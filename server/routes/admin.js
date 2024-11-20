const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(401).json({ message: 'Usuário ou senha inválidos' });
        }
        
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Usuário ou senha inválidos' });
        }
        
        const token = jwt.sign(
            { id: admin._id, username: admin.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({ token });
    } catch (error) {
        console.error('Erro no servidor:', error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

router.get('/orders', auth, async (req, res) => {
    try {
        const filter = {
            paymentStatus: 'paid'
        };
        
        if (req.query.status && req.query.status !== 'all') {
            filter.status = req.query.status;
        }

        console.log('Filtro aplicado:', filter); // Debug

        const orders = await Order.find(filter)
            .sort({ createdAt: -1 });

        console.log('Pedidos encontrados:', orders.length); // Debug
        
        res.json(orders);
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        res.status(500).json({ message: 'Erro ao buscar pedidos' });
    }
});

router.put('/orders/:id/status', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({ message: 'Pedido não encontrado' });
        }

        if (order.paymentStatus !== 'paid') {
            return res.status(400).json({ 
                message: 'Não é possível alterar o status de um pedido não pago' 
            });
        }

        const validStatuses = ['PREPARING', 'DELIVERING', 'COMPLETED', 'CANCELLED'];
        if (!validStatuses.includes(req.body.status)) {
            return res.status(400).json({ 
                message: 'Status inválido' 
            });
        }

        order.status = req.body.status;
        await order.save();
        
        res.json(order);
    } catch (error) {
        console.error('Erro ao atualizar status do pedido:', error);
        res.status(500).json({ message: 'Erro ao atualizar status do pedido' });
    }
});

router.get('/dashboard', auth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayOrders = await Order.find({
            createdAt: { $gte: today },
            paymentStatus: 'paid'
        });

        const totalOrdersToday = todayOrders.length;
        const totalRevenueToday = todayOrders.reduce((sum, order) => sum + order.total, 0);
        const averageTicket = totalOrdersToday > 0 ? totalRevenueToday / totalOrdersToday : 0;
        
        const completedOrders = todayOrders.filter(order => order.status === 'COMPLETED').length;
        const completionRate = totalOrdersToday > 0 ? (completedOrders / totalOrdersToday) * 100 : 0;

        res.json({
            totalOrdersToday,
            totalRevenueToday,
            averageTicket,
            completionRate
        });
    } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        res.status(500).json({ message: 'Erro ao buscar dados do dashboard' });
    }
});

router.get('/charts', auth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const hourlyOrders = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: today },
                    paymentStatus: 'paid'
                }
            },
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const topProducts = await Order.aggregate([
            {
                $match: {
                    paymentStatus: 'paid',
                    createdAt: { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
                }
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    totalSold: { $sum: "$items.quantity" }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $project: {
                    name: { $arrayElemAt: ["$product.name", 0] },
                    totalSold: 1
                }
            }
        ]);

        res.json({
            hourlyOrders,
            topProducts
        });
    } catch (error) {
        console.error('Erro ao buscar dados dos gráficos:', error);
        res.status(500).json({ message: 'Erro ao buscar dados dos gráficos' });
    }
});

module.exports = router;