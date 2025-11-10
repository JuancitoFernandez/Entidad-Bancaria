import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Puerto HTTP (opcional, para health checks)
  const port = process.env.PORT || 3002;
  await app.listen(port);
  
  console.log(`🚀 Backend Orchestrator service is running on: http://localhost:${port}`);
  console.log(`📥 Listening to Kafka topic: txn.commands`);
}

bootstrap();

