import axios from 'axios';

import { Config } from '../../../../../lib/config';
import { AnalysisResultService } from '../../../../../lib/db/firebase/services/analysisResult.service';
import { MessageService } from '../../../../../lib/db/firebase/services/message.service';
import { UserService } from '../../../../../lib/db/firebase/services/user.service';
import { UserQuotaService } from '../../../../../lib/db/firebase/services/userQuota.service';
import { Language } from '../../../../../lib/llm/types';
import { logger } from '../../../../../lib/logger';
import { TwilioWhatsAppWebhookPayload } from '../dtos';
import { TwilioService } from '../twilio/twilio.service';

export class InteractiveMessageService {
    private readonly userService: UserService;
    private readonly twilioService: TwilioService;
    private readonly messageService: MessageService;
    private readonly analysisResultService: AnalysisResultService;
    private readonly userQuotaService: UserQuotaService;

    constructor(
        userService: UserService,
        twilioService: TwilioService,
        messageService: MessageService,
    ) {
        this.userService = userService;
        this.twilioService = twilioService;
        this.messageService = messageService;
        this.analysisResultService = new AnalysisResultService();
        this.userQuotaService = new UserQuotaService();
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

    async setPreferredLanguage(waid: string, listId: string, ctx: any): Promise<void> {
        ctx.waid = waid;
        ctx.listId = listId;

        const language = listId.split('_')[2] as Language; // Assuming the listId format is 'language_picker_<language>'
        if (!language) {
            throw new Error(`Invalid listId format: ${listId}`);
        }

        await this.userService.setPreferredLanguage('whatsapp', waid, language);

        logger.log(`Preferred language set for user ${waid}: ${language}`, ctx);

        const message = `Your preferred language has been set to ${language}.`;
        await this.twilioService.sendWhatsAppMessage({
            to: waid,
            body: message,
            ctx,
        });

        logger.log(`Confirmation message sent to user ${waid}: ${message}`, ctx);
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

        let analysisRecordBase: any = null;
        try {
            const messageObjFromDB = await this.messageService.getMessageByMessageId(
                'whatsapp',
                messageId,
            );
            if (!messageObjFromDB) {
                logger.error(`Message with ID ${messageId} not found in database`, ctx);
                return;
            }

            const { content, userId, imageUrl } = messageObjFromDB;
            ctx.content = content;
            ctx.waid = userId;
            ctx.imageUrl = imageUrl;

            if (!userId) {
                logger.error(`Invalid message object for messageId ${messageId}`, ctx);
                return;
            }

            const user = await this.userService.getUserByUserId('whatsapp', userId);
            if (!user) {
                logger.error(`User with userId ${userId} not found`, ctx);
                return;
            }
            ctx.user = user;

            await this.userQuotaService.initializeQuotaForExistingUser('whatsapp', userId);

            const quotaCheck = await this.userQuotaService.checkQuotaAndUpdate('whatsapp', userId);
            if (!quotaCheck.hasQuota) {
                logger.warn(`User ${userId} has exceeded weekly quota`, {
                    ...ctx,
                    quotaStatus: quotaCheck,
                });

                const quotaStatus = await this.userQuotaService.getQuotaStatus('whatsapp', userId);
                const quotaMessage = this.userQuotaService.formatQuotaMessage(quotaStatus);

                await this.twilioService.sendWhatsAppMessage({
                    to: WaId,
                    body: quotaMessage,
                    ctx,
                });
                return;
            }

            const preferredLanguage = user.preferredLanguage || Language.English;
            ctx.preferredLanguage = preferredLanguage;
            logger.log(`Getting LLM response for messageId ${messageId} and WaId ${WaId}`, ctx);

            let apiPayload: any;
            let requestRecord: any;
            if (imageUrl) {
                apiPayload = {
                    userLanguage: preferredLanguage,
                    screenshotUrl: imageUrl,
                };
            } else {
                apiPayload = {
                    message: content,
                    userTags: ['from_unknown'],
                    userLanguage: preferredLanguage,
                };
            }
            requestRecord = { ...apiPayload };

            analysisRecordBase = {
                source: 'whatsapp',
                userId,
                messageId,
                request: requestRecord,
                response: { data: null, errorMessage: null, errorCode: null },
                createdAt: new Date(),
            };
            await this.analysisResultService.saveResult(analysisRecordBase);

            const response = imageUrl
                ? await axios.post(Config.fraudScreenshotAnalysisApiUrl as string, apiPayload, {
                      headers: {
                          'Content-Type': 'application/json',
                          'x-api-key': Config.apiKey,
                      },
                  })
                : await axios.post(Config.fraudAnalysisApiUrl as string, apiPayload, {
                      headers: {
                          'Content-Type': 'application/json',
                          'x-api-key': Config.apiKey,
                      },
                  });
            if (response.status !== 200) {
                logger.error(`LLM API responded with status ${response.status}`, ctx);
                await this.analysisResultService.saveResult({
                    ...analysisRecordBase,
                    response: {
                        data: null,
                        errorMessage: `LLM API responded with status ${response.status}`,
                        errorCode: 'API_ERROR',
                    },
                    createdAt: new Date(),
                });
                return;
            }

            const llmResponse = response.data;
            ctx.llmResponse = llmResponse;
            logger.log(`LLM response received for messageId ${messageId} and WaId ${WaId}`, ctx);

            await this.analysisResultService.saveResult({
                ...analysisRecordBase,
                response: {
                    data: llmResponse,
                    errorMessage: null,
                    errorCode: null,
                },
                createdAt: new Date(),
            });

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

            await this.userQuotaService.incrementUsage('whatsapp', userId);
            logger.log(`Incremented weekly quota for user ${userId}`, ctx);

            try {
                const quotaStatus = await this.userQuotaService.getQuotaStatus('whatsapp', userId);
                const quotaMessage = `📊 ${quotaStatus.remainingQuota} scans remaining this week (${quotaStatus.currentUsage}/${quotaStatus.limit} used)`;
                await this.twilioService.sendWhatsAppMessage({
                    to: WaId,
                    body: quotaMessage,
                    ctx,
                });
            } catch (error) {
                logger.error('Error showing quota status after analysis', { error, ...ctx });
            }
        } catch (error) {
            logger.error(`Error getting LLM response for messageId ${messageId} and WaId ${WaId}`, {
                error,
                ...ctx,
            });

            if (analysisRecordBase) {
                await this.analysisResultService.saveResult({
                    ...analysisRecordBase,
                    response: {
                        data: null,
                        errorMessage: (error as Error).message,
                        errorCode: 'EXCEPTION',
                    },
                    createdAt: new Date(),
                });
            }
        }
    }
}
