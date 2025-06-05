import { GoogleGenAI } from '@google/genai';

import { Language, TranslatedResult } from '../../../../../lib/llm/types';
import { log_ctx } from '../../../../../types';
import { LLM_CONFIG } from '../config/llm';
import { translatorPromptTemplate } from '../templates/translator';
import { Agent } from './Agent';

export class TranslatorAgent extends Agent {
    constructor(aiInstance?: any) {
        super({
            modelId: LLM_CONFIG.translator.modelId,
            aiInstance: aiInstance || new GoogleGenAI(LLM_CONFIG.aiInstanceOptions),
            generationConfig: LLM_CONFIG.translator.generationConfig,
        });
    }

    async translate({
        reason,
        suggestion,
        sourceLanguage,
        targetLanguage,
        ctx,
    }: {
        reason: string;
        suggestion: string;
        sourceLanguage: Language;
        targetLanguage: Language;
        ctx: log_ctx;
    }): Promise<{ reason: string; suggestion: string }> {
        return this.withRetry(
            async () => {
                const chat = this.AI_INSTANCE.chats.create({
                    model: this.MODEL_ID,
                    config: this.GENERATION_CONFIG,
                });

                const prompt = translatorPromptTemplate({
                    reason,
                    suggestion,
                    sourceLanguage,
                    targetLanguage,
                });
                ctx.translatorPrompt = prompt;

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

                const result = JSON.parse(processedResponse) as TranslatedResult;
                ctx.translatedResult = result;

                if (result.reason && result.suggestion) {
                    return {
                        reason: result.reason,
                        suggestion: result.suggestion,
                    };
                } else {
                    return {
                        reason,
                        suggestion,
                    };
                }
            },
            this.MAX_RETRIES,
            ctx,
        );
    }
}
