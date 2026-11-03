import { S3Client } from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';
import { S3Service } from './s3.service.js';
import { AppConfigService } from '../../../config/app-config.service.js';
import { S3_CLIENT } from './constants/s3-client.token.js';

@Module({
  providers: [
    S3Service,
    {
      provide: S3_CLIENT,
      inject: [AppConfigService],
      useFactory: async (config: AppConfigService) => {
        return new S3Client({
          endpoint: config.storageUrl,
          region: config.storageRegion,
          forcePathStyle: true,
          credentials: {
            accessKeyId: config.storageAccessKeyId,
            secretAccessKey: config.storageSecretAccessKey,
          },
        });
      },
    },
  ],
  exports: [S3Service],
})
export class S3Module {}
