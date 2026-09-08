import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { StatsConfigError, getVisitStats, isConfigured, isDayString, isVisitRange } from '@/app/lib/visits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Dùng lại đúng cơ chế của khu admin, giống /api/analytics. */
function authorized(request: NextRequest): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(request.headers.get('x-admin-password') ?? '');
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Chưa cấu hình ADMIN_PASSWORD cho frontend' }, { status: 503 });
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Sai mật khẩu admin' }, { status: 401 });
  }

  if (!isConfigured()) {
    return NextResponse.json(
      { error: 'Chưa cấu hình STATS_DB_NAME / STATS_SITE', code: 'not_configured' },
      { status: 503 }
    );
  }

  const params = request.nextUrl.searchParams;
  const rangeParam = params.get('range');
  const range = isVisitRange(rangeParam) ? rangeParam : '7d';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const search = params.get('q') ?? '';

  // Bộ lọc riêng của bảng "Khách quay lại nhiều nhất".
  const vFrom = params.get('vfrom');
  const vTo = params.get('vto');
  const topFilter = {
    q: params.get('vq') ?? '',
    from: isDayString(vFrom) ? vFrom : null,
    to: isDayString(vTo) ? vTo : null,
  };

  try {
    return NextResponse.json(await getVisitStats(range, page, search, topFilter));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('Visitors API error:', error);
    return NextResponse.json(
      { error: message, code: error instanceof StatsConfigError ? 'not_configured' : 'db_error' },
      { status: error instanceof StatsConfigError ? 503 : 502 }
    );
  }
}
