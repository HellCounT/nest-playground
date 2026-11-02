import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { applyAppSettings } from '../src/settings/apply-app-settings.js';
import { UserRepository } from '../src/features/user/repository/user.repository.js';
import { AvatarRepository } from '../src/features/avatar/repository/avatar.repository.js';
import { SessionRepository } from '../src/features/session/repository/session.repository.js';
import request from 'supertest';
import { testUsers } from './stabs/test-users.stab.js';
import { AvatarCleanupExecutorService } from '../src/features/avatar/avatar-cleanup/domain/avatar-cleanup-executor.service.js';
import { uploadMultipleAvatarsTestHelper } from './helpers/avatar-test.helper.js';
import { DataSource, Repository } from 'typeorm';
import { Avatar } from '../src/features/avatar/entity/avatar.entity.js';
import { IFileService } from '../src/providers/files/files.adapter.js';
import { MoneyTransferRepository } from '../src/features/money-transfer/repository/money-transfer.repository.js';
import { S3Module } from '../src/providers/files/s3/s3.module.js';
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { S3_CLIENT } from '../src/providers/files/s3/constants/s3-client.token.js';
import { AppConfigService } from '../src/config/app-config.service.js';

describe('Avatar Cleanup (e2e)', () => {
  let app: INestApplication;

  let userRepo: UserRepository;
  let avatarRepo: AvatarRepository;
  let sessionRepo: SessionRepository;
  let executor: AvatarCleanupExecutorService;
  let fileService: IFileService;
  let moneyTransferRepo: MoneyTransferRepository;

  let avatarTypeOrmRepo: Repository<Avatar>;

  let s3Client: S3Client;
  let appConfig: AppConfigService;

  let testAvatars: Avatar[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    applyAppSettings(app);

    userRepo = app.get(UserRepository);
    avatarRepo = app.get(AvatarRepository);
    sessionRepo = app.get(SessionRepository);
    moneyTransferRepo = app.get(MoneyTransferRepository);
    executor = app.get(AvatarCleanupExecutorService);
    const dataSource = app.get(DataSource);
    avatarTypeOrmRepo = dataSource.getRepository(Avatar);
    fileService = app.get(IFileService);
    appConfig = app.get(AppConfigService);

    s3Client = app.select(S3Module).get<S3Client>(S3_CLIENT, { strict: true });

    await app.init();
  });

  beforeEach(async () => {
    // Entries deletion
    const avatarsForDeletion = await avatarTypeOrmRepo.find({
      withDeleted: true,
    });

    for (const avatar of avatarsForDeletion) {
      await fileService.removeFile({ path: avatar.fileName });
    }

    await moneyTransferRepo.testingDeleteAllRecords();
    await sessionRepo.testingDeleteAllRecords();
    await avatarRepo.testingDeleteAllRecords();
    await userRepo.testingDeleteAllRecords();

    await request(app.getHttpServer())
      .post('/api/v1/auth/user-registration')
      .send(testUsers[0])
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ login: testUsers[0].login, password: testUsers[0].password })
      .expect(200);

    const accessToken = loginResponse.body.accessToken;

    testAvatars = await uploadMultipleAvatarsTestHelper(
      app,
      accessToken,
      4,
      'test',
    );

    await avatarTypeOrmRepo.update(testAvatars[0].id, {
      deletedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    });

    await avatarTypeOrmRepo.findOne({
      where: { id: testAvatars[0].id },
      withDeleted: true,
    });

    await avatarTypeOrmRepo.update(testAvatars[1].id, {
      deletedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    });

    await avatarTypeOrmRepo.update(testAvatars[2].id, {
      deletedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });
  });

  afterEach(async () => {});

  afterAll(async () => {
    await app.close();
  });

  it('Should successfully delete all expired avatars', async () => {
    const executionResult = await executor.cleanup();

    console.log(executionResult);

    const testAvatar0 = await avatarTypeOrmRepo.findOne({
      where: { id: testAvatars[0].id },
      withDeleted: true,
    });
    const testAvatar1 = await avatarTypeOrmRepo.findOne({
      where: { id: testAvatars[1].id },
      withDeleted: true,
    });
    const testAvatar2 = await avatarTypeOrmRepo.findOne({
      where: { id: testAvatars[2].id },
      withDeleted: true,
    });

    const testAvatar3 = await avatarTypeOrmRepo.findOne({
      where: { id: testAvatars[3].id },
      withDeleted: true,
    });

    expect(testAvatar0).toBeNull();
    expect(testAvatar1).toBeNull();
    expect(testAvatar2).not.toBeNull();
    expect(testAvatar2?.deletedAt).not.toBeNull();
    expect(testAvatar3).not.toBeNull();
    expect(testAvatar3?.deletedAt).toBeNull();
    expect(executionResult).toEqual({ processed: 2, deleted: 2, failed: 0 });

    const command0 = new HeadObjectCommand({
      Bucket: appConfig.storageBucketName,
      Key: testAvatars[0].fileName,
    });

    const command1 = new HeadObjectCommand({
      Bucket: appConfig.storageBucketName,
      Key: testAvatars[1].fileName,
    });

    const command2 = new HeadObjectCommand({
      Bucket: appConfig.storageBucketName,
      Key: testAvatars[2].fileName,
    });

    const command3 = new HeadObjectCommand({
      Bucket: appConfig.storageBucketName,
      Key: testAvatars[3].fileName,
    });

    await expect(s3Client.send(command0)).rejects.toMatchObject({
      $metadata: {
        httpStatusCode: 404,
      },
    });

    await expect(s3Client.send(command1)).rejects.toMatchObject({
      $metadata: {
        httpStatusCode: 404,
      },
    });

    await expect(s3Client.send(command2)).resolves.toBeDefined();

    await expect(s3Client.send(command3)).resolves.toBeDefined();
  });
});
