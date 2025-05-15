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

    // Ensure request ID exists
    let requestId = req.headers['x-request-id'] as string;
    if (!requestId) {
        requestId = uuidv4();
        req.headers['x-request-id'] = requestId;
        res.setHeader('x-request-id', requestId); // also return it
    }

    // Pre-request log
    logger.info(`→ ${req.method} ${req.originalUrl}`, {
        label: 'Request',
        metadata: {
            requestId,
            ip: req.ip,
            headers: sanitizeHeaders(req.headers),
            query: req.query,
        },
    });

    // Post-request log
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
