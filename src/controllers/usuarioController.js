const Usuario = require('../models/Usuario');
const { validationResult } = require('express-validator');

exports.registro = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const usuario = await Usuario.crear(req.body);
        res.status(201).json({
            mensaje: 'Usuario creado exitosamente',
            usuario
        });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ mensaje: 'El email ya está registrado' });
        }
        res.status(500).json({ mensaje: 'Error al crear el usuario', error: error.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const resultado = await Usuario.login(email, password);
        res.json(resultado);
    } catch (error) {
        if (error.message === 'Usuario no encontrado' || error.message === 'Contraseña incorrecta') {
            return res.status(401).json({ mensaje: error.message });
        }
        res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
};

exports.obtenerPerfil = async (req, res) => {
    try {
        const usuario = await Usuario.obtenerPorId(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el perfil', error: error.message });
    }
}; 