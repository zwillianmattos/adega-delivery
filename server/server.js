const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Product = require('./models/Product');
const Order = require('./models/Order');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.set('strictQuery', true);

const DB_USER = 'teste';
const DB_PASS = 'rGKr7HKsa5WMet64'; 
const DB_CLUSTER = 'cluster0.n3j8j.mongodb.net';
const DB_NAME = 'adega-delivery';

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

app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/products', async (req, res) => {
    const product = new Product(req.body);
    try {
        const newProduct = await product.save();
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const order = new Order(req.body);
        const newOrder = await order.save();
        res.status(201).json(newOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

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

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 