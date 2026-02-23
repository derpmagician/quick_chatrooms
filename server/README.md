# Chat Server

Servidor de chat REST API construido con Bun, Hono, Prisma y MariaDB.

## Funcionalidades

### Autenticación
- **Registro de usuarios**: `POST /auth/register`
- **Login**: `POST /auth/login`
- **Obtener usuario actual**: `GET /auth/me` (protegido)

La respuesta de autenticación incluye:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "avatar": null,
    "theme": "purple",
    "preferences": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "role": "admin",
    "permissions": ["room:create", "room:close", "room:delete", "user:role:change"]
  },
  "token": "jwt-token"
}
```

### Salas (Rooms)
- **Listar salas**: `GET /rooms` (protegido)
- **Listar todas las salas (admin)**: `GET /rooms/all` (protegido, requiere permiso `room:delete`)
- **Crear sala**: `POST /rooms` (protegido, requiere permiso `room:create`)
- **Unirse a una sala**: `POST /rooms/:id/join` (protegido)
- **Salir de una sala**: `POST /rooms/:id/leave` (protegido)
- **Obtener miembros**: `GET /rooms/:id/members` (protegido)
- **Obtener mensajes**: `GET /rooms/:id/messages` (protegido)
- **Cerrar sala**: `PATCH /rooms/:id/close` (protegido, requiere permiso `room:close`)
- **Abrir sala**: `PATCH /rooms/:id/open` (protegido, requiere permiso `room:close`)
- **Borrar sala**: `DELETE /rooms/:id` (protegido, requiere permiso `room:delete` y ser owner)

**Campo adicional:** `isClosed` - indica si la sala está cerrada (solo lectura)

### Usuarios
- **Listar usuarios**: `GET /users` (protegido)
- **Obtener usuario por ID**: `GET /users/:id` (protegido)
- **Obtener roles**: `GET /users/roles` (protegido, requiere permiso `user:role:change`)
- **Actualizar usuario**: `PATCH /users/:id` (protegido, solo propio usuario)
- **Cambiar rol**: `PATCH /users/:id/role` (protegido, requiere permiso `user:role:change`)

#### Actualizar Perfil
El endpoint `PATCH /users/:id` permite actualizar:
- `username`: Nombre de usuario
- `avatar`: URL del avatar
- `theme`: Tema de la aplicación (`purple`, `blue`, `green`, `pink`, `dark`)
- `preferences`: Objeto JSON con preferencias adicionales

### Mensajería en Tiempo Real (WebSocket)
- **Conexión**: `ws://localhost:3001`
- **Eventos**:
  - `join_room` - Unirse a una sala
  - `leave_room` - Salir de una sala
  - `send_message` - Enviar mensaje
  - `typing` - Indicador de escritura
  - `new_message` - Nuevo mensaje recibido
  - `users_in_room` - Lista de usuarios en la sala

## Sistema de Roles y Permisos

### Roles

| Rol | Descripción |
|-----|-------------|
| admin | Administrador con todos los permisos |
| mod | Moderador con permisos de sala |
| user | Usuario regular sin permisos especiales |

### Permisos

| Permiso | Descripción |
|---------|-------------|
| `room:create` | Crear salas |
| `room:close` | Cerrar/abrir salas |
| `room:delete` | Borrar salas |
| `user:role:change` | Cambiar roles de usuarios |

## Temas de Usuario

Los usuarios pueden seleccionar un tema que se aplica a toda la aplicación:

| Tema | Descripción |
|------|-------------|
| `purple` | Púrpura (por defecto) |
| `blue` | Azul |
| `green` | Verde |
| `pink` | Rosa |
| `dark` | Oscuro |

### Asignación de Roles
- El **primer usuario** registrado se convierte en **admin**
- Los usuarios siguientes son **user** por defecto
- Solo el **admin** o **mod** pueden cambiar roles de otros usuarios

### IDs Fijos de Roles
Los roles tienen IDs fijos para mantener consistencia después de resets de base de datos:

| Rol | ID |
|-----|-----|
| admin | `00000000-0000-0000-0000-000000000001` |
| mod | `00000000-0000-0000-0000-000000000002` |
| user | `00000000-0000-0000-0000-000000000003` |

## Tecnologías

- **Runtime**: Bun
- **Framework**: Hono
- **ORM**: Prisma
- **Base de datos**: MariaDB
- **Autenticación**: JWT (jose)
- **Validación**: Zod
- **Hashing**: bcryptjs
- **WebSocket**: Bun native WebSocket

## Requisitos

- Bun instalado
- MariaDB instalado y corriendo

## Instalación

1. Instalar dependencias:

```bash
bun install
```

2. Configurar variables de entorno en `.env`:

```env
DATABASE_URL="mysql://user:password@localhost:3306/chatdb"
JWT_SECRET="tu-secreto-jwt"
PORT=3001
```

## Configuración de la Base de Datos

### Opción 1: Reset completo (recomendado)

Ejecutar el script que resetea la base de datos, aplica migraciones y crea roles:

```bash
bun run scripts/reset-db.ts
```

Esto:
1. Borra todos los datos de las tablas
2. Aplica las migraciones de Prisma
3. Crea los roles y permisos por defecto

### Opción 2: Manual

1. Crear la base de datos en MariaDB:

```sql
CREATE DATABASE chatdb;
```

2. Ejecutar las migraciones de Prisma:

```bash
bunx prisma migrate dev
```

3. (Opcional) Generar el cliente Prisma:

```bash
bunx prisma generate
```

## Ejecutar el Servidor

```bash
bun run index.ts
```

El servidor iniciando en:
- **HTTP**: `http://localhost:3001`
- **WebSocket**: `ws://localhost:3001`

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `bun run scripts/reset-db.ts` | Resetea la DB, aplica migraciones y crea roles con IDs fijos |
| `bun run scripts/seed-roles.ts` | Crea roles y permisos (si ya hay migraciones) |
| `bun run scripts/drop-db.ts` | Borra todos los datos de la base de datos |
| `bun run scripts/test-api.ts` | Ejecuta tests de API |
| `bun run scripts/test-query.ts` | Ejecuta pruebas de consulta a la DB |

## Endpoints Completos

### Auth
```
POST /auth/register     - Registrar usuario
POST /auth/login       - Iniciar sesión
GET  /auth/me          - Obtener usuario actual
```

### Rooms
```
GET    /rooms              - Listar salas (miembro o públicas)
GET    /rooms/all          - Listar todas las salas (admin)
POST   /rooms              - Crear sala
POST   /rooms/:id/join     - Unirse a sala
POST   /rooms/:id/leave    - Salir de sala
GET    /rooms/:id/members  - Obtener miembros
GET    /rooms/:id/messages - Obtener mensajes
PATCH  /rooms/:id/close    - Cerrar sala
PATCH  /rooms/:id/open     - Abrir sala
DELETE /rooms/:id          - Borrar sala
```

### Users
```
GET    /users          - Listar usuarios
GET    /users/roles    - Listar roles (admin)
GET    /users/:id      - Obtener usuario
PATCH  /users/:id      - Actualizar usuario (propio perfil)
PATCH  /users/:id/role - Cambiar rol (admin)
```
