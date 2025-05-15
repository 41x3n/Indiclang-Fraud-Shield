export enum ErrorCode {
    MISSING_API_KEY = 'MISSING_API_KEY',
    INVALID_API_KEY = 'INVALID_API_KEY',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export interface ErrorPayload {
    message: string;
    code: ErrorCode;
    metadata?: Record<string, any>;
}
