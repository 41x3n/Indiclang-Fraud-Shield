import {
    Bengali,
    English,
    Gujarati,
    Hindi,
    Kannada,
    Malayalam,
    Marathi,
    Tamil,
    Telugu,
    Urdu,
} from '../../../../../lib/llm/message-bank';
import { logger } from '../../../../../lib/logger';
import { ErrorCode, log_ctx } from '../../../../../types';
import { Language } from '../../../../../types/message-bank';
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

            const { languageDetectionResult, useMessageBank } =
                await this.llmService.detectLanguage({ message, ctx });

            ctx.languageDetectionResult = languageDetectionResult;
            ctx.useMessageBank = useMessageBank;

            logger.info('FraudAnalysisService.analyzeMessage - Language detection result', ctx);

            const examples = useMessageBank
                ? this.gatherExamplesFromMessageBank(languageDetectionResult.language)
                : [];

            ctx.examplesLength = examples.length;

            const scamClassifierResult = await this.llmService.classifyScam({
                message,
                language: languageDetectionResult.language,
                script: languageDetectionResult.script,
                scoreBoost: heuristicResult.scoreBoost,
                heuristicReasons: heuristicResult.heuristicReasons,
                examples,
                ctx,
            });

            return {
                data: {
                    heuristicResult,
                    languageDetectionResult,
                    useMessageBank,
                    scamClassifierResult,
                },
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

    gatherExamplesFromMessageBank(language: string) {
        switch (language) {
            case Language.Hindi:
                return Hindi;
            case Language.Bengali:
                return Bengali;
            case Language.Gujarati:
                return Gujarati;
            case Language.Kannada:
                return Kannada;
            case Language.Malayalam:
                return Malayalam;
            case Language.Marathi:
                return Marathi;
            case Language.Telugu:
                return Telugu;
            case Language.Tamil:
                return Tamil;
            case Language.Urdu:
                return Urdu;
            case Language.English:
                return English;
            default:
                return [];
        }
    }
}

export default FraudAnalysisService;
