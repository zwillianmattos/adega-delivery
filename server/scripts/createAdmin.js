require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function createInitialAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const admin = new Admin({
            username: 'admin',
            password: 'senha123', // Altere para uma senha segura
            name: 'Administrador'
        });
        
        await admin.save();
        console.log('Administrador criado com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('Erro ao criar administrador:', error);
        process.exit(1);
    }
}

createInitialAdmin(); 