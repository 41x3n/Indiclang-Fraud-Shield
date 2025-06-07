import axios from 'axios';

import { Config } from '../../../../../lib/config';
import { MessageService } from '../../../../../lib/db/firebase/services/message.service';
import { UserService } from '../../../../../lib/db/firebase/services/user.service';
import { Language } from '../../../../../lib/llm/types';
import { logger } from '../../../../../lib/logger';
import { log_ctx } from '../../../../../types/generic';

export class TelegramLLMService {
    constructor(
        private userService: UserService,
        private messageService: MessageService,
    ) {}

    async getLLMResponse({
        messageId,
        telegramId,
        ctx,
    }: {
        messageId: string;
        telegramId: string;
        ctx: log_ctx;
    }): Promise<{ messageToBeSent: string }> {
        ctx.messageId = messageId;
        ctx.telegramId = telegramId;
        try {
            const messageObjFromDB = await this.messageService.getMessageByMessageId(
                'telegram',
                messageId,
            );
            if (!messageObjFromDB) {
                logger.error(`Message with ID ${messageId} not found in database`, ctx);
                throw new Error('Message not found');
            }

            const { content, userId, imageUrl } = messageObjFromDB;
            ctx.content = content;
            ctx.userId = userId;
            ctx.imageUrl = imageUrl;
            if (!userId) {
                logger.error(`Invalid message object for messageId ${messageId}`, ctx);
                throw new Error('User ID is missing in the message object');
            }

            const user = await this.userService.getUserByUserId('telegram', userId);
            if (!user) {
                logger.error(`User with userId ${userId} not found`, ctx);
                throw new Error('User not found');
            }

            ctx.user = user;
            const preferredLanguage = user.preferredLanguage || Language.English;
            ctx.preferredLanguage = preferredLanguage;
            logger.log(
                `Getting LLM response for messageId ${messageId} and telegramId ${telegramId}`,
                ctx,
            );
            const response = imageUrl
                ? await axios.post(
                      Config.fraudScreenshotAnalysisApiUrl as string,
                      {
                          userLanguage: preferredLanguage,
                          screenshotUrl: imageUrl,
                      },
                      {
                          headers: {
                              'Content-Type': 'application/json',
                              'x-api-key': Config.apiKey,
                          },
                      },
                  )
                : await axios.post(
                      Config.fraudAnalysisApiUrl as string,
                      {
                          message: content,
                          userTags: ['from_unknown'],
                          userLanguage: preferredLanguage,
                      },
                      {
                          headers: {
                              'Content-Type': 'application/json',
                              'x-api-key': Config.apiKey,
                          },
                      },
                  );

            if (response.status !== 200) {
                logger.error(`LLM API responded with status ${response.status}`);
                throw new Error('LLM API responded with an error');
            }

            const llmResponse = response.data;
            ctx.llmResponse = llmResponse;
            logger.log(
                `LLM response received for messageId ${messageId} and telegramId ${telegramId}`,
                ctx,
            );
            if (!llmResponse || !llmResponse.data) {
                logger.error(
                    `Invalid LLM response for messageId ${messageId} and telegramId ${telegramId}`,
                    ctx,
                );
                throw new Error('Invalid LLM response');
            }

            const scamClassifierResult = llmResponse?.data?.scamClassifierResult;
            if (!scamClassifierResult) {
                logger.error(
                    `No scam classifier result in LLM response for messageId ${messageId}`,
                    ctx,
                );
                throw new Error('No scam classifier result');
            }

            const { risk_label, reason, suggestion } = scamClassifierResult;
            let messageToBeSent = '';
            if (risk_label === 'scam') {
                messageToBeSent = `⚠️ Heads up! This looks suspicious and could be a scam.\n\nWhy? ${reason}\n\nWhat should you do? ${suggestion}\n\nStay safe — never share personal or financial info with unknown contacts!`;
            } else {
                messageToBeSent = `✅ All clear! This message doesn’t seem to be a scam.\n\nWhy? ${reason}\n\nPro tip: ${suggestion}`;
            }
            return {
                messageToBeSent,
            };
        } catch (error) {
            logger.error(
                `Error getting LLM response for messageId ${messageId} and telegramId ${telegramId}: ${error}`,
                ctx,
            );
            return {
                messageToBeSent:
                    'Oops! Something went wrong while checking your message. Please try again in a bit.',
            };
        }
    }
}
