import { z } from 'zod';

export const FraudAnalysisRequestSchema = z.object({
    message: z.string().min(1, 'Message is required'),
    userLanguage: z.string().min(2),
    userTags: z.array(z.string()).optional(),
});

export type FraudAnalysisRequest = z.infer<typeof FraudAnalysisRequestSchema>;
