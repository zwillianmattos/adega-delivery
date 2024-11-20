const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { validateUserData, validateLoginData } = require('../utils/validators');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../utils/emailService');
const { generateTokens, verifyRefreshToken } = require('../utils/tokenManager');

// Armazenar códigos de verificação temporariamente (em produção, use Redis)
const verificationCodes = new Map();

// Registro de novo usuário
router.post('/register', async (req, res) => {
  try {
    // Validar dados
    const { error } = validateUserData(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Verificar se usuário já existe
    const phoneExists = await User.findOne({ phone: req.body.phone });
    if (phoneExists) return res.status(400).json({ error: 'Telefone já cadastrado' });

    const emailExists = await User.findOne({ email: req.body.email });
    if (emailExists) return res.status(400).json({ error: 'Email já cadastrado' });

    const cpfExists = await User.findOne({ cpf: req.body.cpf });
    if (cpfExists) return res.status(400).json({ error: 'CPF já cadastrado' });

    // Verificar código
    const storedVerification = verificationCodes.get(req.body.email);
    if (!storedVerification) {
      return res.status(400).json({ error: 'Código de verificação expirado ou não encontrado' });
    }

    if (storedVerification.expires < Date.now()) {
      verificationCodes.delete(req.body.email);
      return res.status(400).json({ error: 'Código de verificação expirado' });
    }

    if (storedVerification.code !== req.body.verificationCode) {
      return res.status(400).json({ error: 'Código de verificação inválido' });
    }

    // Remover código usado
    verificationCodes.delete(req.body.email);

    // Criar novo usuário
    const user = new User(req.body);
    await user.save();

    // Gerar token JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        cpf: user.cpf,
      }
    });
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    res.status(500).json({ error: 'Erro ao cadastrar usuário' });
  }
});

// Login com email e senha
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validar dados de login
    const { error } = validateLoginData(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    
    // Verificar se usuário existe
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Email ou senha incorretos' });

    // Verificar senha
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) return res.status(400).json({ error: 'Email ou senha incorretos' });

    // Gerar token JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        cpf: user.cpf,
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao realizar login' });
  }
});

// Rota para enviar código de verificação
router.post('/send-verification', async (req, res) => {
    try {
        const { email } = req.body;

        // Verificar se email já existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        // Gerar código de 6 dígitos
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Armazenar código (expira em 10 minutos)
        verificationCodes.set(email, {
            code: verificationCode,
            expires: Date.now() + 10 * 60 * 1000 // 10 minutos
        });

        // Enviar email com código
        await sendVerificationEmail(email, verificationCode);

        res.json({ message: 'Código de verificação enviado' });

    } catch (error) {
        console.error('Erro ao enviar código de verificação:', error);
        res.status(500).json({ error: 'Erro ao enviar código de verificação' });
    }
});

// Adicionar nova rota para refresh token
router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token não fornecido' });
        }

        const decoded = verifyRefreshToken(refreshToken);
        
        if (!decoded) {
            return res.status(401).json({ message: 'Refresh token inválido' });
        }

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

        res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao renovar token' });
    }
});

module.exports = router; 