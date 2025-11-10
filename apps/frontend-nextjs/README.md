# Frontend Next.js - Banking Events System

Aplicación Next.js que permite crear transacciones bancarias y visualizar eventos en tiempo real a través de WebSocket.

## Características

### NewTransaction Form
- Formulario para crear nuevas transacciones
- Campos: User ID, From Account, To Account, Amount, Currency, Description (opcional)
- Validación de campos requeridos
- Integración con el backend-api para crear transacciones

### TransactionTimeline
- Visualización en tiempo real de eventos de transacciones
- Conexión WebSocket al backend-gateway
- Suscripción automática a eventos por transactionId
- Timeline visual con diferentes estilos por tipo de evento
- Indicador de estado de conexión

## Configuración

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# WebSocket Gateway URL
NEXT_PUBLIC_WS_URL=http://localhost:3003

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Instalación

```bash
# Desde la raíz del proyecto
pnpm install
pnpm build:contracts

# Desde la carpeta del frontend
cd apps/frontend-nextjs
pnpm install
```

## Ejecución

```bash
# Desarrollo
pnpm dev

# La aplicación estará disponible en http://localhost:3000
```

## Estructura del Proyecto

```
src/
  app/
    layout.tsx          # Layout principal
    page.tsx            # Página principal
    globals.css         # Estilos globales
  components/
    NewTransactionForm.tsx    # Componente del formulario
    TransactionTimeline.tsx   # Componente del timeline
```

## Flujo de la Aplicación

1. **Crear Transacción**
   - El usuario completa el formulario y hace clic en "Initiate Transaction"
   - Se envía un POST a `/transactions` del backend-api
   - Se recibe el `transactionId` en la respuesta

2. **Conectar WebSocket**
   - Al recibir el `transactionId`, se establece conexión WebSocket con el backend-gateway
   - Se envía una suscripción con el `transactionId`

3. **Recibir Eventos**
   - El backend-gateway retransmite eventos desde Kafka
   - Los eventos se muestran en el timeline en tiempo real
   - Cada evento tiene un estilo diferente según su tipo

## Tipos de Eventos

- **FundsReserved**: Fondos reservados (verde)
- **FraudChecked**: Chequeo de fraude (amarillo/naranja)
- **Committed**: Transacción comprometida (verde)
- **Reversed**: Transacción revertida (rojo)
- **Notified**: Notificación enviada (azul)

## Componentes

### NewTransactionForm

Componente que maneja la creación de transacciones.

**Props:**
- `onTransactionCreated`: Callback cuando se crea una transacción
- `onConnectionStatus`: Callback para el estado de conexión

**Estado:**
- Formulario con validación
- Manejo de errores y mensajes de éxito
- Estado de carga durante el envío

### TransactionTimeline

Componente que muestra eventos en tiempo real.

**Props:**
- `transactionId`: ID de la transacción a seguir
- `events`: Array de eventos recibidos
- `onEventReceived`: Callback cuando se recibe un evento
- `onConnectionStatus`: Callback para el estado de conexión

**Funcionalidades:**
- Conexión WebSocket automática
- Suscripción a eventos por transactionId
- Renderizado de eventos con estilos diferentes
- Formato de timestamps
- Manejo de estados vacíos

## Estilos

Los estilos están definidos en `globals.css` e incluyen:
- Diseño responsive con grid
- Estilos para formularios
- Estilos para el timeline
- Badges de estado
- Mensajes de error y éxito
- Animaciones y transiciones

## Desarrollo

### Prerequisitos

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Backend API corriendo en http://localhost:3001
- Backend Gateway corriendo en http://localhost:3003
- Kafka corriendo (usar `pnpm docker:up` desde la raíz)

### Estructura de Datos

Los eventos siguen el formato `EventEnvelope<T>` definido en `@banking-events-system/event-contracts`:

```typescript
interface EventEnvelope<T> {
  id: string;
  type: string;
  version: number;
  ts: number;
  transactionId: string;
  userId: string;
  payload: T;
  correlationId?: string;
}
```

## Notas

- La aplicación usa el App Router de Next.js 14
- Los componentes son Client Components (usando 'use client')
- WebSocket se conecta automáticamente cuando se crea una transacción
- Los eventos se muestran en orden cronológico
- El estado de conexión se muestra visualmente





