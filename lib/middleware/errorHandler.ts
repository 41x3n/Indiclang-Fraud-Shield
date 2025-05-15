import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ApiResponse, ErrorCode, ErrorPayload } from '../../types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    // next must be included to maintain the middleware signature
    const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

    const error: ErrorPayload = {
        message: err.message || 'An unexpected error occurred',
        code: err.code || ErrorCode.UNKNOWN_ERROR,
        metadata: err.metadata || {},
    };

    const response: ApiResponse<null> = {
        statusCode,
        data: null,
        error,
    };

    res.status(statusCode).json(response);
}
