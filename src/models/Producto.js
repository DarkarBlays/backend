const db = require('../config/database');

class Producto {
    static getAll() {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM productos', [], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    }

    static getById(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM productos WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }

    static create(producto) {
        return new Promise((resolve, reject) => {
            try {
                const { nombre, descripcion, precio, stock, imagen, activo } = producto;
                
                // Validar tipos de datos
                if (typeof nombre !== 'string' || nombre.trim() === '') {
                    throw new Error('El nombre es requerido y debe ser texto');
                }
                
                // Convertir precio y stock a números
                const precioNum = Number(precio);
                const stockNum = Number(stock);
                
                if (isNaN(precioNum)) {
                    throw new Error('El precio debe ser un número válido');
                }
                if (isNaN(stockNum)) {
                    throw new Error('El stock debe ser un número válido');
                }

                // Preparar la consulta
                const stmt = db.prepare(
                    'INSERT INTO productos (nombre, descripcion, precio, stock, imagen, activo, estado_sincronizacion) VALUES (?, ?, ?, ?, ?, ?, ?)'
                );

                // Ejecutar la inserción
                stmt.run(
                    [nombre, descripcion, precioNum, stockNum, imagen, activo !== undefined ? activo : true, 'sincronizado'],
                    function(err) {
                        if (err) {
                            console.error('Error en la inserción:', err);
                            reject(err);
                            return;
                        }

                        const nuevoProducto = {
                            id: this.lastID,
                            nombre,
                            descripcion,
                            precio: precioNum,
                            stock: stockNum,
                            imagen,
                            activo: activo !== undefined ? activo : true,
                            estado_sincronizacion: 'sincronizado'
                        };

                        // Registrar en el log de sincronización
                        try {
                            const stmtLog = db.prepare(
                                'INSERT INTO sync_log (tipo_operacion, tabla, registro_id, datos) VALUES (?, ?, ?, ?)'
                            );
                            stmtLog.run(['CREATE', 'productos', this.lastID, JSON.stringify(nuevoProducto)]);
                            stmtLog.finalize();
                        } catch (logError) {
                            console.error('Error al registrar en el log de sincronización:', logError);
                            // No rechazamos la promesa aquí porque el producto ya se creó
                        }

                        stmt.finalize();
                        resolve(nuevoProducto);
                    }
                );
            } catch (error) {
                console.error('Error en create:', error);
                reject(error);
            }
        });
    }

    static update(id, producto) {
        return new Promise((resolve, reject) => {
            const { nombre, descripcion, precio, stock } = producto;
            db.run(
                'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, estado_sincronizacion = ? WHERE id = ?',
                [nombre, descripcion, precio, stock, 'pendiente', id],
                function(err) {
                    if (err) reject(err);
                    
                    // Registrar en el log de sincronización
                    if (this.changes > 0) {
                        db.run(
                            'INSERT INTO sync_log (tipo_operacion, tabla, registro_id, datos) VALUES (?, ?, ?, ?)',
                            ['UPDATE', 'productos', id, JSON.stringify(producto)]
                        );
                    }
                    
                    resolve({ changes: this.changes });
                }
            );
        });
    }

    static delete(id) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM productos WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                
                // Registrar en el log de sincronización
                if (this.changes > 0) {
                    db.run(
                        'INSERT INTO sync_log (tipo_operacion, tabla, registro_id) VALUES (?, ?, ?)',
                        ['DELETE', 'productos', id]
                    );
                }
                
                resolve({ changes: this.changes });
            });
        });
    }

    static getPendienteSincronizacion() {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM sync_log WHERE estado = ?', ['pendiente'], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    }

    static marcarComoSincronizado(id) {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE productos SET estado_sincronizacion = ?, ultima_sincronizacion = CURRENT_TIMESTAMP WHERE id = ?',
                ['sincronizado', id],
                function(err) {
                    if (err) reject(err);
                    resolve({ changes: this.changes });
                }
            );
        });
    }
}

module.exports = Producto; 