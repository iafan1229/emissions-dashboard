'use client';

import ImportForm from '@/components/imports/ImportForm';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useData } from '@/lib/contexts/DataContext';

export default function NewImportPage() {
  const { isLoading, error, refetch } = useData();

  return (
    <div className="flex flex-1 flex-col gap-6 px-8 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900">활동 데이터 임포트</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Excel 파일(.xlsx)을 업로드해 활동 데이터를 PostgreSQL에 일괄 등록합니다.
          회사와 제품을 선택한 뒤 원본 파일을 첨부하세요.
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
          <ImportForm />
        </div>
      )}
    </div>
  );
}
