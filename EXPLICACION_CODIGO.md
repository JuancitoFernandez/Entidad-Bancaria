# 📚 Explicación del Código - Banking Events System

## 🏗️ Arquitectura del Sistema

Este sistema implementa una **arquitectura de microservicios basada en eventos** utilizando **Apache Kafka** como sistema de mensajería. El sistema simula transacciones bancarias con un flujo completo que incluye reserva de fondos, verificación de fraude, confirmación y notificaciones.

### Componentes Principales

1. **Frontend (Next.js)** - Interfaz de usuario
2. **Backend API (NestJS)** - Endpoint REST para crear transacciones
3. **Backend Orchestrator (NestJS)** - Orquestador de la saga de transacciones
4. **Backend Gateway (NestJS)** - Gateway WebSocket para eventos en tiempo real
5. **Event Contracts** - Contratos TypeScript compartidos entre servicios
6. **Kafka** - Sistema de mensajería y eventos

---

## 🔄 Flujo de Transacciones

### 1. Inicio de Transacción

**Archivo:** `apps/backend-api/src/app.controller.ts`

El flujo comienza cuando el frontend envía una solicitud POST a `/transactions`:

```13:47:apps/backend-api/src/app.controller.ts
@Post('transactions')
async createTransaction(@Body() body: TransactionInitiated) {
  // Generar transactionId (uuid)
  const transactionId = uuidv4();

  // Construir el payload de TransactionInitiated (asegurar currency por defecto)
  const payload: TransactionInitiated = {
    fromAccount: body.fromAccount,
    toAccount: body.toAccount,
    amount: body.amount,
    currency: body.currency || 'USD',
    userId: body.userId,
  };

  // Construir el evento EventEnvelope<TransactionInitiated>
  const event: EventEnvelope<TransactionInitiated> = {
    id: uuidv4(), // id del evento (uuid)
    type: 'txn.TransactionInitiated',
    version: 1,
    ts: Date.now(), // epoch ms
    transactionId, // partition key
    userId: payload.userId,
    payload,
  };

  // Publicar el evento en el tópico txn.commands usando transactionId como key
  await this.kafkaService.publishEvent('txn.commands', transactionId, event);

  return {
    success: true,
    transactionId,
    message: 'Transaction initiated successfully',
    event,
  };
}
```

**Puntos Destacados:**
- ✅ Genera un `transactionId` único (UUID v4)
- ✅ Crea un `EventEnvelope` siguiendo el contrato estándar
- ✅ Usa `transactionId` como **partition key** para garantizar ordenamiento
- ✅ Publica el evento en el tópico `txn.commands`

### 2. Servicio Kafka (Producer)

**Archivo:** `apps/backend-api/src/kafka.service.ts`

El servicio Kafka se encarga de publicar eventos:

```36:52:apps/backend-api/src/kafka.service.ts
async publishEvent<T>(topic: string, key: string, value: T): Promise<void> {
  try {
    await this.producer.send({
      topic,
      messages: [
        {
          key,
          value: JSON.stringify(value),
        },
      ],
    });
    console.log(`📤 Event published to topic: ${topic}, key: ${key}`);
  } catch (error) {
    console.error(`❌ Error publishing event to ${topic}:`, error);
    throw error;
  }
}
```

**Puntos Destacados:**
- ✅ Serializa el evento a JSON antes de enviarlo
- ✅ Usa la clave (key) para particionar los mensajes
- ✅ Manejo de errores con logging

---

## 🎭 Orquestador de Saga

**Archivo:** `apps/backend-orchestrator/src/orchestrator.service.ts`

El orquestador es el **corazón del sistema**. Consume eventos del tópico `txn.commands` y ejecuta la saga completa de transacciones.

### Consumo de Eventos

```33:45:apps/backend-orchestrator/src/orchestrator.service.ts
async onModuleInit() {
  await this.consumer.connect();
  await this.consumer.subscribe({ topic: 'txn.commands', fromBeginning: false });
  
  console.log('✅ Kafka consumer connected (orchestrator)');
  console.log('📥 Subscribed to topic: txn.commands');

  // Procesar mensajes
  await this.consumer.run({
    eachMessage: async (payload: EachMessagePayload) => {
      await this.handleMessage(payload);
    },
  });
}
```

### Ejecución de la Saga

**Archivo:** `apps/backend-orchestrator/src/orchestrator.service.ts`

La saga ejecuta los siguientes pasos:

```100:134:apps/backend-orchestrator/src/orchestrator.service.ts
private async executeSaga(
  event: EventEnvelope<TransactionInitiated>,
  transactionId: string,
): Promise<void> {
  try {
    const { userId, payload } = event;

    // Paso 1: Emitir txn.FundsReserved
    await this.emitFundsReserved(transactionId, userId, payload);

    // Paso 2: Simular chequeo de fraude
    const fraudRisk = this.simulateFraudCheck();
    console.log(`🔍 Fraud check result: ${fraudRisk}`);

    // Paso 3: Continuar según el resultado del fraude
    if (fraudRisk === 'LOW') {
      await this.handleLowRisk(transactionId, userId, payload);
    } else {
      await this.handleHighRisk(transactionId, userId, payload);
    }

    console.log(`✅ Saga completed successfully for transaction: ${transactionId}`);
  } catch (error) {
    console.error(`❌ Error in saga execution for transaction ${transactionId}:`, error);
    
    // Enviar a DLQ en caso de error
    await this.kafkaService.publishToDLQ(
      'txn.commands',
      JSON.stringify(event),
      error instanceof Error ? error.message : String(error),
      transactionId,
    );
    throw error;
  }
}
```

**Flujo de la Saga:**

1. **FundsReserved** - Reserva los fondos de la cuenta origen
2. **FraudCheck** - Verifica el riesgo de fraude (simulado)
3. **Bifurcación según riesgo:**
   - **Riesgo BAJO (LOW):**
     - ✅ FraudChecked (LOW)
     - ✅ Committed (confirma la transacción)
     - ✅ Notified (envía notificaciones)
   - **Riesgo ALTO (HIGH):**
     - ⚠️ FraudChecked (HIGH)
     - ❌ Reversed (revierte la transacción)

### Manejo de Riesgo Bajo

```178:191:apps/backend-orchestrator/src/orchestrator.service.ts
private async handleLowRisk(
  transactionId: string,
  userId: string,
  payload: TransactionInitiated,
): Promise<void> {
  // Emitir FraudChecked (LOW)
  await this.emitFraudChecked(transactionId, userId, 'LOW');

  // Emitir Committed
  await this.emitCommitted(transactionId, userId);

  // Emitir Notified
  await this.emitNotified(transactionId, userId);
}
```

### Manejo de Riesgo Alto

```196:206:apps/backend-orchestrator/src/orchestrator.service.ts
private async handleHighRisk(
  transactionId: string,
  userId: string,
  payload: TransactionInitiated,
): Promise<void> {
  // Emitir FraudChecked (HIGH)
  await this.emitFraudChecked(transactionId, userId, 'HIGH');

  // Emitir Reversed (rollback)
  await this.emitReversed(transactionId, userId, 'High fraud risk detected');
}
```

**Puntos Destacados:**
- ✅ **Patrón Saga**: Orquesta múltiples pasos de la transacción
- ✅ **Compensación**: En caso de riesgo alto, revierte la transacción
- ✅ **Dead Letter Queue (DLQ)**: Maneja errores enviando mensajes fallidos a `txn.dlq`
- ✅ **CorrelationId**: Usa `transactionId` como correlationId para rastrear eventos relacionados

### Dead Letter Queue (DLQ)

**Archivo:** `apps/backend-orchestrator/src/kafka.service.ts`

El sistema incluye un mecanismo de DLQ para manejar mensajes fallidos:

```61:89:apps/backend-orchestrator/src/kafka.service.ts
async publishToDLQ(
  originalTopic: string,
  originalMessage: any,
  error: string,
  transactionId: string,
): Promise<void> {
  const dlqMessage = {
    originalTopic,
    originalMessage,
    error,
    timestamp: new Date().toISOString(),
  };

  try {
    await this.producer.send({
      topic: 'txn.dlq',
      messages: [
        {
          key: transactionId,
          value: JSON.stringify(dlqMessage),
        },
      ],
    });
    console.log(`⚠️ Message sent to DLQ, transactionId: ${transactionId}`);
  } catch (dlqError) {
    console.error(`❌ Critical error: Failed to send message to DLQ:`, dlqError);
    throw dlqError;
  }
}
```

---

## 📡 Gateway WebSocket

**Archivo:** `apps/backend-gateway/src/events.gateway.ts`

El gateway WebSocket permite que el frontend reciba eventos en tiempo real.

### Suscripciones

Los clientes pueden suscribirse a eventos por `transactionId` o `userId`:

```67:108:apps/backend-gateway/src/events.gateway.ts
@SubscribeMessage('subscribeToTx')
handleSubscribe(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: { transactionId?: string; userId?: string },
) {
  const subscription = this.clients.get(client.id);
  
  if (!subscription) {
    client.emit('error', { message: 'Client not found' });
    return;
  }

  if (data.transactionId) {
    subscription.transactionIds.add(data.transactionId);
    this.logger.log(
      `Client ${client.id} subscribed to transactionId: ${data.transactionId}`,
    );
    client.emit('subscribed', {
      type: 'transactionId',
      value: data.transactionId,
      message: `Subscribed to transaction: ${data.transactionId}`,
    });
  }

  if (data.userId) {
    subscription.userIds.add(data.userId);
    this.logger.log(
      `Client ${client.id} subscribed to userId: ${data.userId}`,
    );
    client.emit('subscribed', {
      type: 'userId',
      value: data.userId,
      message: `Subscribed to user: ${data.userId}`,
    });
  }

  if (!data.transactionId && !data.userId) {
    client.emit('error', {
      message: 'Please provide transactionId or userId',
    });
  }
}
```

### Broadcast de Eventos

```152:191:apps/backend-gateway/src/events.gateway.ts
broadcastEvent(event: EventEnvelope): void {
  const { transactionId, userId } = event;
  let sentCount = 0;

  // Iterar sobre todos los clientes conectados
  for (const [socketId, subscription] of this.clients.entries()) {
    const socket = this.server.sockets.sockets.get(socketId);
    
    if (!socket) {
      // Cliente desconectado, limpiar
      this.clients.delete(socketId);
      continue;
    }

    // Verificar si el cliente está suscrito a este transactionId o userId
    const isSubscribedToTransaction =
      subscription.transactionIds.has(transactionId);
    const isSubscribedToUser = subscription.userIds.has(userId);

    if (isSubscribedToTransaction || isSubscribedToUser) {
      // Enviar el evento al cliente
      socket.emit('transactionEvent', event);
      sentCount++;
      
      this.logger.debug(
        `Event ${event.type} sent to client ${socketId} (transactionId: ${transactionId}, userId: ${userId})`,
      );
    }
  }

  if (sentCount > 0) {
    this.logger.log(
      `Event ${event.type} (transactionId: ${transactionId}) broadcasted to ${sentCount} client(s)`,
    );
  } else {
    this.logger.debug(
      `Event ${event.type} (transactionId: ${transactionId}) - no subscribers`,
    );
  }
}
```

**Puntos Destacados:**
- ✅ **Filtrado eficiente**: Solo envía eventos a clientes suscritos
- ✅ **Múltiples suscripciones**: Un cliente puede suscribirse a múltiples `transactionId` o `userId`
- ✅ **Limpieza automática**: Elimina clientes desconectados de la lista

### Consumidor de Kafka en el Gateway

**Archivo:** `apps/backend-gateway/src/kafka-consumer.service.ts`

El consumidor de Kafka escucha eventos del tópico `txn.events` y los retransmite al gateway:

```63:92:apps/backend-gateway/src/kafka-consumer.service.ts
private async handleMessage(payload: EachMessagePayload): Promise<void> {
  try {
    const messageValue = payload.message.value?.toString();
    
    if (!messageValue) {
      this.logger.warn('⚠️ Received message with no value');
      return;
    }

    // Parsear el evento
    const event: EventEnvelope = JSON.parse(messageValue);
    const transactionId = event.transactionId || payload.message.key?.toString();
    
    if (!transactionId) {
      this.logger.warn('⚠️ Received event without transactionId');
      return;
    }

    this.logger.log(
      `📨 Received event: ${event.type} for transactionId: ${transactionId}`,
    );

    // Retransmitir el evento al EventsGateway
    // El gateway se encargará de filtrar y enviar solo a los clientes suscritos
    this.eventsGateway.broadcastEvent(event);
  } catch (error) {
    this.logger.error('❌ Error processing message from Kafka:', error);
    this.logger.error('Message payload:', payload.message.value?.toString());
  }
}
```

---

## 📦 Contratos de Eventos

**Archivo:** `packages/event-contracts/src/index.ts`

Los contratos definen la estructura estándar de todos los eventos:

### EventEnvelope (Sobre del Evento)

```8:17:packages/event-contracts/src/index.ts
export interface EventEnvelope<T = any> { 
  id: string; // uuid v4 
  type: string; // ej: "txn.FundsReserved" 
  version: number; // 1 
  ts: number; // epoch ms 
  transactionId: string; // partition key 
  userId: string; 
  payload: T; 
  correlationId?: string; 
}
```

**Puntos Destacados:**
- ✅ **Estandarización**: Todos los eventos siguen la misma estructura
- ✅ **Versionado**: Campo `version` para evolución futura
- ✅ **Trazabilidad**: `transactionId` y `correlationId` para rastrear eventos relacionados
- ✅ **Timestamp**: `ts` en epoch milliseconds para ordenamiento

### Tipos de Payloads

```21:49:packages/event-contracts/src/index.ts
export type TransactionInitiated = { 
  fromAccount: string; 
  toAccount: string; 
  amount: number; 
  currency: string; 
  userId: string; 
};

export type FundsReserved = { 
  ok: true; 
  holdId: string; 
  amount: number; 
};

export type FraudChecked = { 
  risk: 'LOW' | 'HIGH'; 
};

export type Committed = { 
  ledgerTxId: string; 
};

export type Reversed = { 
  reason: string; 
};

export type Notified = { 
  channels: string[]; // ej: ['email', 'sms'] 
};
```

---

## 🖥️ Frontend (Next.js)

### Componente Principal

**Archivo:** `apps/frontend-nextjs/src/app/page.tsx`

El componente principal gestiona el estado de las transacciones y eventos:

```22:51:apps/frontend-nextjs/src/app/page.tsx
const handleNewTransaction = useCallback(async (transaction: TransactionInitiated) => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${apiUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaction),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Error: ${response.statusText}`)
    }

    const data = await response.json()
    setCurrentTransactionId(data.transactionId)
    setEvents([]) // Reset events for new transaction
    setSuccessMessage(`Transacción creada exitosamente: ${data.transactionId}`)
    
    // Limpiar mensaje de éxito después de 5 segundos
    setTimeout(() => setSuccessMessage(null), 5000)
  } catch (err) {
    console.error('Error creating transaction:', err)
    setIsConnected(false)
    throw err // Re-lanzar para que TransactionForm pueda manejarlo
  }
}, [])
```

### Conexión WebSocket

**Archivo:** `apps/frontend-nextjs/src/components/TransactionTimeline.tsx`

El componente `TransactionTimeline` maneja la conexión WebSocket y suscripción a eventos:

```79:126:apps/frontend-nextjs/src/components/TransactionTimeline.tsx
// Manejar conexión
socket.on('connect', () => {
  console.log('Connected to WebSocket');
  onConnectionStatusRef.current(true);

  // Suscribirse al transactionId cuando se conecte
  // Usar el valor actual de la ref para evitar problemas de closure
  const txIdToSubscribe = currentTransactionIdRef.current;
  if (txIdToSubscribe && socketRef.current) {
    socketRef.current.emit('subscribeToTx', { transactionId: txIdToSubscribe });
    subscribedRef.current = true;
    console.log(`Subscribed to transactionId: ${txIdToSubscribe}`);
  }
});

// Manejar desconexión
socket.on('disconnect', (reason) => {
  console.log('Disconnected from WebSocket:', reason);
  // Solo actualizar estado si fue una desconexión intencional
  // No actualizar si es una reconexión automática
  if (reason === 'io client disconnect') {
    onConnectionStatusRef.current(false);
    subscribedRef.current = false;
  }
});

// Manejar reconexión
socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected to WebSocket after', attemptNumber, 'attempts');
  onConnectionStatusRef.current(true);
  // Re-suscribirse después de reconectar
  const txIdToSubscribe = currentTransactionIdRef.current;
  if (txIdToSubscribe && socketRef.current) {
    socketRef.current.emit('subscribeToTx', { transactionId: txIdToSubscribe });
    subscribedRef.current = true;
    console.log(`Re-subscribed to transactionId: ${txIdToSubscribe}`);
  }
});

// Manejar eventos de transacción
socket.on('transactionEvent', (event: EventEnvelope) => {
  console.log('Event received:', event);
  onEventReceivedRef.current(event);
});
```

**Puntos Destacados:**
- ✅ **Reconexión automática**: El cliente se reconecta automáticamente si se pierde la conexión
- ✅ **Re-suscripción**: Después de reconectar, se suscribe nuevamente al `transactionId`
- ✅ **Manejo de eventos**: Recibe eventos en tiempo real y los muestra en la UI

---

## 🐳 Docker y Kafka

**Archivo:** `docker-compose.yml`

El sistema utiliza Docker Compose para gestionar Kafka, Zookeeper y Kafka UI:

### Configuración de Kafka

```20:44:docker-compose.yml
kafka:
  image: confluentinc/cp-kafka:7.5.0
  container_name: kafka
  depends_on:
    zookeeper:
      condition: service_healthy
  ports:
    - "9092:9092"
    - "9093:9093"
  environment:
    KAFKA_BROKER_ID: 1
    KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
    KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092,PLAINTEXT_INTERNAL://kafka:29092
    KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_INTERNAL:PLAINTEXT
    KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT_INTERNAL
    KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
    KAFKA_NUM_PARTITIONS: 3
  networks:
    - kafka-network
  healthcheck:
    test: ["CMD", "kafka-broker-api-versions", "--bootstrap-server", "localhost:9092"]
    interval: 10s
    timeout: 5s
    retries: 5
```

### Creación Automática de Topics

```46:67:docker-compose.yml
kafka-init:
  image: confluentinc/cp-kafka:7.5.0
  container_name: kafka-init
  depends_on:
    kafka:
      condition: service_healthy
  entrypoint: ['/bin/sh', '-c']
  command: |
    echo 'Esperando a que Kafka esté listo...'
    until kafka-broker-api-versions --bootstrap-server kafka:29092 2>/dev/null; do
      echo 'Kafka no está listo, esperando...'
      sleep 2
    done
    echo 'Kafka está listo. Creando topics...'
    kafka-topics --create --if-not-exists --bootstrap-server kafka:29092 --partitions 3 --replication-factor 1 --topic txn.commands
    kafka-topics --create --if-not-exists --bootstrap-server kafka:29092 --partitions 3 --replication-factor 1 --topic txn.events
    kafka-topics --create --if-not-exists --bootstrap-server kafka:29092 --partitions 3 --replication-factor 1 --topic txn.dlq
    echo 'Topics creados exitosamente:'
    kafka-topics --list --bootstrap-server kafka:29092
  networks:
    - kafka-network
  restart: "no"
```

**Topics Creados:**
- `txn.commands` - Comandos de transacciones (inicio de transacciones)
- `txn.events` - Eventos de transacciones (eventos de la saga)
- `txn.dlq` - Dead Letter Queue (mensajes fallidos)

---

## 🎯 Puntos Clave del Sistema

### 1. Arquitectura Event-Driven
- ✅ Los servicios se comunican mediante eventos, no llamadas directas
- ✅ Desacoplamiento entre servicios
- ✅ Escalabilidad horizontal

### 2. Saga Pattern
- ✅ Orquesta múltiples pasos de una transacción
- ✅ Maneja compensaciones (rollback) en caso de error
- ✅ Garantiza consistencia eventual

### 3. Partition Key
- ✅ Usa `transactionId` como partition key
- ✅ Garantiza que todos los eventos de una transacción vayan a la misma partición
- ✅ Permite procesamiento ordenado

### 4. Dead Letter Queue (DLQ)
- ✅ Maneja mensajes fallidos
- ✅ Permite recuperación y análisis posterior
- ✅ Evita pérdida de datos

### 5. WebSocket en Tiempo Real
- ✅ Notificaciones en tiempo real al frontend
- ✅ Suscripciones por `transactionId` o `userId`
- ✅ Reconexión automática

### 6. Contratos Compartidos
- ✅ TypeScript compartido entre servicios
- ✅ Type safety en tiempo de compilación
- ✅ Versionado de eventos

---

## 🔍 Flujo Completo de una Transacción

```
1. Frontend → POST /transactions
   ↓
2. Backend API → Crea EventEnvelope<TransactionInitiated>
   ↓
3. Backend API → Publica en txn.commands (Kafka)
   ↓
4. Backend Orchestrator → Consume de txn.commands
   ↓
5. Backend Orchestrator → Ejecuta Saga:
   a. Emite FundsReserved → txn.events
   b. Simula FraudCheck
   c. Si LOW: Emite FraudChecked, Committed, Notified → txn.events
   d. Si HIGH: Emite FraudChecked, Reversed → txn.events
   ↓
6. Backend Gateway → Consume de txn.events
   ↓
7. Backend Gateway → Filtra suscripciones y broadcast via WebSocket
   ↓
8. Frontend → Recibe eventos en tiempo real y actualiza UI
```

---

## 📊 Diagrama de Arquitectura

```
┌─────────────┐
│   Frontend  │
│  (Next.js)  │
└──────┬──────┘
       │ HTTP POST
       │
       ↓
┌─────────────┐
│ Backend API │
│  (NestJS)   │
└──────┬──────┘
       │
       │ Kafka Producer
       │
       ↓
┌─────────────────────┐
│   Kafka Topics      │
│  - txn.commands     │
│  - txn.events       │
│  - txn.dlq          │
└──────┬──────────────┘
       │
       │ Kafka Consumer
       │
       ↓
┌─────────────────────┐
│ Backend Orchestrator│
│     (NestJS)        │
│  - Saga Pattern     │
│  - Fraud Check      │
│  - Compensation     │
└──────┬──────────────┘
       │
       │ Kafka Producer
       │
       ↓
┌─────────────────────┐
│   Kafka Topics      │
│    txn.events       │
└──────┬──────────────┘
       │
       │ Kafka Consumer
       │
       ↓
┌─────────────────────┐
│  Backend Gateway    │
│    (NestJS)         │
│  - WebSocket        │
│  - Subscriptions    │
└──────┬──────────────┘
       │
       │ WebSocket
       │
       ↓
┌─────────────┐
│   Frontend  │
│  (Next.js)  │
└─────────────┘
```

---

## 🚀 Comandos Útiles

### Desarrollo
```bash
# Iniciar todos los servicios
pnpm dev

# Iniciar Docker (Kafka)
pnpm docker:up

# Ver logs de Docker
pnpm docker:logs
```

### Construcción
```bash
# Construir contratos
pnpm build:contracts

# Construir todo
pnpm build
```

---

## 📝 Notas Finales

Este sistema demuestra una arquitectura de microservicios moderna con:
- ✅ **Event-Driven Architecture** con Kafka
- ✅ **Saga Pattern** para orquestación
- ✅ **WebSocket** para tiempo real
- ✅ **Type Safety** con TypeScript
- ✅ **Dead Letter Queue** para manejo de errores
- ✅ **Partition Keys** para ordenamiento

El código está diseñado para ser escalable, mantenible y fácil de extender con nuevas funcionalidades.

