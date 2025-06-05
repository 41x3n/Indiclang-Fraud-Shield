export enum Language {
    Hindi = 'Hindi',
    Bengali = 'Bengali',
    Gujarati = 'Gujarati',
    Kannada = 'Kannada',
    Malayalam = 'Malayalam',
    Marathi = 'Marathi',
    Telugu = 'Telugu',
    Tamil = 'Tamil',
    Urdu = 'Urdu',
    English = 'English',
    Latin = 'Latin',
}

export enum MessageType {
    SCAM = 'scam',
    NON_SCAM = 'non_scam',
    MAYBE_SCAM = 'maybe_scam',
}

export interface ExampleMessage {
    language: Language;
    script: Language;
    message: string;
    label: MessageType;
}

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

export interface ExtractedMessageAndTagsResult {
    message: string;
    userTags: string[];
    success: boolean;
    error: string;
}
