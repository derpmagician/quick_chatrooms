# Chat Client

Cliente de chat en tiempo real construido con Vue 3, Pinia, Vite y Bun.

## Funcionalidades

### Autenticación
- **Registro de usuarios**: Crear cuenta con email, username y contraseña
- **Login**: Iniciar sesión con email y contraseña
- **Persistencia**: Token JWT almacenado en localStorage

### Salas (Rooms)
- **Listar salas**: Ver todas las salas disponibles
- **Crear sala**: Crear nuevas salas públicas
- **Unirse a sala**: Unirse a salas existentes
- **Salir de sala**: Abandonar una sala

### Mensajería en Tiempo Real
- **WebSocket**: Comunicación en tiempo real sin polling
- **Mensajes**: Enviar y recibir mensajes instantáneamente
- **Indicador de escritura**: Ver cuando otros usuarios están escribiendo
- **Usuarios en línea**: Lista de participantes conectados en tiempo real

### Interfaz
- Diseño responsive
- Lista de salas en sidebar
- Panel de participantes con estado en línea/desconectado
- Mensajes diferenciados por usuario

## Tecnologías

- **Framework**: Vue 3 (Composition API)
- **Gestión de estado**: Pinia
- **Build tool**: Vite
- **Runtime**: Bun
- **Enrutamiento**: Vue Router
- **HTTP Client**: Axios
- **Estilos**: CSS nativo con variables

## Requisitos

- Bun instalado
- Servidor corriendo en `http://localhost:3001`

## Instalación

1. Instalar dependencias:

```bash
bun install
```

2. Configurar variables de entorno en `.env`:

```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

## Ejecutar el Cliente

```bash
bun run dev
```

El cliente abrirá en `http://localhost:5173`

## Building

```bash
bun run build
```

## Linting

```bash
bun run lint
```
