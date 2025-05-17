import { heuristicRules, MAX_BOOST, userTagMap } from '../../../../../lib/llm/heuristicsRules';
import { logger } from '../../../../../lib/logger';
import { HeuristicKey, HeuristicOutput, HeuristicsOptions, log_ctx } from '../../../../../types';

export class HeuristicService {
    constructor() {}

    runHeuristics({
        message,
        options,
        ctx,
    }: {
        message: string;
        options: HeuristicsOptions;
        ctx: log_ctx;
    }): HeuristicOutput {
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

        logger.info('HeuristicService.runHeuristics', ctx);

        return {
            scoreBoost: parseFloat(scoreBoost.toFixed(2)),
            heuristicReasons,
        };
    }
}
