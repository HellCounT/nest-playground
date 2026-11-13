import { INestApplication } from '@nestjs/common';
import { UserRegistrationInputDto } from '../../src/features/auth/api/dto/registration-input.dto.js';
import request from 'supertest';
import { LoginInputDto } from '../../src/features/auth/api/dto/login-input.dto.js';

export async function registerUserTestHelper(
  app: INestApplication,
  user: UserRegistrationInputDto,
): Promise<void> {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/user-registration')
    .send(user);

  if (response.status !== 201) {
    console.log('Failed user:', user);
    console.log('Response:', response.body);
  }

  expect(response.status).toBe(201);
}

export async function loginUserTestHelper(
  app: INestApplication,
  user: LoginInputDto,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({
      login: user.login,
      password: user.password,
    })
    .expect(200);

  return response.body.accessToken;
}

export async function registerAndLoginTestHelper(
  app: INestApplication,
  user: UserRegistrationInputDto,
): Promise<string> {
  await registerUserTestHelper(app, user);

  return loginUserTestHelper(app, user);
}
