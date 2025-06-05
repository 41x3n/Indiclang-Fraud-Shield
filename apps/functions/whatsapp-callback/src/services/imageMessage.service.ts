import { logger } from '../../../../../lib/logger';
import { log_ctx } from '../../../../../types';
import { TwilioWhatsAppWebhookPayload } from '../dtos';
import { MessageService } from '../firebase/services/message.service';
import { UserService } from '../firebase/services/user.service';
import { TwilioService } from '../twilio/twilio.service';

export class ImageMessageService {
    private readonly userService: UserService;
    private readonly twilioService: TwilioService;
    private readonly messageService: MessageService;

    constructor(
        userService: UserService,
        twilioService: TwilioService,
        messageService: MessageService,
    ) {
        this.userService = userService;
        this.twilioService = twilioService;
        this.messageService = messageService;
    }

    async handleImageMessage(payload: TwilioWhatsAppWebhookPayload, ctx: log_ctx): Promise<void> {
        try {
            const { MediaUrl0, MediaContentType0, WaId, ProfileName } = payload;
            if (!MediaUrl0 || !WaId) {
                logger.error('Invalid image message payload', ctx);
                return;
            }
            logger.log(
                `Image message from ${ProfileName || WaId}: ${MediaUrl0} (${MediaContentType0})`,
                ctx,
            );

            const user = await this.userService.createUserIfNotExists(WaId, ProfileName || WaId);
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
                await this.userService.updateUser(WaId, { isBoarded: true });
                return;
            }

            logger.log(`Processing image for boarded user ${WaId}`, ctx);
            await this.twilioService.sendMessageScanningRequestTemplate({
                to: WaId,
                ctx,
                messageId: payload.MessageSid,
            });
        } catch (error) {
            logger.error(`Error handling image message: ${error}`, ctx);
        }
    }
}
