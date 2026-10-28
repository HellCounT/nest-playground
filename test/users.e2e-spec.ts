import { AppModule } from '../src/app.module.js';
import { Test, TestingModule } from '@nestjs/testing';
import { applyAppSettings } from '../src/settings/apply-app-settings.js';
import { UserRepository } from '../src/features/user/repository/user.repository.js';
import { SessionRepository } from '../src/features/session/repository/session.repository.js';
import { INestApplication } from '@nestjs/common';
import { testUsers } from './stabs/test-users.stab.js';
import request from 'supertest';
import { AvatarRepository } from '../src/features/avatar/repository/avatar.repository.js';
import { registerAndLoginTestHelper } from './helpers/auth-test.helper.js';
import { testUsersForTop } from './stabs/test-users-for-top.stab.js';
import {
  deleteAvatarTestHelper,
  uploadMultipleAvatarsTestHelper,
} from './helpers/avatar-test.helper.js';
import { Avatar } from '../src/features/avatar/entity/avatar.entity.js';
import { MoneyTransferRepository } from '../src/features/money-transfer/repository/money-transfer.repository.js';

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
    const avatarRepo = app.get(AvatarRepository);
    const sessionRepo = app.get(SessionRepository);
    const moneyTransferRepo = app.get(MoneyTransferRepository);

    await app.init();

    // Entries deletion
    await moneyTransferRepo.testingDeleteAllRecords();
    await sessionRepo.testingDeleteAllRecords();
    await avatarRepo.testingDeleteAllRecords();
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

  describe('GET /api/v1/users/me', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
    });

    it('should return current user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual({
        id: expect.any(String),
        login: testUsers[0].login,
        email: testUsers[0].email,
        age: testUsers[0].age,
        description: testUsers[0].description,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should return 401 with fake access token', async () => {
      const fakeToken =
        accessToken.slice(0, -1) + (accessToken.endsWith('a') ? 'b' : 'a');

      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(401);
    });
  });

  describe('GET /api/v1/users/top', () => {
    let validCaseUploadedAvatars1: Avatar[];
    // let validCaseUploadedAvatars2: Avatar[];

    beforeAll(async () => {
      const validCaseToken1 = await registerAndLoginTestHelper(
        app,
        testUsersForTop.valid1,
      );
      const validCaseToken2 = await registerAndLoginTestHelper(
        app,
        testUsersForTop.valid2,
      );
      const onlyTwoAvatarsToken = await registerAndLoginTestHelper(
        app,
        testUsersForTop.onlyTwoAvatars,
      );
      // const noDescriptionCaseToken = await registerAndLoginTestHelper(
      //   app,
      //   testUsersForTop.noDescription,
      // );
      const tooYoungCaseToken = await registerAndLoginTestHelper(
        app,
        testUsersForTop.tooYoung,
      );
      const deletedAvatarCaseToken = await registerAndLoginTestHelper(
        app,
        testUsersForTop.deletedAvatar,
      );
      validCaseUploadedAvatars1 = await uploadMultipleAvatarsTestHelper(
        app,
        validCaseToken1,
        3,
        'valid1',
      );
      //validCaseUploadedAvatars2
      await uploadMultipleAvatarsTestHelper(app, validCaseToken2, 4, 'valid2');
      //onlyTwoUploadedCaseAvatars
      await uploadMultipleAvatarsTestHelper(
        app,
        onlyTwoAvatarsToken,
        2,
        'only-two',
      );
      //noDescriptionCaseAvatars
      // await uploadMultipleAvatarsTestHelper(
      //   app,
      //   noDescriptionCaseToken,
      //   3,
      //   'no-description',
      // );
      //tooYoungCaseAvatars
      await uploadMultipleAvatarsTestHelper(
        app,
        tooYoungCaseToken,
        3,
        'too-young',
      );
      const avatarDeletionCaseAvatars = await uploadMultipleAvatarsTestHelper(
        app,
        deletedAvatarCaseToken,
        3,
        'deleted-avatar',
      );

      await deleteAvatarTestHelper(
        app,
        deletedAvatarCaseToken,
        avatarDeletionCaseAvatars[2].id,
      );
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/top')
        .query({
          page: 1,
          pageSize: 10,
          minAge: 18,
          maxAge: 35,
        })
        .expect(401);
    });

    it('should return users matching requirements', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/top')
        .query({
          page: 1,
          pageSize: 10,
          minAge: 18,
          maxAge: 35,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.items).toHaveLength(2);
      expect(response.body.totalCount).toBe(2);

      const logins = response.body.items.map(
        (user: { login: string }) => user.login,
      );

      expect(logins).toContain(testUsersForTop.valid1.login);
      expect(logins).toContain(testUsersForTop.valid2.login);

      expect(logins).not.toContain(testUsersForTop.onlyTwoAvatars.login);
      // expect(logins).not.toContain(testUsersForTop.noDescription.login);
      expect(logins).not.toContain(testUsersForTop.tooYoung.login);
      expect(logins).not.toContain(testUsersForTop.deletedAvatar.login);
    });

    it('should return latest active avatar', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/top')
        .query({
          page: 1,
          pageSize: 10,
          minAge: 18,
          maxAge: 35,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const user = response.body.items.find(
        (user: { login: string }) =>
          user.login === testUsersForTop.valid1.login,
      );

      expect(user).toBeDefined();

      const latestUploadedAvatar = validCaseUploadedAvatars1.at(-1)!;

      expect(user.latestAvatar).toEqual({
        id: latestUploadedAvatar.id,
        fileName: latestUploadedAvatar.fileName,
        createdAt: expect.any(String),
      });
    });

    it('should not count deleted avatars as active', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/top')
        .query({
          page: 1,
          pageSize: 10,
          minAge: 18,
          maxAge: 35,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const user = response.body.items.find(
        (user: { login: string }) =>
          user.login === testUsersForTop.deletedAvatar.login,
      );

      expect(user).toBeUndefined();
    });

    it('should not return user with only two active avatars', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/top')
        .query({
          page: 1,
          pageSize: 10,
          minAge: 18,
          maxAge: 35,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const user = response.body.items.find(
        (user: { login: string }) =>
          user.login === testUsersForTop.onlyTwoAvatars.login,
      );

      expect(user).toBeUndefined();
    });

    // it('should not return user without description', async () => {
    //   const response = await request(app.getHttpServer())
    //     .get('/api/v1/users/top')
    //     .query({
    //       page: 1,
    //       pageSize: 10,
    //       minAge: 18,
    //       maxAge: 35,
    //     })
    //     .set('Authorization', `Bearer ${accessToken}`)
    //     .expect(200);
    //
    //   const user = response.body.items.find(
    //     (user: { login: string }) =>
    //       user.login === testUsersForTop.noDescription.login,
    //   );
    //
    //   expect(user).toBeUndefined();
    // });

    it('should filter users by age range', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/top')
        .query({
          page: 1,
          pageSize: 10,
          minAge: 26,
          maxAge: 35,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const logins = response.body.items.map(
        (user: { login: string }) => user.login,
      );

      expect(logins).not.toContain(testUsersForTop.valid1.login);
      expect(logins).toContain(testUsersForTop.valid2.login);

      for (const user of response.body.items) {
        expect(user.age).toBeGreaterThanOrEqual(26);
        expect(user.age).toBeLessThanOrEqual(35);
      }
    });

    it('should not expose internal fields', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/top')
        .query({
          page: 1,
          pageSize: 10,
          minAge: 18,
          maxAge: 35,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      for (const user of response.body.items) {
        expect(user).not.toHaveProperty('passwordHash');
        expect(user).not.toHaveProperty('deletedAt');

        expect(user.latestAvatar).not.toHaveProperty('deletedAt');
        expect(user.latestAvatar).not.toHaveProperty('userId');
      }
    });

    it('should return correct pagination metadata', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/top')
        .query({
          page: 1,
          pageSize: 1,
          minAge: 18,
          maxAge: 35,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.items).toHaveLength(1);

      expect(response.body.totalCount).toBe(2);
      expect(response.body.page).toBe(1);
      expect(response.body.pageSize).toBe(1);
      expect(response.body.pagesCount).toBe(2);
    });
  });
});
