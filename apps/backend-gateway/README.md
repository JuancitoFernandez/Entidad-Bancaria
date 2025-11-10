# Backend Gateway WebSocket Service

Servicio NestJS que consume eventos de Kafka y los retransmite a clientes WebSocket en tiempo real.

## Funcionalidad

### Consumo de Eventos

- Consume eventos del tópico `txn.events` de Kafka
- Procesa todos los tipos de eventos: `FundsReserved`, `FraudChecked`, `Committed`, `Reversed`, `Notified`

### Servidor WebSocket

- Implementa un servidor WebSocket usando Socket.IO
- Acepta conexiones de clientes web
- Permite que los clientes se suscriban a eventos por `userId` o `transactionId`
- Retransmite eventos de Kafka solo a los clientes suscritos correspondientes

## Eventos WebSocket

### Cliente → Servidor

#### `subscribeToTx`
Suscribirse a eventos por `transactionId` o `userId`.

```json
{
  "transactionId": "uuid-v4",
  "userId": "user123"
}
```

**Respuesta:**
```json
{
  "type": "transactionId",
  "value": "uuid-v4",
  "message": "Subscribed to transaction: uuid-v4"
}
```

#### `unsubscribeFromTx`
Cancelar suscripción.

```json
{
  "transactionId": "uuid-v4",
  "userId": "user123"
}
```

#### `getStats`
Obtener estadísticas de conexiones y suscripciones.

### Servidor → Cliente

#### `connected`
Confirmación de conexión.

```json
{
  "message": "Connected to WebSocket gateway",
  "socketId": "socket-id"
}
```

#### `transactionEvent`
Evento de transacción retransmitido desde Kafka.

```json
{
  "id": "uuid-v4",
  "type": "txn.FundsReserved",
  "version": 1,
  "ts": 1234567890,
  "transactionId": "uuid-v4",
  "userId": "user123",
  "payload": { ... }
}
```

#### `subscribed`
Confirmación de suscripción.

```json
{
  "type": "transactionId",
  "value": "uuid-v4",
  "message": "Subscribed to transaction: uuid-v4"
}
```

#### `error`
Mensaje de error.

```json
{
  "message": "Error message"
}
```

## Configuración

Variables de entorno:
- `PORT`: Puerto del servicio (default: 3003)
- `KAFKA_BROKER`: Broker de Kafka (default: localhost:9092)

## Ejecución

```bash
# Desarrollo
pnpm dev

# Producción
pnpm build
pnpm start
```

## Uso desde el Frontend

### Ejemplo con socket.io-client

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3003');

// Conectar
socket.on('connected', (data) => {
  console.log('Connected:', data);
});

// Suscribirse a una transacción
socket.emit('subscribeToTx', {
  transactionId: 'uuid-v4'
});

// Suscribirse a un usuario
socket.emit('subscribeToTx', {
  userId: 'user123'
});

// Recibir eventos
socket.on('transactionEvent', (event) => {
  console.log('Transaction event:', event);
  // event.type puede ser: txn.FundsReserved, txn.FraudChecked, etc.
});

// Manejar errores
socket.on('error', (error) => {
  console.error('Error:', error);
});
```

## Flujo de Datos

```
Kafka (txn.events)
    ↓
KafkaConsumerService
    ↓
EventsGateway
    ↓
Filtrado por suscripciones
    ↓
Clientes WebSocket suscritos
```

## Características

- **Filtrado inteligente**: Solo envía eventos a clientes suscritos al `transactionId` o `userId` correspondiente
- **Múltiples suscripciones**: Los clientes pueden suscribirse a múltiples transacciones y usuarios
- **Gestión de conexiones**: Limpia automáticamente clientes desconectados
- **Logging detallado**: Registra todas las conexiones, suscripciones y eventos retransmitidos
- **Estadísticas**: Permite consultar estadísticas de conexiones y suscripciones

## Tipos de Eventos Soportados

- `txn.FundsReserved`
- `txn.FraudChecked`
- `txn.Committed`
- `txn.Reversed`
- `txn.Notified`

Todos los eventos siguen el formato `EventEnvelope<T>` definido en `@banking-events-system/event-contracts`.





