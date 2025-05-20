import express from 'express';
import { Express } from 'express';

import { requestLogger, responseFormatter, verifyApiKey } from '../../../../lib/middleware';

export function setupApp(): Express {
    const app = express();

    app.use(requestLogger);
    app.use(express.json());
    app.use(responseFormatter);

    app.use((req, res, next) => {
        if (req.path === '/health') return next();
        verifyApiKey(req, res, next);
    });

    app.get('/health', (req, res) => {
        res.status(200).send('OK');
    });

    app.get('/', (req, res) => {
        res.status(200).json({
            message: 'Welcome to the Fraud Analysis Service',
            description: 'This Service analyzes messages for potential fraud.',
        });
    });

    return app;
}
