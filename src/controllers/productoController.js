const Producto = require('../models/Producto');
const { validationResult } = require('express-validator');

exports.getAllProductos = async (req, res) => {
    try {
        const productos = await Producto.getAll();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los productos', error });
    }
};

exports.getProductoById = async (req, res) => {
    try {
        const producto = await Producto.getById(req.params.id);
        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }
        res.json(producto);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el producto', error });
    }
};

exports.createProducto = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const producto = await Producto.create(req.body);
        res.status(201).json({
            mensaje: 'Producto creado exitosamente',
            producto,
            estado_sincronizacion: 'pendiente'
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear el producto', error });
    }
};

exports.updateProducto = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const resultado = await Producto.update(req.params.id, req.body);
        if (resultado.changes === 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }
        res.json({
            mensaje: 'Producto actualizado exitosamente',
            estado_sincronizacion: 'pendiente'
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar el producto', error });
    }
};

exports.deleteProducto = async (req, res) => {
    try {
        const resultado = await Producto.delete(req.params.id);
        if (resultado.changes === 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }
        res.json({
            mensaje: 'Producto eliminado exitosamente',
            estado_sincronizacion: 'pendiente'
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar el producto', error });
    }
};

// Endpoints para sincronización
exports.getPendienteSincronizacion = async (req, res) => {
    try {
        const cambiosPendientes = await Producto.getPendienteSincronizacion();
        res.json(cambiosPendientes);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener cambios pendientes', error });
    }
};

exports.marcarComoSincronizado = async (req, res) => {
    try {
        const { id } = req.params;
        await Producto.marcarComoSincronizado(id);
        res.json({ mensaje: 'Producto marcado como sincronizado' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al marcar como sincronizado', error });
    }
}; 