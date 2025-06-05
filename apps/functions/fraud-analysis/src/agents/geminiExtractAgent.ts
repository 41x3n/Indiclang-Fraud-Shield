import { GoogleGenAI } from '@google/genai';

import { ExtractedMessageAndTagsResult } from '../../../../../lib/llm/types';
import { HeuristicKey, log_ctx } from '../../../../../types';
import { LLM_CONFIG } from '../config/llm';
import { geminiExtractMessageAndTagsPrompt } from '../templates/geminiExtractMessageAndTags';
import { Agent } from './Agent';

export class GeminiExtractAgent extends Agent {
    constructor(aiInstance?: any) {
        super({
            modelId: LLM_CONFIG.geminiExtract.modelId,
            aiInstance: aiInstance || new GoogleGenAI(LLM_CONFIG.aiInstanceOptions),
            generationConfig: LLM_CONFIG.geminiExtract.generationConfig,
        });
    }

    async extractMessageAndTags({
        ocrText,
        ctx,
    }: {
        ocrText: string;
        ctx: log_ctx;
    }): Promise<{ message: string; userTags: HeuristicKey[] }> {
        return this.withRetry(
            async () => {
                const chat = this.AI_INSTANCE.chats.create({
                    model: this.MODEL_ID,
                    config: this.GENERATION_CONFIG,
                });

                const prompt = geminiExtractMessageAndTagsPrompt({ ocrText });
                ctx.extractMessageAndTagsPrompt = prompt;

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

                const result = JSON.parse(processedResponse) as ExtractedMessageAndTagsResult;
                ctx.extractMessageAndTagsResult = result;

                if (result.success && result.message && Array.isArray(result.userTags)) {
                    return {
                        message: result.message,
                        userTags: result.userTags as HeuristicKey[],
                    };
                }

                return {
                    message: '',
                    userTags: [] as HeuristicKey[],
                };
            },
            this.MAX_RETRIES,
            ctx,
        );
    }
}
