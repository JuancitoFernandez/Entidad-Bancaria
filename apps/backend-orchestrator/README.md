# Backend Orchestrator Service

Servicio NestJS que implementa la saga de orquestación para transacciones bancarias. Consume eventos del tópico `txn.commands` y orquesta el flujo completo de la transacción.

## Funcionalidad

### Consumo de Eventos

- Consume eventos `TransactionInitiated` del tópico `txn.commands`
- Procesa cada mensaje de forma asíncrona

### Saga de Orquestación

El servicio implementa la siguiente saga:

1. **Paso 1: FundsReserved**
   - Emite evento `txn.FundsReserved` al tópico `txn.events`
   - Simula la reserva de fondos

2. **Paso 2: Fraud Check**
   - Simula un chequeo de fraude usando `Math.random()`
   - 80% de probabilidad de riesgo BAJO, 20% de riesgo ALTO

3. **Paso 3a: Riesgo BAJO**
   - Emite `txn.FraudChecked` (risk: 'LOW')
   - Emite `txn.Committed`
   - Emite `txn.Notified`

4. **Paso 3b: Riesgo ALTO**
   - Emite `txn.FraudChecked` (risk: 'HIGH')
   - Emite `txn.Reversed` (rollback)

### Manejo de Errores

- Si ocurre un error inesperado durante el procesamiento, el mensaje se envía al tópico `txn.dlq`
- Todos los eventos usan `transactionId` como partition key para garantizar ordenamiento

## Eventos Publicados

### txn.events

- `txn.FundsReserved`
- `txn.FraudChecked`
- `txn.Committed`
- `txn.Reversed`
- `txn.Notified`

### txn.dlq

- Mensajes que fallaron durante el procesamiento

## Configuración

Variables de entorno:
- `PORT`: Puerto del servicio HTTP (default: 3002)
- `KAFKA_BROKER`: Broker de Kafka (default: localhost:9092)

## Ejecución

```bash
# Desarrollo
pnpm dev

# Producción
pnpm build
pnpm start
```

## Flujo de Datos

```
txn.commands (TransactionInitiated)
    ↓
Orchestrator Service
    ↓
┌─────────────────────────────────────┐
│ Paso 1: FundsReserved → txn.events │
│ Paso 2: Fraud Check (simulado)     │
│ Paso 3a (LOW):                     │
│   - FraudChecked (LOW)             │
│   - Committed                      │
│   - Notified                       │
│ Paso 3b (HIGH):                    │
│   - FraudChecked (HIGH)            │
│   - Reversed                       │
└─────────────────────────────────────┘
    ↓
txn.events (varios eventos)
```

## Notas

- Todos los eventos mantienen el mismo `transactionId` como partition key
- El servicio utiliza `correlationId` para rastrear eventos relacionados
- Los errores se capturan y se envían a la DLQ para análisis posterior



