import { UserQuotaService } from '../../../../../lib/db/firebase/services/userQuota.service';
import { Language } from '../../../../../lib/llm/types';
import { logger } from '../../../../../lib/logger';
import { log_ctx } from '../../../../../types/index';

export interface CommandHandler {
    canHandle(text: string): boolean;
    handle(ctx: any, telegramId: string, l_ctx: log_ctx): Promise<boolean>;
}

export class HelpCommandHandler implements CommandHandler {
    canHandle(text: string): boolean {
        const lowerText = text.toLowerCase();
        return (
            lowerText.includes('/help') ||
            lowerText.includes('help') ||
            lowerText.includes('/start')
        );
    }

    async handle(ctx: any): Promise<boolean> {
        const helpMessage = `🤖 **IndicLang Fraud Shield Help**

I'm your digital detective helping you identify scam messages! Here's what I can do:

**Available Commands:**
• \`/help\` or \`/start\` - Show this help message
• \`/quota\` - Check your weekly scanning quota
• \`/language\` or \`/lang\` - Change your preferred language
• \`/status\` - Check bot status and features

**How to use me:**
1️⃣ **Forward suspicious messages** - Just send me any text message you want me to analyze
2️⃣ **Send screenshots** - Share images of suspicious chats from WhatsApp, SMS, or other apps
3️⃣ **Get instant analysis** - I'll tell you if it's a scam and provide safety tips

**Features:**
✅ Multi-language support (English, Hindi, Bengali, Tamil, Telugu, Malayalam, Kannada, Marathi, Gujarati, Urdu)
✅ AI-powered scam detection
✅ Screenshot analysis
✅ Safety recommendations

**Getting Started:**
Simply send me any message or image you want to check, and I'll ask if you want me to scan it for scams!

Stay safe! 🛡️`;

        await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
        return true;
    }
}

export class QuotaCommandHandler implements CommandHandler {
    constructor(private userQuotaService: UserQuotaService) {}

    canHandle(text: string): boolean {
        const lowerText = text.toLowerCase();
        return (
            lowerText.includes('/quota') ||
            lowerText.includes('quota status') ||
            lowerText.includes('my quota')
        );
    }

    async handle(ctx: any, telegramId: string, l_ctx: log_ctx): Promise<boolean> {
        try {
            await this.userQuotaService.initializeQuotaForExistingUser('telegram', telegramId);
            const quotaStatus = await this.userQuotaService.getQuotaStatus('telegram', telegramId);
            const quotaMessage = this.userQuotaService.formatQuotaMessage(quotaStatus);
            await ctx.reply(quotaMessage);
        } catch (error) {
            logger.error('Error getting quota status', { error, ...l_ctx });
            await ctx.reply(
                "Sorry, I couldn't check your quota status right now. Please try again later.",
            );
        }
        return true;
    }
}

export class StatusCommandHandler implements CommandHandler {
    canHandle(text: string): boolean {
        const lowerText = text.toLowerCase();
        return (
            lowerText.includes('/status') ||
            lowerText.includes('status') ||
            lowerText.includes('/info')
        );
    }

    async handle(ctx: any): Promise<boolean> {
        const statusMessage = `🤖 **IndicLang Fraud Shield Status**

✅ **Bot Status:** Online and ready
🛡️ **Protection Level:** Active
🌐 **Languages Supported:** 10+ Indian languages
📊 **Features:** 
• Text message analysis
• Screenshot analysis  
• Real-time scam detection

Type /help to see all available commands.`;

        await ctx.reply(statusMessage, { parse_mode: 'Markdown' });
        return true;
    }
}

export class LanguageCommandHandler implements CommandHandler {
    canHandle(text: string): boolean {
        const lowerText = text.toLowerCase();
        return (
            lowerText.includes('/language') ||
            lowerText.includes('/lang') ||
            lowerText.includes('change language') ||
            lowerText.includes('select language') ||
            lowerText.includes('language picker')
        );
    }

    async handle(ctx: any): Promise<boolean> {
        await ctx.reply(
            '🌐 **Choose your preferred language:**\n\nThis will change the language for all scam detection reports and suggestions.',
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: Language.English, callback_data: 'lang_' + Language.English }],
                        [{ text: Language.Hindi, callback_data: 'lang_' + Language.Hindi }],
                        [{ text: Language.Bengali, callback_data: 'lang_' + Language.Bengali }],
                        [{ text: Language.Tamil, callback_data: 'lang_' + Language.Tamil }],
                        [{ text: Language.Telugu, callback_data: 'lang_' + Language.Telugu }],
                        [{ text: Language.Malayalam, callback_data: 'lang_' + Language.Malayalam }],
                        [{ text: Language.Kannada, callback_data: 'lang_' + Language.Kannada }],
                        [{ text: Language.Marathi, callback_data: 'lang_' + Language.Marathi }],
                        [{ text: Language.Gujarati, callback_data: 'lang_' + Language.Gujarati }],
                        [{ text: Language.Urdu, callback_data: 'lang_' + Language.Urdu }],
                    ],
                    one_time_keyboard: true,
                },
            },
        );
        return true;
    }
}

export class TelegramCommandService {
    private handlers: CommandHandler[] = [];

    constructor(userQuotaService: UserQuotaService) {
        this.handlers = [
            new HelpCommandHandler(),
            new QuotaCommandHandler(userQuotaService),
            new StatusCommandHandler(),
            new LanguageCommandHandler(),
        ];
    }

    async handleCommand(
        text: string,
        ctx: any,
        telegramId: string,
        l_ctx: log_ctx,
    ): Promise<boolean> {
        for (const handler of this.handlers) {
            if (handler.canHandle(text)) {
                return await handler.handle(ctx, telegramId, l_ctx);
            }
        }
        return false;
    }

    addHandler(handler: CommandHandler): void {
        this.handlers.push(handler);
    }
}
