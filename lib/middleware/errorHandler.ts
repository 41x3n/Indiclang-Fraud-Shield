// lib/errorHandler.ts
import { Request, Response } from 'express';
import { ApiResponse, ErrorPayload, ErrorCode } from '../../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function errorHandler(err: any, req: Request, res: Response) {
    const statusCode = err.statusCode || 500;

    const error: ErrorPayload = {
        message: err.message || 'An unexpected error occurred',
        code: err.code || ErrorCode.UNKNOWN_ERROR,
    };

    const response: ApiResponse<null> = {
        statusCode,
        data: null,
        error,
    };

    res.status(statusCode).json(response);
}
