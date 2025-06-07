import express from 'express';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';

import { Config } from '../../../../lib/config';
import router from './routes';
import { TelegramCallbackService } from './services';

export const bot = new Telegraf(Config.telegramBotToken);
const telegramCallbackService = new TelegramCallbackService();

bot.on(message('text'), async (ctx) => {
    await telegramCallbackService.getTextHandler()(ctx);
});

bot.on(message('photo'), async (ctx) => {
    await telegramCallbackService.getImageHandler()(ctx);
});

bot.on('callback_query', async (ctx) => {
    await telegramCallbackService.getCallbackQueryHandler()(ctx);
});

export const app = express();
app.use(express.json());

app.use('/telegram/webhook', bot.webhookCallback('/telegram/webhook'));

app.use(router);

const webhookUrl = Config.telegramWebhookUrl;

if (webhookUrl) {
    bot.telegram
        .setWebhook(`${webhookUrl}/telegram/webhook`)
        .then(() => {
            console.log(`[telegram] Webhook registered: ${webhookUrl}/telegram/webhook`);
        })
        .catch((err) => {
            console.error('[telegram] Failed to register webhook:', err);
        });
}
