# Chat Server

Servidor de chat REST API construido con Bun, Hono, Prisma y MariaDB.

## Funcionalidades

### Autenticación
- **Registro de usuarios**: `POST /auth/register`
- **Login**: `POST /auth/login`
- **Obtener usuario actual**: `GET /auth/me` (protegido)

### Salas (Rooms)
- **Listar salas**: `GET /rooms` (protegido)
- **Crear sala**: `POST /rooms` (protegido)
- **Unirse a una sala**: `POST /rooms/:id/join` (protegido)
- **Salir de una sala**: `POST /rooms/:id/leave` (protegido)
- **Obtener miembros**: `GET /rooms/:id/members` (protegido)
- **Obtener mensajes**: `GET /rooms/:id/messages` (protegido)

## Tecnologías

- **Runtime**: Bun
- **Framework**: Hono
- **ORM**: Prisma
- **Base de datos**: MariaDB
- **Autenticación**: JWT (jose)
- **Validación**: Zod
- **Hashing**: bcryptjs

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

El servidor iniciará en `http://localhost:3001`

## Testing

Ejecutar tests de API:

```bash
bun run scripts/test-api.ts
```
