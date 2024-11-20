require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Product = require('./models/Product');
const Order = require('./models/Order');
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payment');
const adminRoutes = require('./routes/admin');
const addressesRoutes = require('./routes/addresses');
const ordersRoutes = require('./routes/orders');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.set('strictQuery', true);

const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conectado ao MongoDB com sucesso!');
}).catch((err) => {
    console.error('Erro ao conectar ao MongoDB:', err);
});

console.log("Email Credentials: ");    
console.log(process.env.EMAIL_USER);    

app.use(express.json());
app.use(express.static('public'));

// Segurança
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de 100 requisições por windowMs
});
app.use('/api/', limiter);

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

// Rotas de pagamento
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/addresses', addressesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);


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


// Rota para relatórios
app.get('/api/reports/:period', async (req, res) => {
    try {
        const { period } = req.params;
        let startDate = new Date();
        
        // Definir período do relatório
        switch (period) {
            case 'daily':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'weekly':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'monthly':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
        }

        // Buscar pedidos do período
        const orders = await Order.find({
            createdAt: { $gte: startDate }
        });

        // Calcular métricas
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        const averageTicket = totalRevenue / totalOrders || 0;
        
        // Contar pedidos por status
        const ordersByStatus = orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});

        res.json({
            totalOrders,
            totalRevenue,
            averageTicket,
            ordersByStatus
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao gerar relatório' });
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