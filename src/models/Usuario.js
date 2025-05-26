const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'tu_secreto_super_seguro'; // En producción esto debería estar en variables de entorno

class Usuario {
    static async crear(usuario) {
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(usuario.password, salt);

            return new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
                    [usuario.nombre, usuario.email, hashedPassword, usuario.rol || 'usuario'],
                    function(err) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve({ id: this.lastID, ...usuario, password: undefined });
                    }
                );
            });
        } catch (error) {
            throw error;
        }
    }

    static async login(email, password) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM usuarios WHERE email = ?', [email], async (err, usuario) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (!usuario) {
                    reject(new Error('Usuario no encontrado'));
                    return;
                }

                const passwordValido = await bcrypt.compare(password, usuario.password);
                if (!passwordValido) {
                    reject(new Error('Contraseña incorrecta'));
                    return;
                }

                const token = jwt.sign(
                    { id: usuario.id, email: usuario.email, rol: usuario.rol },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                resolve({
                    token,
                    usuario: {
                        id: usuario.id,
                        nombre: usuario.nombre,
                        email: usuario.email,
                        rol: usuario.rol
                    }
                });
            });
        });
    }

    static async obtenerPorId(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT id, nombre, email, rol FROM usuarios WHERE id = ?', [id], (err, usuario) => {
                if (err) reject(err);
                resolve(usuario);
            });
        });
    }
}

module.exports = Usuario; 