'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useData } from '@/lib/contexts/DataContext';
import { ActivityType } from '@/lib/types';

const ACTIVITY_TYPES: ActivityType[] = ['전기', '원소재', '운송'];

const DESCRIPTIONS_BY_TYPE: Record<ActivityType, string[]> = {
  전기: ['한국전력'],
  원소재: ['플라스틱 1', '플라스틱 2'],
  운송: ['트럭'],
};

const UNIT_BY_DESCRIPTION: Record<string, string> = {
  한국전력: 'kWh',
  '플라스틱 1': 'kg',
  '플라스틱 2': 'kg',
  트럭: 'ton-km',
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const REQUIRED_MSG = '필수 항목입니다.';

type FormState = {
  companyId: string;
  productId: string;
  date: string;
  activityType: ActivityType | '';
  description: string;
  amount: string;
};

type Errors = Partial<Record<keyof FormState | 'submit', string>>;

const INITIAL_FORM: FormState = {
  companyId: '',
  productId: '',
  date: '',
  activityType: '',
  description: '',
  amount: '',
};

export default function ActivityForm() {
  const router = useRouter();
  const { companies, products, createActivity, createProduct } = useData();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [productSaveError, setProductSaveError] = useState<string | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const filteredProducts = useMemo(
    () => products.filter((p) => p.companyId === form.companyId),
    [products, form.companyId],
  );

  const descriptionOptions = form.activityType
    ? DESCRIPTIONS_BY_TYPE[form.activityType]
    : [];

  const unit = form.description ? UNIT_BY_DESCRIPTION[form.description] ?? '' : '';

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'companyId') next.productId = '';
      if (key === 'activityType') next.description = '';
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: undefined, submit: undefined }));
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
    if (!form.date) next.date = REQUIRED_MSG;
    else if (!DATE_REGEX.test(form.date) || Number.isNaN(Date.parse(form.date)))
      next.date = '올바른 날짜 형식을 입력해주세요.';
    if (!form.activityType) next.activityType = REQUIRED_MSG;
    if (!form.description) next.description = REQUIRED_MSG;
    if (!form.amount) next.amount = REQUIRED_MSG;
    else if (Number.isNaN(Number(form.amount)))
      next.amount = '숫자를 입력해주세요.';
    else if (Number(form.amount) <= 0)
      next.amount = '0보다 큰 값을 입력해주세요.';
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setIsSubmitting(true);
    try {
      await createActivity({
        companyId: form.companyId,
        productId: form.productId,
        date: form.date,
        activityType: form.activityType as ActivityType,
        description: form.description,
        amount: Number(form.amount),
        unit,
      });
      router.push(`/products/${form.productId}`);
    } catch (err) {
      setErrors({
        submit:
          err instanceof Error
            ? `저장에 실패했습니다. 다시 시도해주세요. (${err.message})`
            : '저장에 실패했습니다. 다시 시도해주세요.',
      });
      setIsSubmitting(false);
    }
  };

  const noProducts = form.companyId !== '' && filteredProducts.length === 0;

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

      <Field label="일자" error={errors.date} required>
        <input
          type="date"
          value={form.date}
          onChange={(e) => update('date', e.target.value)}
          className={fieldCls(!!errors.date)}
        />
      </Field>

      <Field label="활동 유형" error={errors.activityType} required>
        <select
          value={form.activityType}
          onChange={(e) => update('activityType', e.target.value as ActivityType)}
          className={fieldCls(!!errors.activityType)}
        >
          <option value="">— 선택 —</option>
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>

      <Field label="설명" error={errors.description} required>
        <select
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          disabled={!form.activityType}
          className={fieldCls(!!errors.description)}
        >
          <option value="">
            {!form.activityType ? '— 활동 유형을 먼저 선택하세요 —' : '— 선택 —'}
          </option>
          {descriptionOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </Field>

      <Field label="단위" error={undefined}>
        <input
          type="text"
          value={unit}
          readOnly
          placeholder="설명을 선택하면 자동 설정"
          className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600"
        />
      </Field>

      <Field label="량" error={errors.amount} required>
        <input
          type="number"
          step="any"
          value={form.amount}
          onChange={(e) => update('amount', e.target.value)}
          className={fieldCls(!!errors.amount)}
          placeholder="0보다 큰 숫자"
        />
      </Field>

      <div className="flex items-center gap-3 border-t border-zinc-100 pt-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isSubmitting ? '저장 중...' : '저장'}
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
