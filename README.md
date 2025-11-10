# Banking Events System

Sistema de simulación de transacciones bancarias con arquitectura de microservicios basada en eventos usando Kafka.

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker y Docker Compose

### Pasos para Ejecutar Todo

#### 1. Instalar Dependencias

```bash
pnpm install
```

#### 2. Construir Contratos

```bash
pnpm build:contracts
```

#### 3. Iniciar Kafka y Zookeeper

```bash
pnpm docker:up
```

Espera unos segundos a que los servicios estén listos. Puedes verificar en http://localhost:8080 (Kafka UI).

#### 4. Ejecutar Todos los Servicios

**Opción A: Todo en una terminal (Recomendado)**

```bash
pnpm dev
```

Este comando inicia todos los servicios en paralelo:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Backend Orchestrator: http://localhost:3002
- Backend Gateway: http://localhost:3003

**Opción B: Servicios en terminales separadas**

Abre 4 terminales y ejecuta en cada una (desde la raíz del proyecto):

```powershell
# Terminal 1 - Backend API
pnpm --filter backend-api run dev

# Terminal 2 - Backend Orchestrator
pnpm --filter backend-orchestrator run dev

# Terminal 3 - Backend Gateway
pnpm --filter backend-gateway run dev

# Terminal 4 - Frontend
pnpm --filter frontend-nextjs run dev
```

#### 5. Abrir la Aplicación

Abre tu navegador en: **http://localhost:3000**

## 📋 Puertos del Sistema

| Servicio | Puerto | URL |
|----------|--------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend API | 3001 | http://localhost:3001 |
| Backend Orchestrator | 3002 | http://localhost:3002 |
| Backend Gateway (WebSocket) | 3003 | http://localhost:3003 |
| Kafka UI | 8080 | http://localhost:8080 |

## 🛠️ Comandos Útiles

### Docker

```bash
# Iniciar servicios (Kafka, Zookeeper, Kafka UI)
pnpm docker:up

# Detener servicios
pnpm docker:down

# Ver logs
pnpm docker:logs

# Reiniciar servicios
pnpm docker:restart
```

### Desarrollo

```bash
# Ejecutar todos los servicios
pnpm dev

# Ejecutar un servicio específico
pnpm --filter frontend-nextjs run dev
pnpm --filter backend-api run dev
pnpm --filter backend-orchestrator run dev
pnpm --filter backend-gateway run dev
```

### Construcción

```bash
# Construir contratos
pnpm build:contracts

# Construir todo
pnpm build
```

## 🔍 Verificación

1. **Verificar Docker**: `docker ps` (deberías ver zookeeper, kafka, kafka-ui)
2. **Verificar Kafka UI**: http://localhost:8080 (deberías ver los topics)
3. **Verificar Frontend**: http://localhost:3000 (debería cargar el dashboard)

## 🐛 Solución de Problemas

### Error: "Port already in use"

```powershell
# Windows PowerShell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Error: "Kafka connection failed"

```bash
# Reiniciar Docker
pnpm docker:restart
```

### Error: "Cannot find module"

```bash
# Reinstalar dependencias
pnpm install
pnpm build:contracts
```

## 🛑 Detener el Sistema

```bash
# Detener servicios de desarrollo (Ctrl+C en la terminal)

# Detener Docker
pnpm docker:down
```

## 📦 Estructura del Proyecto

```
├── apps/
│   ├── frontend-nextjs/      # Frontend Next.js
│   ├── backend-api/           # API REST
│   ├── backend-orchestrator/  # Orquestador de eventos
│   └── backend-gateway/       # Gateway WebSocket
└── packages/
    └── event-contracts/       # Contratos TypeScript compartidos
```

## 📝 Topics de Kafka

Se crean automáticamente:
- `txn.commands`: Comandos de transacciones
- `txn.events`: Eventos de transacciones
- `txn.dlq`: Dead Letter Queue
