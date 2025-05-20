import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ApiResponse, ErrorCode } from '../../types';

export function responseFormatter(req: Request, res: Response, next: NextFunction) {
    const oldJson = res.json;

    res.json = function (payload: any) {
        const looksFormattedError =
            payload &&
            typeof payload === 'object' &&
            'statusCode' in payload &&
            'error' in payload &&
            payload.data === null;

        if (looksFormattedError) {
            return oldJson.call(this, payload);
        }

        const statusCode = res.statusCode;
        const isError = statusCode >= StatusCodes.BAD_REQUEST;

        const response: ApiResponse<any> = {
            statusCode,
            data: isError ? null : payload,
            error: isError
                ? {
                      message:
                          typeof payload === 'string'
                              ? payload
                              : payload?.message || 'Unknown error',
                      code: payload?.code || ErrorCode.UNKNOWN_ERROR,
                  }
                : null,
        };

        return oldJson.call(this, response);
    };

    next();
}
