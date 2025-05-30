import { config as dotenvConfig } from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
    dotenvConfig();
    console.log('[env] Loaded from .env');
}

const REQUIRED_VARS = [
    'API_KEY',
    'NODE_ENV',
    'CLOUD_PROJECT_NAME',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PREFERRED_LANGUAGE_TEMPLATE_ID',
    'TWILIO_WHATSAPP_FROM',
    'TWILIO_MESSAGE_SCANNING_REQUEST_TEMPLATE_ID',
    'FRAUD_ANALYSIS_API_URL',
] as const;

type RequiredEnv = {
    [K in (typeof REQUIRED_VARS)[number]]: string;
};

const missing: string[] = [];

const loadedEnv = {} as RequiredEnv;

for (const key of REQUIRED_VARS) {
    const value = process.env[key];
    if (!value) {
        missing.push(key);
    } else {
        loadedEnv[key] = value;
    }
}

if (missing.length > 0) {
    throw new Error(`[env] Missing required env vars: ${missing.join(', ')}`);
}

export const Config = {
    apiKey: loadedEnv.API_KEY,
    nodeEnv: loadedEnv.NODE_ENV,
    cloudProjectName: process.env.CLOUD_PROJECT_NAME,
    isProd: loadedEnv.NODE_ENV === 'production',
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioPreferredLanguageTemplateId: process.env.TWILIO_PREFERRED_LANGUAGE_TEMPLATE_ID as string,
    twilioWhatsAppFrom: process.env.TWILIO_WHATSAPP_FROM as string,
    twilioMessageScanningRequestTemplateId: process.env
        .TWILIO_MESSAGE_SCANNING_REQUEST_TEMPLATE_ID as string,
    fraudAnalysisApiUrl: process.env.FRAUD_ANALYSIS_API_URL as string,
};
