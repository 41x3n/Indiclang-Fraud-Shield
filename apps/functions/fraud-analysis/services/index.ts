import { logger } from '../../../../lib/logger';
import { ErrorCode, log_ctx } from '../../../../types';
import { FraudAnalysisRequest } from '../dtos';

class FraudAnalysisService {
    async analyzeMessage({ body, ctx }: { body: FraudAnalysisRequest; ctx: log_ctx }): Promise<{
        data: Record<string, any> | null;
        errorMessage: string | null;
        errorCode: ErrorCode | null;
    }> {
        logger.info('FraudAnalysisService.analyzeMessage', {
            body,
            ...ctx,
        });
        try {
            return {
                data: { message: 'Fraud analysis result' },
                errorMessage: null,
                errorCode: null,
            };
        } catch (error) {
            return {
                data: null,
                errorMessage: (error as Error).message,
                errorCode: (error as any).code || ErrorCode.UNKNOWN_ERROR,
            };
        }
    }
}

export default FraudAnalysisService;
