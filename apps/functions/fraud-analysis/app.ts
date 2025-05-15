import express from 'express';
import { Express } from 'express';

import { requestLogger, responseFormatter, verifyApiKey } from '../../../lib/middleware';

/**
 * Sets up the Express application with common middleware and basic routes
 * @returns Configured Express application
 */
export function setupApp(): Express {
    const app = express();

    // Add common middleware
    app.use(requestLogger);
    app.use(express.json());
    app.use(responseFormatter);

    // Skip auth for health checks
    app.use((req, res, next) => {
        if (req.path === '/health') return next();
        verifyApiKey(req, res, next);
    });

    // Add health check endpoint
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
