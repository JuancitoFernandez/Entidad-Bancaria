# Backend API Service

Servicio NestJS que recibe solicitudes de nuevas transacciones y las publica en Kafka.

## Endpoints

### POST /transactions

Crea una nueva transacción y publica el evento en Kafka.

**Request Body:**
```json
{
  "fromAccount": "ACC001",
  "toAccount": "ACC002",
  "amount": 100.50,
  "currency": "USD",
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "uuid-v4",
  "message": "Transaction initiated successfully",
  "event": {
    "id": "uuid-v4",
    "type": "txn.TransactionInitiated",
    "version": 1,
    "ts": 1234567890,
    "transactionId": "uuid-v4",
    "userId": "user123",
    "payload": {
      "fromAccount": "ACC001",
      "toAccount": "ACC002",
      "amount": 100.50,
      "currency": "USD",
      "userId": "user123"
    }
  }
}
```

## Configuración

Variables de entorno:
- `PORT`: Puerto del servicio (default: 3001)
- `KAFKA_BROKER`: Broker de Kafka (default: localhost:9092)

## Ejecución

```bash
# Desarrollo
pnpm dev

# Producción
pnpm build
pnpm start
```

## Funcionalidad

1. Recibe solicitudes POST en `/transactions`
2. Genera un `transactionId` único (UUID v4)
3. Construye un `EventEnvelope<TransactionInitiated>`
4. Publica el evento en el tópico `txn.commands` de Kafka
5. Usa `transactionId` como partition key para garantizar ordenamiento





