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
