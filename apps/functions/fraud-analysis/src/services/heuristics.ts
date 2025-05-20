import { heuristicRules, MAX_BOOST, userTagMap } from '../../../../../lib/llm/heuristicsRules';
import { logger } from '../../../../../lib/logger';
import { HeuristicKey, HeuristicOutput, HeuristicsOptions, log_ctx } from '../../../../../types';
import { HeuristicEngine } from './heuristicEngine';

export class HeuristicService {
    private engine: HeuristicEngine;
    constructor() {
        this.engine = new HeuristicEngine({
            rules: heuristicRules,
            userTagMap,
            maxBoost: MAX_BOOST,
        });
    }

    runHeuristics({
        message,
        options,
        ctx,
    }: {
        message: string;
        options: HeuristicsOptions;
        ctx: log_ctx;
    }): HeuristicOutput {
        const { scoreBoost, heuristicReasons } = this.engine.run(message, options.userTags);
        logger.info('HeuristicService.runHeuristics', ctx);

        return { scoreBoost, heuristicReasons: heuristicReasons as HeuristicKey[] };
    }
}
