import { Player, Article, MemorialPost, Match, TeamStats, DriveLink, VideoHighlight, RecommendedVideo, BannerSlide, AuthUser } from './types';

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const BASE = API_BASE;

export interface ArticleImage {
  filename: string;
  url: string;
  size: number;
  uploaded_at: string;
}

/** Lỗi HTTP có kèm status để caller phân biệt 401 với lỗi mạng. */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const AUTH_TOKEN_KEY = 'lffc_user_token';

export function getAuthToken(): string {
  return typeof window !== 'undefined' ? (localStorage.getItem(AUTH_TOKEN_KEY) || '') : '';
}

function bearer(token?: string): Record<string, string> {
  const t = token ?? getAuthToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// Gọi API phía tài khoản thành viên. Khác fetchJSON ở chỗ 401 KHÔNG được coi là
// admin hết hạn (không xoá mật khẩu admin đang lưu) — chỉ ném ApiError(401).
async function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) message = Array.isArray(body.message) ? body.message.join(', ') : String(body.message);
    } catch {}
    throw new ApiError(res.status, message);
  }
  return res.json();
}

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
  /** Thông báo quan trọng đang hiệu lực, hoặc null. */
  getImportantArticle: () => fetchJSON<{ article: Article | null }>('/api/articles/important').then(r => r.article),
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
    if (!r.ok) throw new Error(await r.text() || `HTTP ${r.status}`);
    return r.json() as Promise<{ url: string; filename: string; size: number }>;
  },
  getArticleImages: (password: string) =>
    fetchJSON<ArticleImage[]>('/api/articles/images', {
      headers: { 'x-admin-password': password },
    }),
  deleteArticleImage: (filename: string, password: string) =>
    fetchJSON<{ deleted: boolean; filename: string }>(`/api/articles/images/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    }),

  // Memorial Posts
  getMemorialPosts: () => fetchJSON<MemorialPost[]>('/api/memorial-posts'),
  getMemorialPost: (idOrSlug: number | string) => fetchJSON<MemorialPost>(`/api/memorial-posts/${idOrSlug}`),
  createMemorialPost: (data: Partial<MemorialPost>, password: string) =>
    fetchJSON<MemorialPost>('/api/memorial-posts', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'x-admin-password': password },
    }),
  updateMemorialPost: (id: number, data: Partial<MemorialPost>, password: string) =>
    fetchJSON<MemorialPost>(`/api/memorial-posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'x-admin-password': password },
    }),
  deleteMemorialPost: (id: number, password: string) =>
    fetchJSON(`/api/memorial-posts/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    }),
  uploadMemorialPostImage: async (file: File, password: string) => {
    const form = new FormData();
    form.append('image', file);
    const r = await fetch(`${BASE}/api/memorial-posts/upload-image`, {
      method: 'POST',
      headers: { 'x-admin-password': password },
      body: form,
    });
    if (r.status === 401) { handleUnauthorized(); throw new Error('Unauthorized'); }
    return r.json() as Promise<{ url: string }>;
  },

  // Auth — tài khoản thành viên
  login: (username: string, password: string) =>
    authFetch<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: (token?: string) => authFetch<AuthUser>('/api/auth/me', { headers: bearer(token) }),
  changePassword: (current_password: string, new_password: string) =>
    authFetch<{ token: string; user: AuthUser }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password }),
      headers: bearer(),
    }),
  // Auth — admin quản lý tài khoản
  getAccounts: (password: string) =>
    fetchJSON<AuthUser[]>('/api/auth/accounts', { headers: { 'x-admin-password': password } }),
  syncAccounts: (password: string) =>
    fetchJSON<{ created: number; total: number }>('/api/auth/accounts/sync', {
      method: 'POST',
      headers: { 'x-admin-password': password },
    }),
  resetAccountPassword: (id: number, password: string, newPassword?: string) =>
    fetchJSON<{ ok: boolean; is_default_password: boolean }>(`/api/auth/accounts/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password: newPassword }),
      headers: { 'x-admin-password': password },
    }),
  updateAccount: (id: number, data: { username?: string; is_active?: boolean; display_name?: string }, password: string) =>
    fetchJSON<AuthUser>(`/api/auth/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'x-admin-password': password },
    }),

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
