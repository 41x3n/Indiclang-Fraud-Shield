import { MessageService } from '../../../../../lib/db/firebase/services/message.service';
import { UserService } from '../../../../../lib/db/firebase/services/user.service';
import { logger } from '../../../../../lib/logger';
import { log_ctx } from '../../../../../types/generic';
import { TelegramLLMService } from './llm.service';

export class TelegramInteractiveMessageService {
    private llmService: TelegramLLMService;
    constructor(
        private userService: UserService,
        private messageService: MessageService,
    ) {
        this.llmService = new TelegramLLMService(userService, messageService);
    }

    async handleCallbackQuery(ctx: any): Promise<void> {
        const telegramId = ctx.from?.id?.toString();
        const callbackData = ctx.callbackQuery?.data;

        const l_ctx: log_ctx = {
            telegramId,
            callbackData,
        };

        if (!telegramId || !callbackData) {
            logger.error('Invalid Telegram callback query payload', l_ctx);
            return;
        }

        if (callbackData.startsWith('lang_')) {
            const language = callbackData.replace('lang_', '');
            await this.userService.setPreferredLanguage('telegram', telegramId, language);
            await ctx.reply(`Your preferred language has been set to ${language}.`);
            return;
        }

        if (callbackData.startsWith('process_yes')) {
            const parts = callbackData.split('_');
            const messageId = parts.length > 2 ? parts.slice(2).join('_') : undefined;
            if (!messageId) {
                await ctx.reply('No message ID found to process.');
                return;
            }

            await ctx.reply(
                'Our Agents are processing your message/image. Please wait a moment...',
            );

            const { messageToBeSent } = await this.llmService.getLLMResponse({
                messageId,
                telegramId,
                ctx: l_ctx,
            });

            ctx.reply(messageToBeSent);
        } else if (callbackData === 'process_no') {
            await ctx.reply('Okay, not processing this message/image.');
        }
    }
}
