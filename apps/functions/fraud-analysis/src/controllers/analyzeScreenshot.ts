import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { throwFormattedError } from '../../../../../lib/error';
import { logger } from '../../../../../lib/logger';
import { log_ctx } from '../../../../../types';
import { ScreenshotAnalysisRequest } from '../dtos/screenshot';
import FraudAnalysisService from '../services';

class FraudAnalysisController {
    private fraudAnalysisService: FraudAnalysisService;
    constructor(fraudAnalysisService: FraudAnalysisService) {
        this.fraudAnalysisService = fraudAnalysisService;
    }
    async analyzeScreenshot(req: Request, res: Response) {
        const body: ScreenshotAnalysisRequest = req.body;
        const requestId = req.headers['x-request-id'] as string;
        const ctx: log_ctx = {
            requestId,
            body,
        };
        logger.info('FraudAnalysisController.analyzeScreenshot - Analyzing screenshot', ctx);

        const { data, errorMessage, errorCode } = await this.fraudAnalysisService.analyzeScreenshot(
            {
                body,
                ctx,
            },
        );
        if (errorMessage) {
            logger.error('FraudAnalysisController.analyzeScreenshot', {
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
