import { MessageService } from '../../../../../lib/db/firebase/services/message.service';
import { logger } from '../../../../../lib/logger';
import { log_ctx } from '../../../../../types/index';

export class TelegramMessageProcessingService {
    private readonly scamPromptMessages: string[] = [
        "🧐 Ready to scan this message for scams? Let's check it out!",
        '🕵️‍♀️ Shall we investigate this message for potential scams? Confirm to proceed!',
        '🔎 Thinking this might be a scam? I can analyze it for you. Proceed?',
        '🛡️ Want to check if this message is safe? Let me scan it for scams!',
        '🚨 Suspicious message? I can help! Ready to scan for scams?',
    ];
    constructor(private messageService: MessageService) {}

    async processRegularMessage(
        ctx: any,
        telegramId: string,
        text: string,
        profileName: string,
        l_ctx: log_ctx,
    ): Promise<void> {
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
