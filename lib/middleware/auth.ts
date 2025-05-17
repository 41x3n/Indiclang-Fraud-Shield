import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ErrorCode } from '../../types';
import { Config } from '../config';
import { throwFormattedError } from '../error';

export function verifyApiKey(req: Request, _res: Response, next: NextFunction) {
    const apiKey = req.header('x-api-key');
    const expectedKey = Config.apiKey;

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
