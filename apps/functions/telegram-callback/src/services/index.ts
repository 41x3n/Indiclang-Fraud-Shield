import { MessageService } from '../../../../../lib/db/firebase/services/message.service';
import { UserService } from '../../../../../lib/db/firebase/services/user.service';
import { TelegramImageMessageService } from './imageMessage.service';
import { TelegramInteractiveMessageService } from './interactiveMessage.service';
import { TelegramTextMessageService } from './textMessage.service';

export class TelegramCallbackService {
    private userService: UserService;
    private messageService: MessageService;
    private textMessageService: TelegramTextMessageService;
    private imageMessageService: TelegramImageMessageService;
    private interactiveMessageService: TelegramInteractiveMessageService;

    constructor() {
        this.userService = new UserService();
        this.messageService = new MessageService();
        this.textMessageService = new TelegramTextMessageService(
            this.userService,
            this.messageService,
        );
        this.imageMessageService = new TelegramImageMessageService(
            this.userService,
            this.messageService,
        );
        this.interactiveMessageService = new TelegramInteractiveMessageService(
            this.userService,
            this.messageService,
        );
    }

    getTextHandler() {
        return this.textMessageService.handleTextMessage.bind(this.textMessageService);
    }
    getImageHandler() {
        return this.imageMessageService.handleImageMessage.bind(this.imageMessageService);
    }
    getCallbackQueryHandler() {
        return this.interactiveMessageService.handleCallbackQuery.bind(
            this.interactiveMessageService,
        );
    }
}
