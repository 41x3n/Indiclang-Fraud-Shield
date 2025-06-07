import * as admin from 'firebase-admin';

import { db } from '../../config/firestore';

export type MessagingPlatform = 'whatsapp' | 'telegram';
export type MessageType = 'text' | 'image' | 'audio' | 'video' | 'document' | 'other';

export interface Message {
    platform: MessagingPlatform; // 'whatsapp' or 'telegram'
    messageId: string; // WhatsApp MessageSid or Telegram message_id (string for uniformity)
    userId: string; // WhatsApp waid or Telegram user.id
    chatId?: string; // Telegram chat.id, if relevant
    content: string;
    type: MessageType;
    imageUrl?: string;
    receivedAt: FirebaseFirestore.Timestamp;
    telegramData?: {
        message_id?: number;
        chat?: {
            id: number | string;
            type: string;
            title?: string;
            username?: string;
        };
        from?: {
            id: number | string;
            is_bot?: boolean;
            first_name?: string;
            last_name?: string;
            username?: string;
            language_code?: string;
        };
    };
    whatsappData?: {
        waid?: string;
        messageSid?: string;
    };
}

export class MessageRepository {
    private readonly collection: FirebaseFirestore.CollectionReference;

    constructor() {
        this.collection = db.collection('messages');
    }

    async create(message: Omit<Message, 'receivedAt'>) {
        const now = admin.firestore.Timestamp.now();
        await this.collection.add({ ...message, receivedAt: now });
        return { ...message, receivedAt: now };
    }

    async getMessagesByUserId(platform: MessagingPlatform, userId: string) {
        const snapshot = await this.collection
            .where('platform', '==', platform)
            .where('userId', '==', userId)
            .orderBy('receivedAt', 'desc')
            .get();
        return snapshot.docs.map((doc) => ({ ...doc.data() })) as Message[];
    }

    async getMessageByMessageId(platform: MessagingPlatform, messageId: string) {
        const snapshot = await this.collection
            .where('platform', '==', platform)
            .where('messageId', '==', messageId)
            .limit(1)
            .get();
        if (snapshot.empty) {
            return null;
        }
        const doc = snapshot.docs[0];
        return { ...doc.data() } as Message;
    }
}
