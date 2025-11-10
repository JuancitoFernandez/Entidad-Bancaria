import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;

  constructor() {
    const broker = process.env.KAFKA_BROKER || 'localhost:9092';
    
    this.kafka = new Kafka({
      clientId: 'backend-orchestrator-producer',
      brokers: [broker],
    });

    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    console.log('✅ Kafka producer connected (orchestrator)');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    console.log('✅ Kafka producer disconnected (orchestrator)');
  }

  /**
   * Publica un evento en un tópico de Kafka
   * @param topic - Tópico de Kafka
   * @param key - Clave de partición (partition key) - transactionId
   * @param value - Valor del mensaje (evento)
   */
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

  /**
   * Publica un mensaje a la Dead Letter Queue (DLQ)
   * @param originalTopic - Tópico original donde falló el mensaje
   * @param originalMessage - Mensaje original que falló
   * @param error - Error que ocurrió
   * @param transactionId - TransactionId para usar como partition key
   */
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
}



