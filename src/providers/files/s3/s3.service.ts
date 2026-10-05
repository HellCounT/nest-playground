import { Inject, Injectable } from '@nestjs/common';
import { IFileService } from '../files.adapter.js';
import { S3_CLIENT } from './constants/s3-client.token.js';
import { UploadFilePayloadDto } from './dto/upload-file-payload.dto.js';
import { UploadFileResultDto } from './dto/upload-file-result.dto.js';
import { RemoveFilePayloadDto } from './dto/remove-file-payload.dto.js';
import {
  FileRemoveFailedException,
  FileUploadFailedException,
} from '../exceptions/files-storage.exception.js';
import { AppConfigService } from '../../../config/app-config.service.js';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service extends IFileService {
  // private readonly logger = new Logger(S3Service.name);
  constructor(
    @Inject(S3_CLIENT) private readonly s3: S3Client,
    private readonly configService: AppConfigService,
  ) {
    super();
  }

  async uploadFile(dto: UploadFilePayloadDto): Promise<UploadFileResultDto> {
    const { folder, file, name } = dto;
    const path = `${folder}/${uuidv4()}${name}`;

    return new Promise((resolve, reject) => {
      this.s3.send(
        new PutObjectCommand({
          Bucket: this.configService.storageBucketName,
          Key: path,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
        (error) => {
          if (!error) {
            resolve({
              path,
            });
          } else {
            reject(new FileUploadFailedException(error.message));
          }
        },
      );
    });
  }

  async removeFile(dto: RemoveFilePayloadDto): Promise<void> {
    const { path } = dto;

    return new Promise((resolve, reject) => {
      this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.configService.storageBucketName,
          Key: path,
        }),
        (error) => {
          if (!error) {
            resolve();
          } else {
            reject(new FileRemoveFailedException(error.message));
          }
        },
      );
    });
  }
}
