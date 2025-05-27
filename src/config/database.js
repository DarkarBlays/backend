const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH 
    ? path.resolve(__dirname, '../../', process.env.DB_PATH)
    : path.resolve(__dirname, '../database/inventario.sqlite');

// Configurar SQLite para manejar grandes cantidades de datos
sqlite3.Database.prototype.maxBlobSize = parseInt(process.env.MAX_BLOB_SIZE) || 20 * 1024 * 1024; // 20MB por defecto

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err);
    } else {
        console.log('Conexión exitosa con SQLite');
        console.log('Ruta de la base de datos:', dbPath);
        
        // Configurar la base de datos
        db.run('PRAGMA foreign_keys = ON');
        db.run('PRAGMA journal_mode = WAL');
        db.run('PRAGMA synchronous = NORMAL');
        
        initDatabase();
    }
});

function initDatabase() {
    const tables = `
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            rol TEXT DEFAULT 'usuario',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS productos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            descripcion TEXT,
            precio REAL NOT NULL CHECK (precio >= 0),
            stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
            imagen TEXT,
            activo BOOLEAN DEFAULT 1,
            ultima_sincronizacion DATETIME,
            estado_sincronizacion TEXT DEFAULT 'sincronizado',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sync_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo_operacion TEXT NOT NULL,
            tabla TEXT NOT NULL,
            registro_id INTEGER,
            datos TEXT,
            estado TEXT DEFAULT 'pendiente',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `;

    db.exec(tables, (err) => {
        if (err) {
            console.error('Error al crear las tablas:', err);
        } else {
            console.log('Tablas creadas exitosamente');
            createDefaultAdmin();
        }
    });
}

function createDefaultAdmin() {
    const bcrypt = require('bcryptjs');
    const defaultAdmin = {
        nombre: process.env.DEFAULT_ADMIN_NAME || 'Administrador',
        email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com',
        password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
        rol: 'admin'
    };

    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;

    bcrypt.hash(defaultAdmin.password, saltRounds, (err, hashedPassword) => {
        if (err) {
            console.error('Error al hashear la contraseña:', err);
            return;
        }

        const checkAdmin = `SELECT id FROM usuarios WHERE email = ?`;
        db.get(checkAdmin, [defaultAdmin.email], (err, row) => {
            if (err) {
                console.error('Error al verificar usuario admin:', err);
                return;
            }

            if (!row) {
                const insertAdmin = `
                    INSERT INTO usuarios (nombre, email, password, rol)
                    VALUES (?, ?, ?, ?)
                `;
                db.run(insertAdmin, [
                    defaultAdmin.nombre,
                    defaultAdmin.email,
                    hashedPassword,
                    defaultAdmin.rol
                ], (err) => {
                    if (err) {
                        console.error('Error al crear usuario admin:', err);
                    } else {
                        console.log('Usuario admin creado exitosamente');
                        console.log('Email:', defaultAdmin.email);
                        if (process.env.NODE_ENV === 'development') {
                            console.log('Contraseña:', defaultAdmin.password);
                        }
                    }
                });
            }
        });
    });
}

module.exports = db; 