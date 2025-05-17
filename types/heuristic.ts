export enum HeuristicKey {
    MONEY = 'money',
    UPI = 'upi',
    SUSPICIOUS_LINK = 'suspicious_link',
    PRESSURE = 'pressure',
    FORMATTING = 'formatting',
    FROM_UNKNOWN = 'from_unknown',
    FORWARDED_MANY_TIMES = 'forwarded_many_times',
    ATTACHED_FILE = 'attached_file',
}

export type HeuristicType = 'rule' | 'tag';

export interface HeuristicRuleBase {
    boost: number;
    reason: string;
    type: HeuristicType;
}

export interface HeuristicRule extends HeuristicRuleBase {
    name: HeuristicKey;
    test: (message: string, lowerMsg: string) => boolean;
}

export interface HeuristicOutput {
    scoreBoost: number;
    heuristicReasons: HeuristicKey[];
}

export interface HeuristicsOptions {
    userTags?: HeuristicKey[];
}
