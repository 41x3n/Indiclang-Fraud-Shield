import { logger } from '../../../../../lib/logger';
import { log_ctx } from '../../../../../types/index';
import { TwilioWhatsAppWebhookPayload } from '../dtos';
import { MessageService } from '../firebase/services/message.service';
import { UserService } from '../firebase/services/user.service';
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

    constructor() {
        this.userService = new UserService();
        this.twilioService = new TwilioService();
        this.messageService = new MessageService();
        this.textMessageService = new TextMessageService(
            this.userService,
            this.twilioService,
            this.messageService,
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
        const { WaId, ProfileName, MessageType } = payload;
        if (!WaId || !ProfileName || !MessageType) {
            logger.error('Invalid message received', ctx);
            return;
        }
        if (payload.WaId) {
            await this.messageService.saveMessage({
                waid: WaId,
                content: payload.Body || '',
                type: (payload.MessageType as any) || 'text',
                imageUrl: payload.MediaUrl0 || '',
                messageSid: payload.MessageSid,
            });
            logger.log(`Message saved for ${ProfileName || WaId}: ${payload.Body}`, ctx);
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
