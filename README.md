# Backend del Sistema de Inventario PWA

Este es el backend del sistema de inventario PWA, diseñado para proporcionar una API robusta y eficiente que soporte operaciones tanto online como offline.

## Tecnologías Utilizadas

### Node.js y Express
- **Justificación**: Se eligió Node.js con Express por su excelente rendimiento en operaciones I/O, ideal para APIs REST.
- **Beneficios**:
  - Arquitectura basada en eventos no bloqueante
  - Gran ecosistema de paquetes npm
  - Fácil escalabilidad horizontal
  - Excelente para aplicaciones en tiempo real

### SQLite
- **Justificación**: Se optó por SQLite como base de datos por:
  - No requiere servidor separado
  - Perfecta para aplicaciones de tamaño medio
  - Excelente rendimiento en operaciones CRUD
  - Soporte para transacciones ACID
  - Fácil respaldo y portabilidad

### JWT (JSON Web Tokens)
- **Justificación**: Implementación de autenticación stateless que:
  - Permite escalabilidad horizontal sin problemas de sesión
  - Reduce la carga en la base de datos
  - Facilita la autenticación en APIs RESTful

## Implementación de Sincronización Offline/Online

### Estrategia de Sincronización
1. **Registro de Cambios**
   - Tabla `sync_log` para registrar operaciones pendientes
   - Campos para tipo de operación, estado y timestamp
   - Soporte para resolución de conflictos

2. **Proceso de Sincronización**
   ```javascript
   // Ejemplo de estructura de sync_log
   {
     tipo_operacion: 'CREATE|UPDATE|DELETE',
     tabla: 'productos',
     registro_id: 123,
     datos: '{...}',
     estado: 'pendiente|completado|error'
   }
   ```

3. **Manejo de Conflictos**
   - Estrategia "Last Write Wins" por defecto
   - Registro de timestamps para cada operación
   - Resolución manual para conflictos complejos

### Políticas de Reintento
- Implementación de backoff exponencial
- Máximo 3 intentos por operación
- Intervalos configurables vía variables de entorno:
  ```env
  SYNC_RETRY_ATTEMPTS=3
  SYNC_RETRY_DELAY=5000
  ```

## Detalles Técnicos

### Estructura de la Base de Datos
```sql
-- Principales tablas del sistema
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY,
    nombre TEXT,
    email TEXT UNIQUE,
    password TEXT,
    rol TEXT
);

CREATE TABLE productos (
    id INTEGER PRIMARY KEY,
    nombre TEXT,
    descripcion TEXT,
    precio REAL,
    stock INTEGER,
    ultima_sincronizacion DATETIME
);

CREATE TABLE sync_log (
    id INTEGER PRIMARY KEY,
    tipo_operacion TEXT,
    tabla TEXT,
    registro_id INTEGER,
    datos TEXT,
    estado TEXT
);
```

### Manejo de Errores
1. **Errores de Red**
   - Respuestas con códigos HTTP apropiados
   - Mensajes de error descriptivos
   - Logging detallado para debugging

2. **Validación de Datos**
   - Middleware de validación con express-validator
   - Esquemas de validación por ruta
   - Respuestas de error estructuradas

3. **Errores de Base de Datos**
   - Manejo de transacciones para operaciones críticas
   - Rollback automático en caso de error
   - Logging de errores en archivo separado

### Seguridad
1. **Autenticación**
   - JWT con expiración configurable
   - Rotación de tokens
   - Almacenamiento seguro de contraseñas con bcrypt

2. **Autorización**
   - Middleware de roles
   - Permisos granulares por ruta
   - Validación de tokens en cada request

3. **Protección contra Ataques**
   - Rate limiting
   - Sanitización de inputs
   - Headers de seguridad con helmet

## Variables de Entorno
```env
# Configuración del servidor
PORT=3000
NODE_ENV=development

# Configuración de la base de datos
DB_PATH=src/database/inventario.sqlite
MAX_BLOB_SIZE=20971520

# Configuración de seguridad
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRATION=24h
BCRYPT_ROUNDS=10

# Configuración de CORS
CORS_ORIGIN=http://localhost:5173

# Configuración de límites de carga
UPLOAD_LIMIT=50mb

# Configuración del administrador por defecto
DEFAULT_ADMIN_NAME=Admin
DEFAULT_ADMIN_EMAIL=admin@yourdomain.com
DEFAULT_ADMIN_PASSWORD=your_secure_password_here

# Configuración de logging
LOG_LEVEL=dev

# Configuración de sincronización
SYNC_RETRY_ATTEMPTS=3
SYNC_RETRY_DELAY=5000
```

## Endpoints API

### Usuarios
- `POST /api/usuarios/registro` - Registro de usuarios
- `POST /api/usuarios/login` - Login de usuarios
- `GET /api/usuarios/perfil` - Obtener perfil del usuario

### Productos
- `GET /api/productos` - Listar productos
- `POST /api/productos` - Crear producto
- `PUT /api/productos/:id` - Actualizar producto
- `DELETE /api/productos/:id` - Eliminar producto
- `GET /api/productos/sync` - Sincronizar cambios

## Instalación y Configuración

1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Copiar `.env.example` a `.env` y configurar variables
4. Iniciar el servidor:
   ```bash
   npm run dev
   ```

## Scripts Disponibles
- `npm run dev` - Inicia el servidor en modo desarrollo
- `npm start` - Inicia el servidor en modo producción
- `npm test` - Ejecuta las pruebas
- `npm run lint` - Ejecuta el linter

## Consideraciones de Producción
1. **Escalabilidad**
   - Configurar PM2 para múltiples instancias
   - Implementar caché con Redis si es necesario
   - Monitoreo con herramientas como New Relic

2. **Seguridad**
   - Configurar HTTPS
   - Implementar rate limiting
   - Revisar y actualizar dependencias regularmente

3. **Mantenimiento**
   - Backups regulares de la base de datos
   - Rotación de logs
   - Monitoreo de recursos 