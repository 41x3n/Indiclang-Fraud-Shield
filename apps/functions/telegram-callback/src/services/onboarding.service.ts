import { UserService } from '../../../../../lib/db/firebase/services/user.service';
import { Language } from '../../../../../lib/llm/types';
import { logger } from '../../../../../lib/logger';
import { log_ctx } from '../../../../../types/index';

export class TelegramOnboardingService {
    constructor(private userService: UserService) {}

    async handleOnboarding(ctx: any, telegramId: string, l_ctx: log_ctx): Promise<void> {
        logger.log(`User ${telegramId} is not boarded. Triggering onboarding process.`, l_ctx);

        const welcomeMessage = `🚨 **Welcome to IndicLang Fraud Shield!**

I'm your digital detective helping you identify scam messages!

**What I can do:**
• Analyze suspicious text messages
• Check screenshots for scams
• Support 10+ Indian languages

**Available Commands:**
• \`/help\` - Show help and commands
• \`/quota\` - Check your weekly scanning quota

**How to start:** Forward any suspicious message or send a screenshot, and I'll analyze it for you!

Pick your preferred language below to get started:`;

        await ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });

        await this.userService.updateUser('telegram', telegramId, { isBoarded: true });

        await ctx.reply('Pick your preferred language to get started:', {
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
        });
    }
}
