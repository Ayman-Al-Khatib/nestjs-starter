import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureRouting } from '../src/bootstrap';
import { seedAdmin } from '../src/modules/admins/seeders/seed-admin';

// Booting AppModule needs a live Postgres + migrations, so this suite is
// gated behind RUN_DB_E2E=1 (set in CI alongside the Postgres service).
// Locally `npm run test:e2e` skips it and only runs the infra-free e2e.
const runDbE2e = process.env.RUN_DB_E2E === '1';
const describeDb = runDbE2e ? describe : describe.skip;

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

describeDb('Auth flows (e2e — requires Postgres)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const admin = {
    username: process.env.SEED_ADMIN_USERNAME ?? 'admin',
    password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureRouting(app);
    await app.init();

    dataSource = app.get(DataSource);
    const schema = (dataSource.options as { schema?: string }).schema ?? 'public';
    await dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    await dataSource.runMigrations();
    await seedAdmin(app);
  });

  afterAll(async () => {
    await app?.close();
  });

  const server = () => app.getHttpServer();
  const data = (body: unknown): TokenPair => (body as { data: TokenPair }).data;

  it('rejects invalid admin credentials with 401', async () => {
    await request(server())
      .post('/api/v1/auth/admin/login')
      .send({ username: admin.username, password: 'wrong-password' })
      .expect(401);
  });

  it('issues an access + refresh token pair on valid login', async () => {
    const res = await request(server())
      .post('/api/v1/auth/admin/login')
      .send(admin)
      .expect(200);

    expect(data(res.body).accessToken).toEqual(expect.any(String));
    expect(data(res.body).refreshToken).toEqual(expect.any(String));
  });

  it('rotates the refresh token and detects reuse of the old one', async () => {
    const login = await request(server()).post('/api/v1/auth/admin/login').send(admin).expect(200);
    const original = data(login.body).refreshToken;

    const rotated = await request(server())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: original })
      .expect(200);
    const next = data(rotated.body).refreshToken;
    expect(next).not.toEqual(original);

    // Re-presenting the already-rotated token is treated as theft → 401.
    await request(server())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: original })
      .expect(401);
  });

  it('accepts the issued access token on a protected route', async () => {
    const login = await request(server()).post('/api/v1/auth/admin/login').send(admin).expect(200);
    const { accessToken } = data(login.body);

    await request(server())
      .get('/api/v1/admin/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('rejects a protected route without a token', async () => {
    await request(server()).get('/api/v1/admin/me').expect(401);
  });
});
