import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = NestFactory.create(AppModule);
  const app2 = await app;
  app2.enableCors({ origin: 'http://localhost:3000', credentials: true });
  app2.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app2.listen(process.env.PORT ?? 3001);
  console.log('FulizaBoost backend running on port 3001');
}
bootstrap();
