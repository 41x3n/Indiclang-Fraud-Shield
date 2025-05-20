import { GoogleGenAI } from '@google/genai';

import { LanguageDetectionResult } from '../../../../../lib/llm/types';
import { log_ctx } from '../../../../../types';
import { LLM_CONFIG } from '../config/llm';
import { languageDetectorPromptTemplate } from '../templates/languageDetector';
import { Agent } from './Agent';

export class LanguageDetectorAgent extends Agent {
    constructor(aiInstance?: any) {
        super({
            modelId: LLM_CONFIG.languageDetector.modelId,
            aiInstance: aiInstance || new GoogleGenAI(LLM_CONFIG.aiInstanceOptions),
            generationConfig: LLM_CONFIG.languageDetector.generationConfig,
        });
    }

    async detectLanguage({
        message,
        ctx,
    }: {
        message: string;
        ctx: log_ctx;
    }): Promise<LanguageDetectionResult> {
        return this.withRetry(
            async () => {
                const chat = this.AI_INSTANCE.chats.create({
                    model: this.MODEL_ID,
                    config: this.GENERATION_CONFIG,
                });

                const prompt = languageDetectorPromptTemplate.replace('{message}', message);
                ctx.languageDetectorPrompt = prompt;

                let fullResponse = '';
                const response = await chat.sendMessageStream({ message: prompt });

                for await (const chunk of response) {
                    if (chunk.text) fullResponse += chunk.text;
                }

                ctx.fullResponse = fullResponse;

                let processedResponse = fullResponse
                    .trim()
                    .replace(/^```(?:json)?|```$/gim, '')
                    .trim();

                const result = JSON.parse(processedResponse) as LanguageDetectionResult;
                ctx.languageDetectionResult = result;

                if (result.language && result.script) {
                    return result;
                } else {
                    throw new Error('Language detection response missing required fields');
                }
            },
            this.MAX_RETRIES,
            ctx,
        );
    }

    private getDefaultErrorResult(): LanguageDetectionResult {
        return {
            language: '',
            script: '',
            supported: false,
            confidence: 0,
            success: false,
        };
    }
}
