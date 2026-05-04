import { GhgEmission, GhgScope, LcaStage } from '@/lib/types';

export const ACTIVITY_COLORS: Record<string, string> = {
  전기: '#3b82f6',
  원소재: '#f59e0b',
  운송: '#10b981',
};

export const SCOPE_COLORS: Record<GhgScope, string> = {
  scope1: '#9ca3af',
  scope2: '#3b82f6',
  scope3: '#6366f1',
};

export const STAGE_COLORS: Record<LcaStage, string> = {
  원료조달: '#f59e0b',
  제조: '#3b82f6',
  운송유통: '#10b981',
  사용: '#d1d5db',
  폐기: '#d1d5db',
};

export const SCOPE_LABEL: Record<GhgScope, string> = {
  scope1: 'Scope 1',
  scope2: 'Scope 2',
  scope3: 'Scope 3',
};

export const STAGE_TO_SCOPE: Record<LcaStage, GhgScope | null> = {
  원료조달: 'scope3',
  제조: 'scope2',
  운송유통: 'scope3',
  사용: null,
  폐기: null,
};

export const ALL_MONTHS_2025 = [
  '2025-01',
  '2025-02',
  '2025-03',
  '2025-04',
  '2025-05',
  '2025-06',
  '2025-07',
  '2025-08',
] as const;

export function groupByMonth(emissions: GhgEmission[]): Record<string, GhgEmission[]> {
  return emissions.reduce<Record<string, GhgEmission[]>>((acc, e) => {
    (acc[e.yearMonth] ??= []).push(e);
    return acc;
  }, {});
}

export function sumEmissions(emissions: GhgEmission[]): number {
  return emissions.reduce((sum, e) => sum + e.emissions, 0);
}

export function formatKgCO2e(value: number): string {
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} kgCO₂e`;
}
