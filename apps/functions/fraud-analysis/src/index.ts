import { HttpFunction } from '@google-cloud/functions-framework';

import { Config } from '../../../../lib/config';
import { logger } from '../../../../lib/logger';
import { errorHandler } from '../../../../lib/middleware';
import { setupApp } from './app';
import { fraudAnalysisRouter } from './routes/index';

// Initialize logging
if (Config.isProd) {
    logger.info('Running in production mode');
}

// Setup the Express app with common middleware
const app = setupApp();

// Register API routes
app.use('/api/v1/fraud-analysis', fraudAnalysisRouter);

// Add error handling middleware at the end
app.use(errorHandler);

// Cloud Function handler for Google Cloud Functions Gen2
export const defaultHandler: HttpFunction = (req, res) => {
    return app(req, res);
};
