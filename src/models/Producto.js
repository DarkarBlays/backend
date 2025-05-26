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
            const { nombre, descripcion, precio, stock } = producto;
            db.run(
                'INSERT INTO productos (nombre, descripcion, precio, stock, estado_sincronizacion) VALUES (?, ?, ?, ?, ?)',
                [nombre, descripcion, precio, stock, 'pendiente'],
                function(err) {
                    if (err) reject(err);
                    
                    // Registrar en el log de sincronización
                    db.run(
                        'INSERT INTO sync_log (tipo_operacion, tabla, registro_id, datos) VALUES (?, ?, ?, ?)',
                        ['CREATE', 'productos', this.lastID, JSON.stringify(producto)]
                    );
                    
                    resolve({ id: this.lastID, ...producto });
                }
            );
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