const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro';

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