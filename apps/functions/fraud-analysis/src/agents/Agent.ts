import { logger } from '../../../../../lib/logger';
import { log_ctx } from '../../../../../types/generic';

export abstract class Agent {
    protected readonly MODEL_ID: string;
    protected readonly AI_INSTANCE: any;
    protected readonly GENERATION_CONFIG: Record<string, any>;
    protected readonly MAX_RETRIES: number = 3;

    constructor({
        modelId,
        aiInstance,
        generationConfig,
    }: {
        modelId: string;
        aiInstance: any;
        generationConfig: Record<string, any>;
    }) {
        this.MODEL_ID = modelId;
        this.AI_INSTANCE = aiInstance;
        this.GENERATION_CONFIG = generationConfig;
    }

    protected async withRetry<T>(
        fn: () => Promise<T>,
        maxRetries = 3,
        ctx: log_ctx = {},
    ): Promise<T> {
        let lastError: any;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                ctx.attempt = attempt;

                return await fn();
            } catch (err) {
                lastError = err;

                logger.error(`Retry attempt ${attempt} failed`, { error: err, ...ctx });
            }
        }
        throw lastError;
    }
}
