import { MessageService } from '../../../../../lib/db/firebase/services/message.service';
import { UserService } from '../../../../../lib/db/firebase/services/user.service';
import { UserQuotaService } from '../../../../../lib/db/firebase/services/userQuota.service';
import { logger } from '../../../../../lib/logger';
import { log_ctx } from '../../../../../types/index';
import { TwilioWhatsAppWebhookPayload } from '../dtos';
import { TwilioService } from '../twilio/twilio.service';
import { ImageMessageService } from './imageMessage.service';
import { InteractiveMessageService } from './interactiveMessage.service';
import { TextMessageService } from './textMessage.service';

class WhatsAppCallbackService {
    private textMessageService: TextMessageService;
    private imageMessageService: ImageMessageService;
    private interactiveMessageService: InteractiveMessageService;
    private userService: UserService;
    private twilioService: TwilioService;
    private messageService: MessageService;
    private userQuotaService: UserQuotaService;

    constructor() {
        this.userService = new UserService();
        this.twilioService = new TwilioService();
        this.messageService = new MessageService();
        this.userQuotaService = new UserQuotaService();
        this.textMessageService = new TextMessageService(
            this.userService,
            this.twilioService,
            this.messageService,
            this.userQuotaService,
        );
        this.imageMessageService = new ImageMessageService(
            this.userService,
            this.twilioService,
            this.messageService,
        );
        this.interactiveMessageService = new InteractiveMessageService(
            this.userService,
            this.twilioService,
            this.messageService,
        );
    }

    async handleMessage({
        payload,
        ctx,
    }: {
        payload: TwilioWhatsAppWebhookPayload;
        ctx: log_ctx;
    }): Promise<void> {
        const { WaId, ProfileName, MessageType, MessageSid, Body, MediaUrl0 } = payload;
        if (!WaId || !ProfileName || !MessageType) {
            logger.error('Invalid message received', ctx);
            return;
        }
        if (WaId) {
            await this.messageService.saveMessage({
                platform: 'whatsapp',
                userId: WaId,
                content: Body || '',
                type: (MessageType as any) || 'text',
                imageUrl: MediaUrl0 || '',
                messageId: MessageSid,
                whatsappData: { waid: WaId, messageSid: MessageSid },
            });
            logger.log(`Message saved for ${ProfileName || WaId}: ${Body}`, ctx);
        }
        switch (MessageType) {
            case 'text':
                await this.textMessageService.handleTextMessage(payload, ctx);
                break;
            case 'image':
                await this.imageMessageService.handleImageMessage(payload, ctx);
                break;
            case 'interactive':
                await this.interactiveMessageService.handleInteractiveMessage(payload, ctx);
                break;
            default:
                logger.log(`Unhandled message type: ${MessageType}`, ctx);
        }
    }
}

export default WhatsAppCallbackService;
