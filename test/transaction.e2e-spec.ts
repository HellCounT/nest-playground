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

  it('Should return 204 on successful money transfer', async () => {
    const registerSenderResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/user-registration')
      .send(testUsers[0])
      .expect(201);
    const registerRecipientResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/user-registration')
      .send(testUsers[1])
      .expect(201);

    const senderId = registerSenderResponse.body.id;
    const recipientId = registerRecipientResponse.body.id;

    const sender = await userRepository.getById(senderId);
    expect(sender).not.toBeNull();
    const recipient = await userRepository.getById(recipientId);
    expect(recipient).not.toBeNull();

    const isUpdated = await userRepository.updateOneById(senderId, {
      balance: '100.50',
    });
    expect(isUpdated).toBe(true);

    const senderBeforeTransfer = await userRepository.getById(senderId);
    expect(senderBeforeTransfer?.balance).toBe('100.50');

    const senderLoginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ login: testUsers[0].login, password: testUsers[0].password })
      .expect(200);

    const accessToken = senderLoginResponse.body.accessToken;

    await request(app.getHttpServer())
      .post('/api/v1/users/me/transfer-money')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ recipientId: recipientId, amount: '20.50' })
      .expect(204);

    const senderAfterTransfer = await userRepository.getById(senderId);
    const recipientAfterTransfer = await userRepository.getById(recipientId);

    expect(senderAfterTransfer?.balance).toBe('80.00');
    expect(recipientAfterTransfer?.balance).toBe('20.50');
  });

  it('Should return 409 on insufficient funds', async () => {
    const registerSenderResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/user-registration')
      .send(testUsers[0])
      .expect(201);
    const registerRecipientResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/user-registration')
      .send(testUsers[1])
      .expect(201);

    const senderId = registerSenderResponse.body.id;
    const recipientId = registerRecipientResponse.body.id;

    const sender = await userRepository.getById(senderId);
    expect(sender).not.toBeNull();
    const recipient = await userRepository.getById(recipientId);
    expect(recipient).not.toBeNull();

    const isUpdated = await userRepository.updateOneById(senderId, {
      balance: '50.00',
    });
    expect(isUpdated).toBe(true);

    const senderLoginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ login: testUsers[0].login, password: testUsers[0].password })
      .expect(200);

    const accessToken = senderLoginResponse.body.accessToken;

    await request(app.getHttpServer())
      .post('/api/v1/users/me/transfer-money')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ recipientId: recipientId, amount: '80' })
      .expect(409);

    const senderAfterTransfer = await userRepository.getById(senderId);
    const recipientAfterTransfer = await userRepository.getById(recipientId);

    expect(senderAfterTransfer?.balance).toBe('50.00');
    expect(recipientAfterTransfer?.balance).toBe('0.00');
  });

  it('Should return 500 on credit failure', async () => {
    const registerSenderResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/user-registration')
      .send(testUsers[0])
      .expect(201);
    const registerRecipientResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/user-registration')
      .send(testUsers[1])
      .expect(201);

    const senderId = registerSenderResponse.body.id;
    const recipientId = registerRecipientResponse.body.id;

    const sender = await userRepository.getById(senderId);
    expect(sender).not.toBeNull();
    const recipient = await userRepository.getById(recipientId);
    expect(recipient).not.toBeNull();

    const isUpdated = await userRepository.updateOneById(senderId, {
      balance: '100.00',
    });
    expect(isUpdated).toBe(true);

    const senderLoginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ login: testUsers[0].login, password: testUsers[0].password })
      .expect(200);

    const accessToken = senderLoginResponse.body.accessToken;

    let balanceInsideTransaction: string | undefined;

    const creditSpy = vi.spyOn(userRepository, 'credit');

    try {
      creditSpy.mockImplementationOnce(async () => {
        const senderInsideTransaction = await userRepository.getById(senderId);
        balanceInsideTransaction = senderInsideTransaction?.balance;
        throw new Error('Credit failure simulation');
      });
      await request(app.getHttpServer())
        .post('/api/v1/users/me/transfer-money')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ recipientId: recipientId, amount: '30' })
        .expect(500);

      expect(balanceInsideTransaction).toBe('70.00');

      const senderAfter = await userRepository.getById(senderId);
      const recipientAfter = await userRepository.getById(recipientId);

      expect(senderAfter?.balance).toBe('100.00');
      expect(recipientAfter?.balance).toBe('0.00');

      expect(creditSpy).toHaveBeenCalledExactlyOnceWith(recipientId, '30');
    } finally {
      creditSpy.mockRestore();
    }
  });

  it('Should allow only one of two concurrent transfers', async () => {
    const registerSenderResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/user-registration')
      .send(testUsers[0])
      .expect(201);
    const registerRecipient1Response = await request(app.getHttpServer())
      .post('/api/v1/auth/user-registration')
      .send(testUsers[1])
      .expect(201);
    const registerRecipient2Response = await request(app.getHttpServer())
      .post('/api/v1/auth/user-registration')
      .send(testUsers[2])
      .expect(201);

    const senderId = registerSenderResponse.body.id;
    const recipient1Id = registerRecipient1Response.body.id;
    const recipient2Id = registerRecipient2Response.body.id;

    const sender = await userRepository.getById(senderId);
    expect(sender).not.toBeNull();
    const recipient1 = await userRepository.getById(recipient1Id);
    expect(recipient1).not.toBeNull();
    const recipient2 = await userRepository.getById(recipient2Id);
    expect(recipient2).not.toBeNull();

    const isUpdated = await userRepository.updateOneById(senderId, {
      balance: '100.00',
    });
    expect(isUpdated).toBe(true);

    const senderLoginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ login: testUsers[0].login, password: testUsers[0].password })
      .expect(200);

    const accessToken = senderLoginResponse.body.accessToken;

    const firstRequest = request(app.getHttpServer())
      .post('/api/v1/users/me/transfer-money')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ recipientId: recipient1Id, amount: '80' });

    const secondRequest = request(app.getHttpServer())
      .post('/api/v1/users/me/transfer-money')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ recipientId: recipient2Id, amount: '80' });

    const responses = await Promise.all([firstRequest, secondRequest]);

    const statusCodes = responses.map((r) => r.status);

    expect(statusCodes.sort()).toEqual([204, 409]);

    const senderAfterTransfer = await userRepository.getById(senderId);
    const recipient1AfterTransfer = await userRepository.getById(recipient1Id);
    const recipient2AfterTransfer = await userRepository.getById(recipient2Id);

    expect(senderAfterTransfer?.balance).toBe('20.00');

    const balancesAfterTransfer = [
      recipient1AfterTransfer?.balance,
      recipient2AfterTransfer?.balance,
    ].sort();

    expect(balancesAfterTransfer).toEqual(['0.00', '80.00']);
  });
});
