import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilitar CORS para desarrollo (permite conexiones WebSocket desde el frontend)
  app.enableCors({
    origin: '*', // En producción, especificar dominios permitidos
    credentials: true,
  });
  
  // Puerto por defecto 3003 para el servicio Gateway
  const port = process.env.PORT || 3003;
  await app.listen(port);
  
  console.log(`🚀 Backend Gateway WebSocket service is running on: http://localhost:${port}`);
  console.log(`🔌 WebSocket server ready on: ws://localhost:${port}`);
  console.log(`📥 Listening to Kafka topic: txn.events`);
}

bootstrap();





