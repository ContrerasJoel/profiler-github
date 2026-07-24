import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/http-exception.filter';

/**
 * E2E que no toca la red: solo cubre el contrato que el frontend necesita para no
 * romperse (liveness y validación de entrada). Los casos que sí llaman a GitHub se
 * verifican manualmente, para no depender del rate limit en CI.
 */
describe('API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  it('GET /health devuelve estado ok', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(response.body).toMatchObject({ status: 'ok' });
    expect(typeof response.body.uptime).toBe('number');
  });

  it('GET /user/:username rechaza un username con formato inválido', async () => {
    const response = await request(app.getHttpServer()).get('/user/--invalido--').expect(400);

    expect(response.body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
    expect(response.body.message.join(' ')).toContain('Username inválido');
  });

  it('GET /user/:username rechaza un username demasiado largo', async () => {
    await request(app.getHttpServer()).get(`/user/${'a'.repeat(40)}`).expect(400);
  });

  afterAll(async () => {
    await app.close();
  });
});
