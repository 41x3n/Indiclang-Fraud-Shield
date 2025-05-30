import { Message, MessageRepository } from '../repositories/message.repository';

export class MessageService {
    private readonly messageRepository: MessageRepository;

    constructor() {
        this.messageRepository = new MessageRepository();
    }

    async saveMessage({
        waid,
        content,
        type,
        imageUrl,
        messageSid,
    }: {
        waid: string;
        content: string;
        type: Message['type'];
        imageUrl?: string;
        messageSid: string;
    }) {
        return this.messageRepository.create({
            waid,
            content,
            type,
            ...(imageUrl ? { imageUrl } : {}),
            messageSid,
        });
    }

    async getMessagesForUser(waid: string) {
        return this.messageRepository.getMessagesByWaid(waid);
    }

    async getMessageBySid(messageSid: string) {
        return this.messageRepository.getMessageBySid(messageSid);
    }
}
