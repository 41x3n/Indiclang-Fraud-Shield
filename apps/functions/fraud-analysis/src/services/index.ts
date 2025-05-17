import { logger } from '../../../../../lib/logger';
import { ErrorCode, log_ctx } from '../../../../../types';
import { FraudAnalysisRequest } from '../../src/dtos';
import { HeuristicService } from './heuristics';
import { LLMService } from './llm';

class FraudAnalysisService {
    private heuristicService: HeuristicService;
    private llmService: LLMService;

    constructor() {
        this.heuristicService = new HeuristicService();
        this.llmService = new LLMService();
    }
    async analyzeMessage({ body, ctx }: { body: FraudAnalysisRequest; ctx: log_ctx }): Promise<{
        data: Record<string, any> | null;
        errorMessage: string | null;
        errorCode: ErrorCode | null;
    }> {
        logger.info('FraudAnalysisService.analyzeMessage', ctx);
        try {
            const { message, userTags } = body;
            const heuristicResult = this.heuristicService.runHeuristics({
                message,
                options: { userTags },
                ctx,
            });

            ctx.heuristicResult = heuristicResult;

            logger.info('FraudAnalysisService.analyzeMessage - Heuristic result', ctx);

            const languageResult = await this.llmService.detectLanguage({ message, ctx });
            return {
                data: { heuristicResult, languageResult },
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
