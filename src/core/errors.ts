/**
 * Typed error classes for SiftCoder. Throw classes, not strings.
 */

export class SiftcoderError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'SiftcoderError';
  }
}

export class DaemonUnreachableError extends SiftcoderError {
  constructor(socket: string, cause?: unknown) {
    super(`Daemon unreachable at ${socket}`, 'DAEMON_UNREACHABLE', cause);
    this.name = 'DaemonUnreachableError';
  }
}

export class StorageBackendError extends SiftcoderError {
  constructor(message: string, cause?: unknown) {
    super(message, 'STORAGE_BACKEND', cause);
    this.name = 'StorageBackendError';
  }
}

export class LLMBackendError extends SiftcoderError {
  constructor(backend: string, message: string, cause?: unknown) {
    super(`[${backend}] ${message}`, 'LLM_BACKEND', cause);
    this.name = 'LLMBackendError';
  }
}

export class ConfigError extends SiftcoderError {
  constructor(message: string) {
    super(message, 'CONFIG', undefined);
    this.name = 'ConfigError';
  }
}

export class ScopeViolationError extends SiftcoderError {
  constructor(filePath: string) {
    super(`Path outside allowed scope: ${filePath}`, 'SCOPE_VIOLATION');
    this.name = 'ScopeViolationError';
  }
}
