import { AppModule } from '../src/app.module.js';
import { Test, TestingModule } from '@nestjs/testing';
import { applyAppSettings } from '../src/settings/apply-app-settings.js';
import { UserRepository } from '../src/features/user/repository/user.repository.js';
import { SessionRepository } from '../src/features/session/repository/session.repository.js';
import { INestApplication } from '@nestjs/common';
import { testUsers } from './stabs/test-users.stab.js';
import request from 'supertest';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    applyAppSettings(app);

    const userRepo = app.get(UserRepository);
    const sessionRepo = app.get(SessionRepository);

    await app.init();

    // Entries deletion
    await sessionRepo.testingDeleteAllRecords();
    await userRepo.testingDeleteAllRecords();

    for (const user of testUsers) {
      await request(app.getHttpServer())
        .post('/api/v1/auth/user-registration')
        .send(user)
        .expect(201);
    }

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ login: testUsers[0].login, password: testUsers[0].password })
      .expect(200);

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/users', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/api/v1/users').expect(401);
    });

    it('should return users without sensitive info for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.items).toBeInstanceOf(Array);
      expect(response.body.totalCount).toBe(4);
      expect(response.body.pageSize).toBeDefined();
      expect(response.body.pagesCount).toBeDefined();
      for (const user of response.body.items) {
        expect(user).not.toHaveProperty('passwordHash');
      }
    });

    it('should return correct page and pageSize', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .query({
          page: 2,
          pageSize: 2,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.items).toHaveLength(2);
      expect(response.body.totalCount).toBe(4);

      expect(response.body.page).toBe(2);
      expect(response.body.pageSize).toBe(2);
      expect(response.body.pagesCount).toBe(2);
    });

    it('should return empty result when login is not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .query({
          searchLogin: 'this-user-does-not-exist',
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.items).toEqual([]);
      expect(response.body.totalCount).toBe(0);
      expect(response.body.pagesCount).toBe(0);
    });

    it('should combine search, pagination and sorting', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .query({
          searchLogin: 'andy',
          page: 1,
          pageSize: 1,
          sortDirection: 'asc',
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.totalCount).toBe(2);
      expect(response.body.page).toBe(1);
      expect(response.body.pageSize).toBe(1);
      expect(response.body.pagesCount).toBe(2);

      expect(response.body.items[0].login.toLowerCase()).toContain('andy');
    });
  });
});
