import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ErrorCode } from '../../types';

export function responseFormatter(req: Request, res: Response, next: NextFunction) {
    const oldJson = res.json;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.json = function (payload: any) {
        // Don't rewrap if payload already has `statusCode` + `error` and no `data`
        const looksFormattedError =
            payload &&
            typeof payload === 'object' &&
            'statusCode' in payload &&
            'error' in payload &&
            payload.data === null;

        if (looksFormattedError) {
            return oldJson.call(this, payload); // Let it pass untouched
        }

        const statusCode = res.statusCode;
        const isError = statusCode >= 400;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
