const express = require('express');
const router = express.Router();
const { payment } = require('../config/mercadopago');
const Order = require('../models/Order');
const util = require('util');

// Gerar PIX
router.post('/generate-pix', async (req, res) => {
    try {
        const { orderId, amount, customer } = req.body;

        // Buscar o pedido
        const order = await Order.findOne({ orderNumber: orderId });
        if (!order) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }

        // Verificar se já existe um pagamento
        if (order.paymentId) {
            // Buscar pagamento existente
            try {
                const existingPayment = await payment.get({ id: order.paymentId });
                if (existingPayment.status === 'pending') {
                    // Retornar dados do PIX existente
                    const pixData = existingPayment.point_of_interaction.transaction_data;
                    return res.json({
                        orderReference: orderId,
                        qrCodeImage: pixData.qr_code_base64,
                        pixCopiaECola: pixData.qr_code
                    });
                }
            } catch (error) {
                console.log('Erro ao buscar pagamento existente:', error);
                // Se der erro, continua e cria um novo
            }
        }

        // Criar novo pagamento no Mercado Pago
        const payment_data = {
            body: {
                transaction_amount: Number(amount),
                description: `Pedido ${orderId}`,
                payment_method_id: 'pix',
                payer: {
                    email: `${customer.whatsapp}@tempmail.com`,
                    first_name: 'Cliente',
                    last_name: 'Adega',
                    identification: {
                        type: 'CPF',
                        number: customer.cpf
                    }
                },
            }
        };

        console.log('Dados do pagamento:', JSON.stringify(payment_data, null, 2));
        const paymentResponse = await payment.create(payment_data);
        console.log('Resposta do Mercado Pago:', JSON.stringify(paymentResponse, null, 2));

        // Atualizar pedido com referência do pagamento
        order.paymentId = paymentResponse.id;
        await order.save();

        // Retornar dados do PIX
        const pixData = paymentResponse.point_of_interaction.transaction_data;
        res.json({
            orderReference: orderId,
            qrCodeImage: pixData.qr_code_base64,
            pixCopiaECola: pixData.qr_code
        });

    } catch (error) {
        console.error('Erro detalhado ao gerar PIX:', error.response?.body || error);
        res.status(500).json({ 
            error: 'Erro ao gerar pagamento PIX', 
            details: error.message,
            fullError: error.response?.body || error 
        });
    }
});

// Verificar status do pagamento
router.get('/status/:paymentId', async (req, res) => {
    try {
        const order = await Order.findOne({ paymentId: req.params.paymentId });
        if (!order) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }

        // Verificar status do pagamento no Mercado Pago
        const paymentResponse = await payment.get({ id: req.params.paymentId });
        const status = paymentResponse.status;

        // Atualizar status do pedido se necessário
        if (status === 'approved' && order.paymentStatus !== 'paid') {
            order.paymentStatus = 'paid';
            order.status = 'confirmed';
            await order.save();
        }

        res.json({
            status: status === 'approved' ? 'paid' : 'pending',
            orderStatus: order.status
        });

    } catch (error) {
        console.error('Erro ao verificar status:', error);
        res.status(500).json({ error: 'Erro ao verificar status' });
    }
});

// Rota para buscar dados do PIX existente
router.get('/pix-data/:paymentId', async (req, res) => {
    try {
        // Buscar o pagamento no Mercado Pago
        const paymentResponse = await payment.get({ id: req.params.paymentId });
        
        if (!paymentResponse || !paymentResponse.point_of_interaction) {
            return res.status(404).json({ error: 'Dados do PIX não encontrados' });
        }

        // Extrair dados do PIX
        const pixData = paymentResponse.point_of_interaction.transaction_data;
        
        // Retornar dados do PIX
        res.json({
            qrCodeImage: pixData.qr_code_base64,
            pixCopiaECola: pixData.qr_code
        });

    } catch (error) {
        console.error('Erro ao buscar dados do PIX:', error);
        res.status(500).json({ error: 'Erro ao buscar dados do PIX' });
    }
});

module.exports = router; 