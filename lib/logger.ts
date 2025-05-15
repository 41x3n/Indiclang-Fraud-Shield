type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogOptions {
    label?: string;
    metadata?: Record<string, unknown>;
}

function formatLog(level: LogLevel, message: string, options?: LogOptions) {
    const timestamp = new Date().toISOString();
    const label = options?.label ? `[${options.label}]` : '';
    const meta = options?.metadata ? JSON.stringify(options.metadata) : '';
    return `${timestamp} ${label} ${level.toUpperCase()}: ${message} ${meta}`;
}

export const logger = {
    info(message: string, options?: LogOptions) {
        console.info(formatLog('info', message, options));
    },
    warn(message: string, options?: LogOptions) {
        console.warn(formatLog('warn', message, options));
    },
    error(message: string, options?: LogOptions) {
        console.error(formatLog('error', message, options));
    },
    debug(message: string, options?: LogOptions) {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(formatLog('debug', message, options));
        }
    },
};
