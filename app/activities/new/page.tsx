'use client';

import ActivityForm from '@/components/activities/ActivityForm';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useData } from '@/lib/contexts/DataContext';

export default function NewActivityPage() {
  const { isLoading, error, refetch } = useData();

  return (
    <div className="flex flex-1 flex-col gap-6 px-8 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900">활동 데이터 입력</h1>
        <p className="mt-1 text-sm text-zinc-600">
          새로운 활동 데이터를 추가합니다. 저장 시 해당 제품 상세 페이지로 이동합니다.
        </p>
      </header>

      {isLoading && <LoadingSpinner label="회사/제품 목록을 불러오는 중..." />}

      {!isLoading && error && (
        <ErrorMessage
          message="회사/제품 목록을 불러오지 못했습니다."
          onRetry={refetch}
        />
      )}

      {!isLoading && !error && (
        <div className="max-w-xl">
          <ActivityForm />
        </div>
      )}
    </div>
  );
}
