const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Listar endereços do usuário
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user.addresses || []);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar endereços' });
    }
});

// Adicionar novo endereço
router.post('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        // Se for marcado como padrão, remove o padrão dos outros
        if (req.body.isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }
        // Se for o primeiro endereço, marca como padrão
        else if (user.addresses.length === 0) {
            req.body.isDefault = true;
        }

        user.addresses.push(req.body);
        await user.save();
        
        res.status(201).json(user.addresses);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao adicionar endereço' });
    }
});

// Atualizar endereço
router.put('/:addressId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const addressIndex = user.addresses.findIndex(
            addr => addr._id.toString() === req.params.addressId
        );

        if (addressIndex === -1) {
            return res.status(404).json({ error: 'Endereço não encontrado' });
        }

        // Se for marcado como padrão, remove o padrão dos outros
        if (req.body.isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        user.addresses[addressIndex] = {
            ...user.addresses[addressIndex].toObject(),
            ...req.body
        };

        await user.save();
        res.json(user.addresses);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar endereço' });
    }
});

// Remover endereço
router.delete('/:addressId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const addressIndex = user.addresses.findIndex(
            addr => addr._id.toString() === req.params.addressId
        );

        if (addressIndex === -1) {
            return res.status(404).json({ error: 'Endereço não encontrado' });
        }

        user.addresses.splice(addressIndex, 1);
        
        // Se removeu o endereço padrão e ainda existem endereços, define o primeiro como padrão
        if (user.addresses.length > 0 && !user.addresses.some(addr => addr.isDefault)) {
            user.addresses[0].isDefault = true;
        }

        await user.save();
        res.json(user.addresses);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao remover endereço' });
    }
});

module.exports = router; 