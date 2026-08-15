import { NextRequest, NextResponse } from 'next/server';
import { isBot, isConfigured, recordVisit } from '@/app/lib/visits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Nhận beacon từ trình duyệt. Công khai, không xác thực — nên phải tự lo
 * chống spam. Luôn trả 204 kể cả khi bỏ qua hoặc lỗi: đây là đo đạc, không
 * bao giờ được làm hỏng trải nghiệm của khách hay rò rỉ trạng thái nội bộ.
 */

/** Cùng khách + cùng đường dẫn trong 5 giây thì bỏ — chặn double-fire khi React remount. */
const DEDUP_MS = 5_000;
/** Trần ghi cho mỗi IP trong 1 phút. */
const RATE_LIMIT = 120;
const RATE_WINDOW_MS = 60_000;

const lastSeen = new Map<string, number>();
const rate = new Map<string, { count: number; resetAt: number }>();

/** Map sống trong RAM tiến trình; dọn định kỳ để không phình theo thời gian. */
function sweep(now: number) {
  if (lastSeen.size > 5000) {
    for (const [key, at] of lastSeen) if (now - at > DEDUP_MS) lastSeen.delete(key);
  }
  if (rate.size > 5000) {
    for (const [key, entry] of rate) if (entry.resetAt < now) rate.delete(key);
  }
}

function rateLimited(ip: string, now: number): boolean {
  const entry = rate.get(ip);
  if (!entry || entry.resetAt < now) {
    rate.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

/**
 * X-Real-IP do chính nginx của mình đặt và ghi đè giá trị client gửi lên, mà
 * cổng ứng dụng lại không mở ra internet nên không có đường đi vòng. Vì vậy
 * header này tin được. Tuyệt đối KHÔNG lấy phần tử đầu của X-Forwarded-For:
 * đoạn đó do client tự khai, giả mạo IP thoải mái.
 */
function clientIp(request: NextRequest): string {
  const real = request.headers.get('x-real-ip')?.trim();
  if (real) return real;
  // Sau nginx thì phần tử cuối XFF là địa chỉ nginx nhìn thấy.
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return '0.0.0.0';
}

interface Payload {
  vid?: unknown;
  sid?: unknown;
  new?: unknown;
  path?: unknown;
  title?: unknown;
  ref?: unknown;
  screen?: unknown;
  lang?: unknown;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const asText = (v: unknown) => (typeof v === 'string' ? v : null);

export async function POST(request: NextRequest) {
  const done = new NextResponse(null, { status: 204 });
  if (!isConfigured()) return done;

  const userAgent = request.headers.get('user-agent') || '';
  if (isBot(userAgent)) return done;

  let body: Payload;
  try {
    body = await request.json();
  } catch {
    return done;
  }

  const visitorId = asText(body.vid);
  const sessionId = asText(body.sid);
  const path = asText(body.path);
  // ID do client sinh nên phải kiểm dạng, tránh nhận rác vào cột CHAR(36).
  if (!visitorId || !UUID_RE.test(visitorId)) return done;
  if (!sessionId || !UUID_RE.test(sessionId)) return done;
  if (!path || !path.startsWith('/')) return done;

  const now = Date.now();
  sweep(now);

  const ip = clientIp(request);
  if (rateLimited(ip, now)) return done;

  const dedupKey = `${visitorId}|${path}`;
  const previous = lastSeen.get(dedupKey);
  if (previous && now - previous < DEDUP_MS) return done;
  lastSeen.set(dedupKey, now);

  try {
    await recordVisit({
      visitorId,
      sessionId,
      isNewVisitor: body.new === true,
      ip,
      path,
      title: asText(body.title),
      referrer: asText(body.ref),
      screen: asText(body.screen),
      lang: asText(body.lang),
      userAgent,
    });
  } catch (error) {
    // Không để lỗi ghi log truy cập nổi lên thành lỗi cho khách.
    console.error('Track API error:', error);
  }

  return done;
}
