import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ErrorCode } from '../../types';
import { throwFormattedError } from '../error';

export function verifyApiKey(req: Request, _res: Response, next: NextFunction) {
    const apiKey = req.header('x-api-key');
    const expectedKey = process.env.API_KEY;

    if (apiKey === undefined) {
        throwFormattedError(
            'No API key provided',
            StatusCodes.UNAUTHORIZED,
            ErrorCode.MISSING_API_KEY,
        );
    }

    if (apiKey !== expectedKey) {
        throwFormattedError('Unauthorized', StatusCodes.UNAUTHORIZED, ErrorCode.INVALID_API_KEY);
    }

    next();
}
