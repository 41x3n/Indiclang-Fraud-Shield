import * as admin from 'firebase-admin';

import { db } from '../../config/firestore';

export interface AnalysisResultRecord {
    source: 'whatsapp' | 'telegram';
    userId: string;
    messageId: string;
    request: {
        // For message-based analysis
        message?: string;
        userTags?: string[];
        userLanguage?: string;
        // For screenshot-based analysis
        screenshotUrl?: string;
    };
    response: {
        data: Record<string, any> | null;
        errorMessage: string | null;
        errorCode: string | null;
    };
    createdAt: FirebaseFirestore.Timestamp;
    updatedAt?: FirebaseFirestore.Timestamp;
}

export class AnalysisResultRepository {
    private readonly collection: FirebaseFirestore.CollectionReference;

    constructor() {
        this.collection = db.collection('analysisResults');
    }

    async create(record: Omit<AnalysisResultRecord, 'createdAt' | 'updatedAt'>) {
        const now = admin.firestore.Timestamp.now();
        // Remove undefined properties from the record before saving
        const newRecord = {
            ...record,
            createdAt: now,
            updatedAt: now,
        };
        await this.collection.add(newRecord);
        return newRecord;
    }

    async update(
        id: string,
        updates: Partial<Omit<AnalysisResultRecord, 'createdAt' | 'updatedAt'>>,
    ) {
        const now = admin.firestore.Timestamp.now();
        const updatedRecord = {
            ...updates,
            updatedAt: now,
        };
        await this.collection.doc(id).update(updatedRecord);
        return updatedRecord;
    }
}
