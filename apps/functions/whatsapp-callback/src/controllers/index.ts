import { Request, Response } from 'express';

import { log_ctx } from '../../../../../types/index';
import { TwilioWhatsAppWebhookPayload } from '../dtos';
import WhatsAppCallbackService from '../services';

class WhatsAppCallbackController {
    constructor(private readonly service: WhatsAppCallbackService) {}

    async handleMessage(req: Request, res: Response): Promise<void> {
        const requestId = req.headers['x-request-id'] as string;
        const ctx: log_ctx = {
            requestId,
        };

        const payload: TwilioWhatsAppWebhookPayload = req.body;
        ctx.payload = payload;

        await this.service.handleMessage({ payload, ctx });
        res.status(200).send('Message received and processed');
    }
}
export default WhatsAppCallbackController;
