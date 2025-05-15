import { StatusCodes } from 'http-status-codes';

import { ErrorCode } from '../types';

export function throwFormattedError(
    message: string,
    statusCode: StatusCodes,
    errorCode: ErrorCode | null = null,
    metadata?: Record<string, any>,
): never {
    const error = new Error(message);
    (error as any).statusCode = statusCode;
    (error as any).code = errorCode || ErrorCode.UNKNOWN_ERROR;
    (error as any).metadata = metadata;
    throw error;
}
