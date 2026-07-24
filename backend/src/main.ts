import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  const port = Number(process.env.PORT ?? 3001);

  // Detrás de Nginx Proxy Manager: sin esto el throttler vería siempre la IP del proxy
  // y limitaría a todos los usuarios como si fueran uno solo.
  app.set('trust proxy', 1);

  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins.includes('*') ? true : origins,
    methods: ['GET'],
    credentials: false,
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('GitHub Profiler API')
    .setDescription(
      'API en NestJS que consulta la API pública de GitHub y devuelve un perfil ya agregado ' +
        'y normalizado, listo para renderizar en el frontend.',
    )
    .setVersion('1.0.0')
    .build();

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig), {
    customSiteTitle: 'GitHub Profiler API',
  });

  await app.listen(port, '0.0.0.0');

  logger.log(`API escuchando en http://localhost:${port}`);
  logger.log(`Documentación Swagger en http://localhost:${port}/docs`);
  logger.log(`Orígenes CORS permitidos: ${origins.join(', ')}`);
}

void bootstrap();
