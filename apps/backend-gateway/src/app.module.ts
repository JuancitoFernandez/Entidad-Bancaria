import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { KafkaConsumerService } from './kafka-consumer.service';

@Module({
  imports: [],
  controllers: [],
  providers: [EventsGateway, KafkaConsumerService],
})
export class AppModule {}





