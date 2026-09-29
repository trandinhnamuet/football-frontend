import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SyncTrigger from '../components/SyncTrigger';
import PlayersGrid from '../components/PlayersGrid';
import { Player, MemorialPost, FANTA, memberProfileLinks } from '../lib/types';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const BLACK = 'var(--bg)';
const CARD = 'var(--card)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';

async function getPlayers(): Promise<Player[]> {
  try {
    const res = await fetch(`${BASE}/api/players`, { next: { revalidate: 60 } });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

async function getMemorialPosts(): Promise<MemorialPost[]> {
  try {
    const res = await fetch(`${BASE}/api/memorial-posts`, { next: { revalidate: 60 } });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

export default async function PlayersPage() {
  const [players, posts] = await Promise.all([getPlayers(), getMemorialPosts()]);
  const profileLinks = memberProfileLinks(players, posts);

  return (
    <div style={{ background: BLACK, color: INK, fontFamily: '"Space Grotesk", system-ui, sans-serif', minHeight: '100vh' }}>
      <SyncTrigger />
      <Header />
      <main className="mob-p-main" style={{ padding: '48px 48px 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 24 }}>
            <Link href="/" style={{ color: MUTED, textDecoration: 'none' }}>← Trang chủ</Link>
            {' '}/ Đội hình
          </div>
          <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(56px, 8vw, 96px)', lineHeight: 0.92, letterSpacing: '0.01em', textTransform: 'uppercase', margin: 0 }}>
            ĐỘI HÌNH <span style={{ color: FANTA }}>2026</span>
          </h1>
          <p style={{ color: MUTED, fontSize: 15, marginTop: 28 }}>{players.length} cầu thủ · Bốn vai trò · Một tinh thần</p>
        </div>

        {players.length === 0 ? (
          <div style={{ padding: '80px 40px', textAlign: 'center', background: CARD, borderLeft: `4px solid ${FANTA}` }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: MUTED, textTransform: 'uppercase' }}>Đang đồng bộ dữ liệu cầu thủ...</div>
          </div>
        ) : (
          <PlayersGrid players={players} profileLinks={profileLinks} />
        )}
      </main>
      <Footer />
    </div>
  );
}
