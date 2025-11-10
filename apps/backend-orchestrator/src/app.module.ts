import { Module } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';
import { KafkaService } from './kafka.service';

@Module({
  imports: [],
  controllers: [],
  providers: [OrchestratorService, KafkaService],
})
export class AppModule {}





