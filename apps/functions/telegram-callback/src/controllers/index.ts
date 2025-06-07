import axios from 'axios';
import { Request, Response } from 'express';

import { Config } from '../../../../../lib/config';
import { logger } from '../../../../../lib/logger';
import { bot } from '../app';

export const telegramWebhookController = async (req: Request, res: Response) => {
    try {
        await bot.handleUpdate(req.body, res);
    } catch (err) {
        logger.error('Error handling Telegram update:', err);
        res.status(500).send('Error handling Telegram update');
    }
};

export const telegramFileController = async (req: Request, res: Response) => {
    const { fileId } = req.params;
    try {
        const file = await bot.telegram.getFile(fileId);
        if (!file || !file.file_path) {
            return res.status(404).json({ error: 'File not found' });
        }

        const fileUrl = `https://api.telegram.org/file/bot${Config.telegramBotToken}/${file.file_path}`;
        const response = await axios.get(fileUrl, { responseType: 'stream' });

        res.setHeader(
            'Content-Type',
            response.headers['content-type'] || 'application/octet-stream',
        );
        if (file.file_path) {
            const filename = file.file_path.split('/').pop();
            if (filename) {
                res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            }
        }
        return response.data.pipe(res);
    } catch (err) {
        logger.error('Failed to fetch file from Telegram', { fileId, err });
        res.status(500).json({
            error: 'Failed to fetch file from Telegram',
            details: (err as any)?.message,
        });
    }
};
