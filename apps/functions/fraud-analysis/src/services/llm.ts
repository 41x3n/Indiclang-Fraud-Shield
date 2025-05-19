import { logger } from '../../../../../lib/logger';
import { ExampleMessage, Language, LanguageDetectionResult, log_ctx } from '../../../../../types';
import { LanguageDetectorAgent } from '../agents';
import { ScamClassifierAgent } from '../agents/scamClassifierAgent';

export class LLMService {
    private languageDetectorAgent: LanguageDetectorAgent;
    private scamClassifierAgent: ScamClassifierAgent;

    constructor() {
        this.languageDetectorAgent = new LanguageDetectorAgent();
        this.scamClassifierAgent = new ScamClassifierAgent();
    }

    async detectLanguage({ message, ctx }: { message: string; ctx: log_ctx }): Promise<any> {
        try {
            const languageDetectionResult = await this.languageDetectorAgent.detectLanguage({
                message,
                ctx,
            });

            ctx.languageDetectionResult = languageDetectionResult;
            logger.info('LLMService.detectLanguage - Language detection result', ctx);

            const { supported, confidence, success } =
                languageDetectionResult as LanguageDetectionResult;

            const useMessageBank = success && supported && confidence > 0.8;

            return {
                languageDetectionResult,
                useMessageBank,
            };
        } catch (error) {
            logger.error('LLMService.detectLanguage', {
                ...ctx,
                error: (error as Error).message,
            });
            return {
                languageDetectionResult: null,
                useMessageBank: false,
            };
        }
    }

    async classifyScam({
        message,
        language,
        script,
        scoreBoost,
        heuristicReasons,
        examples,
        ctx,
    }: {
        message: string;
        language: Language;
        script: Language;
        scoreBoost: number;
        heuristicReasons: string[];
        examples: ExampleMessage[];
        ctx: log_ctx;
    }) {
        try {
            const result = await this.scamClassifierAgent.classifyScam({
                message,
                language,
                script,
                scoreBoost,
                heuristicReasons,
                examples,
                ctx,
            });

            ctx.scamClassificationResult = result;
            logger.info('LLMService.classifyScam - Scam classification result', ctx);

            return result;
        } catch (error) {
            logger.error('LLMService.classifyScam', {
                ...ctx,
                error: (error as Error).message,
            });
            return null;
        }
    }
}
