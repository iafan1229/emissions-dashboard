'use client';

import { ALL_MONTHS_2025 } from '@/lib/utils/chartHelpers';

type PeriodFilterProps = {
  startMonth: string;
  endMonth: string;
  onChange: (start: string, end: string) => void;
};

export default function PeriodFilter({
  startMonth,
  endMonth,
  onChange,
}: PeriodFilterProps) {
  const handleStart = (value: string) => {
    onChange(value, value > endMonth ? value : endMonth);
  };

  const handleEnd = (value: string) => {
    onChange(value < startMonth ? value : startMonth, value);
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-zinc-500">기간</span>
      <select
        value={startMonth}
        onChange={(e) => handleStart(e.target.value)}
        className="rounded border border-zinc-300 bg-white px-2 py-1"
      >
        {ALL_MONTHS_2025.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <span className="text-zinc-400">~</span>
      <select
        value={endMonth}
        onChange={(e) => handleEnd(e.target.value)}
        className="rounded border border-zinc-300 bg-white px-2 py-1"
      >
        {ALL_MONTHS_2025.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}
