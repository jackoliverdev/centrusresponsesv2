import express from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { API } from 'common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for all origins
  app.enableCors({
    origin: '*', // Allow any origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.use(API.stripeWebhook.path, express.raw({ type: 'application/json' }));

  //await app.listen(process.env.PORT || 4000);
  await app.listen(process.env.PORT || 4000, '0.0.0.0');
}

bootstrap();
