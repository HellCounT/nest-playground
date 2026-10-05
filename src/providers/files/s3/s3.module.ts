import * as AWS from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';
import { S3Lib } from './constants/s3lib.constant.js';
import { S3Service } from './s3.service.js';
import { AppConfigService } from '../../../config/app-config.service.js';

@Module({
  providers: [
    S3Service,
    {
      provide: S3Lib,
      inject: [AppConfigService],
      useFactory: async (config: AppConfigService) => {
        return new AWS.S3({
          endpoint: config.storageUrl,
          region: config.storageRegion,
          credentials: {
            accessKeyId: config.storageAccessKeyId,
            secretAccessKey: config.storageSecretAccessKey,
          },
        });
      },
    },
  ],
  exports: [S3Service, S3Lib],
})
export class S3Module {}
