'use client';

import { useMemo, useState } from 'react';
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
};

export default function TimeSeriesChart({ emissions }: TimeSeriesChartProps) {
  const [startMonth, setStartMonth] = useState<string>(ALL_MONTHS_2025[0]);
  const [endMonth, setEndMonth] = useState<string>(
    ALL_MONTHS_2025[ALL_MONTHS_2025.length - 1],
  );

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

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">월별 배출량 추이</h3>
          <p className="mt-1 text-xs text-zinc-500">활동 유형별 스택 바 (kgCO₂e)</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <label className="flex items-center gap-1">
            <span className="text-zinc-500">시작</span>
            <select
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              className="rounded border border-zinc-300 bg-white px-2 py-1"
            >
              {ALL_MONTHS_2025.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1">
            <span className="text-zinc-500">종료</span>
            <select
              value={endMonth}
              onChange={(e) => setEndMonth(e.target.value)}
              className="rounded border border-zinc-300 bg-white px-2 py-1"
            >
              {ALL_MONTHS_2025.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>
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
