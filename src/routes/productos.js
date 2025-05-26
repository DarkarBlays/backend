const express = require('express');
const { check } = require('express-validator');
const productoController = require('../controllers/productoController');
const router = express.Router();

// Validaciones comunes para crear y actualizar productos
const validaciones = [
  check('nombre').notEmpty().withMessage('El nombre es requerido'),
  check('precio').isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
  check('stock').isInt({ min: 0 }).withMessage('El stock debe ser un número entero positivo'),
  check('descripcion').optional().isString().withMessage('La descripción debe ser un texto'),
  check('imagen').optional().isString().withMessage('La imagen debe ser una cadena de texto'),
  check('activo').optional().isBoolean().withMessage('El estado activo debe ser booleano')
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

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

module.exports = router;
