import { Message, MessageRepository, MessagingPlatform } from '../repositories/message.repository';

export class MessageService {
    private readonly messageRepository: MessageRepository;

    constructor() {
        this.messageRepository = new MessageRepository();
    }

    async saveMessage({
        platform,
        userId,
        content,
        type,
        imageUrl,
        messageId,
        telegramData,
        whatsappData,
        chatId,
    }: {
        platform: MessagingPlatform;
        userId: string;
        content: string;
        type: Message['type'];
        imageUrl?: string;
        messageId: string;
        telegramData?: Message['telegramData'];
        whatsappData?: Message['whatsappData'];
        chatId?: string;
    }) {
        return this.messageRepository.create({
            platform,
            userId,
            content,
            type,
            ...(imageUrl ? { imageUrl } : {}),
            messageId,
            ...(telegramData ? { telegramData } : {}),
            ...(whatsappData ? { whatsappData } : {}),
            ...(chatId ? { chatId } : {}),
        });
    }

    async getMessagesForUser(platform: MessagingPlatform, userId: string) {
        return this.messageRepository.getMessagesByUserId(platform, userId);
    }

    async getMessageByMessageId(platform: MessagingPlatform, messageId: string) {
        return this.messageRepository.getMessageByMessageId(platform, messageId);
    }
}
