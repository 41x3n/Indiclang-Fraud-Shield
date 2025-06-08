import {
    AnalysisResultRecord,
    AnalysisResultRepository,
} from '../repositories/analysisResult.repository';

export class AnalysisResultService {
    private readonly analysisResultRepository: AnalysisResultRepository;

    constructor() {
        this.analysisResultRepository = new AnalysisResultRepository();
    }

    async saveResult(record: AnalysisResultRecord): Promise<void> {
        await this.analysisResultRepository.create(record);
    }

    async updateResult(
        id: string,
        updates: Partial<Omit<AnalysisResultRecord, 'createdAt' | 'updatedAt'>>,
    ): Promise<void> {
        await this.analysisResultRepository.update(id, updates);
    }
}
