'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import CompanyChart from '@/components/products/CompanyChart';
import LcaStageChart from '@/components/products/LcaStageChart';
import ReportForm from '@/components/products/ReportForm';
import ScopeChart from '@/components/products/ScopeChart';
import TimeSeriesChart from '@/components/products/TimeSeriesChart';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useData } from '@/lib/contexts/DataContext';
import { calculateEmissions } from '@/lib/utils/calculateEmissions';
import { formatKgCO2e, sumEmissions } from '@/lib/utils/chartHelpers';

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id ?? '';

  const {
    products,
    companies,
    activityData,
    isLoading,
    error,
    refetch,
  } = useData();

  const product = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId],
  );

  const company = useMemo(
    () => companies.find((c) => c.id === product?.companyId),
    [companies, product],
  );

  const productEmissions = useMemo(() => {
    const productActivities = activityData.filter(
      (a) => a.productId === productId,
    );
    return calculateEmissions(productActivities);
  }, [activityData, productId]);

  const allEmissions = useMemo(
    () => calculateEmissions(activityData),
    [activityData],
  );

  const totalEmissions = useMemo(
    () => sumEmissions(productEmissions),
    [productEmissions],
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col px-8 py-8">
        <LoadingSpinner label="제품 데이터를 불러오는 중..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col px-8 py-8">
        <ErrorMessage
          message="제품 데이터를 불러오지 못했습니다."
          onRetry={refetch}
        />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-1 flex-col px-8 py-8">
        <ErrorMessage message={`제품을 찾을 수 없습니다: ${productId}`} />
        <Link
          href="/"
          className="mx-auto text-sm text-zinc-700 underline hover:text-zinc-900"
        >
          ← 대시보드로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-8 py-8">
      <header className="flex flex-col gap-1">
        <Link
          href="/"
          className="text-xs text-zinc-500 hover:text-zinc-900"
        >
          ← 대시보드
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900">{product.name}</h1>
        <p className="text-sm text-zinc-600">
          {company?.name ?? '—'} · 기간 총 배출량{' '}
          <span className="font-medium text-zinc-900">
            {formatKgCO2e(totalEmissions)}
          </span>
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LcaStageChart emissions={productEmissions} />
        <ScopeChart emissions={productEmissions} />
        <TimeSeriesChart emissions={productEmissions} />
        <CompanyChart companies={companies} emissions={allEmissions} />
      </section>

      <section>
        <ReportForm productId={product.id} />
      </section>
    </div>
  );
}
