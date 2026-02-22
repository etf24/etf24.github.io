export const features = {
    rebalancer: true,
} as const;

export type FeatureFlags = typeof features;
