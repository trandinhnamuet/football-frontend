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
  const { t } = useApp();
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
                return (
                  <div key={p.id} style={{ background: CARD, position: 'relative', overflow: 'hidden', borderLeft: `4px solid ${roleColors[role]}` }}>
                    <PlayerPhoto p={p} />
                    <div style={{ padding: 20, position: 'relative' }}>
                      <div style={{ position: 'absolute', top: -4, right: 12, fontFamily: 'Anton, sans-serif', fontSize: 64, lineHeight: 0.85, color: 'rgba(128,128,128,0.10)', letterSpacing: '-0.02em', pointerEvents: 'none' }}>{p.num}</div>
                      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, letterSpacing: '0.02em', textTransform: 'uppercase', position: 'relative' }}>{p.first_name} {p.last_name}</div>
                      <div style={{ fontSize: 11, color: roleColors[role], letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 4, fontWeight: 700 }}>#{p.num} · {role}</div>
                      <div style={{ fontSize: 12, color: MUTED, marginTop: 4, fontStyle: 'italic' }}>&quot;{p.nick}&quot;</div>
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
                      {href && (
                        <Link href={href} className="player-profile-link" style={{ display: 'block', marginTop: 12, padding: '9px 12px', textAlign: 'center', background: 'rgba(255,107,26,0.1)', border: `1px solid ${FANTA}55`, color: FANTA, textDecoration: 'none', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
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

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: INK }}>{value}</div>
      <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 1 }}>{label}</div>
    </div>
  );
}
