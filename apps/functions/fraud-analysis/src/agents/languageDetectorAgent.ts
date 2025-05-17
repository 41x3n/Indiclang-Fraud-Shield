import { GoogleGenAI } from '@google/genai';

import { Config } from '../../../../../lib/config';
import { logger } from '../../../../../lib/logger';
import { LanguageDetectionResult, log_ctx } from '../../../../../types';

export class LanguageDetectorAgent {
    private readonly MODEL_ID: string;
    private readonly AI_INSTANCE: GoogleGenAI;
    private readonly GENERATION_CONFIG: Record<string, any>;
    private readonly PROMPT_TEMPLATE: string;

    constructor() {
        this.MODEL_ID = 'gemini-2.5-flash-preview-04-17';
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

        this.PROMPT_TEMPLATE = this.buildPromptTemplate();
    }

    private buildPromptTemplate(): string {
        return `Role
You are a language-and-script detector.
Output contract
Respond with nothing but a single-line JSON object in the exact schema below (no extra keys, comments, or trailing text):
{
  "language":  "string",   // one of SupportedLanguages
  "script":    "string",   // either the language itself or "Latin"
  "supported": true | false,
  "confidence": 0-1,       // float, certainty of *language* detection
  "success":   true | false
}
SupportedLanguages enum
Hindi | Bengali | Gujarati | Kannada | Malayalam |
Marathi | Telugu | Tamil | Urdu | English | Latin
Logic rules
Detect language of {message}.
Set "language" to the closest match in SupportedLanguages.
Detect script
Native script → "script" = language (e.g., "Hindi").
Romanized → "script" = "Latin".
Set "supported"
true if "language" is in SupportedLanguages; else false.
Set "confidence"
Return a probability 0 – 1 (use heuristic if the detector gives none).
Set "success"
false only if detection/parsing fails catastrophically; otherwise true.
Always return the JSON object — even on failure (use sensible defaults like "", false, 0).
Input
{message}
Remember: output only the JSON specified above.`;
    }

    async detectLanguage({
        message,
        ctx,
    }: {
        message: string;
        ctx: log_ctx;
    }): Promise<LanguageDetectionResult> {
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            ctx.attempt = attempt;
            logger.info(
                `Language detection attempt ${attempt} for text: "${message.substring(0, 30)}..."`,
                ctx,
            );

            const startTime = Date.now();
            ctx.startTime = startTime;
            try {
                const chat = this.AI_INSTANCE.chats.create({
                    model: this.MODEL_ID,
                    config: this.GENERATION_CONFIG,
                });

                const prompt = this.PROMPT_TEMPLATE.replace('{message}', message);

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
                    `Language detection response received in ${durationMs} ms (attempt ${attempt})`,
                    ctx,
                );

                try {
                    // Remove markdown code block markers if present
                    let processedResponse = fullResponse
                        .trim()
                        .replace(/^```(?:json)?|```$/gim, '')
                        .trim();
                    const result = JSON.parse(processedResponse) as LanguageDetectionResult;
                    if (result.language && result.script) {
                        return result;
                    } else {
                        logger.error(
                            `Language detection response is missing required fields (attempt ${attempt}):`,
                            { response: processedResponse, ...ctx },
                        );
                    }
                } catch (parseError) {
                    logger.error(
                        `Failed to parse language detection response (attempt ${attempt}):`,
                        { error: parseError, response: fullResponse, ...ctx },
                    );
                }
            } catch (error) {
                logger.error(`Language detection error (attempt ${attempt}):`, { error, ...ctx });
            }
        }
        // If all attempts fail, return default error result
        return this.getDefaultErrorResult();
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
