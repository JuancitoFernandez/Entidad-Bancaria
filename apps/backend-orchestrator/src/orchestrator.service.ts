import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import {
  EventEnvelope,
  TransactionInitiated,
  FundsReserved,
  FraudChecked,
  Committed,
  Reversed,
  Notified,
} from '@banking-events-system/event-contracts';
import { KafkaService } from './kafka.service';

@Injectable()
export class OrchestratorService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(private readonly kafkaService: KafkaService) {
    const broker = process.env.KAFKA_BROKER || 'localhost:9092';
    
    this.kafka = new Kafka({
      clientId: 'backend-orchestrator-consumer',
      brokers: [broker],
    });

    this.consumer = this.kafka.consumer({
      groupId: 'orchestrator-consumer-group',
    });
  }

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

  async onModuleDestroy() {
    await this.consumer.disconnect();
    console.log('✅ Kafka consumer disconnected (orchestrator)');
  }

  /**
   * Maneja cada mensaje recibido del tópico txn.commands
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    try {
      const messageValue = payload.message.value?.toString();
      if (!messageValue) {
        console.warn('⚠️ Received message with no value');
        return;
      }

      const event: EventEnvelope<TransactionInitiated> = JSON.parse(messageValue);
      const transactionId = event.transactionId;

      console.log(`📨 Processing transaction: ${transactionId}, type: ${event.type}`);

      // Validar que sea un evento TransactionInitiated
      if (event.type !== 'txn.TransactionInitiated') {
        console.warn(`⚠️ Unexpected event type: ${event.type}`);
        return;
      }

      // Ejecutar la saga de orquestación
      await this.executeSaga(event, transactionId);
    } catch (error) {
      console.error('❌ Error processing message:', error);
      
      // Intentar enviar a DLQ
      try {
        const messageValue = payload.message.value?.toString();
        const transactionId = payload.message.key?.toString() || 'unknown';
        
        await this.kafkaService.publishToDLQ(
          'txn.commands',
          messageValue || '{}',
          error instanceof Error ? error.message : String(error),
          transactionId,
        );
      } catch (dlqError) {
        console.error('❌ Critical: Failed to send to DLQ:', dlqError);
      }
    }
  }

  /**
   * Ejecuta la saga de orquestación completa
   */
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

  /**
   * Paso 1: Emite el evento FundsReserved
   */
  private async emitFundsReserved(
    transactionId: string,
    userId: string,
    payload: TransactionInitiated,
  ): Promise<void> {
    const fundsReservedPayload: FundsReserved = {
      ok: true,
      holdId: uuidv4(),
      amount: payload.amount,
    };

    const event: EventEnvelope<FundsReserved> = {
      id: uuidv4(),
      type: 'txn.FundsReserved',
      version: 1,
      ts: Date.now(),
      transactionId,
      userId,
      payload: fundsReservedPayload,
      correlationId: transactionId,
    };

    await this.kafkaService.publishEvent('txn.events', transactionId, event);
    console.log(`✅ FundsReserved event emitted for transaction: ${transactionId}`);
  }

  /**
   * Paso 2: Simula el chequeo de fraude
   * @returns 'LOW' o 'HIGH'
   */
  private simulateFraudCheck(): 'LOW' | 'HIGH' {
    // Simulación: 80% de probabilidad de LOW, 20% de HIGH
    const random = Math.random();
    return random < 0.8 ? 'LOW' : 'HIGH';
  }

  /**
   * Paso 3a: Maneja el flujo para riesgo BAJO
   */
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

  /**
   * Paso 3b: Maneja el flujo para riesgo ALTO
   */
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

  /**
   * Emite el evento FraudChecked
   */
  private async emitFraudChecked(
    transactionId: string,
    userId: string,
    risk: 'LOW' | 'HIGH',
  ): Promise<void> {
    const fraudCheckedPayload: FraudChecked = {
      risk,
    };

    const event: EventEnvelope<FraudChecked> = {
      id: uuidv4(),
      type: 'txn.FraudChecked',
      version: 1,
      ts: Date.now(),
      transactionId,
      userId,
      payload: fraudCheckedPayload,
      correlationId: transactionId,
    };

    await this.kafkaService.publishEvent('txn.events', transactionId, event);
    console.log(`✅ FraudChecked event emitted (risk: ${risk}) for transaction: ${transactionId}`);
  }

  /**
   * Emite el evento Committed
   */
  private async emitCommitted(transactionId: string, userId: string): Promise<void> {
    const committedPayload: Committed = {
      ledgerTxId: uuidv4(),
    };

    const event: EventEnvelope<Committed> = {
      id: uuidv4(),
      type: 'txn.Committed',
      version: 1,
      ts: Date.now(),
      transactionId,
      userId,
      payload: committedPayload,
      correlationId: transactionId,
    };

    await this.kafkaService.publishEvent('txn.events', transactionId, event);
    console.log(`✅ Committed event emitted for transaction: ${transactionId}`);
  }

  /**
   * Emite el evento Reversed
   */
  private async emitReversed(
    transactionId: string,
    userId: string,
    reason: string,
  ): Promise<void> {
    const reversedPayload: Reversed = {
      reason,
    };

    const event: EventEnvelope<Reversed> = {
      id: uuidv4(),
      type: 'txn.Reversed',
      version: 1,
      ts: Date.now(),
      transactionId,
      userId,
      payload: reversedPayload,
      correlationId: transactionId,
    };

    await this.kafkaService.publishEvent('txn.events', transactionId, event);
    console.log(`✅ Reversed event emitted for transaction: ${transactionId}, reason: ${reason}`);
  }

  /**
   * Emite el evento Notified
   */
  private async emitNotified(transactionId: string, userId: string): Promise<void> {
    const notifiedPayload: Notified = {
      channels: ['email', 'sms'],
    };

    const event: EventEnvelope<Notified> = {
      id: uuidv4(),
      type: 'txn.Notified',
      version: 1,
      ts: Date.now(),
      transactionId,
      userId,
      payload: notifiedPayload,
      correlationId: transactionId,
    };

    await this.kafkaService.publishEvent('txn.events', transactionId, event);
    console.log(`✅ Notified event emitted for transaction: ${transactionId}`);
  }
}



