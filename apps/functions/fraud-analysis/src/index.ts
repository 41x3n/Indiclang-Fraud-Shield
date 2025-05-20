import { HttpFunction } from '@google-cloud/functions-framework';

import { Config } from '../../../../lib/config';
import { logger } from '../../../../lib/logger';
import { errorHandler } from '../../../../lib/middleware';
import { setupApp } from './app';
import { fraudAnalysisRouter } from './routes/index';

if (Config.isProd) {
    logger.info('Running in production mode');
}

const app = setupApp();

app.use('/api/v1/fraud-analysis', fraudAnalysisRouter);

app.use(errorHandler);

export const defaultHandler: HttpFunction = (req, res) => {
    return app(req, res);
};
