'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useData } from '@/lib/contexts/DataContext';
import { ALL_MONTHS_2025 } from '@/lib/utils/chartHelpers';

type ReportFormProps = {
  productId: string;
};

type SaveStatus =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'success'; mode: 'create' | 'update' }
  | { kind: 'error'; message: string };

export default function ReportForm({ productId }: ReportFormProps) {
  const { posts, createOrUpdatePost } = useData();
  const [month, setMonth] = useState<string>(ALL_MONTHS_2025[0]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<SaveStatus>({ kind: 'idle' });

  const existingPost = useMemo(
    () =>
      posts.find(
        (p) => p.resourceUid === productId && p.dateTime === month,
      ),
    [posts, productId, month],
  );

  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title);
      setContent(existingPost.content);
    } else {
      setTitle('');
      setContent('');
    }
    setStatus({ kind: 'idle' });
  }, [existingPost, month]);

  const isUpdate = Boolean(existingPost);
  const isSaving = status.kind === 'saving';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setStatus({
        kind: 'error',
        message: '제목과 내용을 모두 입력해주세요.',
      });
      return;
    }
    setStatus({ kind: 'saving' });
    try {
      await createOrUpdatePost({
        id: existingPost?.id,
        title,
        content,
        resourceUid: productId,
        dateTime: month,
      });
      setStatus({
        kind: 'success',
        mode: existingPost ? 'update' : 'create',
      });
    } catch (err) {
      setStatus({
        kind: 'error',
        message:
          err instanceof Error
            ? `저장에 실패했습니다. 다시 시도해주세요. (${err.message})`
            : '저장에 실패했습니다. 다시 시도해주세요.',
      });
    }
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">월별 리포트 작성</h3>
          <p className="mt-1 text-xs text-zinc-500">
            {isUpdate ? '기존 리포트 수정 모드' : '신규 리포트 작성 모드'}
          </p>
        </div>
        <Link
          href="/reports"
          className="text-xs text-zinc-700 underline hover:text-zinc-900"
        >
          전체 리포트 목록 →
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-zinc-600">대상 월</span>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded border border-zinc-300 bg-white px-2 py-2 text-sm"
          >
            {ALL_MONTHS_2025.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="text-zinc-600">제목</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded border border-zinc-300 bg-white px-2 py-2 text-sm"
            placeholder="예: Sustainability Report"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="text-zinc-600">내용</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="rounded border border-zinc-300 bg-white px-2 py-2 text-sm"
            placeholder="해당 월의 배출량 분석/코멘트를 입력하세요."
          />
        </label>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {isSaving ? '저장 중...' : isUpdate ? '리포트 수정' : '리포트 저장'}
          </button>

          {status.kind === 'success' && (
            <p className="text-xs text-emerald-700">
              {status.mode === 'update' ? '수정 완료' : '저장 완료'}
            </p>
          )}
          {status.kind === 'error' && (
            <p className="text-xs text-red-600">{status.message}</p>
          )}
        </div>
      </form>
    </div>
  );
}
