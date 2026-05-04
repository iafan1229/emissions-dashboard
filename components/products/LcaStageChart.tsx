'use client';

import { useMemo } from 'react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { GhgEmission, LcaStage } from '@/lib/types';
import {
  STAGE_COLORS,
  STAGE_TO_SCOPE,
  SCOPE_LABEL,
  formatKgCO2e,
  sumEmissions,
} from '@/lib/utils/chartHelpers';

const ACTIVE_STAGES: LcaStage[] = ['원료조달', '제조', '운송유통'];
const NO_DATA_STAGES: LcaStage[] = ['사용', '폐기'];

type LcaStageChartProps = {
  emissions: GhgEmission[];
};

export default function LcaStageChart({ emissions }: LcaStageChartProps) {
  const data = useMemo(() => {
    const total = sumEmissions(emissions);
    return ACTIVE_STAGES.map((stage) => {
      const stageEmissions = emissions.filter((e) => e.lcaStage === stage);
      const value = sumEmissions(stageEmissions);
      const scope = STAGE_TO_SCOPE[stage];
      return {
        stage,
        scope,
        scopeLabel: scope ? SCOPE_LABEL[scope] : '',
        value,
        pct: total > 0 ? (value / total) * 100 : 0,
        color: STAGE_COLORS[stage],
      };
    });
  }, [emissions]);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-zinc-900">전과정 단계별 배출량</h3>
      <p className="mt-1 text-xs text-zinc-500">LCA 단계 + GHG Scope 매핑</p>

      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="stage"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={entry.stage} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, item) => {
                const numeric = typeof value === 'number' ? value : Number(value);
                const payload = (item as { payload?: { stage?: string; scopeLabel?: string } }).payload ?? {};
                return [
                  formatKgCO2e(numeric),
                  `${payload.stage ?? ''} (${payload.scopeLabel ?? ''})`,
                ];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-4 space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.stage} className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: d.color }}
              />
              <span className="font-medium text-zinc-900">{d.stage}</span>
              <span className="text-xs text-zinc-500">({d.scopeLabel})</span>
            </span>
            <span className="text-zinc-600">
              {formatKgCO2e(d.value)} ({d.pct.toFixed(1)}%)
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t border-zinc-100 pt-3">
        <p className="text-xs text-zinc-500">
          {NO_DATA_STAGES.join(' / ')} 단계: <span className="text-zinc-400">데이터 없음</span>
        </p>
      </div>
    </div>
  );
}
