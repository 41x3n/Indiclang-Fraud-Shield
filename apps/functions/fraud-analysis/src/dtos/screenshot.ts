import { z } from 'zod';

import { Language } from '../../../../../lib/llm/types';

export const ScreenshotAnalysisRequestSchema = z.object({
    userLanguage: z.nativeEnum(Language),
    screenshotUrl: z.string().url('A valid screenshot URL is required'),
});

export type ScreenshotAnalysisRequest = z.infer<typeof ScreenshotAnalysisRequestSchema>;
