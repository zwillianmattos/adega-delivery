const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

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
        
        if (req.query.status) {
            filter.status = req.query.status;
        }

        const orders = await Order.find(filter)
            .populate({ path: 'items', strictPopulate: false })
            .sort({ createdAt: -1 });
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

        const validStatuses = ['preparing', 'delivering', 'completed', 'cancelled'];
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

module.exports = router;