'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SyncTrigger from '../components/SyncTrigger';
import RequireAuth from '../components/RequireAuth';
import { Player, TeamStats, ROLES, FANTA, avatarColor, initials } from '../lib/types';
import { api } from '../lib/api';

const BLACK = 'var(--bg)';
const CARD = 'var(--card)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
const LINE = 'var(--line)';

/** "Phạm Đình Hải Tú" -> "Hải Tú": đủ phân biệt hai người trùng tên gọi, vừa trục dọc mobile. */
function shortName(p: Player): string {
  const parts = (p.first_name || '').trim().split(/\s+/).filter(Boolean);
  const mid = parts.length > 1 ? parts[parts.length - 1] : parts[0] || '';
  return `${mid} ${p.last_name || ''}`.trim();
}

type Metric = 'stat_points' | 'stat_goals' | 'stat_assists' | 'stat_saves' | 'stat_tackles' | 'stat_passes' | 'stat_attendance' | 'stat_minutes';

const METRICS: { key: Metric; label: string }[] = [
  { key: 'stat_points', label: 'Điểm' },
  { key: 'stat_goals', label: 'Bàn thắng' },
  { key: 'stat_assists', label: 'Kiến tạo' },
  { key: 'stat_saves', label: 'Cứu thua' },
  { key: 'stat_tackles', label: 'Tắc bóng' },
  { key: 'stat_passes', label: 'Đường chuyền' },
  { key: 'stat_attendance', label: 'Tham dự' },
  { key: 'stat_minutes', label: 'Phút' },
];

function DashboardContent() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [metric, setMetric] = useState<Metric>('stat_points');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  // Mobile: chart vẽ ngang (tên ở trục dọc) để tên cầu thủ không chồng nhau.
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    Promise.all([api.getPlayers(), api.getTeamStats()])
      .then(([p, ts]) => { setPlayers(p); setTeamStats(ts); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = roleFilter === 'ALL' ? players : players.filter(p => p.role === roleFilter);
  const sorted = [...filtered].sort((a, b) => (b[metric] as number) - (a[metric] as number));
  const chartData = sorted.slice(0, 20).map(p => ({
    name: `${p.first_name} ${p.last_name}`,
    short: shortName(p),
    value: p[metric] as number,
    role: p.role,
    num: p.num,
    id: p.id,
  }));
  const max = chartData[0]?.value || 1;

  const roleColors: Record<string, string> = { GK: '#aa3333', DEF: '#2a6fdb', MID: '#1f8a5b', FWD: FANTA };

  // Chia đôi chỉ chiếm ô KPI khi thực sự có trận nội bộ — mùa không có thì giữ
  // nguyên 6 ô như cũ.
  const kpis = teamStats ? [
    { label: 'Trận đã đá', value: teamStats.played },
    { label: 'Thắng', value: teamStats.wins },
    { label: 'Hòa', value: teamStats.draws },
    { label: 'Thua', value: teamStats.losses },
    ...(teamStats.splits ? [{ label: 'Chia đôi', value: teamStats.splits }] : []),
    ...(teamStats.cancelled ? [{ label: 'Trận hủy', value: teamStats.cancelled }] : []),
    { label: 'Bàn ghi', value: teamStats.gf },
    { label: 'Bàn thủng', value: teamStats.ga },
  ] : [];

  const roleDist = ['GK', 'DEF', 'MID', 'FWD'].map(r => ({
    role: r,
    label: ROLES[r]?.vi || r,
    count: players.filter(p => p.role === r).length,
  }));
  const maxRoleCount = Math.max(...roleDist.map(r => r.count), 1);

  return (
    <div style={{ background: BLACK, color: INK, fontFamily: '"Space Grotesk", system-ui, sans-serif', minHeight: '100vh' }}>
      <SyncTrigger />
      <Header />

      <main className="mob-p-main" style={{ padding: '48px 48px 80px' }}>
        {/* Title */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 24 }}>
            <Link href="/" style={{ color: MUTED, textDecoration: 'none' }}>← Trang chủ</Link>
            {' '}/ Dashboard
          </div>
          <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(56px, 8vw, 96px)', lineHeight: 0.92, letterSpacing: '0.01em', textTransform: 'uppercase', margin: 0 }}>
            THỐNG KÊ <span style={{ color: FANTA }}>MÙA 2026</span>
          </h1>
          <p style={{ color: MUTED, fontSize: 15, marginTop: 28 }}>Số liệu tổng hợp từ Excel · Cập nhật khi có người truy cập</p>
        </div>

        {/* KPIs */}
        {kpis.length > 0 && (
          <div className="mob-kpi-grid mob-hide" style={{ display: 'grid', gridTemplateColumns: `repeat(${kpis.length}, 1fr)`, gap: 14, marginBottom: 40 }}>
            {kpis.map(k => (
              <div key={k.label} style={{ background: CARD, border: `1px solid ${LINE}`, padding: '20px 20px' }}>
                <div style={{ fontSize: 11, color: MUTED, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600 }}>{k.label}</div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 48, lineHeight: 0.95, letterSpacing: '0.01em', color: FANTA, marginTop: 6 }}>{k.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* KPIs — mobile: một thẻ tỉ số gọn thay cho lưới 3 cột */}
        {teamStats && (
          <div className="mob-only" style={{ marginBottom: 20 }}>
            <div style={{ background: CARD, border: `1px solid ${LINE}`, display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.1fr' }}>
              <div style={{ padding: '14px 12px', borderRight: `1px solid ${LINE}` }}>
                <div style={{ fontSize: 10, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>Trận đã đá</div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 34, lineHeight: 1, color: FANTA, marginTop: 6 }}>{teamStats.played}</div>
              </div>
              <div style={{ padding: '14px 12px', borderRight: `1px solid ${LINE}` }}>
                <div style={{ fontSize: 10, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>Thắng · Hòa · Thua</div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 34, lineHeight: 1, marginTop: 6, display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <span style={{ color: '#1f8a5b' }}>{teamStats.wins}</span>
                  <span style={{ color: MUTED, fontSize: 18 }}>·</span>
                  <span style={{ color: INK }}>{teamStats.draws}</span>
                  <span style={{ color: MUTED, fontSize: 18 }}>·</span>
                  <span style={{ color: '#cc4444' }}>{teamStats.losses}</span>
                </div>
              </div>
              <div style={{ padding: '14px 12px' }}>
                <div style={{ fontSize: 10, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>Bàn ghi : thủng</div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 34, lineHeight: 1, marginTop: 6, whiteSpace: 'nowrap' }}>
                  <span style={{ color: FANTA }}>{teamStats.gf}</span><span style={{ color: MUTED, fontSize: 20, margin: '0 4px' }}>:</span>{teamStats.ga}
                </div>
              </div>
            </div>
            {(teamStats.splits > 0 || teamStats.cancelled > 0) && (
              <div style={{ fontSize: 12, color: MUTED, marginTop: 8, letterSpacing: '0.06em' }}>
                {teamStats.splits > 0 && <span>Chia đôi: <b style={{ color: INK }}>{teamStats.splits}</b></span>}
                {teamStats.splits > 0 && teamStats.cancelled > 0 && <span> · </span>}
                {teamStats.cancelled > 0 && <span>Trận hủy: <b style={{ color: INK }}>{teamStats.cancelled}</b></span>}
              </div>
            )}
          </div>
        )}

        {/* Toolbar */}
        <div style={{ background: CARD, border: `1px solid ${LINE}`, padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 10, color: MUTED, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Chỉ số</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {METRICS.map(m => (
                <button
                  key={m.key}
                  onClick={() => setMetric(m.key)}
                  style={{
                    background: metric === m.key ? INK : 'var(--hover-bg)',
                    color: metric === m.key ? BLACK : INK,
                    border: `1px solid ${metric === m.key ? INK : LINE}`,
                    padding: '7px 14px', fontSize: 12, letterSpacing: '0.06em', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: MUTED, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Vị trí</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['ALL', 'GK', 'DEF', 'MID', 'FWD'].map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  style={{
                    background: roleFilter === r ? INK : 'var(--hover-bg)',
                    color: roleFilter === r ? BLACK : INK,
                    border: `1px solid ${roleFilter === r ? INK : LINE}`,
                    padding: '7px 14px', fontSize: 12, letterSpacing: '0.06em', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                  }}
                >
                  {r === 'ALL' ? 'Tất cả' : r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="mob-dash-card" style={{ background: CARD, border: `1px solid ${LINE}`, padding: '32px', marginBottom: 24 }}>
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, lineHeight: 1, letterSpacing: '0.01em', textTransform: 'uppercase' }}>
                {METRICS.find(m => m.key === metric)?.label || metric}
              </div>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 6 }}>Top {Math.min(20, sorted.length)} cầu thủ · {filtered.length} tổng</div>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: MUTED, flexWrap: 'wrap' }}>
              {Object.entries(roleColors).map(([r, c]) => (
                <span key={r}><span style={{ display: 'inline-block', width: 10, height: 10, background: c, marginRight: 5 }}></span>{ROLES[r]?.vi || r}</span>
              ))}
            </div>
          </div>
          {loading ? (
            <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED }}>Đang tải...</div>
          ) : chartData.length === 0 ? (
            <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontFamily: 'Anton, sans-serif', fontSize: 24 }}>
              Chưa có dữ liệu
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={isMobile ? chartData.length * 30 + 28 : 400}>
              {isMobile ? (
                // Thanh ngang, mỗi cầu thủ một dòng: tên đọc thẳng, không xoay, không chồng.
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.28)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="short" width={92} interval={0} tick={{ fill: MUTED, fontSize: 12, fontFamily: 'Space Grotesk' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--card)', border: `1px solid ${FANTA}`, borderRadius: 0, color: 'var(--ink)', fontFamily: 'Space Grotesk' }}
                    cursor={{ fill: 'rgba(255,107,26,0.08)' }}
                    labelFormatter={(_label, payload) => payload?.[0]?.payload?.name ?? _label}
                  />
                  <Bar dataKey="value" barSize={18} radius={[0, 2, 2, 0]} label={{ position: 'right', fill: MUTED, fontSize: 11, fontFamily: 'Space Grotesk' }}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={roleColors[entry.role] || FANTA} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
              <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 60, left: 0 }}>
                {/* SVG presentation attributes don't resolve var(), so use a
                    mid-grey that reads on both light and dark backgrounds. */}
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.28)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: MUTED, fontSize: 11, fontFamily: 'Space Grotesk' }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fill: MUTED, fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: `1px solid ${FANTA}`, borderRadius: 0, color: 'var(--ink)', fontFamily: 'Space Grotesk' }}
                  cursor={{ fill: 'rgba(255,107,26,0.08)' }}
                />
                <Bar dataKey="value" maxBarSize={40} radius={[2, 2, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={roleColors[entry.role] || FANTA} />
                  ))}
                </Bar>
              </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Split: Leaderboard + Role Dist */}
        <div className="mob-dash-split" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          {/* Full ranking */}
          <div className="mob-dash-card" style={{ background: CARD, border: `1px solid ${LINE}`, padding: '28px' }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: 16 }}>
              Bảng xếp hạng — {METRICS.find(m => m.key === metric)?.label}
            </div>
            {sorted.map((p, i) => {
              const val = p[metric] as number;
              const w = max > 0 ? (val / max) * 100 : 0;
              const [bg, fg] = avatarColor(p);
              return (
                <div key={p.id} className="mob-dash-rank-row" style={{ display: 'grid', gridTemplateColumns: '36px 160px 1fr 80px', gap: 14, alignItems: 'center', padding: '9px 0', borderBottom: i < sorted.length - 1 ? `1px dashed ${LINE}` : 'none' }}>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, color: MUTED, letterSpacing: '0.02em' }}>{i + 1}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton, sans-serif', fontSize: 11, flexShrink: 0 }}>
                      {initials(p)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.first_name} {p.last_name}</div>
                      <div style={{ fontSize: 10, color: roleColors[p.role] || MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 1 }}>{p.role}</div>
                    </div>
                  </div>
                  <div style={{ height: 20, background: 'rgba(255,107,26,0.08)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ width: `${w}%`, height: '100%', background: FANTA, transition: 'width 0.5s ease' }}></div>
                  </div>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, color: INK, textAlign: 'right' }}>
                    {typeof val === 'number' ? (val % 1 !== 0 ? val.toFixed(1) : val) : val}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Role distribution */}
          <div className="mob-dash-card" style={{ background: CARD, border: `1px solid ${LINE}`, padding: '28px' }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: 20 }}>
              Phân bổ vị trí
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 24 }}>
              {roleDist.map(r => {
                const h = maxRoleCount > 0 ? (r.count / maxRoleCount) * 140 : 0;
                return (
                  <div key={r.role} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ height: 140, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <div style={{ height: `${h}px`, width: '80%', background: roleColors[r.role] || FANTA, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', color: '#fff', fontFamily: 'Anton, sans-serif', fontSize: 28, paddingBottom: 6, transition: 'height 0.4s' }}>
                        {r.count}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{r.role}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>{r.label}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 16 }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: 12 }}>Top 5</div>
              {sorted.slice(0, 5).map((p, i) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 4 ? `1px dashed ${LINE}` : 'none' }}>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: i === 0 ? FANTA : MUTED, width: 24 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.first_name} {p.last_name}</div>
                    <div style={{ fontSize: 10, color: roleColors[p.role] || MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{p.role}</div>
                  </div>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: FANTA }}>
                    {typeof (p[metric] as number) === 'number' ? Math.round(p[metric] as number) : p[metric]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Dashboard chỉ dành cho thành viên đã đăng nhập.
export default function DashboardPage() {
  return <RequireAuth><DashboardContent /></RequireAuth>;
}
