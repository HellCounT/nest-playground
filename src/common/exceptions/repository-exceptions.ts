export class RepositoryException extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class RepositoryReadException extends RepositoryException {
  constructor(cause?: unknown) {
    super('Failed to read data from repository', cause);
  }
}

export class RepositoryWriteException extends RepositoryException {
  constructor(cause?: unknown) {
    super('Failed to write data to repository', cause);
  }
}
