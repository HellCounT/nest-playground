export class RepositoryException extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = RepositoryException.name;
  }
}

export class RepositoryReadException extends RepositoryException {
  constructor(cause?: unknown) {
    super('Failed to read data from repository', cause);
    this.name = RepositoryReadException.name;
  }
}

export class RepositoryWriteException extends RepositoryException {
  constructor(cause?: unknown) {
    super('Failed to write data to repository', cause);
    this.name = RepositoryWriteException.name;
  }
}
