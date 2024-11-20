const jwt = require('jsonwebtoken');

const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
};

const verifyRefreshToken = (refreshToken) => {
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        return decoded;
    } catch (error) {
        return null;
    }
};

module.exports = { generateTokens, verifyRefreshToken }; 