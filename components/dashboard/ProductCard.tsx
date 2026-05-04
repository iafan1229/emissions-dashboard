'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useData } from '@/lib/contexts/DataContext';
import { calculateEmissions } from '@/lib/utils/calculateEmissions';
import { Product } from '@/lib/types';

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const { companies, activityData } = useData();

  const summary = useMemo(() => {
    const company = companies.find((c) => c.id === product.companyId);
    const productActivities = activityData.filter(
      (a) => a.productId === product.id,
    );
    const emissions = calculateEmissions(productActivities);

    const total = emissions.reduce((sum, e) => sum + e.emissions, 0);
    const scope2 = emissions
      .filter((e) => e.scope === 'scope2')
      .reduce((sum, e) => sum + e.emissions, 0);
    const scope3 = emissions
      .filter((e) => e.scope === 'scope3')
      .reduce((sum, e) => sum + e.emissions, 0);

    return {
      companyName: company?.name ?? '—',
      total,
      scope2Pct: total > 0 ? (scope2 / total) * 100 : 0,
      scope3Pct: total > 0 ? (scope3 / total) * 100 : 0,
    };
  }, [companies, activityData, product]);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md"
    >
      <div>
        <h3 className="text-base font-semibold text-zinc-900 group-hover:text-zinc-700">
          {product.name}
        </h3>
        <p className="text-xs text-zinc-500">{summary.companyName}</p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          기간 총 배출량
        </p>
        <p className="text-2xl font-semibold text-zinc-900">
          {summary.total.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{' '}
          <span className="text-sm font-normal text-zinc-500">kgCO₂e</span>
        </p>
      </div>

      <div className="flex gap-4 border-t border-zinc-100 pt-3">
        <ScopeBadge label="Scope 2" pct={summary.scope2Pct} />
        <ScopeBadge label="Scope 3" pct={summary.scope3Pct} />
      </div>
    </Link>
  );
}

function ScopeBadge({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-sm font-medium text-zinc-900">
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}
