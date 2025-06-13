import { MessageService } from '../../../../../lib/db/firebase/services/message.service';
import { UserService } from '../../../../../lib/db/firebase/services/user.service';
import { UserQuotaService } from '../../../../../lib/db/firebase/services/userQuota.service';
import { logger } from '../../../../../lib/logger';
import { log_ctx } from '../../../../../types';
import { TwilioWhatsAppWebhookPayload } from '../dtos';
import { TwilioService } from '../twilio/twilio.service';

export class TextMessageService {
    private readonly userService: UserService;
    private readonly twilioService: TwilioService;
    private readonly messageService: MessageService;
    private readonly userQuotaService: UserQuotaService;

    constructor(
        userService: UserService,
        twilioService: TwilioService,
        messageService: MessageService,
        userQuotaService: UserQuotaService,
    ) {
        this.userService = userService;
        this.twilioService = twilioService;
        this.messageService = messageService;
        this.userQuotaService = userQuotaService;
    }

    async handleTextMessage(payload: TwilioWhatsAppWebhookPayload, ctx: log_ctx): Promise<void> {
        try {
            const { Body, WaId, ProfileName } = payload;
            if (!Body || !WaId) {
                logger.error('Invalid text message payload', ctx);
                return;
            }
            logger.log(`Text message from ${ProfileName || WaId}: ${Body}`, ctx);

            const user = await this.userService.createUserIfNotExists({
                platform: 'whatsapp',
                userId: WaId,
                profileName: ProfileName || WaId,
                whatsappData: { waid: WaId },
            });
            const isBoarded = this.userService.hasTheUserBeenBoarded(user);

            if (!isBoarded) {
                logger.log(`User ${WaId} is not boarded. Triggering onboarding process.`, ctx);
                const success = await this.twilioService.triggerTheUserToOnboard({
                    waId: WaId,
                    ctx,
                });
                if (!success) {
                    logger.error(`Failed to trigger onboarding for user ${WaId}`, ctx);
                    return;
                }
                logger.log(`Onboarding triggered for user ${WaId}`, ctx);
                await this.userService.updateUser('whatsapp', WaId, { isBoarded: true });
                return;
            }

            if (
                Body.toLowerCase().includes('quota') ||
                Body.toLowerCase().includes('limit') ||
                Body.toLowerCase().includes('usage')
            ) {
                try {
                    await this.userQuotaService.initializeQuotaForExistingUser('whatsapp', WaId);
                    const quotaStatus = await this.userQuotaService.getQuotaStatus(
                        'whatsapp',
                        WaId,
                    );
                    const quotaMessage = this.userQuotaService.formatQuotaMessage(quotaStatus);
                    await this.twilioService.sendWhatsAppMessage({
                        to: WaId,
                        body: quotaMessage,
                        ctx,
                    });
                } catch (error) {
                    logger.error('Error getting quota status', { error, ...ctx });
                    await this.twilioService.sendWhatsAppMessage({
                        to: WaId,
                        body: "Sorry, I couldn't check your quota status right now. Please try again later.",
                        ctx,
                    });
                }
                return;
            }

            logger.log(`Processing text message for boarded user ${WaId}`, ctx);
            await this.twilioService.sendMessageScanningRequestTemplate({
                to: WaId,
                ctx,
                messageId: payload.MessageSid,
            });
        } catch (error) {
            logger.error(`Error handling text message: ${error}`, ctx);
        }
    }
}
