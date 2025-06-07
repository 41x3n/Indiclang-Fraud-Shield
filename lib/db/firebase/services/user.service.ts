import { Language } from '../../../llm/types';
import { MessagingPlatform, User, UserRepository } from '../repositories/user.repository';

export class UserService {
    private readonly userRepository: UserRepository;

    constructor() {
        this.userRepository = new UserRepository();
    }

    async createUserIfNotExists({
        platform,
        userId,
        profileName,
        username,
        phoneNumber,
        telegramData,
        whatsappData,
    }: {
        platform: MessagingPlatform;
        userId: string;
        profileName?: string;
        username?: string;
        phoneNumber?: string;
        telegramData?: User['telegramData'];
        whatsappData?: User['whatsappData'];
    }) {
        const existingUser = await this.userRepository.getByUserId(platform, userId);
        if (existingUser) {
            return existingUser;
        }
        return this.userRepository.create({
            platform,
            userId,
            profileName,
            username,
            phoneNumber,
            telegramData,
            whatsappData,
        });
    }

    async getUserByUserId(platform: MessagingPlatform, userId: string) {
        return this.userRepository.getByUserId(platform, userId);
    }

    async updateUser(platform: MessagingPlatform, userId: string, data: Partial<User>) {
        return this.userRepository.update(platform, userId, data);
    }

    async deleteUser(platform: MessagingPlatform, userId: string) {
        return this.userRepository.delete(platform, userId);
    }

    hasTheUserBeenBoarded(user: User): boolean {
        return user.isBoarded;
    }

    async setPreferredLanguage(platform: MessagingPlatform, userId: string, language: Language) {
        const user = await this.getUserByUserId(platform, userId);
        if (!user) {
            throw new Error(`User with userId ${userId} on platform ${platform} not found`);
        }
        await this.updateUser(platform, userId, { preferredLanguage: language });
    }
}
