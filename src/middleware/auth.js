const jwt = require('jsonwebtoken');

const JWT_SECRET = 'tu_secreto_super_seguro'; // Debe coincidir con el secreto en Usuario.js

module.exports = (req, res, next) => {
    // Obtener el token del header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ mensaje: 'No hay token, autorización denegada' });
    }

    try {
        // Verificar el token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        res.status(401).json({ mensaje: 'Token no válido' });
    }
}; 