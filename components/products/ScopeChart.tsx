'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts';
import { GhgEmission, GhgScope } from '@/lib/types';
import {
  ALL_MONTHS_2025,
  SCOPE_COLORS,
  SCOPE_LABEL,
  formatKgCO2e,
  sumEmissions,
} from '@/lib/utils/chartHelpers';

const SCOPE_STAGE_DESCRIPTION: Record<GhgScope, string> = {
  scope1: '데이터 없음',
  scope2: '제조 단계 (전기)',
  scope3: '원료조달 + 운송유통',
};

const SCOPES: GhgScope[] = ['scope1', 'scope2', 'scope3'];

type ScopeChartProps = {
  emissions: GhgEmission[];
  startMonth: string;
  endMonth: string;
};

export default function ScopeChart({
  emissions,
  startMonth,
  endMonth,
}: ScopeChartProps) {
  const donutData = useMemo(() => {
    return SCOPES.map((scope) => ({
      scope,
      label: SCOPE_LABEL[scope],
      stages: SCOPE_STAGE_DESCRIPTION[scope],
      value: sumEmissions(emissions.filter((e) => e.scope === scope)),
      color: SCOPE_COLORS[scope],
    }));
  }, [emissions]);

  const monthlyData = useMemo(() => {
    const months = ALL_MONTHS_2025.filter(
      (m) => m >= startMonth && m <= endMonth,
    );
    return months.map((month) => {
      const monthly = emissions.filter((e) => e.yearMonth === month);
      return {
        month,
        scope1: 0,
        scope2: sumEmissions(monthly.filter((e) => e.scope === 'scope2')),
        scope3: sumEmissions(monthly.filter((e) => e.scope === 'scope3')),
      };
    });
  }, [emissions, startMonth, endMonth]);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-zinc-900">GHG Scope별 배출량</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Scope 1/2/3 비중 + 월별 추이 (LCA 단계 함께 표시)
      </p>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-zinc-700">Scope 비중</p>
          <div className="mt-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData.filter((d) => d.value > 0)}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {donutData
                    .filter((d) => d.value > 0)
                    .map((entry) => (
                      <Cell key={entry.scope} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip content={DonutTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1 text-xs">
            {donutData.map((d) => (
              <li key={d.scope} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-sm"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="font-medium text-zinc-900">{d.label}</span>
                  <span className="text-zinc-500">— {d.stages}</span>
                </span>
                <span className="text-zinc-600">{formatKgCO2e(d.value)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium text-zinc-700">월별 Scope 추이</p>
          <div className="mt-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={MonthlyTooltip} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="scope2"
                  name="Scope 2"
                  stackId="s"
                  fill={SCOPE_COLORS.scope2}
                />
                <Bar
                  dataKey="scope3"
                  name="Scope 3"
                  stackId="s"
                  fill={SCOPE_COLORS.scope3}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function DonutTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const data = (item.payload ?? {}) as {
    label?: string;
    stages?: string;
    value?: number;
  };
  return (
    <div className="rounded border border-zinc-200 bg-white px-3 py-2 text-xs shadow">
      <p className="font-semibold text-zinc-900">
        {data.label} — {data.stages}
      </p>
      <p className="text-zinc-700">{formatKgCO2e(data.value ?? 0)}</p>
    </div>
  );
}

function MonthlyTooltip({
  active,
  payload,
  label,
}: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded border border-zinc-200 bg-white px-3 py-2 text-xs shadow">
      <p className="font-semibold text-zinc-900">{label}</p>
      {payload.map((item) => {
        const scopeName = String(item.name ?? '');
        const stages =
          scopeName === 'Scope 2'
            ? '제조 단계 (전기)'
            : scopeName === 'Scope 3'
              ? '원료조달 + 운송유통'
              : '';
        const numeric =
          typeof item.value === 'number' ? item.value : Number(item.value ?? 0);
        return (
          <p key={scopeName} style={{ color: item.color }}>
            {scopeName}
            {stages ? ` — ${stages}` : ''}: {formatKgCO2e(numeric)}
          </p>
        );
      })}
    </div>
  );
}
