/**
 * GA4 Data API client.
 *
 * Xác thực bằng service account: tự ký JWT (RS256) rồi đổi lấy access token,
 * thay vì kéo cả `googleapis` (~50MB) chỉ để gọi vài endpoint REST.
 *
 * Env cần có:
 *   GA_PROPERTY_ID          — property ID dạng số, ví dụ 512345678 (KHÔNG phải G-XXXX)
 *   GA_SERVICE_ACCOUNT_KEY  — nội dung file JSON của service account, dán trực tiếp
 *                             hoặc mã hoá base64 (khuyến nghị khi đặt trên Vercel)
 */
import { createSign } from 'node:crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DATA_API = 'https://analyticsdata.googleapis.com/v1beta';
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

export class GaConfigError extends Error {}

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

function serviceAccount(): ServiceAccount {
  const raw = process.env.GA_SERVICE_ACCOUNT_KEY?.trim();
  if (!raw) throw new GaConfigError('Chưa cấu hình GA_SERVICE_ACCOUNT_KEY');

  let json: string;
  try {
    json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  } catch {
    throw new GaConfigError('GA_SERVICE_ACCOUNT_KEY không phải JSON hợp lệ hay base64 hợp lệ');
  }

  let parsed: Partial<ServiceAccount>;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new GaConfigError('GA_SERVICE_ACCOUNT_KEY không parse được thành JSON');
  }

  if (!parsed.client_email || !parsed.private_key) {
    throw new GaConfigError('GA_SERVICE_ACCOUNT_KEY thiếu client_email hoặc private_key');
  }
  return {
    client_email: parsed.client_email,
    // Khi dán JSON thẳng vào env, xuống dòng thường bị escape thành "\n" literal.
    private_key: parsed.private_key.replace(/\\n/g, '\n'),
  };
}

export function propertyId(): string {
  const id = process.env.GA_PROPERTY_ID?.trim();
  if (!id) throw new GaConfigError('Chưa cấu hình GA_PROPERTY_ID');
  if (!/^\d+$/.test(id)) {
    throw new GaConfigError(`GA_PROPERTY_ID phải là dãy số (nhận được "${id}")`);
  }
  return id;
}

/** Trả về true khi đủ env để gọi Data API — dùng để render trạng thái "chưa cấu hình". */
export function isConfigured(): boolean {
  return Boolean(process.env.GA_PROPERTY_ID?.trim() && process.env.GA_SERVICE_ACCOUNT_KEY?.trim());
}

const b64url = (input: string) => Buffer.from(input).toString('base64url');

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  // Token sống 1h; xin lại sớm 60s để không dùng phải token vừa hết hạn giữa chừng.
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const sa = serviceAccount();
  const now = Math.floor(Date.now() / 1000);
  const payload =
    b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' })) +
    '.' +
    b64url(JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }));

  const signer = createSign('RSA-SHA256');
  signer.update(payload);
  const assertion = `${payload}.${signer.sign(sa.private_key).toString('base64url')}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    cache: 'no-store',
  });

  const body = (await res.json()) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!res.ok || !body.access_token) {
    throw new Error(`Không lấy được access token từ Google: ${body.error_description || res.status}`);
  }

  cachedToken = { value: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000 };
  return cachedToken.value;
}

interface GaRow {
  dimensionValues?: { value: string }[];
  metricValues?: { value: string }[];
}
interface GaReport {
  rows?: GaRow[];
  totals?: GaRow[];
}

async function callDataApi<T>(method: string, body: unknown): Promise<T> {
  const res = await fetch(`${DATA_API}/properties/${propertyId()}:${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      message = (JSON.parse(text) as { error?: { message?: string } }).error?.message || text;
    } catch {
      /* giữ nguyên text thô */
    }
    if (res.status === 403) {
      throw new GaConfigError(
        `GA từ chối truy cập property ${process.env.GA_PROPERTY_ID}. ` +
          `Kiểm tra đã thêm email service account vào property với quyền Viewer chưa. (${message})`
      );
    }
    throw new Error(`GA4 Data API lỗi ${res.status}: ${message}`);
  }
  return res.json() as Promise<T>;
}

/* ------------------------------------------------------------------ */
/* Khoảng thời gian                                                    */
/* ------------------------------------------------------------------ */

export const RANGES = {
  today: { label: 'Hôm nay', current: ['today', 'today'], previous: ['yesterday', 'yesterday'] },
  '7d': { label: '7 ngày', current: ['7daysAgo', 'today'], previous: ['14daysAgo', '8daysAgo'] },
  '28d': { label: '28 ngày', current: ['28daysAgo', 'today'], previous: ['56daysAgo', '29daysAgo'] },
  '90d': { label: '90 ngày', current: ['90daysAgo', 'today'], previous: ['180daysAgo', '91daysAgo'] },
} as const;

export type RangeKey = keyof typeof RANGES;

export function isRangeKey(value: string | null): value is RangeKey {
  return value !== null && value in RANGES;
}

const dateRange = (pair: readonly [string, string] | readonly string[]) => ({
  startDate: pair[0],
  endDate: pair[1],
});

/* ------------------------------------------------------------------ */
/* Kết quả trả về cho dashboard                                        */
/* ------------------------------------------------------------------ */

export interface Kpi {
  users: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
  /** giây */
  avgSessionDuration: number;
  /** tỉ lệ 0..1 */
  bounceRate: number;
}

export interface NamedCount {
  name: string;
  value: number;
}

export interface Overview {
  range: RangeKey;
  current: Kpi;
  previous: Kpi;
  timeseries: { date: string; users: number; sessions: number; pageViews: number }[];
  topPages: { path: string; title: string; views: number }[];
  channels: NamedCount[];
  devices: NamedCount[];
  cities: NamedCount[];
  activeNow: number;
  updatedAt: string;
}

const num = (row: GaRow | undefined, index: number) => Number(row?.metricValues?.[index]?.value ?? 0);
const dim = (row: GaRow, index: number) => row.dimensionValues?.[index]?.value ?? '';

const KPI_METRICS = [
  { name: 'totalUsers' },
  { name: 'newUsers' },
  { name: 'sessions' },
  { name: 'screenPageViews' },
  { name: 'averageSessionDuration' },
  { name: 'bounceRate' },
];

const toKpi = (row: GaRow | undefined): Kpi => ({
  users: num(row, 0),
  newUsers: num(row, 1),
  sessions: num(row, 2),
  pageViews: num(row, 3),
  avgSessionDuration: num(row, 4),
  bounceRate: num(row, 5),
});

/** "20260814" -> "2026-08-14" để client parse được bằng Date. */
const isoDate = (compact: string) =>
  compact.length === 8 ? `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6)}` : compact;

export async function getOverview(range: RangeKey): Promise<Overview> {
  const { current, previous } = RANGES[range];

  // batchRunReports cho tối đa 5 report/lần — gộp để chỉ tốn 1 vòng mạng.
  const batch = callDataApi<{ reports: GaReport[] }>('batchRunReports', {
    requests: [
      // 0 — KPI kỳ này so kỳ trước (2 dateRange => 2 dòng kết quả)
      {
        dateRanges: [dateRange(current), dateRange(previous)],
        metrics: KPI_METRICS,
      },
      // 1 — chuỗi thời gian theo ngày
      {
        dateRanges: [dateRange(current)],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'totalUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
        limit: 180,
      },
      // 2 — trang xem nhiều nhất
      {
        dateRanges: [dateRange(current)],
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      },
      // 3 — nguồn traffic
      {
        dateRanges: [dateRange(current)],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 8,
      },
      // 4 — thiết bị
      {
        dateRanges: [dateRange(current)],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 5,
      },
    ],
  });

  const citiesReport = callDataApi<GaReport>('runReport', {
    dateRanges: [dateRange(current)],
    dimensions: [{ name: 'city' }],
    metrics: [{ name: 'sessions' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 8,
  });

  // Realtime dùng property riêng biệt trong GA và có thể lỗi độc lập —
  // hỏng phần này không nên làm hỏng cả dashboard.
  const realtime = callDataApi<GaReport>('runRealtimeReport', {
    metrics: [{ name: 'activeUsers' }],
  }).catch(() => null);

  const [reports, cities, live] = await Promise.all([batch, citiesReport, realtime]);
  const [kpiReport, timeseriesReport, pagesReport, channelsReport, devicesReport] = reports.reports;

  return {
    range,
    current: toKpi(kpiReport?.rows?.[0]),
    previous: toKpi(kpiReport?.rows?.[1]),
    timeseries: (timeseriesReport?.rows ?? []).map((row) => ({
      date: isoDate(dim(row, 0)),
      users: num(row, 0),
      sessions: num(row, 1),
      pageViews: num(row, 2),
    })),
    topPages: (pagesReport?.rows ?? []).map((row) => ({
      path: dim(row, 0),
      title: dim(row, 1),
      views: num(row, 0),
    })),
    channels: (channelsReport?.rows ?? []).map((row) => ({ name: dim(row, 0), value: num(row, 0) })),
    devices: (devicesReport?.rows ?? []).map((row) => ({ name: dim(row, 0), value: num(row, 0) })),
    cities: (cities.rows ?? []).map((row) => ({ name: dim(row, 0) || 'Không xác định', value: num(row, 0) })),
    activeNow: num(live?.rows?.[0], 0),
    updatedAt: new Date().toISOString(),
  };
}
