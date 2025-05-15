import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { throwFormattedError } from '../../../../../lib/error';
import { logger } from '../../../../../lib/logger';
import { log_ctx } from '../../../../../types';
import { FraudAnalysisRequest } from '../dtos';
import FraudAnalysisService from '../services';

class FraudAnalysisController {
    private fraudAnalysisService: FraudAnalysisService;

    constructor(fraudAnalysisService: FraudAnalysisService) {
        this.fraudAnalysisService = fraudAnalysisService;
    }

    async analyzeMessage(req: Request, res: Response) {
        const body: FraudAnalysisRequest = req.body;
        const ctx: log_ctx = {
            body: body,
        };
        logger.info('FraudAnalysisController.analyzeMessage - Analyzing message', {
            ...ctx,
        });

        const { data, errorMessage, errorCode } = await this.fraudAnalysisService.analyzeMessage({
            body,
            ctx,
        });
        if (errorMessage) {
            logger.error('FraudAnalysisController.analyzeMessage', {
                ...ctx,
                errorMessage,
                errorCode,
            });
            throwFormattedError(errorMessage, StatusCodes.BAD_GATEWAY, errorCode);
        }
        res.json(data);
    }
}

export default FraudAnalysisController;
