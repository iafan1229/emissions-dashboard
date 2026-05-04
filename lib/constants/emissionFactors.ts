import { EmissionFactor } from '@/lib/types';

export const EMISSION_FACTORS: EmissionFactor[] = [
  {
    source: '한국전력',
    factor: 0.456,
    unit: 'kgCO₂e / kWh',
    scope: 'scope2',
    lcaStage: '제조',
    version: 1,
    effectiveDate: '2025-01-01',
  },
  {
    source: '플라스틱 1',
    factor: 2.3,
    unit: 'kgCO₂e / kg',
    scope: 'scope3',
    lcaStage: '원료조달',
    version: 1,
    effectiveDate: '2025-01-01',
  },
  {
    source: '플라스틱 2',
    factor: 3.2,
    unit: 'kgCO₂e / kg',
    scope: 'scope3',
    lcaStage: '원료조달',
    version: 1,
    effectiveDate: '2025-01-01',
  },
  {
    source: '트럭',
    factor: 3.5,
    unit: 'kgCO₂e / ton-km',
    scope: 'scope3',
    lcaStage: '운송유통',
    version: 1,
    effectiveDate: '2025-01-01',
  },
];
