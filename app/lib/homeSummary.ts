import { Article, Match, TeamStats } from './types';

// Dữ liệu tóm tắt cho preview trang chủ (mô tả og:description + ảnh og:image).
// Chạy phía server nên tự tính "hôm nay" theo giờ Việt Nam — múi giờ của VPS
// không nhất thiết là +07.

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const TZ = 'Asia/Ho_Chi_Minh';
/** Ngày thi đấu kết thúc lúc 22:00, khớp MATCH_DAY_END_HOUR phía client. */
const MATCH_DAY_END_HOUR = 22;
const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

export interface HomeSummary {
  next: Match | null;
  /** Trận gần nhất có kết quả thắng/hòa/thua (bỏ qua chia đôi, hủy). */
  last: Match | null;
  stats: TeamStats | null;
  latest: Article | null;
  playerCount: number;
}

async function getJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(3000) });
    return res.ok ? ((await res.json()) as T) : null;
  } catch { return null; }
}

/** Ngày + giờ hiện tại ở Việt Nam: { day: 'YYYY-MM-DD', hour }. */
function nowInVietnam(): { day: string; hour: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date())
      .map(p => [p.type, p.value]),
  );
  return { day: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

export async function getHomeSummary(): Promise<HomeSummary> {
  const [matches, stats, articles, players] = await Promise.all([
    getJSON<Match[]>('/api/matches'),
    getJSON<TeamStats>('/api/matches/stats'),
    getJSON<Article[]>('/api/articles'),
    getJSON<unknown[]>('/api/players'),
  ]);
  const now = nowInVietnam();
  const day = (m: Match) => m.date.slice(0, 10);
  const isPast = (m: Match) => day(m) < now.day || (day(m) === now.day && now.hour >= MATCH_DAY_END_HOUR);
  const list = matches || [];
  const next = list.filter(m => !isPast(m)).sort((a, b) => day(a).localeCompare(day(b)) || a.week - b.week)[0] ?? null;
  const last = list
    .filter(m => isPast(m) && ['W', 'D', 'L'].includes(m.result))
    .sort((a, b) => day(b).localeCompare(day(a)) || b.week - a.week)[0] ?? null;
  return { next, last, stats, latest: articles?.[0] ?? null, playerCount: players?.length ?? 0 };
}

/** "Thứ Ba 13/10" */
export function matchDayLabel(m: Match): string {
  const [y, mo, d] = m.date.slice(0, 10).split('-').map(Number);
  const wd = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
  return `${WEEKDAYS[wd]} ${String(d).padStart(2, '0')}/${String(mo).padStart(2, '0')}`;
}

/** Số ngày từ hôm nay (giờ VN) tới ngày thi đấu. */
export function daysToMatch(m: Match): number {
  const today = Date.parse(`${nowInVietnam().day}T00:00:00Z`);
  return Math.round((Date.parse(`${m.date.slice(0, 10)}T00:00:00Z`) - today) / 86400000);
}

/** "thắng Okiwa 4-3" — tỉ số luôn theo thứ tự Lon Fanta trước. */
export function resultPhrase(m: Match): string {
  const verb = m.result === 'W' ? 'thắng' : m.result === 'D' ? 'hòa' : 'thua';
  return `${verb} ${m.opponent} ${m.goals_for}-${m.goals_against}`;
}

/** Mô tả og:description trang chủ — thay đổi theo lịch & kết quả mới nhất. */
export function homeDescription(s: HomeSummary): string {
  const parts: string[] = [];
  if (s.next) {
    const when = [s.next.time, matchDayLabel(s.next)].filter(Boolean).join(', ');
    parts.push(`⚽ Trận kế tiếp: Lon Fanta FC vs ${s.next.opponent} — ${when}${s.next.venue ? ` tại ${s.next.venue}` : ''}.`);
  }
  if (s.last) parts.push(`Kết quả gần nhất: ${resultPhrase(s.last)}.`);
  if (s.stats && s.stats.played) parts.push(`Mùa giải: ${s.stats.wins} thắng · ${s.stats.draws} hòa · ${s.stats.losses} thua.`);
  parts.push(`Lịch thi đấu, đội hình${s.playerCount ? ` ${s.playerCount} thành viên` : ''}, tin tức & highlight của đội bóng phong trào Hà Nội #ĐamMêBấtTận.`);
  return parts.join(' ');
}
