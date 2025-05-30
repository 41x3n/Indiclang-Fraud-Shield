import { Twilio } from 'twilio';

import { Config } from '../../../../../lib/config';
import { logger } from '../../../../../lib/logger';
import { log_ctx } from '../../../../../types/index';

export class TwilioService {
    private readonly client: Twilio;
    private readonly from: string;
    private readonly preferredLanguageTemplate: string;

    constructor() {
        this.client = new Twilio(Config.twilioAccountSid, Config.twilioAuthToken);
        this.from = Config.twilioWhatsAppFrom;
        this.preferredLanguageTemplate = Config.twilioPreferredLanguageTemplateId;
    }

    async sendWhatsAppMessage({ to, body, ctx }: { to: string; body: string; ctx: log_ctx }) {
        try {
            ctx.to = to;
            ctx.body = body;

            const message = await this.client.messages.create({
                from: this.from,
                to: `whatsapp:+${to}`,
                body,
            });

            ctx.messageId = message.sid;
            logger.log('WhatsApp message sent successfully:', { message, ...ctx });

            return message;
        } catch (error) {
            logger.error('Error sending WhatsApp message:', { error, ...ctx });
            throw error;
        }
    }

    async sendOnboardingTemplateMessage({
        to,
        ctx,
    }: {
        to: string;
        ctx: log_ctx;
    }): Promise<boolean> {
        try {
            ctx.to = to;
            const message = await this.client.messages.create({
                from: this.from,
                to: `whatsapp:+${to}`,
                contentSid: this.preferredLanguageTemplate,
            } as any);
            ctx.messageId = message.sid;
            logger.log('WhatsApp template message sent successfully:', { message, ...ctx });
            return !!message.sid;
        } catch (error) {
            logger.error('Error sending WhatsApp template message:', { error, ...ctx });
            throw error;
        }
    }

    async triggerTheUserToOnboard({ waId, ctx }: { waId: string; ctx: log_ctx }) {
        logger.log(`Triggering onboarding for user ${waId}`, ctx);

        const success = await this.sendOnboardingTemplateMessage({
            to: waId,
            ctx,
        });

        return success;
    }

    async sendMessageScanningRequestTemplate({
        to,
        ctx,
        messageId,
    }: {
        to: string;
        ctx: log_ctx;
        messageId: string;
    }): Promise<boolean> {
        try {
            ctx.to = to;
            const message = await this.client.messages.create({
                from: this.from,
                to: `whatsapp:+${to}`,
                contentSid: Config.twilioMessageScanningRequestTemplateId,
                contentVariables: JSON.stringify({
                    1: messageId,
                }),
            } as any);
            ctx.messageId = message.sid;
            logger.log('WhatsApp message scanning request template sent successfully:', {
                message,
                ...ctx,
            });
            return !!message.sid;
        } catch (error) {
            logger.error('Error sending WhatsApp message scanning request template:', {
                error,
                ...ctx,
            });
            throw error;
        }
    }
}
