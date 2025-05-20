import { HeuristicKey } from '../../../../../types';

export interface HeuristicRule {
    name: HeuristicKey;
    boost: number;
    test: (message: string, lowerMsg: string) => boolean;
}

export class HeuristicEngine {
    private rules: HeuristicRule[] = [];
    private userTagMap: Record<string, { boost: number }> = {};
    private maxBoost: number;

    constructor({
        rules,
        userTagMap,
        maxBoost,
    }: {
        rules: HeuristicRule[];
        userTagMap: Record<string, { boost: number }>;
        maxBoost: number;
    }) {
        this.rules = rules;
        this.userTagMap = userTagMap;
        this.maxBoost = maxBoost;
    }

    run(message: string, userTags?: string[]): { scoreBoost: number; heuristicReasons: string[] } {
        let scoreBoost = 0;
        const heuristicReasons: string[] = [];
        const lowerMsg = message.toLowerCase();
        for (const rule of this.rules) {
            if (rule.test(message, lowerMsg)) {
                scoreBoost += rule.boost;
                heuristicReasons.push(rule.name);
            }
        }
        userTags?.forEach((tag) => {
            const tagInfo = this.userTagMap[tag];
            if (tagInfo && !heuristicReasons.includes(tag)) {
                scoreBoost += tagInfo.boost;
                heuristicReasons.push(tag);
            }
        });
        scoreBoost = Math.min(scoreBoost, this.maxBoost);
        return { scoreBoost: parseFloat(scoreBoost.toFixed(2)), heuristicReasons };
    }
}
