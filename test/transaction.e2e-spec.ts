import { INestApplication } from '@nestjs/common';
import { UserRepository } from '../src/features/user/repository/user.repository.js';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { applyAppSettings } from '../src/settings/apply-app-settings.js';
import request from 'supertest';
import { testUsers } from './stabs/test-users.stab.js';
import { TransactionContext } from '../src/base/infrastructure/repository/typeorm/transaction-context.js';
import { SessionRepository } from '../src/features/session/repository/session.repository.js';
import { AvatarRepository } from '../src/features/avatar/repository/avatar.repository.js';
import {
  ITransactionManager,
  TRANSACTION_MANAGER,
} from '../src/application/transaction-manager.interface.js';

describe('Transaction manager (e2e)', () => {
  let app: INestApplication;
  let userRepository: UserRepository;
  let sessionRepository: SessionRepository;
  let avatarRepository: AvatarRepository;
  let transactionManager: ITransactionManager;
  let transactionContext: TransactionContext;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    applyAppSettings(app);

    userRepository = app.get(UserRepository);
    sessionRepository = app.get(SessionRepository);
    avatarRepository = app.get(AvatarRepository);

    transactionManager = app.get<ITransactionManager>(TRANSACTION_MANAGER);
    transactionContext = app.get(TransactionContext);

    await app.init();
  });

  beforeEach(async () => {
    // Entries deletion
    await sessionRepository.testingDeleteAllRecords();
    await avatarRepository.testingDeleteAllRecords();
    await userRepository.testingDeleteAllRecords();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Should rollback transaction on failure', async () => {
    const registerUserResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/user-registration')
      .send(testUsers[0])
      .expect(201);

    const userId = registerUserResponse.body.id;

    const userBefore = await userRepository.getById(userId);

    expect(userBefore).not.toBeNull();

    const originalDescription = userBefore!.description;

    await expect(
      transactionManager.run(async () => {
        await userRepository.updateOneById(userId, {
          description: 'Changed description',
        });

        const userInsideTransaction = await userRepository.getById(userId);

        expect(userInsideTransaction?.description).toBe('Changed description');

        throw new Error('Fake transaction error');
      }),
    ).rejects.toThrow('Fake transaction error');

    const userAfter = await userRepository.getById(userId);

    expect(userAfter?.description).toBe(originalDescription);

    const managerOutOfTransaction = transactionContext.getManager();

    expect(managerOutOfTransaction).toBeUndefined();
  });

  it('Should commit transaction on success', async () => {
    const registerUserResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/user-registration')
      .send(testUsers[0])
      .expect(201);

    const userId = registerUserResponse.body.id;

    const user = await userRepository.getById(userId);

    expect(user).not.toBeNull();

    await transactionManager.run(async () => {
      const manager = transactionContext.getManager();

      expect(manager).toBeDefined();
      expect(manager?.queryRunner?.isTransactionActive).toBe(true);

      const isUpdated = await userRepository.updateOneById(userId, {
        description: 'Updated description',
      });

      expect(isUpdated).toBe(true);

      const userInsideTransaction = await userRepository.getById(userId);

      expect(userInsideTransaction?.description).toBe('Updated description');
    });

    const updatedUser = await userRepository.getById(userId);

    expect(updatedUser?.description).toBe('Updated description');

    const managerOutOfTransaction = transactionContext.getManager();

    expect(managerOutOfTransaction).toBeUndefined();
  });

  it('Should rollback all changes when nested operation fails', async () => {
    const registerFirstUserResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/user-registration')
      .send(testUsers[0])
      .expect(201);
    const registerSecondUserResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/user-registration')
      .send(testUsers[1])
      .expect(201);

    const firstUserId = registerFirstUserResponse.body.id;
    const secondUserId = registerSecondUserResponse.body.id;

    const firstUser = await userRepository.getById(firstUserId);
    expect(firstUser).not.toBeNull();
    const secondUser = await userRepository.getById(secondUserId);
    expect(secondUser).not.toBeNull();

    const originalFirstDescription = firstUser!.description;
    const originalSecondDescription = secondUser!.description;

    await expect(
      transactionManager.run(async () => {
        const outerManager = transactionContext.getManager();
        expect(outerManager).toBeDefined();
        expect(outerManager?.queryRunner?.isTransactionActive).toBe(true);

        const isUpdatedFirstUser = await userRepository.updateOneById(
          firstUserId,
          {
            description: 'User 1 updated description',
          },
        );

        expect(isUpdatedFirstUser).toBe(true);

        const firstUserInsideTransaction =
          await userRepository.getById(firstUserId);

        expect(firstUserInsideTransaction?.description).toBe(
          'User 1 updated description',
        );

        await transactionManager.run(async () => {
          const innerManager = transactionContext.getManager();
          expect(innerManager).toBeDefined();
          expect(innerManager).toBe(outerManager);

          const isUpdatedSecondUser = await userRepository.updateOneById(
            secondUserId,
            {
              description: 'User 2 updated description',
            },
          );

          expect(isUpdatedSecondUser).toBe(true);

          const secondUserInsideTransaction =
            await userRepository.getById(secondUserId);

          expect(secondUserInsideTransaction?.description).toBe(
            'User 2 updated description',
          );

          throw new Error('Fake transaction error');
        });
      }),
    ).rejects.toThrow('Fake transaction error');

    const firstUserAfterRollback = await userRepository.getById(firstUserId);
    const secondUserAfterRollback = await userRepository.getById(secondUserId);
    expect(firstUserAfterRollback?.description).toBe(originalFirstDescription);
    expect(secondUserAfterRollback?.description).toBe(
      originalSecondDescription,
    );

    expect(transactionContext.getManager()).toBeUndefined();
  });
});
