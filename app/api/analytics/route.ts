import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { GaConfigError, getOverview, isConfigured, isRangeKey } from '../../lib/ga';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Dùng lại đúng cơ chế của khu admin: client gửi header `x-admin-password`
 * (AdminGuard đã giữ sẵn trong localStorage). ADMIN_PASSWORD ở đây phải trùng
 * giá trị ADMIN_PASSWORD của football-backend.
 */
function authorized(request: NextRequest): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const given = request.headers.get('x-admin-password') ?? '';
  const a = Buffer.from(given);
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
      { error: 'Chưa cấu hình GA_PROPERTY_ID / GA_SERVICE_ACCOUNT_KEY', code: 'not_configured' },
      { status: 503 }
    );
  }

  const rangeParam = request.nextUrl.searchParams.get('range');
  const range = isRangeKey(rangeParam) ? rangeParam : '28d';

  try {
    return NextResponse.json(await getOverview(range));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: message, code: error instanceof GaConfigError ? 'not_configured' : 'upstream_error' },
      { status: error instanceof GaConfigError ? 503 : 502 }
    );
  }
}
