import * as admin from 'firebase-admin';

import { Language } from '../../../llm/types';
import { db } from '../../config/firestore';

export type MessagingPlatform = 'whatsapp' | 'telegram';

export interface User {
    platform: MessagingPlatform; // 'whatsapp' or 'telegram'
    userId: string; // WhatsApp waid or Telegram user.id (string for uniformity)
    username?: string; // Telegram username, if available
    phoneNumber?: string; // WhatsApp or Telegram phone number, if available
    profileName?: string; // WhatsApp profileName or Telegram first_name + last_name
    isBoarded: boolean;
    isActive: boolean;
    preferredLanguage: Language;
    createdAt: FirebaseFirestore.Timestamp;
    updatedAt: FirebaseFirestore.Timestamp;
    // Weekly quota tracking
    weeklyScamAnalysisCount: number; // Current week's scam analysis count
    weeklyQuotaResetDate: FirebaseFirestore.Timestamp; // Date when weekly quota should reset
    telegramData?: {
        first_name?: string;
        last_name?: string;
        language_code?: string;
        is_bot?: boolean;
    };
    whatsappData?: {
        waid?: string;
    };
}

export class UserRepository {
    private readonly collection: FirebaseFirestore.CollectionReference;

    constructor() {
        this.collection = db.collection('users');
    }

    async create(
        user: Omit<
            User,
            | 'createdAt'
            | 'updatedAt'
            | 'isBoarded'
            | 'isActive'
            | 'preferredLanguage'
            | 'weeklyScamAnalysisCount'
            | 'weeklyQuotaResetDate'
        > &
            Partial<Pick<User, 'isBoarded' | 'isActive' | 'preferredLanguage'>>,
    ) {
        if (!user.platform || !user.userId) {
            throw new Error('platform and userId are required');
        }
        const now = admin.firestore.Timestamp.now();
        // Calculate next week's reset date (current date + 7 days)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const weeklyQuotaResetDate = admin.firestore.Timestamp.fromDate(nextWeek);

        // Remove undefined properties from the user object before saving
        const newUser: User = {
            platform: user.platform,
            userId: user.userId,
            ...(user.username !== undefined ? { username: user.username ?? '' } : {}),
            ...(user.phoneNumber !== undefined ? { phoneNumber: user.phoneNumber ?? '' } : {}),
            ...(user.profileName !== undefined ? { profileName: user.profileName ?? '' } : {}),
            isBoarded: user.isBoarded ?? false,
            isActive: user.isActive ?? true,
            preferredLanguage: user.preferredLanguage ?? Language.English,
            weeklyScamAnalysisCount: 0,
            weeklyQuotaResetDate,
            createdAt: now,
            updatedAt: now,
            ...(user.telegramData !== undefined ? { telegramData: user.telegramData } : {}),
            ...(user.whatsappData !== undefined ? { whatsappData: user.whatsappData } : {}),
        };
        await this.collection.doc(`${newUser.platform}_${newUser.userId}`).set(newUser);
        return newUser;
    }

    async getByUserId(platform: MessagingPlatform, userId: string): Promise<User | null> {
        const doc = await this.collection.doc(`${platform}_${userId}`).get();
        return doc.exists ? (doc.data() as User) : null;
    }

    async update(platform: MessagingPlatform, userId: string, data: Partial<User>) {
        const now = admin.firestore.Timestamp.now();
        await this.collection.doc(`${platform}_${userId}`).update({ ...data, updatedAt: now });
    }

    async delete(platform: MessagingPlatform, userId: string) {
        const now = admin.firestore.Timestamp.now();
        await this.collection
            .doc(`${platform}_${userId}`)
            .update({ isActive: false, updatedAt: now });
    }
}
