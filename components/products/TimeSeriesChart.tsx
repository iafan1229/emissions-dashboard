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
import { ActivityType, GhgEmission } from '@/lib/types';
import {
  ACTIVITY_COLORS,
  ALL_MONTHS_2025,
  formatKgCO2e,
} from '@/lib/utils/chartHelpers';

const ACTIVITY_FROM_SOURCE: Record<string, ActivityType> = {
  한국전력: '전기',
  '플라스틱 1': '원소재',
  '플라스틱 2': '원소재',
  트럭: '운송',
};

type TimeSeriesChartProps = {
  emissions: GhgEmission[];
  startMonth: string;
  endMonth: string;
};

export default function TimeSeriesChart({
  emissions,
  startMonth,
  endMonth,
}: TimeSeriesChartProps) {
  const data = useMemo(() => {
    const months = ALL_MONTHS_2025.filter(
      (m) => m >= startMonth && m <= endMonth,
    );
    return months.map((month) => {
      const monthly = emissions.filter((e) => e.yearMonth === month);
      const byType: Record<ActivityType, number> = {
        전기: 0,
        원소재: 0,
        운송: 0,
      };
      for (const e of monthly) {
        const type = ACTIVITY_FROM_SOURCE[e.source];
        if (type) byType[type] += e.emissions;
      }
      return { month, ...byType };
    });
  }, [emissions, startMonth, endMonth]);

  const periodTotal = useMemo(
    () => data.reduce((sum, d) => sum + d.전기 + d.원소재 + d.운송, 0),
    [data],
  );

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">월별 배출량 추이</h3>
        <p className="mt-1 text-xs text-zinc-500">활동 유형별 스택 바 (kgCO₂e)</p>
        <p className="mt-2 text-xs text-zinc-500">
          기간 총 배출량 ({startMonth} ~ {endMonth})
        </p>
        <p className="text-xl font-semibold text-zinc-900">
          {formatKgCO2e(periodTotal)}
        </p>
      </div>

      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) =>
                formatKgCO2e(typeof value === 'number' ? value : Number(value))
              }
              labelStyle={{ fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="전기" stackId="a" fill={ACTIVITY_COLORS['전기']} />
            <Bar dataKey="원소재" stackId="a" fill={ACTIVITY_COLORS['원소재']} />
            <Bar dataKey="운송" stackId="a" fill={ACTIVITY_COLORS['운송']} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
