export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export class FileValidationError extends StorageError {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'FileValidationError';
  }
}

export class FileNotFoundError extends StorageError {
  constructor(public readonly key: string) {
    super(`File not found in storage: ${key}`);
    this.name = 'FileNotFoundError';
  }
}

export class StorageProviderError extends StorageError {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'StorageProviderError';
  }
}
