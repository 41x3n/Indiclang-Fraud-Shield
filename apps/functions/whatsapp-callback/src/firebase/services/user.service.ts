import { Language } from '../../../../../../lib/llm/types';
import { User, UserRepository } from '../repositories/user.repository';

export class UserService {
    private readonly userRepository: UserRepository;

    constructor() {
        this.userRepository = new UserRepository();
    }

    async createUserIfNotExists(waid: string, profileName: string) {
        const existingUser = await this.userRepository.getByWaid(waid);
        if (existingUser) {
            return existingUser;
        }
        return this.userRepository.create({ waid, profileName });
    }
    async getUserByWaid(waid: string) {
        return this.userRepository.getByWaid(waid);
    }

    async updateUser(waid: string, data: Partial<User>) {
        return this.userRepository.update(waid, data);
    }

    async deleteUser(waid: string) {
        return this.userRepository.delete(waid);
    }

    hasTheUserBeenBoarded(user: User): boolean {
        return user.isBoarded;
    }

    async setPreferredLanguage(waid: string, language: Language) {
        const user = await this.getUserByWaid(waid);
        if (!user) {
            throw new Error(`User with waid ${waid} not found`);
        }
        await this.updateUser(waid, { preferredLanguage: language });
    }
}
