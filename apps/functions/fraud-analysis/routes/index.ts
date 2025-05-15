import { Router } from 'express';

import { validate } from '../../../../lib/middleware';
import FraudAnalysisController from '../controllers';
import { FraudAnalysisRequestSchema } from '../dtos';
import FraudAnalysisService from '../services';

const fraudAnalysisRouter = Router();

const fraudAnalysisService = new FraudAnalysisService();
const fraudAnalysisController = new FraudAnalysisController(fraudAnalysisService);

fraudAnalysisRouter.post('/analyze', validate(FraudAnalysisRequestSchema), (req, res) =>
    fraudAnalysisController.analyzeMessage(req, res),
);

export { fraudAnalysisRouter };
