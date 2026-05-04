'use client';

import { useMemo } from 'react';
import ReportCard from '@/components/reports/ReportCard';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useData } from '@/lib/contexts/DataContext';

export default function ReportsPage() {
  const { posts, products, isLoading, error, refetch } = useData();

  const sortedPosts = useMemo(
    () => [...posts].sort((a, b) => b.dateTime.localeCompare(a.dateTime)),
    [posts],
  );

  return (
    <div className="flex flex-1 flex-col gap-6 px-8 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900">리포트</h1>
        <p className="mt-1 text-sm text-zinc-600">
          제품별 월간 지속가능성 리포트 전체 목록.
        </p>
      </header>

      {isLoading && <LoadingSpinner label="리포트를 불러오는 중..." />}

      {!isLoading && error && (
        <ErrorMessage
          message="리포트를 불러오지 못했습니다."
          onRetry={refetch}
        />
      )}

      {!isLoading && !error && sortedPosts.length === 0 && (
        <p className="text-sm text-zinc-500">
          아직 작성된 리포트가 없습니다. 제품 상세 페이지에서 월별 리포트를 작성해 보세요.
        </p>
      )}

      {!isLoading && !error && sortedPosts.length > 0 && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sortedPosts.map((post) => (
            <ReportCard
              key={post.id}
              post={post}
              product={products.find((p) => p.id === post.resourceUid)}
            />
          ))}
        </section>
      )}
    </div>
  );
}
