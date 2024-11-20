require('dotenv').config();

const { MercadoPagoConfig, Payment } = require('mercadopago');

// Configurar o cliente do Mercado Pago
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN
});

// Inicializar o objeto de pagamento
const payment = new Payment(client);

// Adicionar log para debug
console.log('Mercado Pago configurado com token:', process.env.MP_ACCESS_TOKEN.substring(0, 10) + '...');

module.exports = { payment }; 
