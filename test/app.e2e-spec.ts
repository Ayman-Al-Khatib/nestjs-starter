import { INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { SnakeCaseInterceptor } from '../src/core/interceptors/snake-case.interceptor';
import { TransformInterceptor } from '../src/core/interceptors/transform.interceptor';
import { UtcDateSerializerInterceptor } from '../src/core/interceptors/utc-date-serializer.interceptor';

/**
 * Infra-free e2e: exercises the real HTTP pipeline (global response
 * interceptors + envelope shaping) end-to-end without a database, Redis, or
 * any external service. Runs anywhere `npm run test:e2e` runs.
 */
describe('App HTTP pipeline (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
        { provide: APP_INTERCEPTOR, useClass: SnakeCaseInterceptor },
        { provide: APP_INTERCEPTOR, useClass: UtcDateSerializerInterceptor },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /info wraps the payload in the standard { data } envelope', async () => {
    const res = await request(app.getHttpServer()).get('/info').expect(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.name).toBe('nestjs-starter');
  });

  it('GET / serves the HTML landing page', async () => {
    const res = await request(app.getHttpServer()).get('/').expect(200);
    expect(res.text).toContain('<!doctype html>');
  });

  it('snake-cases the response body when x-case-format: snake is requested', async () => {
    const res = await request(app.getHttpServer())
      .get('/info')
      .set('x-case-format', 'snake')
      .expect(200);
    // displayName -> display_name when snake formatting is requested.
    expect(res.body.data).toHaveProperty('display_name');
  });
});
