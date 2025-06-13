import * as admin from 'firebase-admin';

import { logger } from '../../../logger';
import { MessagingPlatform } from '../repositories/user.repository';
import { UserService } from './user.service';

export class UserQuotaService {
    private readonly userService: UserService;
    private readonly WEEKLY_SCAM_ANALYSIS_LIMIT = 10;

    constructor() {
        this.userService = new UserService();
    }

    async checkQuotaAndUpdate(
        platform: MessagingPlatform,
        userId: string,
    ): Promise<{
        hasQuota: boolean;
        remainingQuota: number;
        nextResetDate: Date;
    }> {
        const user = await this.userService.getUserByUserId(platform, userId);
        if (!user) {
            throw new Error(`User with userId ${userId} on platform ${platform} not found`);
        }

        const now = new Date();
        const resetDate = user.weeklyQuotaResetDate.toDate();

        if (now >= resetDate) {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);

            await this.userService.updateUser(platform, userId, {
                weeklyScamAnalysisCount: 0,
                weeklyQuotaResetDate: admin.firestore.Timestamp.fromDate(nextWeek),
            });

            return {
                hasQuota: true,
                remainingQuota: this.WEEKLY_SCAM_ANALYSIS_LIMIT,
                nextResetDate: nextWeek,
            };
        }

        const currentCount = user.weeklyScamAnalysisCount || 0;
        const hasQuota = currentCount < this.WEEKLY_SCAM_ANALYSIS_LIMIT;
        const remainingQuota = Math.max(0, this.WEEKLY_SCAM_ANALYSIS_LIMIT - currentCount);

        return {
            hasQuota,
            remainingQuota,
            nextResetDate: resetDate,
        };
    }

    async incrementUsage(platform: MessagingPlatform, userId: string): Promise<void> {
        const user = await this.userService.getUserByUserId(platform, userId);
        if (!user) {
            throw new Error(`User with userId ${userId} on platform ${platform} not found`);
        }

        const currentCount = user.weeklyScamAnalysisCount || 0;
        await this.userService.updateUser(platform, userId, {
            weeklyScamAnalysisCount: currentCount + 1,
        });
    }

    async getQuotaStatus(
        platform: MessagingPlatform,
        userId: string,
    ): Promise<{
        currentUsage: number;
        limit: number;
        remainingQuota: number;
        nextResetDate: Date;
        hasQuota: boolean;
    }> {
        const user = await this.userService.getUserByUserId(platform, userId);
        if (!user) {
            throw new Error(`User with userId ${userId} on platform ${platform} not found`);
        }

        const currentUsage = user.weeklyScamAnalysisCount || 0;
        const remainingQuota = Math.max(0, this.WEEKLY_SCAM_ANALYSIS_LIMIT - currentUsage);
        const hasQuota = currentUsage < this.WEEKLY_SCAM_ANALYSIS_LIMIT;
        const nextResetDate = user.weeklyQuotaResetDate.toDate();

        return {
            currentUsage,
            limit: this.WEEKLY_SCAM_ANALYSIS_LIMIT,
            remainingQuota,
            nextResetDate,
            hasQuota,
        };
    }

    formatQuotaMessage(quotaStatus: {
        currentUsage: number;
        limit: number;
        remainingQuota: number;
        nextResetDate: Date;
        hasQuota: boolean;
    }): string {
        const { currentUsage, limit, remainingQuota, nextResetDate } = quotaStatus;

        if (remainingQuota === 0) {
            const resetDateStr = nextResetDate.toLocaleDateString();
            return `🚫 Weekly limit reached! You've used all ${limit} scam analyses this week. Your quota resets on ${resetDateStr}. Want unlimited access? Consider upgrading!`;
        }

        if (remainingQuota <= 2) {
            return `⚠️ You have ${remainingQuota} scam analysis${remainingQuota === 1 ? '' : 'es'} remaining this week (${currentUsage}/${limit} used).`;
        }

        return `✅ You have ${remainingQuota} scam analyses remaining this week (${currentUsage}/${limit} used).`;
    }

    async initializeQuotaForExistingUser(
        platform: MessagingPlatform,
        userId: string,
    ): Promise<void> {
        const user = await this.userService.getUserByUserId(platform, userId);
        if (!user) {
            throw new Error(`User with userId ${userId} on platform ${platform} not found`);
        }

        if (user.weeklyScamAnalysisCount !== undefined && user.weeklyQuotaResetDate !== undefined) {
            return; // Already initialized
        }

        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        await this.userService.updateUser(platform, userId, {
            weeklyScamAnalysisCount: 0,
            weeklyQuotaResetDate: admin.firestore.Timestamp.fromDate(nextWeek),
        });

        logger.info(`Initialized quota fields for existing user ${userId} on platform ${platform}`);
    }
}
