type ErrorMessageProps = {
  message?: string;
  onRetry?: () => void;
};

export default function ErrorMessage({
  message = '데이터를 불러오지 못했습니다.',
  onRetry,
}: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="flex flex-1 flex-col items-center justify-center gap-4 py-16"
    >
      <p className="text-sm text-red-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
