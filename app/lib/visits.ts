/**
 * Nhật ký truy cập tự lưu — bù bốn thứ GA4 không cho:
 *   1. IP thô của từng lượt truy cập
 *   2. Định danh khách do mình kiểm soát (visitor_id trong localStorage)
 *   3. Xem được từng lượt lẻ, không chỉ số đã gộp
 *   4. Không bị ad-blocker chặn (beacon về chính domain của mình)
 *
 * Lưu vào MariaDB sẵn có trên VPS, bảng `webstats.visits`, phân biệt hai site
 * bằng cột `site`.
 *
 * Env:
 *   STATS_DB_HOST / STATS_DB_USER / STATS_DB_PASS / STATS_DB_NAME
 *   STATS_SITE — khoá site của app này, ví dụ 'trecome'
 */
import mysql from 'mysql2/promise';

export class StatsConfigError extends Error {}

export function siteKey(): string {
  const site = process.env.STATS_SITE?.trim();
  if (!site) throw new StatsConfigError('Chưa cấu hình STATS_SITE');
  return site;
}

export function isConfigured(): boolean {
  return Boolean(process.env.STATS_DB_NAME?.trim() && process.env.STATS_SITE?.trim());
}

// Next dev tái nạp module liên tục; giữ pool trên globalThis để khỏi mở
// hàng chục connection pool chồng nhau.
const globalForPool = globalThis as unknown as { __visitsPool?: mysql.Pool };

function pool(): mysql.Pool {
  if (!process.env.STATS_DB_NAME?.trim()) throw new StatsConfigError('Chưa cấu hình STATS_DB_NAME');
  if (!globalForPool.__visitsPool) {
    globalForPool.__visitsPool = mysql.createPool({
      host: process.env.STATS_DB_HOST || '127.0.0.1',
      user: process.env.STATS_DB_USER || 'webstats',
      password: process.env.STATS_DB_PASS || '',
      database: process.env.STATS_DB_NAME,
      connectionLimit: 5,
      waitForConnections: true,
      // MariaDB trên VPS chạy Asia/Ho_Chi_Minh nên cột DATETIME lưu giờ +07.
      // Khai báo đúng ở đây thì mysql2 mới dựng được Date đúng mốc thời gian;
      // để mặc định 'Z' là lệch đúng 7 tiếng.
      // Lưu ý: chỉ đúng cho DATETIME. Cột kiểu DATE mà để mysql2 tự dựng Date
      // thì thành 00:00+07 = 17:00 UTC hôm trước, nên phần gom theo ngày dùng
      // DATE_FORMAT trả thẳng chuỗi thay vì để nó chuyển đổi.
      timezone: '+07:00',
    });
  }
  return globalForPool.__visitsPool;
}

/* ------------------------------------------------------------------ */
/* Bóc user-agent                                                      */
/* ------------------------------------------------------------------ */

/**
 * Chỉ cần họ trình duyệt / HĐH / loại thiết bị, không cần số hiệu bản dựng —
 * nên viết tay ~40 dòng thay vì kéo thêm ua-parser-js vào cả hai project.
 * Thứ tự các nhánh có ý nghĩa: Edge và Opera đều tự nhận là Chrome, Chrome tự
 * nhận là Safari, nên phải xét thằng cụ thể trước.
 */
export function parseUserAgent(ua: string): { device: string; browser: string; os: string } {
  const s = ua || '';

  const device = /iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(s)
    ? 'tablet'
    : /Mobi|Android|iPhone|iPod|Windows Phone/i.test(s)
      ? 'mobile'
      : 'desktop';

  let browser = 'Khác';
  if (/Edg[A-Z]?\//i.test(s)) browser = 'Edge';
  else if (/OPR\/|Opera/i.test(s)) browser = 'Opera';
  else if (/SamsungBrowser/i.test(s)) browser = 'Samsung Internet';
  else if (/CriOS/i.test(s)) browser = 'Chrome';
  else if (/FxiOS/i.test(s)) browser = 'Firefox';
  else if (/Firefox\//i.test(s)) browser = 'Firefox';
  else if (/Chrome\//i.test(s)) browser = 'Chrome';
  else if (/Safari\//i.test(s)) browser = 'Safari';

  let os = 'Khác';
  if (/Windows NT/i.test(s)) os = 'Windows';
  else if (/iPhone|iPad|iPod/i.test(s)) os = 'iOS';
  else if (/Android/i.test(s)) os = 'Android';
  else if (/Mac OS X/i.test(s)) os = 'macOS';
  else if (/CrOS/i.test(s)) os = 'ChromeOS';
  else if (/Linux/i.test(s)) os = 'Linux';

  return { device, browser, os };
}

const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|embedly|quora|pinterest|vkshare|preview|scanner|curl|wget|python-requests|axios|headless|lighthouse|pagespeed|gtmetrix|semrush|ahrefs|mj12|dotbot|petalbot|applebot|duckduckbot|yandex/i;

export function isBot(ua: string): boolean {
  return !ua || BOT_RE.test(ua);
}

/* ------------------------------------------------------------------ */
/* Ghi nhận lượt truy cập                                              */
/* ------------------------------------------------------------------ */

export interface VisitInput {
  visitorId: string;
  sessionId: string;
  isNewVisitor: boolean;
  ip: string;
  path: string;
  title?: string | null;
  referrer?: string | null;
  screen?: string | null;
  lang?: string | null;
  userAgent: string;
}

const cut = (value: string | null | undefined, max: number) =>
  value ? value.slice(0, max) : null;

export async function recordVisit(input: VisitInput): Promise<void> {
  const { device, browser, os } = parseUserAgent(input.userAgent);
  await pool().execute(
    `INSERT INTO visits
       (site, visitor_id, session_id, is_new_visitor, ip, path, title, referrer,
        device, browser, os, screen, lang, user_agent)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      siteKey(),
      input.visitorId,
      input.sessionId,
      input.isNewVisitor ? 1 : 0,
      cut(input.ip, 45),
      cut(input.path, 512),
      cut(input.title, 255),
      cut(input.referrer, 512),
      device,
      browser,
      os,
      cut(input.screen, 16),
      cut(input.lang, 16),
      cut(input.userAgent, 512),
    ]
  );
}

/* ------------------------------------------------------------------ */
/* Truy vấn cho màn hình thống kê                                      */
/* ------------------------------------------------------------------ */

export const VISIT_RANGES = {
  today: { label: 'Hôm nay', days: 0 },
  '7d': { label: '7 ngày', days: 7 },
  '28d': { label: '28 ngày', days: 28 },
  '90d': { label: '90 ngày', days: 90 },
  all: { label: 'Tất cả', days: null },
} as const;

export type VisitRange = keyof typeof VISIT_RANGES;

export function isVisitRange(value: string | null): value is VisitRange {
  return value !== null && value in VISIT_RANGES;
}

export interface VisitRow {
  id: number;
  createdAt: string;
  ip: string;
  visitorId: string;
  sessionId: string;
  isNewVisitor: boolean;
  path: string;
  title: string | null;
  referrer: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  screen: string | null;
  lang: string | null;
}

export interface VisitorRow {
  visitorId: string;
  visits: number;
  ipCount: number;
  lastIp: string;
  firstSeen: string;
  lastSeen: string;
  lastPath: string;
  device: string | null;
}

export interface VisitStats {
  range: VisitRange;
  summary: {
    visits: number;
    visitors: number;
    ips: number;
    sessions: number;
    newVisitors: number;
    returningVisits: number;
  };
  daily: { date: string; visits: number; visitors: number }[];
  topPaths: { name: string; value: number }[];
  topReferrers: { name: string; value: number }[];
  devices: { name: string; value: number }[];
  browsers: { name: string; value: number }[];
  topVisitors: VisitorRow[];
  recent: VisitRow[];
  recentTotal: number;
  page: number;
  pageSize: number;
  updatedAt: string;
}

/**
 * Điều kiện thời gian dùng chung cho mọi truy vấn bên dưới.
 *
 * Mốc là CURDATE() chứ không phải NOW(), tức cắt theo **ngày lịch giờ Việt Nam**
 * (MariaDB chạy Asia/Ho_Chi_Minh). Cố ý khớp cách GA4 hiểu `NdaysAgo..today` để
 * hai màn hình /admin/analytics và /admin/visitors so được với nhau; dùng NOW()
 * thì thành cửa sổ trượt N×24h và hai bên lệch nhau.
 */
function rangeClause(range: VisitRange): { sql: string; params: (string | number)[] } {
  const site = siteKey();
  const days = VISIT_RANGES[range].days;
  if (days === null) return { sql: 'site = ?', params: [site] };
  if (days === 0) return { sql: 'site = ? AND DATE(created_at) = CURDATE()', params: [site] };
  return {
    sql: 'site = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)',
    params: [site, days],
  };
}

type Row = Record<string, unknown>;

const num = (v: unknown) => Number(v ?? 0);
const str = (v: unknown) => (v == null ? '' : String(v));
/** mysql2 trả DATETIME thành Date; chuẩn hoá về ISO cho client. */
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v ?? ''));

export const PAGE_SIZE = 50;

export async function getVisitStats(
  range: VisitRange,
  page: number,
  search: string
): Promise<VisitStats> {
  const { sql: where, params } = rangeClause(range);
  const db = pool();

  // Ô tìm kiếm lọc theo IP, visitor_id hoặc đường dẫn — chỉ áp cho bảng
  // "lượt truy cập gần nhất", các biểu đồ tổng quan vẫn giữ nguyên toàn kỳ.
  const term = search.trim();
  const searchSql = term ? ' AND (ip LIKE ? OR visitor_id LIKE ? OR path LIKE ?)' : '';
  const searchParams = term ? [`%${term}%`, `%${term}%`, `%${term}%`] : [];

  const offset = Math.max(0, (page - 1) * PAGE_SIZE);

  const q = <T = Row[]>(sql: string, p: unknown[] = []) =>
    db.query(sql, p).then(([rows]) => rows as T);

  const [summary, daily, paths, referrers, devices, browsers, visitors, recent, recentCount] =
    await Promise.all([
      q(
        `SELECT COUNT(*) AS visits,
                COUNT(DISTINCT visitor_id) AS visitors,
                COUNT(DISTINCT ip) AS ips,
                COUNT(DISTINCT session_id) AS sessions,
                SUM(is_new_visitor) AS newVisitors
           FROM visits WHERE ${where}`,
        params
      ),
      q(
        `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS d, COUNT(*) AS visits, COUNT(DISTINCT visitor_id) AS visitors
           FROM visits WHERE ${where}
          GROUP BY d ORDER BY d`,
        params
      ),
      q(
        `SELECT path AS name, COUNT(*) AS value FROM visits WHERE ${where}
          GROUP BY path ORDER BY value DESC LIMIT 10`,
        params
      ),
      q(
        `SELECT COALESCE(NULLIF(referrer, ''), 'Truy cập thẳng') AS name, COUNT(*) AS value
           FROM visits WHERE ${where}
          GROUP BY name ORDER BY value DESC LIMIT 10`,
        params
      ),
      q(
        `SELECT device AS name, COUNT(*) AS value FROM visits WHERE ${where}
          GROUP BY device ORDER BY value DESC`,
        params
      ),
      q(
        `SELECT browser AS name, COUNT(*) AS value FROM visits WHERE ${where}
          GROUP BY browser ORDER BY value DESC LIMIT 8`,
        params
      ),
      q(
        `SELECT visitor_id,
                COUNT(*) AS visits,
                COUNT(DISTINCT ip) AS ipCount,
                SUBSTRING_INDEX(GROUP_CONCAT(ip ORDER BY created_at DESC), ',', 1) AS lastIp,
                MIN(created_at) AS firstSeen,
                MAX(created_at) AS lastSeen,
                SUBSTRING_INDEX(GROUP_CONCAT(path ORDER BY created_at DESC), ',', 1) AS lastPath,
                SUBSTRING_INDEX(GROUP_CONCAT(device ORDER BY created_at DESC), ',', 1) AS device
           FROM visits WHERE ${where}
          GROUP BY visitor_id ORDER BY visits DESC, lastSeen DESC LIMIT 20`,
        params
      ),
      q(
        `SELECT id, created_at, ip, visitor_id, session_id, is_new_visitor, path, title,
                referrer, device, browser, os, screen, lang
           FROM visits WHERE ${where}${searchSql}
          ORDER BY created_at DESC LIMIT ${PAGE_SIZE} OFFSET ${offset}`,
        [...params, ...searchParams]
      ),
      q(`SELECT COUNT(*) AS total FROM visits WHERE ${where}${searchSql}`, [
        ...params,
        ...searchParams,
      ]),
    ]);

  const s = (summary as Row[])[0] ?? {};
  const visits = num(s.visits);
  const newVisitors = num(s.newVisitors);

  return {
    range,
    summary: {
      visits,
      visitors: num(s.visitors),
      ips: num(s.ips),
      sessions: num(s.sessions),
      newVisitors,
      returningVisits: Math.max(0, visits - newVisitors),
    },
    daily: (daily as Row[]).map((r) => ({
      date: str(r.d),
      visits: num(r.visits),
      visitors: num(r.visitors),
    })),
    topPaths: (paths as Row[]).map((r) => ({ name: str(r.name), value: num(r.value) })),
    topReferrers: (referrers as Row[]).map((r) => ({ name: str(r.name), value: num(r.value) })),
    devices: (devices as Row[]).map((r) => ({ name: str(r.name) || 'Khác', value: num(r.value) })),
    browsers: (browsers as Row[]).map((r) => ({ name: str(r.name) || 'Khác', value: num(r.value) })),
    topVisitors: (visitors as Row[]).map((r) => ({
      visitorId: str(r.visitor_id),
      visits: num(r.visits),
      ipCount: num(r.ipCount),
      lastIp: str(r.lastIp),
      firstSeen: iso(r.firstSeen),
      lastSeen: iso(r.lastSeen),
      lastPath: str(r.lastPath),
      device: str(r.device) || null,
    })),
    recent: (recent as Row[]).map((r) => ({
      id: num(r.id),
      createdAt: iso(r.created_at),
      ip: str(r.ip),
      visitorId: str(r.visitor_id),
      sessionId: str(r.session_id),
      isNewVisitor: num(r.is_new_visitor) === 1,
      path: str(r.path),
      title: (r.title as string) ?? null,
      referrer: (r.referrer as string) ?? null,
      device: (r.device as string) ?? null,
      browser: (r.browser as string) ?? null,
      os: (r.os as string) ?? null,
      screen: (r.screen as string) ?? null,
      lang: (r.lang as string) ?? null,
    })),
    recentTotal: num((recentCount as Row[])[0]?.total),
    page,
    pageSize: PAGE_SIZE,
    updatedAt: new Date().toISOString(),
  };
}
