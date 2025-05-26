const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const productoController = require('../controllers/productoController');

// Validaciones comunes
const validaciones = [
    check('nombre').notEmpty().withMessage('El nombre es requerido'),
    check('precio').isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
    check('stock').isInt({ min: 0 }).withMessage('El stock debe ser un número entero positivo')
];

// Rutas CRUD básicas
router.get('/', productoController.getAllProductos);
router.get('/:id', productoController.getProductoById);
router.post('/', validaciones, productoController.createProducto);
router.put('/:id', validaciones, productoController.updateProducto);
router.delete('/:id', productoController.deleteProducto);

// Rutas de sincronización
router.get('/sync/pendientes', productoController.getPendienteSincronizacion);
router.post('/sync/:id/completado', productoController.marcarComoSincronizado);

module.exports = router; 