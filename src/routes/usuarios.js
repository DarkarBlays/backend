const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const usuarioController = require('../controllers/usuarioController');
const auth = require('../middleware/auth');

// Validaciones para registro
const validacionesRegistro = [
    check('nombre').notEmpty().withMessage('El nombre es requerido'),
    check('email').isEmail().withMessage('Email no válido'),
    check('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];

// Validaciones para login
const validacionesLogin = [
    check('email').isEmail().withMessage('Email no válido'),
    check('password').notEmpty().withMessage('La contraseña es requerida')
];

// Rutas públicas
router.post('/registro', validacionesRegistro, usuarioController.registro);
router.post('/login', validacionesLogin, usuarioController.login);

// Rutas protegidas
router.get('/perfil', auth, usuarioController.obtenerPerfil);

module.exports = router; 