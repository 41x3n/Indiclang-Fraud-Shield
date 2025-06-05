import {
    ExampleMessage,
    Language,
    LanguageDetectionResult,
    ScamClassificationResult,
} from '../../../../../lib/llm/types';
import { logger } from '../../../../../lib/logger';
import { HeuristicKey, log_ctx } from '../../../../../types/index';
import { LanguageDetectorAgent } from '../agents';
import { GeminiExtractAgent } from '../agents/geminiExtractAgent';
import { ScamClassifierAgent } from '../agents/scamClassifierAgent';
import { TranslatorAgent } from '../agents/translatorAgent';

export class LLMService {
    private languageDetectorAgent: LanguageDetectorAgent;
    private scamClassifierAgent: ScamClassifierAgent;
    private geminiExtractAgent: GeminiExtractAgent;
    private translatorAgent: TranslatorAgent;

    constructor(
        languageDetectorAgent?: LanguageDetectorAgent,
        scamClassifierAgent?: ScamClassifierAgent,
        geminiExtractAgent?: GeminiExtractAgent,
        translatorAgent?: TranslatorAgent,
    ) {
        this.languageDetectorAgent = languageDetectorAgent || new LanguageDetectorAgent();
        this.scamClassifierAgent = scamClassifierAgent || new ScamClassifierAgent();
        this.geminiExtractAgent = geminiExtractAgent || new GeminiExtractAgent();
        this.translatorAgent = translatorAgent || new TranslatorAgent();
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

    async extractMessageAndTags({
        ocrText,
        ctx,
    }: {
        ocrText: string;
        ctx: log_ctx;
    }): Promise<{ message: string; userTags: HeuristicKey[] }> {
        try {
            return await this.geminiExtractAgent.extractMessageAndTags({ ocrText, ctx });
        } catch (error) {
            logger.error('LLMService.extractMessageAndTags - Gemini extraction failed', {
                error: (error as Error).message,
            });
            return { message: '', userTags: [] };
        }
    }

    async translate({
        scamClassifierResult,
        userLanguage,
        ctx,
    }: {
        scamClassifierResult: ScamClassificationResult;
        userLanguage: Language;
        ctx: log_ctx;
    }): Promise<ScamClassificationResult> {
        if (userLanguage === Language.English) {
            return scamClassifierResult;
        }
        const { reason, suggestion } = await this.translatorAgent.translate({
            reason: scamClassifierResult.reason,
            suggestion: scamClassifierResult.suggestion,
            sourceLanguage: Language.English,
            targetLanguage: userLanguage,
            ctx,
        });

        return {
            ...scamClassifierResult,
            reason,
            suggestion,
        };
    }
}
