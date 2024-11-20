const express = require('express');
const router = express.Router();
const { payment } = require('../config/mercadopago');
const Order = require('../models/Order');
const util = require('util');

// Gerar PIX
router.post('/generate-pix', async (req, res) => {
    try {
        const { orderId, amount, customer } = req.body;

        // Validar o amount
        const transactionAmount = Number(parseFloat(amount).toFixed(2));
        if (isNaN(transactionAmount) || transactionAmount <= 0) {
            return res.status(400).json({ 
                error: 'Valor inválido para a transação',
                details: 'O valor deve ser um número positivo com até 2 casas decimais'
            });
        }

        // Buscar o pedido
        const order = await Order.findOne({ orderNumber: orderId });
        if (!order) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }

        // Verificar se já existe um pagamento
        if (order.paymentId) {
            try {
                const existingPayment = await payment.get({ id: order.paymentId });
                if (existingPayment.status === 'pending') {
                    // Retornar dados do PIX existente
                    const pixData = existingPayment.point_of_interaction.transaction_data;
                    return res.json({
                        orderReference: orderId,
                        qrCodeImage: pixData.qr_code_base64,
                        pixCopiaECola: pixData.qr_code,
                        createdAt: existingPayment.date_created
                    });
                }
            } catch (error) {
                console.log('Erro ao buscar pagamento existente:', error);
                // Se der erro, continua e cria um novo
            }
        }

        // Validar dados do cliente
        if (!customer || !customer.cpf) {
            return res.status(400).json({ 
                error: 'Dados do cliente inválidos',
                details: 'CPF é obrigatório'
            });
        }

        // Criar novo pagamento no Mercado Pago
        const payment_data = {
            body: {
                transaction_amount: transactionAmount,
                description: `Pedido ${orderId}`,
                payment_method_id: 'pix',
                payer: {
                    email: customer.email || `${customer.whatsapp || 'cliente'}@tempmail.com`,
                    first_name: customer.name || 'Cliente',
                    last_name: 'Adega',
                    identification: {
                        type: 'CPF',
                        number: customer.cpf.replace(/\D/g, '') // Remove caracteres não numéricos
                    }
                },
            }
        };

        console.log('Dados do pagamento:', JSON.stringify(payment_data, null, 2));
        const paymentResponse = await payment.create(payment_data);
        console.log('Resposta do Mercado Pago:', JSON.stringify(paymentResponse, null, 2));

        // Atualizar pedido com referência do pagamento e detalhes do PIX
        order.paymentId = paymentResponse.id;
        order.paymentDetails = {
            pixCode: paymentResponse.point_of_interaction.transaction_data.qr_code,
            pixQRCode: paymentResponse.point_of_interaction.transaction_data.qr_code_base64,
            pixExpiration: new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
        };
        await order.save();

        // Retornar dados do PIX
        const pixData = paymentResponse.point_of_interaction.transaction_data;
        res.json({
            orderReference: orderId,
            qrCodeImage: pixData.qr_code_base64,
            pixCopiaECola: pixData.qr_code,
            createdAt: paymentResponse.date_created
        });

    } catch (error) {
        console.error('Erro detalhado ao gerar PIX:', error.response?.body || error);
        
        // Melhor tratamento de erros específicos
        if (error.cause?.[0]?.code === 4037) {
            return res.status(400).json({ 
                error: 'Valor da transação inválido',
                details: 'O valor deve ser um número positivo com até 2 casas decimais'
            });
        }

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
        const date_created = paymentResponse.date_created;

        // Verificar se o PIX expirou (15 minutos após a criação)
        const createdAt = new Date(date_created);
        const now = new Date();
        const pixExpired = now - createdAt > 15 * 60 * 1000; // 15 minutos em milissegundos

        // Se o PIX expirou e ainda está pendente, cancelar o pedido
        if (pixExpired && status === 'pending') {
            order.status = 'CANCELLED';
            order.paymentStatus = 'expired';
            await order.save();
            
            return res.json({
                status: 'expired',
                orderStatus: 'CANCELLED',
                message: 'PIX expirado e pedido cancelado',
                date_created
            });
        }

        // Atualizar status do pedido se foi aprovado
        if (status === 'approved' && order.paymentStatus !== 'paid') {
            order.paymentStatus = 'paid';
            order.status = 'CONFIRMED';
            await order.save();
        }

        res.json({
            status: status === 'approved' ? 'paid' : 'pending',
            orderStatus: order.status,
            pixExpired,
            date_created
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

        // Se o pagamento não existir ou não tiver os dados do PIX
        if (!paymentResponse || !paymentResponse.point_of_interaction) {
            // Buscar o pedido para verificar o status
            const order = await Order.findOne({ paymentId: req.params.paymentId });
            if (order) {
                // Atualizar o pedido para cancelado se ainda estiver pendente
                if (order.status === 'PENDING' || order.paymentStatus === 'pending') {
                    order.status = 'CANCELLED';
                    order.paymentStatus = 'expired';
                    await order.save();
                }
            }

            return res.status(404).json({ 
                error: 'Dados do PIX não encontrados',
                status: 'expired',
                orderStatus: 'CANCELLED'
            });
        }

        // Extrair dados do PIX
        const pixData = paymentResponse.point_of_interaction.transaction_data;
        
        // Retornar dados do PIX com a data de criação
        res.json({
            qrCodeImage: pixData.qr_code_base64,
            pixCopiaECola: pixData.qr_code,
            status: paymentResponse.status,
            createdAt: paymentResponse.date_created
        });

    } catch (error) {
        console.error('Erro ao buscar dados do PIX:', error);
        
        // Se o erro for "resource not found", significa que o pagamento expirou
        if (error.cause?.[0]?.code === "resource_not_found" || 
            error.message?.includes('resource not found')) {
            
            // Buscar e atualizar o pedido
            const order = await Order.findOne({ paymentId: req.params.paymentId });
            if (order) {
                order.status = 'CANCELLED';
                order.paymentStatus = 'expired';
                await order.save();
            }

            return res.status(404).json({ 
                error: 'PIX expirado',
                status: 'expired',
                orderStatus: 'CANCELLED'
            });
        }

        res.status(500).json({ 
            error: 'Erro ao buscar dados do PIX',
            details: error.message
        });
    }
});

module.exports = router; 