import { GoogleGenAI } from '@google/genai';

import { Config } from '../../../../../lib/config';
import { logger } from '../../../../../lib/logger';
import { ExampleMessage, Language, log_ctx, ScamClassificationResult } from '../../../../../types';

export class ScamClassifierAgent {
    private readonly MODEL_ID: string;
    private readonly AI_INSTANCE: GoogleGenAI;
    private readonly GENERATION_CONFIG: Record<string, any>;

    constructor() {
        this.MODEL_ID = 'gemini-2.0-flash-001';
        this.AI_INSTANCE = new GoogleGenAI({
            vertexai: true,
            project: Config.cloudProjectName,
            location: 'global',
        });
        this.GENERATION_CONFIG = {
            maxOutputTokens: 1024,
            temperature: 0.1,
            topP: 1,
            seed: 0,
            safetySettings: [
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'OFF' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'OFF' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'OFF' },
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'OFF' },
            ],
        };
    }

    private getPromptHeadA(): string {
        return `SYSTEM:
You are "IndicLang Fraud Shield Classifier", a strict JSON-only fraud-detection assistant for WhatsApp messages.
• Think step-by-step internally but NEVER reveal your reasoning.
• After reasoning, reply with the JSON object requested in the USER message—nothing else, no markdown, no prose.

USER:
## Task
Classify the WhatsApp message below as “scam”, “maybe_scam”, or “not_scam”.
Return a confidence score (0.00–1.00), a short reason, and an action suggestion.`;
    }

    private getPromptHeadB({
        language,
        script,
        message,
        scoreBoost,
        heuristicReasons,
        examples_block,
    }: {
        language: Language;
        script: Language;
        message: string;
        scoreBoost: number;
        heuristicReasons: string[];
        examples_block: string;
    }): string {
        return `## Message
LANGUAGE  : ${language}   (script: ${script})
CONTENT   : """${message}"""

## Heuristic signals
score_boost       : ${scoreBoost}          # 0.00–0.40, already capped
heuristic_reasons : [${heuristicReasons.map((r) => `"${r}"`).join(', ')}]    # array of short strings

## Few-shot examples  (in the same language / script)
${examples_block}

## Output (single-line JSON only)
{
  "risk_score": number,         // 0.00 – 1.00  (LLM score only)
  "risk_label": "scam" | "maybe_scam" | "not_scam",
  "reason": "string",           // ≤ 25 words, in English
  "suggestion": "string"        // ≤ 20 words, in English
  "confidence": number          // 0.00 – 1.00
}

### Notes & Constraints
1. Risk-score calibration  
   – Start from your own internal probability.  
   – Add score_boost (already capped) and clip max to 1.00.  
   – Map final score → label:  
       • ≥ 0.80 ⇒ scam  
       • 0.40–0.79 ⇒ maybe_scam  
       • < 0.40 ⇒ not_scam.
2. Keep *reason* and *suggestion* in English.
3. Output exactly and only the JSON object—no extra keys, comments, or new-lines.
4. Do NOT mention heuristics or chain-of-thought.
`;
    }

    private buildExampleForPrompt(examples: ExampleMessage[]): string {
        if (examples.length === 0) {
            return '';
        }
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
        const promptHeadA = this.getPromptHeadA();
        const promptHeadB = this.getPromptHeadB({
            language,
            script,
            message,
            scoreBoost,
            heuristicReasons,
            examples_block,
        });
        return `${promptHeadA}\n${promptHeadB}`;
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

        logger.info('ScamClassifierAgent - Prompt', {
            prompt,
            ...ctx,
        });

        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            ctx.attempt = attempt;
            logger.info(`Scam Classifier attempt ${attempt}"`, ctx);

            const startTime = Date.now();
            ctx.startTime = startTime;
            try {
                const chat = this.AI_INSTANCE.chats.create({
                    model: this.MODEL_ID,
                    config: this.GENERATION_CONFIG,
                });

                let fullResponse = '';
                const response = await chat.sendMessageStream({ message: prompt });

                for await (const chunk of response) {
                    if (chunk.text) {
                        fullResponse += chunk.text;
                    }
                }
                ctx.fullResponse = fullResponse;

                const durationMs = Date.now() - startTime;
                ctx.durationMs = durationMs;
                logger.info(
                    `Scam Classifier response received in ${durationMs} ms (attempt ${attempt})`,
                    ctx,
                );

                try {
                    let processedResponse = fullResponse
                        .trim()
                        .replace(/^```(?:json)?|```$/gim, '')
                        .trim();
                    const result = JSON.parse(processedResponse) as ScamClassificationResult;
                    if (
                        result.risk_score &&
                        result.risk_label &&
                        result.reason &&
                        result.suggestion
                    ) {
                        return result;
                    } else {
                        logger.error(
                            `Scam Classifier response is missing required fields (attempt ${attempt}):`,
                            { response: processedResponse, ...ctx },
                        );
                    }
                } catch (parseError) {
                    logger.error(`Failed to parse scam classifier response (attempt ${attempt}):`, {
                        error: parseError,
                        response: fullResponse,
                        ...ctx,
                    });
                }
            } catch (error) {
                logger.error(`Scam Classifier error (attempt ${attempt}):`, { error, ...ctx });
            }
        }
    }
}
