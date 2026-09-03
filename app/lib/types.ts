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
}

export interface TeamStats {
  played: number;
  wins: number;
  draws: number;
  losses: number;
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
