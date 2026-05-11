'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SyncTrigger from '../components/SyncTrigger';
import { Player, TeamStats, ROLES, FANTA, avatarColor, initials } from '../lib/types';
import { api } from '../lib/api';

const BLACK = 'var(--bg)';
const CARD = 'var(--card)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
const LINE = 'var(--line)';

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

export default function DashboardPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [metric, setMetric] = useState<Metric>('stat_points');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

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
    value: p[metric] as number,
    role: p.role,
    num: p.num,
    id: p.id,
  }));
  const max = chartData[0]?.value || 1;

  const roleColors: Record<string, string> = { GK: '#aa3333', DEF: '#2a6fdb', MID: '#1f8a5b', FWD: FANTA };

  const kpis = teamStats ? [
    { label: 'Trận đã đá', value: teamStats.played },
    { label: 'Thắng', value: teamStats.wins },
    { label: 'Hòa', value: teamStats.draws },
    { label: 'Thua', value: teamStats.losses },
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

      <main style={{ padding: '48px 48px 80px' }}>
        {/* Title */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
            <Link href="/" style={{ color: MUTED, textDecoration: 'none' }}>← Trang chủ</Link>
            {' '}/ Dashboard
          </div>
          <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(56px, 8vw, 96px)', lineHeight: 0.92, letterSpacing: '0.01em', textTransform: 'uppercase', margin: 0 }}>
            THỐNG KÊ <span style={{ color: FANTA }}>MÙA 2026</span>
          </h1>
          <p style={{ color: MUTED, fontSize: 15, marginTop: 12 }}>Số liệu tổng hợp từ Excel · Cập nhật khi có người truy cập</p>
        </div>

        {/* KPIs */}
        {kpis.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14, marginBottom: 40 }}>
            {kpis.map(k => (
              <div key={k.label} style={{ background: CARD, border: `1px solid ${LINE}`, padding: '20px 20px' }}>
                <div style={{ fontSize: 11, color: MUTED, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600 }}>{k.label}</div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 48, lineHeight: 0.95, letterSpacing: '0.01em', color: FANTA, marginTop: 6 }}>{k.value}</div>
              </div>
            ))}
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
                    background: metric === m.key ? INK : 'rgba(255,255,255,0.05)',
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
                    background: roleFilter === r ? INK : 'rgba(255,255,255,0.05)',
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
        <div style={{ background: CARD, border: `1px solid ${LINE}`, padding: '32px', marginBottom: 24 }}>
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, lineHeight: 1, letterSpacing: '0.01em', textTransform: 'uppercase' }}>
                {METRICS.find(m => m.key === metric)?.label || metric}
              </div>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 6 }}>Top {Math.min(20, sorted.length)} cầu thủ · {filtered.length} tổng</div>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: MUTED }}>
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
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 60, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
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
            </ResponsiveContainer>
          )}
        </div>

        {/* Split: Leaderboard + Role Dist */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          {/* Full ranking */}
          <div style={{ background: CARD, border: `1px solid ${LINE}`, padding: '28px' }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: 16 }}>
              Bảng xếp hạng — {METRICS.find(m => m.key === metric)?.label}
            </div>
            {sorted.map((p, i) => {
              const val = p[metric] as number;
              const w = max > 0 ? (val / max) * 100 : 0;
              const [bg, fg] = avatarColor(p);
              return (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '36px 160px 1fr 80px', gap: 14, alignItems: 'center', padding: '9px 0', borderBottom: i < sorted.length - 1 ? `1px dashed ${LINE}` : 'none' }}>
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
          <div style={{ background: CARD, border: `1px solid ${LINE}`, padding: '28px' }}>
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
