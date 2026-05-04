'use client';

import ProductCard from '@/components/dashboard/ProductCard';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useData } from '@/lib/contexts/DataContext';

export default function DashboardPage() {
  const { products, isLoading, error, refetch } = useData();

  return (
    <div className="flex flex-1 flex-col gap-6 px-8 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900">대시보드</h1>
        <p className="mt-1 text-sm text-zinc-600">
          제품별 PCF 전과정 배출량 요약. 카드를 클릭해 상세 분석으로 이동합니다.
        </p>
      </header>

      {isLoading && <LoadingSpinner label="배출량 데이터를 불러오는 중..." />}

      {!isLoading && error && (
        <ErrorMessage
          message="대시보드 데이터를 불러오지 못했습니다."
          onRetry={refetch}
        />
      )}

      {!isLoading && !error && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      )}
    </div>
  );
}
