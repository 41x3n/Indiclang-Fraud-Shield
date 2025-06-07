import { Router } from 'express';

import { telegramFileController, telegramWebhookController } from '../controllers';

const router = Router();

router.post('/telegram/webhook', telegramWebhookController);

router.get('/telegram/file/:fileId', telegramFileController);

export default router;
