import * as admin from 'firebase-admin';

import { db } from '../../config/firestore';

export interface Message {
    messageSid: string; // Twilio MessageSid
    waid: string; // WhatsApp ID of the user
    content: string;
    type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'other';
    imageUrl?: string; // Optional image link
    receivedAt: FirebaseFirestore.Timestamp;
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

    async getMessagesByWaid(waid: string) {
        const snapshot = await this.collection
            .where('waid', '==', waid)
            .orderBy('receivedAt', 'desc')
            .get();
        return snapshot.docs.map((doc) => ({ ...doc.data() })) as Message[];
    }

    async getMessageBySid(messageSid: string) {
        const snapshot = await this.collection.where('messageSid', '==', messageSid).limit(1).get();
        if (snapshot.empty) {
            return null;
        }
        const doc = snapshot.docs[0];
        return { ...doc.data() } as Message;
    }
}
