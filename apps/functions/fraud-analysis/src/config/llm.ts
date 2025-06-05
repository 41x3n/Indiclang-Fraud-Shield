import { Config } from '../../../../../lib/config';

export const LLM_CONFIG = {
    scamClassifier: {
        modelId: 'gemini-2.0-flash-001',
        generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.1,
            topP: 1,
            seed: 0,
            safetySettings: [
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'OFF' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'OFF' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'OFF' },
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'OFF' },
            ],
        },
    },
    languageDetector: {
        modelId: 'gemini-2.0-flash-lite-001',
        generationConfig: {
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
        },
    },
    aiInstanceOptions: {
        vertexai: true,
        project: Config.cloudProjectName,
        location: 'global',
    },
    geminiExtract: {
        modelId: 'gemini-2.0-flash-001',
        generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.1,
            topP: 1,
            seed: 0,
            safetySettings: [
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'OFF' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'OFF' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'OFF' },
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'OFF' },
            ],
        },
    },
    translator: {
        modelId: 'gemini-2.0-flash-lite-001',
        generationConfig: {
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
        },
    },
};
