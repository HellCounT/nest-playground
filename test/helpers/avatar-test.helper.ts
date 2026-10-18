import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Avatar } from '../../src/features/avatar/entity/avatar.entity.js';

const testImage = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlS0AAAAASUVORK5CYII=',
  'base64',
);

export async function uploadAvatarTestHelper(
  app: INestApplication,
  accessToken: string,
  fileName: string,
): Promise<Avatar> {
  const response = await request(app.getHttpServer())
    .post('/api/v1/avatars/upload')
    .set('Authorization', `Bearer ${accessToken}`)
    .attach('file', testImage, {
      filename: fileName,
      contentType: 'image/png',
    })
    .expect(200);

  return response.body;
}

export async function uploadMultipleAvatarsTestHelper(
  app: INestApplication,
  accessToken: string,
  count: number,
  prefix: string,
): Promise<Avatar[]> {
  const avatars: Avatar[] = [];

  for (let i = 1; i <= count; i++) {
    avatars.push(
      await uploadAvatarTestHelper(app, accessToken, `${prefix}-${i}.png`),
    );
  }

  return avatars;
}

export async function deleteAvatarTestHelper(
  app: INestApplication,
  accessToken: string,
  avatarId: string,
): Promise<void> {
  await request(app.getHttpServer())
    .delete(`/api/v1/avatars/${avatarId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(204);
}
