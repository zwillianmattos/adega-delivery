const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nome do produto é obrigatório'],
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Preço é obrigatório'],
        min: [0, 'Preço não pode ser negativo']
    },
    image: {
        type: String,
        required: [true, 'URL da imagem é obrigatória'],
        validate: {
            validator: function(v) {
                return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
            },
            message: 'URL da imagem inválida'
        }
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Categoria é obrigatória'],
        enum: ['Cerveja', 'Vinho', 'Destilados', 'Outros']
    },
    stock: {
        type: Number,
        default: 0,
        min: [0, 'Estoque não pode ser negativo']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema); 