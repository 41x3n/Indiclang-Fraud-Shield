import { GoogleGenAI } from '@google/genai';

import { ExampleMessage, Language, ScamClassificationResult } from '../../../../../lib/llm/types';
import { log_ctx } from '../../../../../types';
import { LLM_CONFIG } from '../config/llm';
import { scamClassifierPromptHeadA, scamClassifierPromptHeadB } from '../templates/scamClassifier';
import { Agent } from './Agent';

export class ScamClassifierAgent extends Agent {
    constructor(aiInstance?: any) {
        super({
            modelId: LLM_CONFIG.scamClassifier.modelId,
            aiInstance: aiInstance || new GoogleGenAI(LLM_CONFIG.aiInstanceOptions),
            generationConfig: LLM_CONFIG.scamClassifier.generationConfig,
        });
    }

    private buildExampleForPrompt(examples: ExampleMessage[]): string {
        if (examples.length === 0) return '';
        return examples
            .map((ex) => {
                const { language, script, message, label } = ex;
                return `[EXAMPLE]\nlabel: ${label}\nlanguage: ${language}\nscript: ${script}\ncontent: "${message}"\n\n[/EXAMPLE]`;
            })
            .join('\n\n');
    }

    private buildPromptTemplate({
        language,
        script,
        message,
        scoreBoost,
        heuristicReasons,
        examples,
    }: {
        language: Language;
        script: Language;
        message: string;
        scoreBoost: number;
        heuristicReasons: string[];
        examples: ExampleMessage[];
    }): string {
        const examples_block = this.buildExampleForPrompt(examples);
        return `${scamClassifierPromptHeadA}\n${scamClassifierPromptHeadB({ language, script, message, scoreBoost, heuristicReasons, examples_block })}`;
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
        const prompt = this.buildPromptTemplate({
            language,
            script,
            message,
            scoreBoost,
            heuristicReasons,
            examples,
        });
        ctx.prompt = prompt;

        return this.withRetry(
            async () => {
                const chat = this.AI_INSTANCE.chats.create({
                    model: this.MODEL_ID,
                    config: this.GENERATION_CONFIG,
                });

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

                const result = JSON.parse(processedResponse) as ScamClassificationResult;
                ctx.scamClassificationResult = result;

                if (result.risk_score && result.risk_label && result.reason && result.suggestion) {
                    return result;
                } else {
                    throw new Error('Scam Classifier response missing required fields');
                }
            },
            this.MAX_RETRIES,
            ctx,
        );
    }
}
