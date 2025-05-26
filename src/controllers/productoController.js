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
    try {
        console.log('Datos recibidos:', JSON.stringify(req.body, null, 2));
        
        // Validar los datos de entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Errores de validación:', errors.array());
            return res.status(400).json({ 
                mensaje: 'Error de validación',
                errores: errors.array() 
            });
        }

        // Validar que los campos requeridos estén presentes
        const { nombre, precio, stock } = req.body;
        if (!nombre || precio === undefined || stock === undefined) {
            console.log('Faltan campos requeridos');
            return res.status(400).json({
                mensaje: 'Faltan campos requeridos',
                requeridos: ['nombre', 'precio', 'stock']
            });
        }

        // Normalizar los datos antes de crear el producto
        const productoData = {
            nombre: nombre.trim(),
            descripcion: (req.body.descripcion || '').trim(),
            precio: Number(precio),
            stock: Number(stock),
            imagen: req.body.imagen || '',
            activo: req.body.activo !== undefined ? Boolean(req.body.activo) : true
        };

        console.log('Datos normalizados:', JSON.stringify(productoData, null, 2));

        // Validar el tamaño de la imagen
        if (productoData.imagen && productoData.imagen.length > 1000000) { // 1MB límite
            console.log('Imagen demasiado grande:', productoData.imagen.length, 'bytes');
            return res.status(400).json({
                mensaje: 'La imagen es demasiado grande. El límite es 1MB',
                error: 'IMAGE_TOO_LARGE'
            });
        }

        // Crear el producto
        const producto = await Producto.create(productoData);
        console.log('Producto creado:', JSON.stringify(producto, null, 2));
        
        res.status(201).json({
            mensaje: 'Producto creado exitosamente',
            producto
        });
    } catch (error) {
        console.error('Error detallado al crear producto:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            errno: error.errno
        });
        
        // Determinar el tipo de error y enviar una respuesta apropiada
        if (error.message.includes('UNIQUE constraint failed')) {
            res.status(409).json({
                mensaje: 'Ya existe un producto con ese nombre',
                error: error.message
            });
        } else if (error.message.includes('El nombre es requerido') ||
                   error.message.includes('precio debe ser') ||
                   error.message.includes('stock debe ser')) {
            res.status(400).json({
                mensaje: 'Datos inválidos',
                error: error.message
            });
        } else {
            res.status(500).json({ 
                mensaje: 'Error al crear el producto',
                error: error.message
            });
        }
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