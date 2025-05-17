export interface LanguageDetectionResult {
    language: string;
    script: string;
    supported: boolean;
    confidence: number;
    success: boolean;
}
