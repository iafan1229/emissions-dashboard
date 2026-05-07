'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useData } from '@/lib/contexts/DataContext';

const REQUIRED_MSG = '필수 항목입니다.';

type FormState = {
  companyId: string;
  productId: string;
  file: File | null;
};

type Errors = Partial<Record<keyof FormState | 'submit', string>>;

type ImportResult = {
  batchId: string;
  rowCount: number;
};

const INITIAL_FORM: FormState = {
  companyId: '',
  productId: '',
  file: null,
};

export default function ImportForm() {
  const router = useRouter();
  const { companies, products, createProduct, refetch } = useData();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [productSaveError, setProductSaveError] = useState<string | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const filteredProducts = useMemo(
    () => products.filter((p) => p.companyId === form.companyId),
    [products, form.companyId],
  );

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'companyId') next.productId = '';
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: undefined, submit: undefined }));
    setResult(null);
    if (key === 'companyId') {
      setIsAddingProduct(false);
      setNewProductName('');
      setProductSaveError(null);
    }
  };

  const handleSaveProduct = async () => {
    const trimmed = newProductName.trim();
    if (!trimmed) {
      setProductSaveError('제품명을 입력해주세요.');
      return;
    }
    setProductSaveError(null);
    setIsSavingProduct(true);
    try {
      const created = await createProduct({
        name: trimmed,
        companyId: form.companyId,
      });
      setForm((prev) => ({ ...prev, productId: created.id }));
      setErrors((prev) => ({ ...prev, productId: undefined }));
      setIsAddingProduct(false);
      setNewProductName('');
    } catch (err) {
      setProductSaveError(
        err instanceof Error
          ? `제품 추가에 실패했습니다. (${err.message})`
          : '제품 추가에 실패했습니다.',
      );
    } finally {
      setIsSavingProduct(false);
    }
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (!form.companyId) next.companyId = REQUIRED_MSG;
    if (!form.productId) next.productId = REQUIRED_MSG;
    if (!form.file) next.file = REQUIRED_MSG;
    else if (!form.file.name.toLowerCase().endsWith('.xlsx'))
      next.file = '.xlsx 파일만 업로드 가능합니다.';
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    if (!form.file) return;

    setIsSubmitting(true);
    setResult(null);
    try {
      const productName =
        products.find((p) => p.id === form.productId)?.name ?? '';
      const fd = new FormData();
      fd.append('companyId', form.companyId);
      fd.append('productId', form.productId);
      fd.append('productName', productName);
      fd.append('file', form.file);

      const res = await fetch('/api/imports', { method: 'POST', body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data && typeof data.error === 'string' && data.error) ||
            `임포트 실패 (HTTP ${res.status})`,
        );
      }
      const data: ImportResult = await res.json();
      setResult(data);
      await refetch();
    } catch (err) {
      setErrors({
        submit:
          err instanceof Error
            ? `임포트에 실패했습니다. (${err.message})`
            : '임포트에 실패했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewProduct = () => {
    router.push(`/products/${form.productId}`);
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setResult(null);
  };

  const noProducts = form.companyId !== '' && filteredProducts.length === 0;

  if (result) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-base font-semibold text-emerald-900">임포트 완료</h2>
        <dl className="grid grid-cols-[6rem_1fr] gap-y-1 text-sm text-emerald-900">
          <dt className="text-emerald-700">배치 ID</dt>
          <dd className="font-mono text-xs">{result.batchId}</dd>
          <dt className="text-emerald-700">등록 건수</dt>
          <dd>{result.rowCount}건</dd>
        </dl>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={handleViewProduct}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            제품 상세로 이동
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-white"
          >
            다른 파일 임포트
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6"
    >
      <Field label="회사" error={errors.companyId} required>
        <select
          value={form.companyId}
          onChange={(e) => update('companyId', e.target.value)}
          className={fieldCls(!!errors.companyId)}
        >
          <option value="">— 선택 —</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.country})
            </option>
          ))}
        </select>
      </Field>

      <Field label="제품" error={errors.productId} required>
        <div className="flex flex-col gap-2">
          <select
            value={form.productId}
            onChange={(e) => update('productId', e.target.value)}
            disabled={!form.companyId}
            className={fieldCls(!!errors.productId)}
          >
            <option value="">
              {!form.companyId
                ? '— 회사를 먼저 선택하세요 —'
                : noProducts
                  ? '— 등록된 제품이 없습니다, 아래에서 추가 —'
                  : '— 선택 —'}
            </option>
            {filteredProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {form.companyId && !isAddingProduct && (
            <button
              type="button"
              onClick={() => setIsAddingProduct(true)}
              className="self-start text-xs text-zinc-700 underline hover:text-zinc-900"
            >
              + 새 제품 추가
            </button>
          )}

          {form.companyId && isAddingProduct && (
            <div className="flex flex-col gap-2 rounded border border-zinc-200 bg-zinc-50 p-3">
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-zinc-700">제품명</span>
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => {
                    setNewProductName(e.target.value);
                    setProductSaveError(null);
                  }}
                  placeholder="예: 컴퓨터 화면 CT-046"
                  className={fieldCls(!!productSaveError)}
                  disabled={isSavingProduct}
                />
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveProduct}
                  disabled={isSavingProduct}
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                >
                  {isSavingProduct ? '추가 중...' : '추가'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingProduct(false);
                    setNewProductName('');
                    setProductSaveError(null);
                  }}
                  disabled={isSavingProduct}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 hover:bg-white"
                >
                  취소
                </button>
                {productSaveError && (
                  <span className="text-xs text-red-600">{productSaveError}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </Field>

      <Field label="Excel 파일 (.xlsx)" error={errors.file} required>
        <input
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => update('file', e.target.files?.[0] ?? null)}
          className="text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-zinc-800"
        />
        {form.file && (
          <p className="mt-1 text-xs text-zinc-500">
            선택됨: <span className="font-medium text-zinc-700">{form.file.name}</span>{' '}
            ({Math.round(form.file.size / 1024)} KB)
          </p>
        )}
      </Field>

      <p className="rounded border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
        ⓘ 같은 회사·제품에 이미 등록된 (일자 + 활동유형 + 설명 + 량) 조합이 파일에 포함되면
        전체 임포트가 거부됩니다. 1행이라도 검증 실패 시 0건이 등록됩니다.
      </p>

      <div className="flex items-center gap-3 border-t border-zinc-100 pt-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isSubmitting ? '임포트 중...' : '임포트'}
        </button>
        {errors.submit && <p className="text-xs text-red-600">{errors.submit}</p>}
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error: string | undefined;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-zinc-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
      {error && <span className="text-red-600">{error}</span>}
    </label>
  );
}

function fieldCls(hasError: boolean) {
  return `rounded border bg-white px-3 py-2 text-sm ${
    hasError ? 'border-red-400' : 'border-zinc-300'
  }`;
}
