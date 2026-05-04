import Link from 'next/link';
import { Post, Product } from '@/lib/types';

type ReportCardProps = {
  post: Post;
  product: Product | undefined;
};

export default function ReportCard({ post, product }: ReportCardProps) {
  const productName = product?.name ?? '— (삭제된 제품)';
  const summary =
    post.content.length > 80 ? `${post.content.slice(0, 80)}…` : post.content;

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-zinc-900">{post.title}</h3>
        <span className="text-xs text-zinc-500">{post.dateTime}</span>
      </header>

      <div className="text-xs text-zinc-500">{productName}</div>

      <p className="text-sm text-zinc-700">{summary}</p>

      {product && (
        <Link
          href={`/products/${product.id}`}
          className="self-start text-xs text-zinc-700 underline hover:text-zinc-900"
        >
          제품 상세 보기 →
        </Link>
      )}
    </article>
  );
}
