import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilitar CORS para desarrollo
  app.enableCors();
  
  // Puerto por defecto 3001 para el servicio API
  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`🚀 Backend API service is running on: http://localhost:${port}`);
}

bootstrap();





