'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Company, GhgEmission } from '@/lib/types';
import {
  SCOPE_COLORS,
  formatKgCO2e,
  sumEmissions,
} from '@/lib/utils/chartHelpers';

type CompanyChartProps = {
  companies: Company[];
  emissions: GhgEmission[];
};

export default function CompanyChart({
  companies,
  emissions,
}: CompanyChartProps) {
  const data = useMemo(() => {
    return companies.map((company) => {
      const companyEmissions = emissions.filter(
        (e) => e.companyId === company.id,
      );
      return {
        name: company.name,
        country: company.country,
        scope1: sumEmissions(companyEmissions.filter((e) => e.scope === 'scope1')),
        scope2: sumEmissions(companyEmissions.filter((e) => e.scope === 'scope2')),
        scope3: sumEmissions(companyEmissions.filter((e) => e.scope === 'scope3')),
        total: sumEmissions(companyEmissions),
      };
    });
  }, [companies, emissions]);

  const hasData = data.some((d) => d.total > 0);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-zinc-900">회사별 배출량 비교</h3>
      <p className="mt-1 text-xs text-zinc-500">
        해당 제품의 회사별 Scope 1/2/3 누적 합 (kgCO₂e, 선택 기간 기준)
      </p>
      <p className="mt-1 text-xs text-zinc-400">
        Scope 1 은 데이터 없음 → 0 으로 표시 (GHG 프레임워크 유지)
      </p>

      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12 }}
              width={100}
            />
            <Tooltip
              formatter={(value) =>
                formatKgCO2e(typeof value === 'number' ? value : Number(value))
              }
              labelStyle={{ fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar
              dataKey="scope1"
              name="Scope 1"
              stackId="c"
              fill={SCOPE_COLORS.scope1}
            />
            <Bar
              dataKey="scope2"
              name="Scope 2"
              stackId="c"
              fill={SCOPE_COLORS.scope2}
            />
            <Bar
              dataKey="scope3"
              name="Scope 3"
              stackId="c"
              fill={SCOPE_COLORS.scope3}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {!hasData && (
        <p className="mt-2 text-xs text-zinc-500">
          이 제품을 보유한 회사의 선택 기간 배출량이 없습니다.
        </p>
      )}

      <ul className="mt-3 space-y-1 text-xs">
        {data.map((d) => (
          <li key={d.name} className="flex justify-between">
            <span className="text-zinc-700">
              {d.name} <span className="text-zinc-400">({d.country})</span>
              {d.total === 0 && (
                <span className="ml-1 text-zinc-400">— 이 제품 미보유</span>
              )}
            </span>
            <span className="text-zinc-600">{formatKgCO2e(d.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
