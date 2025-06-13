import { MessageService } from '../../../../../lib/db/firebase/services/message.service';
import { UserService } from '../../../../../lib/db/firebase/services/user.service';
import { UserQuotaService } from '../../../../../lib/db/firebase/services/userQuota.service';
import { logger } from '../../../../../lib/logger';
import { log_ctx } from '../../../../../types/generic';
import { TelegramLLMService } from './llm.service';

export class TelegramInteractiveMessageService {
    private llmService: TelegramLLMService;
    private userQuotaService: UserQuotaService;
    private readonly messages: string[] = [
        '🕵️‍♂️ Detective Agents are on the case! Analyzing your message now. Hang tight for your scam report! ⏳',
        '🔍 Our top agents are examining your message! Your scam report will be ready soon. Please wait... 📄',
        '🚨 Scam alert! Our detectives are investigating. Your report is on its way! 💨',
        '🧐 Analyzing your message with our expert team! Hold on for your detailed scam report. 📝',
        "🔎 Your message is under review by our Detective Agents! We'll get back to you with a scam report shortly. ⏱️",
    ];

    constructor(
        private userService: UserService,
        private messageService: MessageService,
    ) {
        this.llmService = new TelegramLLMService(userService, messageService);
        this.userQuotaService = new UserQuotaService();
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
            await ctx.reply(`Awesome! You’ll now get scam reports in ${language}.`);
            return;
        }

        if (callbackData.startsWith('process_yes')) {
            const parts = callbackData.split('_');
            const messageId = parts.length > 2 ? parts.slice(2).join('_') : undefined;
            if (!messageId) {
                await ctx.reply('No message ID found to process.');
                return;
            }

            await this.userQuotaService.initializeQuotaForExistingUser('telegram', telegramId);

            const quotaCheck = await this.userQuotaService.checkQuotaAndUpdate(
                'telegram',
                telegramId,
            );
            if (!quotaCheck.hasQuota) {
                logger.warn(`User ${telegramId} has exceeded weekly quota`, {
                    ...l_ctx,
                    quotaStatus: quotaCheck,
                });

                const quotaStatus = await this.userQuotaService.getQuotaStatus(
                    'telegram',
                    telegramId,
                );
                const quotaMessage = this.userQuotaService.formatQuotaMessage(quotaStatus);

                await ctx.reply(quotaMessage);
                return;
            }

            const randomMessage = this.messages[Math.floor(Math.random() * this.messages.length)];
            await ctx.reply(randomMessage);

            const { messageToBeSent } = await this.llmService.getLLMResponse({
                messageId,
                telegramId,
                ctx: l_ctx,
            });

            await this.userQuotaService.incrementUsage('telegram', telegramId);
            logger.log(`Incremented weekly quota for user ${telegramId}`, l_ctx);

            await ctx.reply(messageToBeSent);

            try {
                const quotaStatus = await this.userQuotaService.getQuotaStatus(
                    'telegram',
                    telegramId,
                );
                const quotaMessage = `📊 ${quotaStatus.remainingQuota} scans remaining this week (${quotaStatus.currentUsage}/${quotaStatus.limit} used)`;
                await ctx.reply(quotaMessage);
            } catch (error) {
                logger.error('Error showing quota status after analysis', { error, ...l_ctx });
            }
        } else if (callbackData === 'process_no') {
            await ctx.reply(
                'No worries! This message or image won’t be scanned. If you have another, just send it my way!',
            );
        }
    }

    async handleQuotaStatusRequest(telegramId: string, ctx: any): Promise<void> {
        try {
            await this.userQuotaService.initializeQuotaForExistingUser('telegram', telegramId);

            const quotaStatus = await this.userQuotaService.getQuotaStatus('telegram', telegramId);
            const quotaMessage = this.userQuotaService.formatQuotaMessage(quotaStatus);

            await ctx.reply(quotaMessage);
        } catch (error) {
            logger.error(`Error getting quota status for user ${telegramId}`, {
                error,
                telegramId,
            });
            await ctx.reply(
                "Sorry, I couldn't check your quota status right now. Please try again later.",
            );
        }
    }
}
