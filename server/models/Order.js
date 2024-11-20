const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    customer: {
        name: String,
        email: String,
        phone: String,
        cpf: String,
        address: {
            cep: String,
            street: String,
            number: String,
            complement: String,
            neighborhood: String,
            city: String
        }
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        name: String,
        price: Number,
        quantity: Number,
        total: Number
    }],
    subtotal: Number,
    deliveryFee: Number,
    total: Number,
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERING', 'DELIVERED', 'CANCELLED'],
        default: 'PENDING'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['PIX', 'CREDIT_CARD', 'CASH'],
        default: 'PIX'
    },
    paymentDetails: {
        pixCode: String,
        pixQRCode: String,
        pixExpiration: Date,
        creditCardBrand: String,
        creditCardLast4: String,
        transactionId: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', OrderSchema); 