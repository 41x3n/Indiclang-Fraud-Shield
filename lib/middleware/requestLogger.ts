import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { logger } from '../logger';

const SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-api-key'];

function sanitizeHeaders(headers: Record<string, unknown>) {
    const cleanHeaders = { ...headers };
    for (const key of SENSITIVE_HEADERS) {
        if (cleanHeaders[key]) {
            delete cleanHeaders[key];
        }
    }
    return cleanHeaders;
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    let requestId = req.headers['x-request-id'] as string;
    if (!requestId) {
        requestId = uuidv4();
        req.headers['x-request-id'] = requestId;
        res.setHeader('x-request-id', requestId);
    }

    const logMetadata: Record<string, any> = {
        requestId,
        ip: req.ip,
        headers: sanitizeHeaders(req.headers),
        query: req.query,
    };
    if (req.body && Object.keys(req.body).length > 0) {
        logMetadata.body = req.body;
    }
    logger.info(`→ ${req.method} ${req.originalUrl}`, {
        label: 'Request',
        metadata: logMetadata,
    });

    res.on('finish', () => {
        const duration = Date.now() - start;

        logger.info(`← ${req.method} ${req.originalUrl}`, {
            label: 'Response',
            metadata: {
                requestId,
                statusCode: res.statusCode,
                durationMs: duration,
            },
        });
    });

    next();
}
