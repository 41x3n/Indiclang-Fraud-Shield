import { MessageService } from '../../../../../lib/db/firebase/services/message.service';
import { UserService } from '../../../../../lib/db/firebase/services/user.service';
import { UserQuotaService } from '../../../../../lib/db/firebase/services/userQuota.service';
import { logger } from '../../../../../lib/logger';
import { log_ctx } from '../../../../../types/index';
import { TelegramCommandService } from './commandHandler.service';
import { TelegramMessageProcessingService } from './messageProcessing.service';
import { TelegramOnboardingService } from './onboarding.service';

export class TelegramTextMessageService {
    private commandService: TelegramCommandService;
    private onboardingService: TelegramOnboardingService;
    private messageProcessingService: TelegramMessageProcessingService;

    constructor(
        private userService: UserService,
        private messageService: MessageService,
        private userQuotaService: UserQuotaService,
    ) {
        this.commandService = new TelegramCommandService(userQuotaService);
        this.onboardingService = new TelegramOnboardingService(userService);
        this.messageProcessingService = new TelegramMessageProcessingService(messageService);
    }

    async handleTextMessage(ctx: any): Promise<void> {
        const telegramId = ctx.from?.id?.toString();
        const profileName = ctx.from?.username || ctx.from?.first_name || telegramId;
        const text = ctx.message?.text;

        const l_ctx: log_ctx = {
            telegramId,
            profileName,
            text,
        };

        if (!telegramId || !text) {
            logger.error('Invalid Telegram text message payload', l_ctx);
            return;
        }

        let user = await this.userService.createUserIfNotExists({
            platform: 'telegram',
            userId: telegramId,
            profileName,
            telegramData: {
                first_name: ctx.from?.first_name,
                last_name: ctx.from?.last_name,
                language_code: ctx.from?.language_code,
                is_bot: ctx.from?.is_bot,
            },
        });

        const isBoarded = this.userService.hasTheUserBeenBoarded(user);
        if (!isBoarded) {
            await this.onboardingService.handleOnboarding(ctx, telegramId, l_ctx);
            return;
        }

        const isCommand = await this.commandService.handleCommand(text, ctx, telegramId, l_ctx);
        if (isCommand) {
            return;
        }

        await this.messageProcessingService.processRegularMessage(
            ctx,
            telegramId,
            text,
            profileName,
            l_ctx,
        );
    }
}
