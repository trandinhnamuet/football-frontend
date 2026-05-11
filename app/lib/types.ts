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
