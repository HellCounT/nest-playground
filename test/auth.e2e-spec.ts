import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { applyAppSettings } from '../src/settings/apply-app-settings.js';
import { UserRepository } from '../src/features/user/repository/user.repository.js';
import { SessionRepository } from '../src/features/session/repository/session.repository.js';
import { testUsers } from './stabs/test-users.stab.js';
import request from 'supertest';

let userRepository: UserRepository;
let sessionRepository: SessionRepository;

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    applyAppSettings(app);

    userRepository = app.get(UserRepository);
    sessionRepository = app.get(SessionRepository);

    await app.init();
  });

  beforeEach(async () => {
    // Entries deletion
    await sessionRepository.testingDeleteAllRecords();
    await userRepository.testingDeleteAllRecords();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {});

  describe('POST /api/v1/auth/user-registration', () => {
    it('should register user', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/user-registration')
        .send(testUsers[0])
        .expect(201);
    });

    it('should not register user with existing login/email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/user-registration')
        .send(testUsers[1])
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/v1/auth/user-registration')
        .send(testUsers[1])
        .expect(400);
    });

    it('should return 400 for invalid registration data', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/user-registration')
        .send({
          login: '',
          email: 'not-email',
          password: '1',
          age: -1,
          description: '',
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login user and return tokens pair', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/user-registration')
        .send(testUsers[0])
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ login: testUsers[0].login, password: testUsers[0].password })
        .expect(200);

      expect(response.body.accessToken).toEqual(expect.any(String));

      const cookies = response.headers['set-cookie'];

      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('refreshToken=');
      expect(cookies[0]).toContain('HttpOnly');
    });

    it('should reuse existing session on repeated login and allow refresh', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/user-registration')
        .send(testUsers[0])
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          login: testUsers[0].login,
          password: testUsers[0].password,
        })
        .expect(200);

      const secondLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          login: testUsers[0].login,
          password: testUsers[0].password,
        })
        .expect(200);

      const secondRefreshCookie = secondLoginResponse.headers['set-cookie'][0];

      expect(secondLoginResponse.body.accessToken).toEqual(expect.any(String));

      expect(secondRefreshCookie).toContain('refreshToken=');

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', secondRefreshCookie)
        .expect(200);
    });
  });

  it('should reject unregistered user', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/user-registration')
      .send(testUsers[0])
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ login: 'unreg123', password: testUsers[0].password })
      .expect(401);
  });

  describe('JWT security', () => {
    it('should reject invalid access token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/user-registration')
        .send(testUsers[0])
        .expect(201);
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          login: testUsers[0].login,
          password: testUsers[0].password,
        })
        .expect(200);

      const accessToken = loginResponse.body.accessToken;

      const tokenParts = accessToken.split('.');

      expect(tokenParts).toHaveLength(3);

      const fakePayLoad = Buffer.from(
        JSON.stringify({ userId: 'fakeId', sessionId: 'fakeId' }),
      ).toString('base64url');

      const fakeToken = `${tokenParts[0]}.${fakePayLoad}.${tokenParts[2]}`;
      await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(401);

      const fakeTokenWithModifiedSignature = `${tokenParts[0]}.${tokenParts[1]}.fake-signature`;
      await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${fakeTokenWithModifiedSignature}`)
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    it('should reject request without refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh-token')
        .expect(401);
    });

    it('should reject invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', 'refreshToken=invalid-refresh-token')
        .expect(401);
    });

    it('should issue new token pair', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/user-registration')
        .send(testUsers[1])
        .expect(201);
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          login: testUsers[1].login,
          password: testUsers[1].password,
        })
        .expect(200);

      const oldAccessToken = loginResponse.body.accessToken;
      const oldRefreshCookie = loginResponse.headers['set-cookie'][0];
      const oldRefreshToken = oldRefreshCookie
        .split(';')[0]
        .replace('refreshToken=', '');

      const refreshResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', oldRefreshCookie)
        .expect(200);

      const newAccessToken = refreshResponse.body.accessToken;
      const newRefreshCookie = refreshResponse.headers['set-cookie'][0];
      const newRefreshToken = newRefreshCookie
        .split(';')[0]
        .replace('refreshToken=', '');

      expect(newAccessToken).toEqual(expect.any(String));

      expect(newRefreshCookie).toContain('refreshToken=');

      expect(newAccessToken).not.toBe(oldAccessToken);

      expect(newRefreshToken).not.toBe(oldRefreshToken);
    });
  });
  describe('POST /api/v1/auth/logout', () => {
    it('should reject logout without access token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .expect(401);
    });

    it('should logout authenticated user', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/user-registration')
        .send(testUsers[2])
        .expect(201);
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          login: testUsers[2].login,
          password: testUsers[2].password,
        })
        .expect(200);

      const accessToken = loginResponse.body.accessToken;

      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('should close the session/refrest-token after logout', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/user-registration')
        .send(testUsers[3])
        .expect(201);
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          login: testUsers[3].login,
          password: testUsers[3].password,
        })
        .expect(200);

      const accessToken = loginResponse.body.accessToken;

      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh-token')
        .expect(401);
    });

    it('should reject token from previously closed session', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/user-registration')
        .send(testUsers[3])
        .expect(201);
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          login: testUsers[3].login,
          password: testUsers[3].password,
        })
        .expect(200);

      const oldRefreshCookie = loginResponse.headers['set-cookie'][0];

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', oldRefreshCookie)
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', oldRefreshCookie)
        .expect(401);
    });
  });
});
