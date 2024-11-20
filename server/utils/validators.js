const Joi = require('joi');

const validateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age >= 18;
};

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password.length >= 6;
};

const validateUserData = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().min(3).max(100),
    email: Joi.string().required().email(),
    phone: Joi.string().required().pattern(/^\+55[0-9]{11}$/),
    cpf: Joi.string().required().pattern(/^[0-9]{11}$/),
    password: Joi.string().required().min(6),
    birthDate: Joi.date().required(),
    verificationCode: Joi.string().required().pattern(/^[0-9]{6}$/)
  });

  return schema.validate(data);
};

const validateLoginData = (data) => {
  const schema = Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().required()
  });

  return schema.validate(data);
};

module.exports = {
  validateAge,
  validateEmail,
  validatePassword,
  validateUserData,
  validateLoginData
}; 