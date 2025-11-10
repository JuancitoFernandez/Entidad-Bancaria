import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;

  constructor() {
    const broker = process.env.KAFKA_BROKER || 'localhost:9092';
    
    this.kafka = new Kafka({
      clientId: 'backend-api-producer',
      brokers: [broker],
    });

    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    console.log('✅ Kafka producer connected');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    console.log('✅ Kafka producer disconnected');
  }

  /**
   * Publica un evento en un tópico de Kafka
   * @param topic - Tópico de Kafka
   * @param key - Clave de partición (partition key)
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
}



