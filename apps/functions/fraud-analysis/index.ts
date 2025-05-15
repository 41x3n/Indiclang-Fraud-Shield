import { HttpFunction } from '@google-cloud/functions-framework';
import { config } from '../../../lib/config';
import { logger } from '../../../lib/logger';
import { setupApp } from './app';

// Initialize logging
if (config.isProd) {
    logger.info('Running in production mode');
}

// Setup the Express app with common middleware
const app = setupApp();

// Register API routes

// Cloud Function handler for Google Cloud Functions Gen2
export const defaultHandler: HttpFunction = (req, res) => {
    return app(req, res);
};
