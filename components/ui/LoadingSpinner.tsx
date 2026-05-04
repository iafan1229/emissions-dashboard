type LoadingSpinnerProps = {
  label?: string;
};

export default function LoadingSpinner({ label = '불러오는 중...' }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-1 flex-col items-center justify-center gap-3 py-16"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      <p className="text-sm text-zinc-600">{label}</p>
    </div>
  );
}
