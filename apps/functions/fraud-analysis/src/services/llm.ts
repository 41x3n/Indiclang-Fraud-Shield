import { logger } from '../../../../../lib/logger';
import { log_ctx } from '../../../../../types/index';
import { LanguageDetectorAgent } from '../agents';

export class LLMService {
    private languageDetectorAgent: LanguageDetectorAgent;

    constructor() {
        this.languageDetectorAgent = new LanguageDetectorAgent();
    }

    async detectLanguage({ message, ctx }: { message: string; ctx: log_ctx }): Promise<any> {
        try {
            const response = await this.languageDetectorAgent.detectLanguage({ message, ctx });
            return response;
        } catch (error) {
            logger.error('LLMService.detectLanguage', {
                ...ctx,
                error: (error as Error).message,
            });
            throw new Error(`Failed to detect language: ${error}`);
        }
    }
}
