const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Configuración del puerto
let PORT = 3000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logging de solicitudes HTTP

// Log de todas las rutas
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Rutas
const usuariosRoutes = require('./routes/usuarios');
const productosRoutes = require('./routes/productos');

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/productos', productosRoutes);

// Endpoint de estado
app.get('/api/estado', (req, res) => {
    res.json({
        estado: 'online',
        timestamp: new Date().toISOString()
    });
});

// Manejador de rutas no encontradas
app.use((req, res, next) => {
    res.status(404).json({
        mensaje: 'Ruta no encontrada',
        ruta: req.originalUrl
    });
});

// Manejador de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: err.message
    });
});

// Función para intentar diferentes puertos
const startServer = (port) => {
    try {
        app.listen(port, () => {
            console.log(`Servidor corriendo en el puerto ${port}`);
            console.log('Rutas disponibles:');
            console.log('- POST /api/usuarios/registro');
            console.log('- POST /api/usuarios/login');
            console.log('- GET /api/usuarios/perfil');
            console.log('- GET /api/estado');
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`Puerto ${port} en uso, intentando con el puerto ${port + 1}`);
                startServer(port + 1);
            } else {
                console.error('Error al iniciar el servidor:', err);
            }
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
    }
};

// Iniciar el servidor
startServer(PORT);

module.exports = app; 