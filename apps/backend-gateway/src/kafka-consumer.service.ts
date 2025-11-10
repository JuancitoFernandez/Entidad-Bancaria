import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { Logger } from '@nestjs/common';
import { EventEnvelope } from '@banking-events-system/event-contracts';
import { EventsGateway } from './events.gateway';

@Injectable()
export class KafkaConsumerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(private readonly eventsGateway: EventsGateway) {
    const broker = process.env.KAFKA_BROKER || 'localhost:9092';
    
    this.kafka = new Kafka({
      clientId: 'backend-gateway-consumer',
      brokers: [broker],
    });

    this.consumer = this.kafka.consumer({
      groupId: 'gateway-consumer-group',
    });
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({
        topic: 'txn.events',
        fromBeginning: false, // Solo consumir mensajes nuevos
      });

      this.logger.log('✅ Kafka consumer connected (gateway)');
      this.logger.log('📥 Subscribed to topic: txn.events');

      // Iniciar el consumo de mensajes
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });
    } catch (error) {
      this.logger.error('❌ Error connecting to Kafka:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.consumer.disconnect();
      this.logger.log('✅ Kafka consumer disconnected (gateway)');
    } catch (error) {
      this.logger.error('❌ Error disconnecting from Kafka:', error);
    }
  }

  /**
   * Maneja cada mensaje recibido del tópico txn.events
   */
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
}



