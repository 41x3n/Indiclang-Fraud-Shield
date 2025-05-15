import { Request, Response, NextFunction } from 'express';
import { ErrorCode } from '../../types';

export function verifyApiKey(req: Request, _res: Response, next: NextFunction) {
    const apiKey = req.header('x-api-key');
    const expectedKey = process.env.API_KEY;

    if (apiKey === undefined) {
        const error = new Error('No API key provided');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any).statusCode = 401;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any).code = ErrorCode.MISSING_API_KEY;
        throw error;
    }

    if (apiKey !== expectedKey) {
        const error = new Error('Unauthorized');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any).statusCode = 401;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any).code = ErrorCode.INVALID_API_KEY;
        throw error;
    }

    next();
}
