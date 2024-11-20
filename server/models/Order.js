const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    cpf: {
        type: String,
        required: [true, 'CPF é obrigatório'],
        validate: {
            validator: function(v) {
                return /^\d{11}$/.test(v);
            },
            message: 'Formato de CPF inválido'
        }
    },
    whatsapp: {
        type: String,
        required: [true, 'WhatsApp é obrigatório'],
        validate: {
            validator: function(v) {
                return /^\d{11}$/.test(v);
            },
            message: 'Formato de WhatsApp inválido'
        }
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: String,
        price: Number,
        quantity: Number
    }],
    status: {
        type: String,
        enum: ['PENDING', 'PREPARING', 'DELIVERING', 'COMPLETED', 'CANCELLED'],
        default: 'PENDING'
    },
    subtotal: Number,
    deliveryFee: Number,
    total: Number,
    orderNumber: {
        type: String,
        unique: true
    },
    paymentId: String,
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    customer: {
        address: {
            street: {
                type: String,
                required: true
            },
            number: {
                type: String,
                required: true
            },
            complement: String,
            neighborhood: {
                type: String,
                required: true
            },
            city: {
                type: String,
                required: true
            },
            zipcode: {
                type: String,
                required: true
            }
        }
    }
}, {
    timestamps: true
});

// Gerar número do pedido antes de salvar
orderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        const count = await mongoose.model('Order').countDocuments();
        this.orderNumber = `#${(count + 1).toString().padStart(4, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema); 