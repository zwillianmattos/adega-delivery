const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');

// Criar novo pedido (requer autenticação)
router.post('/', auth, async (req, res) => {
    try {
        const order = new Order({
            ...req.body,
            userId: req.user.id,
            status: 'PENDING',
            orderNumber: generateOrderNumber()
        });

        await order.save();
        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar pedido' });
    }
});

// Buscar pedidos do usuário (requer autenticação)
router.get('/user/:userId', auth, async (req, res) => {
    try {
        // Verificar se o usuário está buscando seus próprios pedidos
        if (req.params.userId !== req.user.id) {
            return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        const orders = await Order.find({ userId: req.user.id })
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar pedidos' });
    }
});

// Buscar pedido específico (requer autenticação)
router.get('/:orderNumber', auth, async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        const orderNumber = req.params.orderNumber;
        const order = await Order.findOne({ orderNumber: orderNumber });

        if (!order) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }

        if (order.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar pedido' });
    }
});


// Rota para atualizar status do pedido
router.put('/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        
        const order = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        );
        
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar status do pedido' });
    }
});

function generateOrderNumber() {
    return 'OD' + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 4).toUpperCase();
}

module.exports = router; 