import * as admin from 'firebase-admin';

import { Language } from '../../../.././../../lib/llm/types';
import { db } from '../../config/firestore';

export interface User {
    waid: string;
    profileName: string;
    isBoarded: boolean;
    isActive: boolean;
    preferredLanguage: Language;
    createdAt: FirebaseFirestore.Timestamp;
    updatedAt: FirebaseFirestore.Timestamp;
}

export class UserRepository {
    private readonly collection: FirebaseFirestore.CollectionReference;

    constructor() {
        this.collection = db.collection('users');
    }
    async create(
        user: Omit<
            User,
            'createdAt' | 'updatedAt' | 'isBoarded' | 'isActive' | 'preferredLanguage'
        > &
            Partial<Pick<User, 'isBoarded' | 'isActive' | 'preferredLanguage'>>,
    ) {
        if (!user.waid || !user.profileName) {
            throw new Error('waid and profileName are required');
        }
        const now = admin.firestore.Timestamp.now();
        const newUser: User = {
            waid: user.waid,
            profileName: user.profileName,
            isBoarded: user.isBoarded ?? false,
            isActive: user.isActive ?? true,
            preferredLanguage: Language.English, // Default to English if not provided
            createdAt: now,
            updatedAt: now,
        };
        await this.collection.doc(newUser.waid).set(newUser);
        return newUser;
    }

    async getByWaid(waid: string): Promise<User | null> {
        const doc = await this.collection.doc(waid).get();
        return doc.exists ? (doc.data() as User) : null;
    }

    async update(waid: string, data: Partial<User>) {
        const now = admin.firestore.Timestamp.now();
        await this.collection.doc(waid).update({ ...data, updatedAt: now });
    }

    async delete(waid: string) {
        const now = admin.firestore.Timestamp.now();
        await this.collection.doc(waid).update({ isActive: false, updatedAt: now });
    }
}
