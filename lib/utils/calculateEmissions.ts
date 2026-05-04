import { ActivityData, GhgEmission } from '@/lib/types';
import { EMISSION_FACTORS } from '@/lib/constants/emissionFactors';

export function calculateEmissions(activities: ActivityData[]): GhgEmission[] {
  return activities.map((activity) => {
    const factor = EMISSION_FACTORS.find((f) => f.source === activity.description);
    if (!factor) throw new Error(`배출계수 없음: ${activity.description}`);

    return {
      yearMonth: activity.date.slice(0, 7),
      source: activity.description,
      emissions: activity.amount * factor.factor,
      scope: factor.scope,
      lcaStage: factor.lcaStage,
      productId: activity.productId,
      companyId: activity.companyId,
    };
  });
}
