import { MessageService } from '../../../../../lib/db/firebase/services/message.service';
import { UserService } from '../../../../../lib/db/firebase/services/user.service';
import { Language } from '../../../../../lib/llm/types';
import { logger } from '../../../../../lib/logger';
import { log_ctx } from '../../../../../types/index';

export class TelegramTextMessageService {
    constructor(
        private userService: UserService,
        private messageService: MessageService,
    ) {}

    async handleTextMessage(ctx: any): Promise<void> {
        const telegramId = ctx.from?.id?.toString();
        const profileName = ctx.from?.username || ctx.from?.first_name || telegramId;
        const text = ctx.message?.text;

        const l_ctx: log_ctx = {
            telegramId,
            profileName,
            text,
        };

        if (!telegramId || !text) {
            logger.error('Invalid Telegram text message payload', l_ctx);
            return;
        }

        let user = await this.userService.createUserIfNotExists({
            platform: 'telegram',
            userId: telegramId,
            profileName,
            telegramData: {
                first_name: ctx.from?.first_name,
                last_name: ctx.from?.last_name,
                language_code: ctx.from?.language_code,
                is_bot: ctx.from?.is_bot,
            },
        });

        const isBoarded = this.userService.hasTheUserBeenBoarded(user);
        if (!isBoarded) {
            logger.log(`User ${telegramId} is not boarded. Triggering onboarding process.`, l_ctx);
            await ctx.reply(
                'Hi! 👋 I’m IndicLang Fraud Shield — your scam detection assistant.\nForward any suspicious message to me, and I’ll scan it and guide you.\nTo get reports in your preferred language, pick one from below.',
            );

            await this.userService.updateUser('telegram', telegramId, { isBoarded: true });

            await ctx.reply('Please select your preferred language:', {
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
            return;
        }

        const message = await this.messageService.saveMessage({
            platform: 'telegram',
            userId: telegramId,
            content: text,
            type: 'text',
            messageId: ctx.message?.message_id?.toString() || '',
            telegramData: {
                message_id: ctx.message?.message_id,
                chat: ctx.message?.chat,
                from: ctx.message?.from,
            },
        });

        if (!message) {
            logger.error('Failed to save message', l_ctx);
            return;
        }

        logger.log(`Processing text message from ${profileName}: ${text}`, l_ctx);

        await ctx.reply('Do you want to scan this message/screenshot?', {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'Yes', callback_data: `process_yes_${message.messageId}` },
                        { text: 'No', callback_data: 'process_no' },
                    ],
                ],
            },
        });
    }
}
