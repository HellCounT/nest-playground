import { HttpStatus } from '@nestjs/common';

export class FilesStorageException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export const filesExceptionStatusMap: Record<string, HttpStatus> = {
  FILE_REMOVE_FAILED: HttpStatus.SERVICE_UNAVAILABLE,
  FILE_UPLOAD_FAILED: HttpStatus.SERVICE_UNAVAILABLE,
};

export class FileUploadFailedException extends FilesStorageException {
  constructor(cause?: unknown) {
    super('Failed on file uploading', 'FILE_UPLOAD_FAILED', cause);
  }
}

export class FileRemoveFailedException extends FilesStorageException {
  constructor(cause?: unknown) {
    super('Failed on file removal', 'FILE_REMOVE_FAILED', cause);
  }
}
