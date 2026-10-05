import * as AWS from '@aws-sdk/client-s3';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { IFileService } from '../files.adapter.js';
import { S3Lib } from './constants/s3lib.constant.js';
import { UploadFilePayloadDto } from './dto/upload-file-payload.dto.js';
import { UploadFileResultDto } from './dto/upload-file-result.dto.js';
import { RemoveFilePayloadDto } from './dto/remove-file-payload.dto.js';
import {
  FileRemoveFailedException,
  FileUploadFailedException,
} from '../exceptions/files-storage.exception.js';
import { AppConfigService } from '../../../config/app-config.service.js';

@Injectable()
export class S3Service extends IFileService {
  private readonly logger = new Logger(S3Service.name);
  private readonly configService: AppConfigService;
  constructor(@Inject(S3Lib) private readonly S3: AWS.S3) {
    super();
  }

  async uploadFile(dto: UploadFilePayloadDto): Promise<UploadFileResultDto> {
    const { folder, file, name } = dto;
    const path = `${folder}/${name}`;

    this.logger.log('📁 Beginning of uploading file to bucket');

    return new Promise((resolve, reject) => {
      this.S3.putObject(
        {
          Bucket: this.configService.storageBucketName,
          Key: path,
          Body: file.buffer,
          ACL: 'public-read',
          ContentType: file.mimetype,
        },
        (error) => {
          if (!error) {
            this.logger.log('✅ Uploading was successful');
            resolve({
              path,
            });
          } else {
            this.logger.error(`❌ File upload error with path: ${path}`);
            reject(new FileUploadFailedException(error.message));
          }
        },
      );
    });
  }

  async removeFile(dto: RemoveFilePayloadDto): Promise<void> {
    const { path } = dto;

    this.logger.log('🗑️ Beginning of removing file from bucket');

    return new Promise((resolve, reject) => {
      this.S3.deleteObject(
        {
          Bucket: this.configService.storageBucketName,
          Key: path,
        },
        (error) => {
          if (!error) {
            this.logger.log('✅ Removing was successful');
            resolve();
          } else {
            this.logger.error(`❌ File remove error with path: ${path}`);
            reject(new FileRemoveFailedException(error.message));
          }
        },
      );
    });
  }
}
