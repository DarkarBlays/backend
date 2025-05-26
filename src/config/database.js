const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/inventario.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err);
    } else {
        console.log('Conexión exitosa con SQLite');
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
            precio REAL NOT NULL,
            stock INTEGER NOT NULL DEFAULT 0,
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
            // Crear usuario admin por defecto si no existe
            createDefaultAdmin();
        }
    });
}

function createDefaultAdmin() {
    const bcrypt = require('bcryptjs');
    const defaultAdmin = {
        nombre: 'Administrador',
        email: 'admin@example.com',
        password: 'admin123',
        rol: 'admin'
    };

    bcrypt.hash(defaultAdmin.password, 10, (err, hashedPassword) => {
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
                        console.log('Credenciales por defecto:');
                        console.log('Email:', defaultAdmin.email);
                        console.log('Contraseña:', defaultAdmin.password);
                    }
                });
            }
        });
    });
}

module.exports = db; 