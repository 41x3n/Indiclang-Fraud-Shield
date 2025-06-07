import axios from 'axios';

import { Config } from '../../../../../lib/config';
import { MessageService } from '../../../../../lib/db/firebase/services/message.service';
import { UserService } from '../../../../../lib/db/firebase/services/user.service';
import { Language } from '../../../../../lib/llm/types';
import { logger } from '../../../../../lib/logger';
import { TwilioWhatsAppWebhookPayload } from '../dtos';
import { TwilioService } from '../twilio/twilio.service';

export class InteractiveMessageService {
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

    async handleInteractiveMessage(payload: TwilioWhatsAppWebhookPayload, ctx: any): Promise<void> {
        const { Body, WaId, ProfileName, ListId = '', ButtonPayload, ButtonText } = payload;
        if (!Body || !WaId) {
            logger.error('Invalid interactive message payload', ctx);
            return;
        }
        logger.log(`Interactive message from ${ProfileName || WaId}: ${Body}`, ctx);
        try {
            const isFromLanguagePicker = this.isLanguagePicker(ListId);
            if (isFromLanguagePicker) {
                await this.setPreferredLanguage(WaId, ListId, ctx);
                return;
            }

            const isScanRequest = this.isScanRequest(Body, ButtonText, ButtonPayload);
            if (isScanRequest) {
                logger.log(`Scan request detected from ${ProfileName || WaId}`, ctx);
                await this.getLLMResponse({
                    messageId: ButtonPayload as string,
                    WaId,
                    ctx,
                });
            }
        } catch (error) {
            logger.error(`Error handling interactive message: ${error}`, ctx);
        }
    }

    isLanguagePicker(listId: string): boolean {
        return listId.includes('language_picker');
    }

    isScanRequest(Body: string, ButtonText: string = '', ButtonPayload: string = ''): boolean {
        return Body.includes('Yes') && ButtonText.includes('Yes') && !!ButtonPayload;
    }

    async setPreferredLanguage(waId: string, listId: string, ctx: any): Promise<void> {
        ctx.waId = waId;
        ctx.listId = listId;

        const language = listId.split('_')[2] as Language; // Assuming the listId format is 'language_picker_<language>'
        if (!language) {
            throw new Error(`Invalid listId format: ${listId}`);
        }

        await this.userService.setPreferredLanguage(waId, language);

        logger.log(`Preferred language set for user ${waId}: ${language}`, ctx);

        const message = `Your preferred language has been set to ${language}.`;
        await this.twilioService.sendWhatsAppMessage({
            to: waId,
            body: message,
            ctx,
        });

        logger.log(`Confirmation message sent to user ${waId}: ${message}`, ctx);
    }

    async getLLMResponse({
        messageId,
        WaId,
        ctx,
    }: {
        messageId: string;
        WaId: string;
        ctx: any;
    }): Promise<void> {
        ctx.messageId = messageId;
        ctx.WaId = WaId;

        try {
            const messageObjFromDB = await this.messageService.getMessageBySid(messageId);
            if (!messageObjFromDB) {
                logger.error(`Message with ID ${messageId} not found in database`, ctx);
                return;
            }

            const { content, waid, imageUrl } = messageObjFromDB;
            ctx.content = content;
            ctx.waid = waid;
            ctx.imageUrl = imageUrl;

            if (!waid) {
                logger.error(`Invalid message object for messageId ${messageId}`, ctx);
                return;
            }

            const user = await this.userService.getUserByWaid(waid);
            if (!user) {
                logger.error(`User with WaId ${waid} not found`, ctx);
                return;
            }
            ctx.user = user;

            const preferredLanguage = user.preferredLanguage || Language.English;
            ctx.preferredLanguage = preferredLanguage;
            logger.log(`Getting LLM response for messageId ${messageId} and WaId ${WaId}`, ctx);

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
                logger.error(`LLM API responded with status ${response.status}`, ctx);
                return;
            }

            const llmResponse = response.data;
            ctx.llmResponse = llmResponse;
            logger.log(`LLM response received for messageId ${messageId} and WaId ${WaId}`, ctx);

            const scamClassifierResult = llmResponse?.data?.scamClassifierResult;
            if (!scamClassifierResult) {
                logger.error(
                    `No scam classifier result in LLM response for messageId ${messageId}`,
                    ctx,
                );
                return;
            }

            const { risk_label, reason, suggestion } = scamClassifierResult;

            let messageToBeSent = '';
            if (risk_label === 'scam') {
                messageToBeSent = `⚠️ Hi! Our system thinks this message could be a scam.\n\nWhy? ${reason}\n\nWhat should you do? ${suggestion}\n\nPlease be careful and avoid sharing personal or financial information.`;
            } else {
                messageToBeSent = `✅ Good news! This message does not appear to be a scam.\n\nWhy? ${reason}\n\nTip: ${suggestion}`;
            }

            await this.twilioService.sendWhatsAppMessage({
                to: WaId,
                body: messageToBeSent,
                ctx,
            });
        } catch (error) {
            logger.error(`Error getting LLM response for messageId ${messageId} and WaId ${WaId}`, {
                error,
                ...ctx,
            });
        }
    }
}
