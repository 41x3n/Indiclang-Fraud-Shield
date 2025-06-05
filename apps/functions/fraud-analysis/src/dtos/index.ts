import { z } from 'zod';

import { Language } from '../../../../../lib/llm/types';
import { HeuristicKey } from '../../../../../types';

export const FraudAnalysisRequestSchema = z.object({
    message: z.string().min(1, 'Message is required'),
    userLanguage: z.nativeEnum(Language),
    userTags: z
        .array(
            z.enum([
                HeuristicKey.FROM_UNKNOWN,
                HeuristicKey.FORWARDED_MANY_TIMES,
                HeuristicKey.ATTACHED_FILE,
            ]),
        )
        .optional(),
});

export type FraudAnalysisRequest = z.infer<typeof FraudAnalysisRequestSchema>;
