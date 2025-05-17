import { heuristicRules, MAX_BOOST, userTagMap } from '../../../../../lib/llm/heuristicsRules';
import { HeuristicKey, HeuristicOutput, HeuristicsOptions } from '../../../../../types';

export class HeuristicService {
    constructor() {}

    runHeuristics(message: string, options: HeuristicsOptions = {}): HeuristicOutput {
        let scoreBoost = 0;
        const heuristicReasons: HeuristicKey[] = [];

        const lowerMsg = message.toLowerCase();

        for (const rule of heuristicRules) {
            if (rule.test(message, lowerMsg)) {
                scoreBoost += rule.boost;
                heuristicReasons.push(rule.name);
            }
        }

        options.userTags?.forEach((tag) => {
            const tagInfo = userTagMap[tag];
            if (tagInfo && !heuristicReasons.includes(tag)) {
                scoreBoost += tagInfo.boost;
                heuristicReasons.push(tag);
            }
        });

        scoreBoost = Math.min(scoreBoost, MAX_BOOST);

        return {
            scoreBoost: parseFloat(scoreBoost.toFixed(2)),
            heuristicReasons,
        };
    }
}
