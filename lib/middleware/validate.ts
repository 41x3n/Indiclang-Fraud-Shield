import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodSchema } from 'zod';

import { ErrorCode } from '../../types';
import { throwFormattedError } from '../error';

export function validate(schema: ZodSchema<any>) {
    return (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const zodError = result.error;
            const formattedErrors = zodError.errors.map((error) => {
                return {
                    message: error.message,
                    path: error.path.join('.'),
                };
            });

            throwFormattedError(
                'Validation failed',
                StatusCodes.BAD_REQUEST,
                ErrorCode.VALIDATION_ERROR,
                { validationErrors: formattedErrors },
            );
        }

        (req as any).validated = result.data;

        next();
    };
}
