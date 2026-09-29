export interface Player {
  id: number;
  num: number;
  first_name: string;
  last_name: string;
  role: string;
  joined: string;
  boots: string;
  nick: string;
  image_url: string | null;
  zoom_image_url: string | null;
  is_active: boolean;
  stat_goals: number;
  stat_assists: number;
  stat_saves: number;
  stat_tackles: number;
  stat_passes: number;
  stat_attendance: number;
  stat_minutes: number;
  stat_points: number;
  stat_matches: number;
}

export interface Article {
  id: number;
  title: string;
  title_en: string;
  content: string;
  content_en: string;
  excerpt: string;
  excerpt_en: string;
  image_url: string | null;
  tag: string;
  tag_en: string;
  published_at: string;
  /** Thông báo quan trọng — chỉ một bài được bật tại một thời điểm. */
  is_important: boolean;
  /** Ngày cuối còn quan trọng (YYYY-MM-DD), null = không hẹn. */
  important_until: string | null;
}

/** Bài quan trọng còn hiệu lực hôm nay (chưa qua ngày hẹn). */
export function isImportantActive(a: Pick<Article, 'is_important' | 'important_until'>): boolean {
  if (!a.is_important) return false;
  if (!a.important_until) return true;
  return a.important_until.slice(0, 10) >= new Date().toISOString().slice(0, 10);
}

export interface MemorialPost {
  id: number;
  slug?: string | null;
  title: string;
  title_en: string;
  content: string;
  content_en: string;
  excerpt: string;
  excerpt_en: string;
  image_url: string | null;
  tag: string;
  tag_en: string;
  published_at: string;
}

/** Cầu thủ gắn với tài khoản đăng nhập (rút gọn). */
export interface AuthPlayer {
  id: number;
  num: number;
  first_name: string;
  last_name: string;
  role: string | null;
  nick: string | null;
  image_url: string | null;
}

/** Tài khoản thành viên, như backend trả về sau đăng nhập / GET /api/auth/me. */
export interface AuthUser {
  id: number;
  username: string;
  display_name: string | null;
  /** Còn dùng mật khẩu mặc định 123123123 — nên nhắc đổi. */
  is_default_password: boolean;
  is_active: boolean;
  last_login_at: string | null;
  player: AuthPlayer | null;
}

export interface Match {
  id: number;
  week: number;
  date: string;
  opponent: string;
  venue: string;
  result: string;
  score: string;
  goals_for: number;
  goals_against: number;
  is_upcoming: boolean;
  time: string;
  image_url: string | null;
  /** Loại sân: 5, 7 hoặc 11 người. */
  pitch_size: number;
  /** Màu áo đội mặc trong trận, vd. "Cam" / "Đen". */
  kit_color: string | null;
  /** Màu áo thứ hai (dự phòng / đổi nếu trùng đối thủ). */
  kit_color_2: string | null;
}

/** Danh sách màu áo đã nhập của trận (1 hoặc 2 màu, bỏ ô trống). */
export function matchKits(m: Pick<Match, 'kit_color' | 'kit_color_2'>): string[] {
  return [m.kit_color, m.kit_color_2].map(k => (k || '').trim()).filter(Boolean);
}

/** Gợi ý màu áo trong form admin và màu swatch tương ứng. */
export const KIT_COLORS: { name: string; hex: string }[] = [
  { name: 'Cam', hex: '#FF6B1A' },
  { name: 'Đen', hex: '#141414' },
  { name: 'Trắng', hex: '#f4f1ea' },
  { name: 'Xanh dương', hex: '#2a6fdb' },
  { name: 'Xanh lá', hex: '#1f8a5b' },
  { name: 'Đỏ', hex: '#c0262b' },
  { name: 'Vàng', hex: '#f5c518' },
  { name: 'Tím', hex: '#7b4fa8' },
  { name: 'Xám', hex: '#8a8a8a' },
  { name: 'Hồng', hex: '#e75480' },
];

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

/**
 * Màu swatch cho tên màu áo nhập tự do ("Áo cam", "xanh duong"...). Trả về
 * null nếu không nhận ra để chỉ hiện chữ.
 */
export function kitColorHex(name: string | null | undefined): string | null {
  if (!name) return null;
  const n = stripDiacritics(name).toLowerCase();
  const hit = KIT_COLORS.find(k => n.includes(stripDiacritics(k.name).toLowerCase()));
  if (hit) return hit.hex;
  if (/blue|navy/.test(n)) return '#2a6fdb';
  if (/green/.test(n)) return '#1f8a5b';
  if (/black/.test(n)) return '#141414';
  if (/white/.test(n)) return '#f4f1ea';
  if (/orange/.test(n)) return '#FF6B1A';
  if (/red/.test(n)) return '#c0262b';
  if (/yellow/.test(n)) return '#f5c518';
  if (/xanh/.test(n)) return '#2a6fdb';
  return null;
}

/** "Trần Hữu Giang" → "tran-huu-giang", cùng quy ước với slug bài giới thiệu. */
export function slugify(s: string): string {
  return stripDiacritics(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Bỏ dấu + hạ chữ để so khớp tìm kiếm ("Đạt" khớp "dat"). */
export function searchKey(s: string): string {
  return stripDiacritics(s).toLowerCase();
}

/**
 * Bài giới thiệu của từng cầu thủ, khớp theo slug của họ tên. Trả về map
 * player.id → đường dẫn /members/<slug>; cầu thủ chưa có bài thì không có.
 */
export function memberProfileLinks(players: Pick<Player, 'id' | 'first_name' | 'last_name'>[], posts: Pick<MemorialPost, 'id' | 'slug'>[]): Record<number, string> {
  const bySlug = new Map(posts.filter(p => p.slug).map(p => [p.slug as string, p]));
  const out: Record<number, string> = {};
  for (const p of players) {
    const slug = slugify(`${p.first_name} ${p.last_name}`);
    if (bySlug.has(slug)) out[p.id] = `/members/${slug}`;
  }
  return out;
}

export const PITCH_SIZES = [5, 7, 11] as const;

/**
 * Mã kết quả trận đấu. 'S' (split) là trận chia đôi đội đá nội bộ: cả hai bên
 * đều là mình nên không có thắng/hòa/thua, và bàn thắng/bàn thủng cũng không
 * cộng vào tổng của đội. 'C' (cancelled) là trận bị hủy vì lý do bất khả kháng
 * (mưa bão, sân hỏng, đối thủ bỏ trận...): không có tỷ số và không tính vào
 * bất cứ thống kê nào.
 */
export type MatchResult = 'W' | 'D' | 'L' | 'S' | 'C';

export const SPLIT_RESULT: MatchResult = 'S';
export const CANCELLED_RESULT: MatchResult = 'C';

export const MATCH_RESULTS: { code: MatchResult; vi: string; en: string }[] = [
  { code: 'W', vi: 'Thắng', en: 'Win' },
  { code: 'D', vi: 'Hòa', en: 'Draw' },
  { code: 'L', vi: 'Thua', en: 'Loss' },
  { code: 'S', vi: 'Chia đôi (đá nội bộ)', en: 'Split squad (internal)' },
  { code: 'C', vi: 'Hủy (bất khả kháng)', en: 'Cancelled (force majeure)' },
];

export function resultLabel(code: string, lang: 'vi' | 'en' = 'vi'): string {
  return MATCH_RESULTS.find(r => r.code === code)?.[lang] || code;
}


/** "Sân 7 người" / "7-a-side" */
export function pitchLabel(n: number | null | undefined, lang: 'vi' | 'en'): string {
  const size = n || 7;
  return lang === 'en' ? `${size}-a-side` : `Sân ${size} người`;
}

export interface TeamStats {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  /** Số trận chia đôi đá nội bộ — nằm ngoài thắng/hòa/thua và gf/ga. */
  splits: number;
  /** Số trận bị hủy vì lý do bất khả kháng — không tính vào played/gf/ga. */
  cancelled: number;
  gf: number;
  ga: number;
}

export interface DriveLink {
  id: number;
  title: string;
  url: string;
  description: string | null;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface VideoHighlight {
  id: number;
  youtube_url: string;
  title: string;
  title_en: string;
  is_active: boolean;
  channel_url: string;
  updated_at: string;
}

export interface RecommendedVideo {
  videoId: string;
  title: string;
  published: string;
  thumbnail: string;
  url: string;
}

export interface BannerSlide {
  id: number;
  image_url: string;
  caption: string;
  caption_en: string;
  link_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const ROLES: Record<string, { vi: string; en: string }> = {
  GK: { vi: 'Thủ môn', en: 'Goalkeeper' },
  DEF: { vi: 'Hậu vệ', en: 'Defender' },
  MID: { vi: 'Tiền vệ', en: 'Midfielder' },
  FWD: { vi: 'Tiền đạo', en: 'Forward' },
  'Tự do': { vi: 'Tự do', en: 'Free Role' },
};

export const FANTA = '#FF6B1A';

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
}

/** Local midnight of a date string, so comparisons ignore the time of day. */
export function dayStart(iso: string): number {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function daysUntil(iso: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((dayStart(iso) - now.getTime()) / 86400000);
}

/** Match day ends at 22:00 local, not midnight — kick-off is 17:30. */
export const MATCH_DAY_END_HOUR = 22;

/**
 * A match counts as played once its day is over — the is_upcoming flag and the
 * presence of a score are deliberately ignored, so a fixture nobody has filled
 * the result in for still lands in the results column. A match today stays the
 * featured next match until 22:00, then moves to the results column.
 */
export function isMatchPast(m: Pick<Match, 'date'>): boolean {
  return Date.now() >= dayStart(m.date) + MATCH_DAY_END_HOUR * 3600000;
}

/** Past matches still missing a result — what the admin dashboard warns about. */
export function matchesMissingResult(matches: Match[]): Match[] {
  return matches
    .filter(m => isMatchPast(m) && !m.result)
    .sort((a, b) => dayStart(b.date) - dayStart(a.date) || b.week - a.week);
}

export function initials(p: Player): string {
  return ((p.first_name?.[0] || '') + (p.last_name?.[0] || '')).toUpperCase();
}

const COLORS = [
  ['#FF6B1A', '#fff'], ['#1a1a1a', '#FF6B1A'], ['#FFB347', '#1a1a1a'],
  ['#0E2A47', '#FFB347'], ['#7A2E0E', '#FFE8D6'], ['#F5E6D3', '#7A2E0E'],
  ['#2E1A0E', '#FF6B1A'], ['#FF8C42', '#fff'],
];

export function avatarColor(p: Player): [string, string] {
  return COLORS[p.id % COLORS.length] as [string, string];
}
