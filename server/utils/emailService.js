require('dotenv').config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  secure: true,
  secureConnection: false,
  tls: {
    ciphers: "SSLv3",
  },
  ssl: {
    rejectUnauthorized: false
  },
  requireTLS: true,
  port: 465,
  debug: true,
  connectionTimeout: 10000,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verificação de Email - Adega Delivery",
    html: `
      <h2>Bem-vindo à Adega Delivery!</h2>
      <p>Seu código de verificação é: <strong>${code}</strong></p>
      <p>Este código expira em 10 minutos.</p>
      <p>Se você não solicitou este código, por favor ignore este email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw new Error('Falha ao enviar email de verificação');
  }
};

module.exports = {
  sendVerificationEmail,
};
