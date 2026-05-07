import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';

const VALID_ACTIVITY_TYPES = ['전기', '원소재', '운송'] as const;

type ParsedRow = {
  date: Date;
  activityType: string;
  description: string;
  amount: number;
  unit: string;
};

type RowError = { row: number; message: string };

const HEADER_ROW_INDEX = 2;
const FIRST_DATA_XLSX_ROW = HEADER_ROW_INDEX + 2;

function err(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status });
}

function parseRow(
  row: Record<string, unknown>,
  xlsxRow: number,
): { data?: ParsedRow; error?: RowError } {
  const dateRaw = row['일자(원본)'];
  const activityType = row['활동 유형'];
  const description = row['설명'];
  const amountRaw = row['량'];
  const unitRaw = row['단위'];

  const allEmpty =
    dateRaw == null &&
    (activityType == null || activityType === '') &&
    (description == null || description === '') &&
    amountRaw == null &&
    (unitRaw == null || unitRaw === '');
  if (allEmpty) return {};

  if (dateRaw == null || dateRaw === '')
    return { error: { row: xlsxRow, message: '일자 누락' } };
  if (activityType == null || activityType === '')
    return { error: { row: xlsxRow, message: '활동 유형 누락' } };
  if (description == null || description === '')
    return { error: { row: xlsxRow, message: '설명 누락' } };
  if (amountRaw == null || amountRaw === '')
    return { error: { row: xlsxRow, message: '량 누락' } };
  if (unitRaw == null || unitRaw === '')
    return { error: { row: xlsxRow, message: '단위 누락' } };

  const activityTypeStr = String(activityType).trim();
  if (!VALID_ACTIVITY_TYPES.includes(activityTypeStr as (typeof VALID_ACTIVITY_TYPES)[number])) {
    return {
      error: {
        row: xlsxRow,
        message: `활동 유형 무효: "${activityTypeStr}" (가능: ${VALID_ACTIVITY_TYPES.join(', ')})`,
      },
    };
  }

  let parsedDate: Date;
  if (dateRaw instanceof Date) {
    parsedDate = dateRaw;
  } else {
    const candidate = new Date(String(dateRaw));
    if (Number.isNaN(candidate.getTime())) {
      return { error: { row: xlsxRow, message: `일자 무효: "${String(dateRaw)}"` } };
    }
    parsedDate = candidate;
  }

  const amountNum =
    typeof amountRaw === 'number' ? amountRaw : Number(String(amountRaw).trim());
  if (Number.isNaN(amountNum)) {
    return { error: { row: xlsxRow, message: `량 무효 (숫자 아님): "${String(amountRaw)}"` } };
  }
  if (amountNum <= 0) {
    return { error: { row: xlsxRow, message: `량은 0보다 커야 함: ${amountNum}` } };
  }

  return {
    data: {
      date: parsedDate,
      activityType: activityTypeStr,
      description: String(description).trim(),
      amount: amountNum,
      unit: String(unitRaw).trim(),
    },
  };
}

export async function POST(request: NextRequest) {
  let fd: FormData;
  try {
    fd = await request.formData();
  } catch {
    return err(400, { error: 'multipart/form-data 요청이 아닙니다.' });
  }

  const companyId = fd.get('companyId');
  const productId = fd.get('productId');
  const productName = fd.get('productName');
  const file = fd.get('file');

  if (typeof companyId !== 'string' || !companyId)
    return err(400, { error: 'companyId 누락' });
  if (typeof productId !== 'string' || !productId)
    return err(400, { error: 'productId 누락' });
  if (typeof productName !== 'string' || !productName)
    return err(400, { error: 'productName 누락' });
  if (!(file instanceof File))
    return err(400, { error: '파일이 첨부되지 않았습니다.' });
  if (!file.name.toLowerCase().endsWith('.xlsx'))
    return err(400, { error: '.xlsx 파일만 업로드 가능합니다.' });

  let rows: Record<string, unknown>[];
  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array', cellDates: true });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) return err(400, { error: 'xlsx에 시트가 없습니다.' });
    const sheet = wb.Sheets[sheetName];
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      range: HEADER_ROW_INDEX,
      defval: null,
    });
  } catch (e) {
    return err(400, {
      error: `xlsx 파싱 실패: ${e instanceof Error ? e.message : String(e)}`,
    });
  }

  const parsed: ParsedRow[] = [];
  const failures: RowError[] = [];
  for (let i = 0; i < rows.length; i++) {
    const xlsxRow = FIRST_DATA_XLSX_ROW + i;
    const result = parseRow(rows[i], xlsxRow);
    if (result.error) failures.push(result.error);
    else if (result.data) parsed.push(result.data);
  }

  if (failures.length > 0) {
    return err(400, {
      error: `검증 실패 ${failures.length}건. 임포트가 거부되었습니다.`,
      failures,
    });
  }

  if (parsed.length === 0) {
    return err(400, { error: '파일에서 유효한 행을 찾지 못했습니다.' });
  }

  const existing = await prisma.activityData.findMany({
    where: {
      companyId,
      productId,
      OR: parsed.map((p) => ({
        date: p.date,
        activityType: p.activityType,
        description: p.description,
        amount: p.amount,
      })),
    },
    select: {
      date: true,
      activityType: true,
      description: true,
      amount: true,
    },
  });

  if (existing.length > 0) {
    return err(409, {
      error: `이미 등록된 ${existing.length}건의 중복 데이터가 발견되어 임포트가 거부되었습니다.`,
      duplicates: existing.map((e) => ({
        date: e.date.toISOString().slice(0, 10),
        activityType: e.activityType,
        description: e.description,
        amount: e.amount.toString(),
      })),
    });
  }

  try {
    const batch = await prisma.$transaction(async (tx) => {
      const created = await tx.importBatch.create({
        data: {
          companyId,
          productId,
          productName,
          filename: file.name,
          rowCount: parsed.length,
        },
      });

      await tx.activityData.createMany({
        data: parsed.map((p) => ({
          date: p.date,
          activityType: p.activityType,
          description: p.description,
          amount: p.amount,
          unit: p.unit,
          companyId,
          productId,
          importBatchId: created.id,
        })),
      });

      return created;
    });

    return NextResponse.json({ batchId: batch.id, rowCount: parsed.length });
  } catch (e) {
    return err(500, {
      error: `임포트 중 DB 오류: ${e instanceof Error ? e.message : String(e)}`,
    });
  }
}
