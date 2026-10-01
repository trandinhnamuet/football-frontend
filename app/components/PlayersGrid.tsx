'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import PlayerPhoto from './PlayerPhoto';
import { Player, FANTA, ROLES, searchKey } from '../lib/types';
import { useApp } from '../contexts/AppContext';

const CARD = 'var(--card)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
const LINE = 'var(--line)';

const roleColors: Record<string, string> = { GK: '#aa3333', DEF: '#2a6fdb', MID: '#1f8a5b', FWD: FANTA };
const ROLE_ORDER = ['GK', 'DEF', 'MID', 'FWD', 'Tự do'];

interface Props {
  players: Player[];
  /** player.id → /members/<slug> cho cầu thủ đã có bài giới thiệu. */
  profileLinks: Record<number, string>;
}

/**
 * Lưới đội hình theo vị trí, có ô tìm theo tên (không cần dấu) hoặc số áo.
 * Nhận dữ liệu từ server component cha nên vẫn render sẵn HTML cho SEO.
 */
export default function PlayersGrid({ players, profileLinks }: Props) {
  const { t, lang } = useApp();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const key = searchKey(q.trim());
    if (!key) return players;
    const asNum = /^\d+$/.test(key) ? Number(key) : null;
    return players.filter(p => {
      if (asNum !== null && p.num === asNum) return true;
      const hay = searchKey(`${p.first_name} ${p.last_name} ${p.nick || ''}`);
      return hay.includes(key) || String(p.num).includes(key);
    });
  }, [players, q]);

  const grouped: Record<string, Player[]> = {};
  for (const r of ROLE_ORDER) grouped[r] = [];
  filtered.forEach(p => {
    const key = grouped[p.role] !== undefined ? p.role : 'Tự do';
    grouped[key].push(p);
  });

  return (
    <>
      <div className="players-search" style={{ position: 'relative', maxWidth: 480, marginBottom: 40 }}>
        <span aria-hidden style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: MUTED, fontSize: 16, pointerEvents: 'none' }}>⌕</span>
        <input
          type="text"
          inputMode="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={t('players.searchPlaceholder')}
          aria-label={t('players.searchPlaceholder')}
          autoComplete="off"
          style={{ width: '100%', background: 'var(--input-bg)', border: `1px solid ${LINE}`, color: INK, padding: '13px 40px 13px 40px', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
        />
        {q && (
          <button type="button" onClick={() => setQ('')} aria-label="Xóa" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer', padding: '4px 8px' }}>×</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: '60px 24px', textAlign: 'center', background: CARD, borderLeft: `4px solid ${FANTA}` }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, color: MUTED, textTransform: 'uppercase' }}>{t('players.noMatch')}</div>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 8 }}>&quot;{q}&quot;</div>
        </div>
      ) : ROLE_ORDER.map(role => {
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
            <div className="mob-players-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
              {group.map(p => {
                const href = profileLinks[p.id];
                const color = roleColors[role] || '#6b6b6b';
                // Chữ trên nền cam phải tối mới đủ tương phản; các màu khác chữ trắng.
                const onColor = color === FANTA ? '#0a0a0a' : '#fff';
                const roleName = ROLES[role]?.[lang] || role;
                return (
                  <div key={p.id} className="pcard" style={{ background: CARD, position: 'relative', overflow: 'hidden', borderLeft: `4px solid ${color}`, display: 'flex', flexDirection: 'column' }}>
                    <PlayerPhoto p={p}>
                      {/* Số áo nổi trên ảnh: nền màu vai trò, chữ tương phản */}
                      <div className="pcard-num" style={{ position: 'absolute', left: 0, top: 0, zIndex: 2, background: color, color: onColor, fontFamily: 'Anton, sans-serif', fontSize: 22, lineHeight: 1, padding: '8px 12px 7px', letterSpacing: '0.02em' }}>
                        #{p.num}
                      </div>
                    </PlayerPhoto>
                    <div className="pcard-body" style={{ padding: 18, display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div className="pcard-name" style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, lineHeight: 1.15, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{p.first_name} {p.last_name}</div>
                      <div className="pcard-meta" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        <span className="pcard-role" style={{ background: color, color: onColor, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 8px', lineHeight: 1.3 }}>
                          {roleName}
                        </span>
                        {p.nick && <span className="pcard-nick" style={{ fontSize: 13, color: 'var(--prose)', fontStyle: 'italic', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>&quot;{p.nick}&quot;</span>}
                      </div>
                      <div className="pcard-stats" style={{ marginTop: 12, display: 'grid', gridTemplateColumns: p.stat_points > 0 ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr', gap: 4, paddingTop: 10, borderTop: `1px solid ${LINE}` }}>
                        {role === 'GK' ? (
                          <><StatChip label="Cứu" value={p.stat_saves} /><StatChip label="Chuyền" value={p.stat_passes} /><StatChip label="Trận" value={p.stat_attendance} /></>
                        ) : (
                          <><StatChip label="Bàn" value={p.stat_goals} /><StatChip label="K.tạo" value={p.stat_assists} /><StatChip label="Tắc" value={p.stat_tackles} /></>
                        )}
                        {p.stat_points > 0 && <StatChip label="Điểm" value={Math.round(p.stat_points)} accent />}
                      </div>
                      {href && <div style={{ flex: 1, minHeight: 12 }} />}
                      {href && (
                        <Link href={href} className="player-profile-link pcard-profile" style={{ display: 'block', padding: '8px 10px', textAlign: 'center', background: 'rgba(255,107,26,0.1)', border: `1px solid ${FANTA}55`, color: FANTA, textDecoration: 'none', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          {t('players.profile')}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}

function StatChip({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="pcard-stat" style={{ textAlign: 'center', minWidth: 0 }}>
      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, lineHeight: 1.1, color: accent ? FANTA : INK }}>{value}</div>
      <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2, whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  );
}
