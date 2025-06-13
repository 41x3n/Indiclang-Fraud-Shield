import { Config } from '../../../../../lib/config';
import { MessageService } from '../../../../../lib/db/firebase/services/message.service';
import { UserService } from '../../../../../lib/db/firebase/services/user.service';
import { Language } from '../../../../../lib/llm/types';
import { logger } from '../../../../../lib/logger';
import { log_ctx } from '../../../../../types/generic';

export class TelegramImageMessageService {
    private readonly scamPromptMessages: string[] = [
        "🧐 Ready to scan this image for scams? Let's check it out!",
        '🕵️‍♀️ Shall we investigate this image for potential scams? Confirm to proceed!',
        '🔎 Thinking this might be a scam? I can analyze it for you. Proceed?',
        '🛡️ Want to check if this image is safe? Let me scan it for scams!',
        '🚨 Suspicious image? I can help! Ready to scan for scams?',
    ];

    constructor(
        private userService: UserService,
        private messageService: MessageService,
    ) {}

    async handleImageMessage(ctx: any): Promise<void> {
        const telegramId = ctx.from?.id?.toString();
        const profileName = ctx.from?.username || ctx.from?.first_name || telegramId;
        const photo = ctx.message?.photo;

        const l_ctx: log_ctx = {
            telegramId,
            profileName,
            photo,
        };

        if (!telegramId || !photo) {
            logger.error('Invalid Telegram image message payload', l_ctx);
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
                '🚨 Scam Alert HQ! I’m IndicLang Fraud Shield, your digital detective.\nThink you’ve spotted something fishy? Forward the message or take a screenshot of your chat on WhatsApp, Telegram, or SMS and send it here — I’ll crack the case!\nPick your language below and let’s bust some scams together!',
            );

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
            return;
        }

        const fileId = photo[photo.length - 1]?.file_id;

        let imageUrl = Config.telegramWebhookUrl + '/telegram/file/' + fileId;

        const message = await this.messageService.saveMessage({
            platform: 'telegram',
            userId: telegramId,
            content: '',
            type: 'image',
            imageUrl: imageUrl,
            messageId: ctx.message?.message_id?.toString() || '',
            telegramData: {
                message_id: ctx.message?.message_id,
                chat: ctx.message?.chat,
                from: ctx.message?.from,
            },
        });

        if (!message) {
            logger.error('Failed to save image message', l_ctx);
            return;
        }

        logger.log('Image message processed and saved successfully', l_ctx);

        const randomScamPrompt =
            this.scamPromptMessages[Math.floor(Math.random() * this.scamPromptMessages.length)];
        await ctx.reply(randomScamPrompt, {
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
