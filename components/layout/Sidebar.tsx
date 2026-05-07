'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: '대시보드' },
  { href: '/reports', label: '리포트' },
  { href: '/activities/new', label: '활동 데이터 입력' },
  { href: '/imports/new', label: '활동 데이터 임포트' },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-white px-4 py-6">
      <div className="px-2 pb-6">
        <h1 className="text-base font-semibold text-zinc-900">HanaLoop</h1>
        <p className="text-xs text-zinc-500">Emissions Dashboard</p>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive(item.href)
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
