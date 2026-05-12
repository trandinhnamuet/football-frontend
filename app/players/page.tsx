import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SyncTrigger from '../components/SyncTrigger';
import { Player, FANTA, ROLES } from '../lib/types';
import { DEFAULT_PLAYER_AVATAR_URL } from '../lib/assets';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const DEFAULT_AVATAR = DEFAULT_PLAYER_AVATAR_URL;
const BLACK = 'var(--bg)';
const CARD = 'var(--card)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
const LINE = 'var(--line)';

async function getPlayers(): Promise<Player[]> {
  try {
    const res = await fetch(`${BASE}/api/players`, { next: { revalidate: 60 } });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

function Avatar({ p, size = 56 }: { p: Player; size?: number }) {
  const imgSrc = p.image_url ? `${BASE}${p.image_url}` : DEFAULT_AVATAR;
  return (
    <img
      src={imgSrc}
      alt={`${p.first_name} ${p.last_name}`}
      width={size} height={size}
      style={{ objectFit: 'cover', flexShrink: 0, clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)' }}
    />
  );
}

const roleColors: Record<string, string> = { GK: '#aa3333', DEF: '#2a6fdb', MID: '#1f8a5b', FWD: FANTA };

export default async function PlayersPage() {
  const players = await getPlayers();
  const grouped: Record<string, Player[]> = { GK: [], DEF: [], MID: [], FWD: [], 'Tự do': [] };
  players.forEach(p => {
    const key = grouped[p.role] !== undefined ? p.role : 'Tự do';
    grouped[key].push(p);
  });

  return (
    <div style={{ background: BLACK, color: INK, fontFamily: '"Space Grotesk", system-ui, sans-serif', minHeight: '100vh' }}>
      <SyncTrigger />
      <Header />
      <main className="mob-p-main" style={{ padding: '48px 48px 80px' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
            <Link href="/" style={{ color: MUTED, textDecoration: 'none' }}>← Trang chủ</Link>
            {' '}/ Đội hình
          </div>
          <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(56px, 8vw, 96px)', lineHeight: 0.92, letterSpacing: '0.01em', textTransform: 'uppercase', margin: 0 }}>
            ĐỘI HÌNH <span style={{ color: FANTA }}>2026</span>
          </h1>
          <p style={{ color: MUTED, fontSize: 15, marginTop: 12 }}>{players.length} cầu thủ · Bốn vai trò · Một tinh thần</p>
        </div>

        {players.length === 0 ? (
          <div style={{ padding: '80px 40px', textAlign: 'center', background: CARD, borderLeft: `4px solid ${FANTA}` }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: MUTED, textTransform: 'uppercase' }}>Đang đồng bộ dữ liệu cầu thủ...</div>
          </div>
        ) : (
          (['GK', 'DEF', 'MID', 'FWD', 'Tự do']).map(role => {
            const group = grouped[role] || [];
            if (group.length === 0) return null;
            return (
              <div key={role} style={{ marginBottom: 56 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{ width: 4, height: 40, background: roleColors[role] }}></div>
                  <div>
                    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 36, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{ROLES[role]?.vi || role}</div>
                    <div style={{ fontSize: 12, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{group.length} cầu thủ</div>
                  </div>
                </div>
                <div className="mob-players-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
                  {group.map(p => (
                    <div key={p.id} style={{ background: CARD, padding: 20, position: 'relative', overflow: 'hidden', borderLeft: `4px solid ${roleColors[role]}` }}>
                      <div style={{ position: 'absolute', top: 8, right: 10, fontFamily: 'Anton, sans-serif', fontSize: 80, lineHeight: 0.85, color: 'rgba(255,255,255,0.04)', letterSpacing: '-0.02em' }}>{p.num}</div>
                      <Avatar p={p} size={64} />
                      <div style={{ marginTop: 14, fontFamily: 'Anton, sans-serif', fontSize: 20, letterSpacing: '0.02em', textTransform: 'uppercase', position: 'relative' }}>{p.first_name} {p.last_name}</div>
                      <div style={{ fontSize: 11, color: roleColors[role], letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 4, fontWeight: 700 }}>#{p.num} · {role}</div>
                      <div style={{ fontSize: 12, color: MUTED, marginTop: 4, fontStyle: 'italic' }}>"{p.nick}"</div>
                      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, paddingTop: 12, borderTop: `1px solid ${LINE}` }}>
                        {role === 'GK' ? (
                          <><StatChip label="Cứu" value={p.stat_saves} /><StatChip label="Đ.chuyền" value={p.stat_passes} /><StatChip label="Trận" value={p.stat_attendance} /></>
                        ) : (
                          <><StatChip label="Bàn" value={p.stat_goals} /><StatChip label="Kiến tạo" value={p.stat_assists} /><StatChip label="Tắc" value={p.stat_tackles} /></>
                        )}
                      </div>
                      {p.stat_points > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Điểm</span>
                          <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: FANTA }}>{Math.round(p.stat_points)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </main>
      <Footer />
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: INK }}>{value}</div>
      <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 1 }}>{label}</div>
    </div>
  );
}
