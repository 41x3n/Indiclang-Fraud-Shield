import vision from '@google-cloud/vision';

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
import { Language } from '../../../../../lib/llm/types';
import { logger } from '../../../../../lib/logger';
import { ErrorCode, HeuristicKey, log_ctx } from '../../../../../types';
import { FraudAnalysisRequest } from '../../src/dtos';
import { ScreenshotAnalysisRequest } from '../dtos/screenshot';
import { HeuristicService } from './heuristics';
import { LLMService } from './llm';

class FraudAnalysisService {
    private heuristicService: HeuristicService;
    private llmService: LLMService;

    constructor(heuristicService?: HeuristicService, llmService?: LLMService) {
        this.heuristicService = heuristicService || new HeuristicService();
        this.llmService = llmService || new LLMService();
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

            if (!languageDetectionResult?.success) {
                return {
                    data: null,
                    errorMessage: 'Language detection failed',
                    errorCode: ErrorCode.LANGUAGE_DETECTION_FAILED,
                };
            }

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

            ctx.scamClassifierResult = scamClassifierResult;
            logger.info('FraudAnalysisService.analyzeMessage - Scam classifier result', ctx);

            if (!scamClassifierResult) {
                return {
                    data: null,
                    errorMessage: 'Scam classification failed',
                    errorCode: ErrorCode.SCAM_CLASSIFICATION_FAILED,
                };
            }

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

    async analyzeScreenshot({
        body,
        ctx,
    }: {
        body: ScreenshotAnalysisRequest;
        ctx: log_ctx;
    }): Promise<{
        data: Record<string, any> | null;
        errorMessage: string | null;
        errorCode: ErrorCode | null;
    }> {
        logger.info(
            'FraudAnalysisService.analyzeScreenshot - Downloading and analyzing screenshot',
            ctx,
        );
        try {
            const imageUrl = body.screenshotUrl;
            const userLanguage = body.userLanguage;

            const response = await fetch(imageUrl);
            if (!response.ok) {
                return {
                    data: null,
                    errorMessage: `Failed to download screenshot: ${response.statusText}`,
                    errorCode: ErrorCode.IMAGE_DOWNLOAD_FAILED,
                };
            }
            const buffer = Buffer.from(await response.arrayBuffer());

            const client = new vision.ImageAnnotatorClient();
            const [result] = await client.textDetection({ image: { content: buffer } });
            const detections = result.textAnnotations;
            if (!detections || detections.length === 0) {
                return {
                    data: null,
                    errorMessage: 'No text detected in screenshot',
                    errorCode: ErrorCode.OCR_FAILED,
                };
            }

            const ocrText = detections[0].description || '';

            const { message, userTags } = await this.llmService.extractMessageAndTags({
                ocrText,
                ctx,
            });

            if (!message) {
                return {
                    data: null,
                    errorMessage: 'No message extracted from screenshot',
                    errorCode: ErrorCode.NO_MESSAGE_EXTRACTED,
                };
            }

            const allowedTags = [
                HeuristicKey.FROM_UNKNOWN,
                HeuristicKey.FORWARDED_MANY_TIMES,
                HeuristicKey.ATTACHED_FILE,
            ] as HeuristicKey[];

            const validUserTags = userTags.filter((tag) => allowedTags.includes(tag));
            return this.analyzeMessage({
                body: {
                    message,
                    userLanguage,
                    userTags: validUserTags as (
                        | HeuristicKey.FROM_UNKNOWN
                        | HeuristicKey.FORWARDED_MANY_TIMES
                        | HeuristicKey.ATTACHED_FILE
                    )[],
                },
                ctx,
            });
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
