import { MessageType } from './message-bank';

export interface LanguageDetectionResult {
    language: string;
    script: string;
    supported: boolean;
    confidence: number;
    success: boolean;
}

export interface ScamClassificationResult {
    risk_score: number;
    risk_label: MessageType | string;
    reason: string;
    suggestion: string;
    confidence: number;
}
