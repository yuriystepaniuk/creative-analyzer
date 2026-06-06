export type HttpStatus = 400 | 422 | 500 | 502;

export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: HttpStatus = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
    this.name = "ValidationError";
  }
}

export class DownloadError extends AppError {
  constructor(message: string) {
    super(message, 422);
    this.name = "DownloadError";
  }
}

export class GeminiError extends AppError {
  constructor(message: string) {
    super(message, 502);
    this.name = "GeminiError";
  }
}

export class ConfigError extends AppError {
  constructor(message: string) {
    super(message, 500);
    this.name = "ConfigError";
  }
}
