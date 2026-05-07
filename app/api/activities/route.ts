import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityData, ActivityType } from '@/lib/types';

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get('productId');
  const rows = await prisma.activityData.findMany({
    where: productId ? { productId } : undefined,
    include: { importBatch: { select: { productName: true } } },
  });

  const result: ActivityData[] = rows.map((r) => ({
    id: r.id,
    date: r.date.toISOString().slice(0, 10),
    activityType: r.activityType as ActivityType,
    description: r.description,
    amount: Number(r.amount.toString()),
    unit: r.unit,
    productId: r.productId,
    companyId: r.companyId,
    productName: r.importBatch.productName,
  }));

  return NextResponse.json(result);
}
