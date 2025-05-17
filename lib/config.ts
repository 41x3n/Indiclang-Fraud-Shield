import { config as dotenvConfig } from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
    dotenvConfig();
    console.log('[env] Loaded from .env');
}

// Define all required env vars here
const REQUIRED_VARS = ['API_KEY', 'NODE_ENV', 'CLOUD_PROJECT_NAME'] as const;

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

// Export clean, typed config
export const Config = {
    apiKey: loadedEnv.API_KEY,
    nodeEnv: loadedEnv.NODE_ENV,
    cloudProjectName: process.env.CLOUD_PROJECT_NAME,
    isProd: loadedEnv.NODE_ENV === 'production',
};
