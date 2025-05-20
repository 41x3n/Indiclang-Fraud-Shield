import { HeuristicKey, HeuristicRule, HeuristicRuleBase } from '../../types/heuristic';

export const baseHeuristicMap: Record<HeuristicKey, Partial<HeuristicRuleBase>> = {
    [HeuristicKey.MONEY]: { boost: 0.1, reason: 'May involve money', type: 'rule' },
    [HeuristicKey.UPI]: { boost: 0.2, reason: 'UPI detected', type: 'rule' },
    [HeuristicKey.SUSPICIOUS_LINK]: {
        boost: 0.2,
        reason: 'Suspicious link or file detected',
        type: 'rule',
    },
    [HeuristicKey.PRESSURE]: { boost: 0.1, reason: 'Urgent tone detected', type: 'rule' },
    [HeuristicKey.FORMATTING]: { boost: 0.1, reason: 'Suspicious formatting', type: 'rule' },
    [HeuristicKey.FROM_UNKNOWN]: { boost: 0.1, reason: 'From unknown sender', type: 'tag' },
    [HeuristicKey.FORWARDED_MANY_TIMES]: {
        boost: 0.05,
        reason: 'Forwarded many times',
        type: 'tag',
    },
    [HeuristicKey.ATTACHED_FILE]: { boost: 0.2, reason: 'File attached', type: 'tag' },
};

const BARE_SUSPICIOUS_DOMAINS = ['bit.ly', 'tinyurl', 't.co'];
const PRESSURE_KEYWORDS = [
    'urgent',
    'immediately',
    'kyc update',
    'account blocked',
    'last warning',
    'अंतिम चेतावनी',
    'खाता बंद',
];

export const heuristicRules: HeuristicRule[] = Object.entries(baseHeuristicMap)
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([_, val]) => val.type === 'rule')
    .map(([key, base]) => {
        const name = key as HeuristicKey;
        const { boost, reason, type } = base;
        if (boost === undefined || reason === undefined || type === undefined) {
            throw new Error(`Incomplete heuristic rule base for key: ${key}`);
        }
        switch (name) {
            case HeuristicKey.MONEY:
                return {
                    name,
                    boost,
                    reason,
                    type,
                    test: (message, lowerMsg) => /(?:\u20B9|rs\.?|rupees)/i.test(lowerMsg),
                };
            case HeuristicKey.UPI:
                return {
                    name,
                    boost,
                    reason,
                    type,
                    test: (message) => /\b[a-zA-Z0-9._%+-]{2,256}@[a-zA-Z]{2,64}\b/.test(message),
                };
            case HeuristicKey.SUSPICIOUS_LINK:
                return {
                    name,
                    boost,
                    reason,
                    type,
                    test: (message) => {
                        const hasUrl = /https?:\/\//i.test(message);
                        const domainMatch = BARE_SUSPICIOUS_DOMAINS.some((domain) =>
                            message.toLowerCase().includes(domain),
                        );
                        const extMatch = /\.(apk|exe)/i.test(message);
                        return hasUrl || domainMatch || extMatch;
                    },
                };
            case HeuristicKey.PRESSURE:
                return {
                    name,
                    boost,
                    reason,
                    type,
                    test: (message, lowerMsg) =>
                        PRESSURE_KEYWORDS.some((word) => lowerMsg.includes(word)),
                };
            case HeuristicKey.FORMATTING:
                return {
                    name,
                    boost,
                    reason,
                    type,
                    test: (message) => {
                        const exclamations = (message.match(/!/g) || []).length;
                        return (
                            message === message.toUpperCase() ||
                            exclamations > 3 ||
                            message.length < 10 ||
                            message.length > 500
                        );
                    },
                };
            default:
                throw new Error(`No rule implemented for HeuristicKey: ${key}`);
        }
    });

export const userTagMap: Record<HeuristicKey, HeuristicRuleBase> = Object.entries(baseHeuristicMap)
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([_, val]) => val.type === 'tag')
    .reduce(
        (acc, [key, val]) => {
            const { boost, reason, type } = val;
            if (boost === undefined || reason === undefined || type === undefined) {
                throw new Error(`Incomplete heuristic rule base for tag key: ${key}`);
            }
            acc[key as HeuristicKey] = { boost, reason, type };
            return acc;
        },
        {} as Record<HeuristicKey, HeuristicRuleBase>,
    );

export const MAX_BOOST = 0.4;
