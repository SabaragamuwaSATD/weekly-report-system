import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { Connection } from 'mongoose';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import { Role } from '../src/common/enums/role.enum';
import * as bcrypt from 'bcrypt';

// Runs against a real MongoDB (the same cluster configured in apps/api/.env),
// but in a dedicated database so it never touches dev/prod data.
const TEST_DB_NAME = 'weekly_reports_e2e_test';

describe('RBAC (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Load apps/api/.env so we can read the real MONGODB_URI, then point it
    // at a throwaway database before AppModule's own ConfigModule boots
    // (dotenv never overwrites vars already present in process.env).
    const configRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
    }).compile();
    const baseUri = configRef
      .get(ConfigService)
      .getOrThrow<string>('MONGODB_URI');

    const testUri = new URL(baseUri);
    testUri.pathname = `/${TEST_DB_NAME}`;
    process.env.MONGODB_URI = testUri.toString();
    process.env.JWT_ACCESS_SECRET ??= 'test-access-secret';
    process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret';

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    // Seed one manager and one team member directly via the service
    const usersService = app.get(UsersService);
    const passwordHash = await bcrypt.hash('password123', 12);

    await usersService.create({
      name: 'Test Manager',
      email: 'manager@test.com',
      passwordHash,
      role: Role.MANAGER,
    });
    await usersService.create({
      name: 'Test Member',
      email: 'member@test.com',
      passwordHash,
      role: Role.TEAM_MEMBER,
    });
  }, 30_000);

  afterAll(async () => {
    if (app) {
      const connection = app.get<Connection>(getConnectionToken());
      await connection.dropDatabase();
      await app.close();
    }
  }, 30_000);

  function loginCookie(email: string) {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'password123' })
      .then((res) => res.headers['set-cookie']);
  }

  it('rejects an unauthenticated request to a protected route', async () => {
    await request(app.getHttpServer())
      .get('/api/ping-authenticated')
      .expect(401);
  });

  it('allows a team member to access an authenticated-only route', async () => {
    const cookies = await loginCookie('member@test.com');
    await request(app.getHttpServer())
      .get('/api/ping-authenticated')
      .set('Cookie', cookies)
      .expect(200);
  });

  it('blocks a team member from a manager-only route', async () => {
    const cookies = await loginCookie('member@test.com');
    await request(app.getHttpServer())
      .get('/api/ping-manager-only')
      .set('Cookie', cookies)
      .expect(403);
  });

  it('allows a manager to access a manager-only route', async () => {
    const cookies = await loginCookie('manager@test.com');
    await request(app.getHttpServer())
      .get('/api/ping-manager-only')
      .set('Cookie', cookies)
      .expect(200);
  });
});
