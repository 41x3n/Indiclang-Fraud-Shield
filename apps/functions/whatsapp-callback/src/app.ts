import express from 'express';
import { Express } from 'express';

import { requestLogger, responseFormatter } from '../../../../lib/middleware';

export function setupApp(): Express {
    const app = express();

    app.use(requestLogger);
    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());
    app.use(responseFormatter);

    app.use((req, res, next) => {
        if (req.path === '/health') return next();
        next();
    });

    app.get('/health', (req, res) => {
        res.status(200).send('OK');
    });

    app.get('/', (req, res) => {
        res.status(200).json({
            message: 'Welcome to the WhatsApp Callback Service',
            description: 'This Service handles incoming WhatsApp messages.',
        });
    });

    return app;
}
