# Chat

Aplicación de chat en tiempo real construida con Bun, Vue 3 y MariaDB.

## Requisitos

- Bun instalado
- MariaDB instalado y corriendo

## Estructura

```
chat/
├── client/     # Cliente Vue 3
├── server/     # Servidor Bun + Hono
└── README.md   # Este archivo
```

## Instalación

1. Instalar dependencias del servidor:

```bash
cd server
bun install
```

2. Instalar dependencias del cliente:

```bash
cd client
bun install
```

## Configuración

### Servidor

1. Crear la base de datos en MariaDB:

```sql
CREATE DATABASE chatdb;
```

2. Configurar el archivo `.env` del servidor (ya configurado por defecto):

```env
DATABASE_URL="mysql://chat:chatpass@localhost:3306/chatdb"
JWT_SECRET="your-secret-key"
PORT=3001
```

3. Ejecutar las migraciones de Prisma:

```bash
cd server
bunx prisma migrate dev
```

### Cliente

El archivo `.env` del cliente ya apunta por defecto a `http://localhost:3001`.

## Ejecutar la Aplicación

### Terminal 1 - Servidor

```bash
cd server
bun run index.ts
```

El servidor estará disponible en `http://localhost:3001`

### Terminal 2 - Cliente

```bash
cd client
bun run dev
```

El cliente estará disponible en `http://localhost:5173`

## Uso

1. Abre el navegador en `http://localhost:5173`
2. Regístrate con un usuario
3. Crea una sala o únete a una existente
4. ¡Empieza a chatear!

## Tecnologías

- **Servidor**: Bun, Hono, Prisma, MariaDB, WebSocket
- **Cliente**: Vue 3, Pinia, Vue Router, Vite, Axios

## Documentación

- [Servidor](./server/README.md)
- [Cliente](./client/README.md)
