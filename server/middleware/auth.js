const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            throw new Error();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.isAdmin) {
            req.admin = decoded;
        } else {
            req.user = {
                id: decoded.id,
                email: decoded.email,
                name: decoded.name
            };
        }

        next();
    } catch (error) {
        res.status(401).json({ message: 'Por favor, faça login.' });
    }
};

module.exports = auth; 