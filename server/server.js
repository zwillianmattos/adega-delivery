require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Product = require('./models/Product');
const Order = require('./models/Order');
const paymentRoutes = require('./routes/payment');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.set('strictQuery', true);

const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS; 
const DB_CLUSTER = process.env.DB_CLUSTER;
const DB_NAME = process.env.DB_NAME;

const mongoURI = `mongodb+srv://${DB_USER}:${DB_PASS}@${DB_CLUSTER}/${DB_NAME}?retryWrites=true&w=majority`;

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conectado ao MongoDB com sucesso!');
}).catch((err) => {
    console.error('Erro ao conectar ao MongoDB:', err);
});

app.use(express.json());
app.use(express.static('public'));

// Rotas de produtos
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Rotas de pedidos
app.post('/api/orders', async (req, res) => {
    try {
        const order = new Order(req.body);
        const newOrder = await order.save();
        res.status(201).json(newOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});



// Buscar pedidos por WhatsApp
app.get('/api/orders/whatsapp/:whatsapp', async (req, res) => {
    try {
        const orders = await Order.find({ 
            whatsapp: req.params.whatsapp 
        })
        .sort({ createdAt: -1 })
        .limit(5);

        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: 'Nenhum pedido encontrado' });
        }
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Atualizar status do pedido
app.patch('/api/orders/:orderNumber/status', async (req, res) => {
    try {
        const { status } = req.body;
        let orderNumber = req.params.orderNumber;
        // Adicionar # se não existir
        if (!orderNumber.startsWith('#')) {
            orderNumber = `#${orderNumber}`;
        }
        const order = await Order.findOne({ orderNumber });
        
        if (!order) {
            return res.status(404).json({ message: 'Pedido não encontrado' });
        }

        order.status = status;
        await order.save();
        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Buscar pedido por número
app.get('/api/orders/:orderNumber', async (req, res) => {
    try {
        let orderNumber = req.params.orderNumber;
        // Adicionar # se não existir
        if (!orderNumber.startsWith('#')) {
            orderNumber = `#${orderNumber}`;
        }
        
        const order = await Order.findOne({ orderNumber });
        if (!order) {
            return res.status(404).json({ message: 'Pedido não encontrado' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Rotas de pagamento
app.use('/api/payment', paymentRoutes);

// Rota para webhook do Mercado Pago
app.post('/api/webhook/mercadopago', async (req, res) => {
    try {
        const { type, data } = req.body;
        
        if (type === 'payment') {
            const { id } = data;
            const paymentResponse = await payment.get({ id });
            if (paymentResponse.status === 'approved') {
                const order = await Order.findOne({ paymentId: id });
                if (order) {
                    order.paymentStatus = 'paid';
                    order.status = 'confirmed';
                    await order.save();
                }
            }
        }
        
        res.sendStatus(200);
    } catch (error) {
        console.error('Erro no webhook:', error);
        res.sendStatus(500);
    }
});

// Middleware de erro
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 