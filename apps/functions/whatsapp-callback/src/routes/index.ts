import { Router } from 'express';

import { validate } from '../../../../../lib/middleware';
import WhatsAppCallbackController from '../controllers';
import { TwilioWhatsAppWebhookSchema } from '../dtos';
import WhatsAppCallbackService from '../services';

const whatsAppRouter = Router();
const whatsAppCallbackService = new WhatsAppCallbackService();
const whatsAppCallbackController = new WhatsAppCallbackController(whatsAppCallbackService);

whatsAppRouter.post('/message', validate(TwilioWhatsAppWebhookSchema), async (req, res) =>
    whatsAppCallbackController.handleMessage(req, res),
);
export { whatsAppRouter };
