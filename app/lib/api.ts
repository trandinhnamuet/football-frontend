import { Player, Article, Match, TeamStats, DriveLink, VideoHighlight, RecommendedVideo, BannerSlide } from './types';

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

function handleUnauthorized() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('lffc_admin_pw');
    window.dispatchEvent(new CustomEvent('admin-unauthorized'));
  }
}

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Players
  getPlayers: () => fetchJSON<Player[]>('/api/players'),
  getPlayer: (id: number) => fetchJSON<Player>(`/api/players/${id}`),
  getLeaderboard: () => fetchJSON<Player[]>('/api/players/leaderboard'),
  updatePlayer: (id: number, data: Partial<Player>, password: string) =>
    fetchJSON<Player>(`/api/players/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'x-admin-password': password },
    }),
  uploadPlayerImage: async (id: number, file: File, password: string) => {
    const form = new FormData();
    form.append('image', file);
    const r = await fetch(`${BASE}/api/players/${id}/image`, {
      method: 'PATCH',
      headers: { 'x-admin-password': password },
      body: form,
    });
    if (r.status === 401) { handleUnauthorized(); throw new Error('Unauthorized'); }
    return r.json();
  },
  uploadPlayerZoomImage: async (id: number, file: File, password: string) => {
    const form = new FormData();
    form.append('image', file);
    const r = await fetch(`${BASE}/api/players/${id}/zoom-image`, {
      method: 'PATCH',
      headers: { 'x-admin-password': password },
      body: form,
    });
    if (r.status === 401) { handleUnauthorized(); throw new Error('Unauthorized'); }
    return r.json();
  },
  createPlayer: (data: Partial<Player>, password: string) =>
    fetchJSON<Player>('/api/players', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'x-admin-password': password },
    }),
  deletePlayer: (id: number, password: string) =>
    fetchJSON<{ deleted: boolean; id: number }>(`/api/players/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    }),
  importPlayers: (password: string) =>
    fetchJSON<{ message: string; added: number; skipped: number }>('/api/sync/import-players', {
      method: 'POST',
      headers: { 'x-admin-password': password },
    }),

  // Articles
  getArticles: () => fetchJSON<Article[]>('/api/articles'),
  getArticle: (id: number) => fetchJSON<Article>(`/api/articles/${id}`),
  createArticle: (data: Partial<Article>, password: string) =>
    fetchJSON<Article>('/api/articles', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'x-admin-password': password },
    }),
  updateArticle: (id: number, data: Partial<Article>, password: string) =>
    fetchJSON<Article>(`/api/articles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'x-admin-password': password },
    }),
  deleteArticle: (id: number, password: string) =>
    fetchJSON(`/api/articles/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    }),
  uploadArticleImage: async (file: File, password: string) => {
    const form = new FormData();
    form.append('image', file);
    const r = await fetch(`${BASE}/api/articles/upload-image`, {
      method: 'POST',
      headers: { 'x-admin-password': password },
      body: form,
    });
    if (r.status === 401) { handleUnauthorized(); throw new Error('Unauthorized'); }
    return r.json() as Promise<{ url: string }>;
  },

  // Matches
  getMatches: () => fetchJSON<Match[]>('/api/matches'),
  getPlayed: () => fetchJSON<Match[]>('/api/matches/played'),
  getUpcoming: () => fetchJSON<Match[]>('/api/matches/upcoming'),
  getTeamStats: () => fetchJSON<TeamStats>('/api/matches/stats'),
  createMatch: (data: Partial<Match>, password: string) =>
    fetchJSON<Match>('/api/matches', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'x-admin-password': password },
    }),
  updateMatch: (id: number, data: Partial<Match>, password: string) =>
    fetchJSON<Match>(`/api/matches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'x-admin-password': password },
    }),
  deleteMatch: (id: number, password: string) =>
    fetchJSON(`/api/matches/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    }),
  uploadMatchImage: async (file: File, password: string) => {
    const form = new FormData();
    form.append('image', file);
    const r = await fetch(`${BASE}/api/matches/upload-image`, {
      method: 'POST',
      headers: { 'x-admin-password': password },
      body: form,
    });
    if (r.status === 401) { handleUnauthorized(); throw new Error('Unauthorized'); }
    return r.json() as Promise<{ url: string }>;
  },

  // Sync
  triggerSync: (force = false) =>
    fetchJSON<{ synced: boolean; message: string }>(`/api/sync${force ? '?force=1' : ''}`),

  // Drive Links
  getDriveLinksPublic: () => fetchJSON<DriveLink[]>('/api/drive-links/public'),
  getDriveLinksAdmin: (password: string) =>
    fetchJSON<DriveLink[]>('/api/drive-links', { headers: { 'x-admin-password': password } }),
  createDriveLink: (data: Partial<DriveLink>, password: string) =>
    fetchJSON<DriveLink>('/api/drive-links', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'x-admin-password': password },
    }),
  updateDriveLink: (id: number, data: Partial<DriveLink>, password: string) =>
    fetchJSON<DriveLink>(`/api/drive-links/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'x-admin-password': password },
    }),
  deleteDriveLink: (id: number, password: string) =>
    fetchJSON(`/api/drive-links/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    }),

  // Site settings — global default theme
  getThemeSetting: () => fetchJSON<{ theme: 'dark' | 'light'; version: number }>('/api/settings/theme'),
  setThemeSetting: (theme: 'dark' | 'light', password: string) =>
    fetchJSON<{ theme: 'dark' | 'light'; version: number }>('/api/settings/theme', {
      method: 'PUT',
      body: JSON.stringify({ theme }),
      headers: { 'x-admin-password': password },
    }),

  // i18n global overrides
  getI18n: () => fetchJSON<{ vi: Record<string, any>; en: Record<string, any> }>('/api/i18n'),
  updateI18n: (data: { vi?: Record<string, any>; en?: Record<string, any> }, password: string) =>
    fetchJSON<void>('/api/i18n', {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'x-admin-password': password },
    }),

  // Video Highlight
  getVideoHighlight: () => fetchJSON<VideoHighlight>('/api/video-highlight'),
  getVideoRecommendations: () => fetchJSON<RecommendedVideo[]>('/api/video-highlight/recommendations'),
  updateVideoHighlight: (data: Partial<VideoHighlight>, password: string) =>
    fetchJSON<VideoHighlight>('/api/video-highlight', {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'x-admin-password': password },
    }),

  // Banner Slides
  getBannerSlidesPublic: () => fetchJSON<BannerSlide[]>('/api/banner-slides/public'),
  getBannerSlidesAdmin: () => fetchJSON<BannerSlide[]>('/api/banner-slides'),
  createBannerSlide: (data: Partial<BannerSlide>, password: string) =>
    fetchJSON<BannerSlide>('/api/banner-slides', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'x-admin-password': password },
    }),
  updateBannerSlide: (id: number, data: Partial<BannerSlide>, password: string) =>
    fetchJSON<BannerSlide>(`/api/banner-slides/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'x-admin-password': password },
    }),
  deleteBannerSlide: (id: number, password: string) =>
    fetchJSON(`/api/banner-slides/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    }),
  uploadBannerImage: async (file: File, password: string) => {
    const form = new FormData();
    form.append('image', file);
    const r = await fetch(`${BASE}/api/banner-slides/upload-image`, {
      method: 'POST',
      headers: { 'x-admin-password': password },
      body: form,
    });
    if (r.status === 401) { handleUnauthorized(); throw new Error('Unauthorized'); }
    return r.json() as Promise<{ url: string }>;
  },

  // About Page
  getAboutPage: () => fetchJSON<{ id: number; banner_image_url: string; content_vi: string; content_en: string; updated_at: string }>('/api/about'),
  updateAboutPage: (data: { banner_image_url?: string; content_vi?: string; content_en?: string }, password: string) =>
    fetchJSON<{ id: number; banner_image_url: string; content_vi: string; content_en: string; updated_at: string }>('/api/about', {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'x-admin-password': password },
    }),
  uploadAboutBanner: async (file: File, password: string) => {
    const form = new FormData();
    form.append('image', file);
    const r = await fetch(`${BASE}/api/about/upload-banner`, {
      method: 'POST',
      headers: { 'x-admin-password': password },
      body: form,
    });
    if (r.status === 401) { handleUnauthorized(); throw new Error('Unauthorized'); }
    return r.json() as Promise<{ url: string }>;
  },
};
