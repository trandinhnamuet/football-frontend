'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from './components/Header';
import Footer from './components/Footer';
import BannerSlider from './components/BannerSlider';
import { Player, Article, Match, TeamStats, RecommendedVideo, FANTA, ROLES, fmtDate } from './lib/types';
import { api } from './lib/api';
import { useApp } from './contexts/AppContext';
import { DEFAULT_PLAYER_AVATAR_URL } from './lib/assets';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const SQUAD_PAGE_SIZE = 5;
const DEFAULT_AVATAR = DEFAULT_PLAYER_AVATAR_URL;

function resolveImg(url: string | null | undefined): string {
  if (!url) return '';
  return url.startsWith('/uploads') ? `${BASE}${url}` : url;
}

function daysUntil(iso: string): number {
  const target = new Date(iso);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

function toYoutubeEmbed(url: string): string {
  if (!url) return '';
  // Already embed URL
  if (url.includes('youtube.com/embed/')) return url;
  // youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  return url;
}

function JerseyNumber({ n, size = 80, color = 'var(--ink)' }: { n: number | string; size?: number; color?: string }) {
  return (
    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: size, lineHeight: 0.85, color, letterSpacing: '-0.02em' }}>
      {String(n).padStart(2, '0')}
    </div>
  );
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

export default function HomePage() {
  const { t, lang } = useApp();
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [played, setPlayed] = useState<Match[]>([]);
  const [upcoming, setUpcoming] = useState<Match[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats>({ played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 });
  const [videoHighlight, setVideoHighlight] = useState<{ youtube_url: string; title: string; title_en: string; is_active: boolean; channel_url?: string } | null>(null);
  const [aboutData, setAboutData] = useState<{ banner_image_url: string } | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedVideo[]>([]);
  const [activeVideo, setActiveVideo] = useState<{ url: string; title: string } | null>(null);

  // Squad carousel
  const [squadPage, setSquadPage] = useState(0);
  const [slideClass, setSlideClass] = useState('slide-from-right');
  const [animKey, setAnimKey] = useState(0);

  // Scoring tooltip
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = () =>
      Promise.all([
        api.getPlayers(),
        api.getArticles(),
        api.getPlayed(),
        api.getUpcoming(),
        api.getTeamStats(),
        api.getVideoHighlight(),
        api.getAboutPage(),
      ]).then(([p, a, pl, up, ts, vh, ab]) => {
        setPlayers(p);
        setArticles(a);
        setPlayed(pl);
        setUpcoming(up);
        setTeamStats(ts);
        setVideoHighlight(vh);
        setAboutData(ab);
        if (vh && vh.is_active && vh.youtube_url) {
          setActiveVideo(prev => prev ?? { url: vh.youtube_url, title: vh.title || '' });
        }
      }).catch(() => {});

    // Load from DB immediately
    loadData();

    // Recommended videos from the YouTube channel (RSS-backed, cached server-side)
    api.getVideoRecommendations().then(recs => {
      setRecommendations(recs);
      setActiveVideo(prev => prev ?? (recs[0] ? { url: recs[0].url, title: recs[0].title } : null));
    }).catch(() => {});

    // Sync in background; reload only if data changed
    api.triggerSync().then(({ synced }) => {
      if (synced) loadData();
    }).catch(() => {});
  }, []);

  const totalSquadPages = Math.max(1, Math.ceil(players.length / SQUAD_PAGE_SIZE));

  // Auto-slide squad every 5s
  useEffect(() => {
    if (totalSquadPages <= 1) return;
    const timer = setInterval(() => goSquad('next'), 5000);
    return () => clearInterval(timer);
  }, [totalSquadPages]);

  function goSquad(dir: 'next' | 'prev') {
    const cls = dir === 'next' ? 'slide-from-right' : 'slide-from-left';
    setSlideClass(cls);
    setAnimKey(k => k + 1);
    setSquadPage(p => dir === 'next'
      ? (p + 1) % totalSquadPages
      : (p - 1 + totalSquadPages) % totalSquadPages
    );
  }

  const board = [...players].sort((a, b) => b.stat_points - a.stat_points);
  const top1 = board[0];
  const top2 = board[1];
  const top3 = board[2];
  const rest = board.slice(3, 12);
  const squadVisible = players.slice(squadPage * SQUAD_PAGE_SIZE, (squadPage + 1) * SQUAD_PAGE_SIZE);

  const roleLabel = (role: string) => ROLES[role]?.[lang] || role;

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', fontFamily: '"Space Grotesk", system-ui, sans-serif' }}>
      <Header />

      {/* BANNER SLIDER — admin-managed running images (e.g. Man of the week) */}
      <BannerSlider />

      {/* HERO — Leaderboard */}
      <section className="mob-p-hero" style={{ position: 'relative', overflow: 'hidden', padding: '48px 48px 64px', backgroundImage: 'repeating-linear-gradient(45deg, transparent 0 60px, rgba(255,107,26,0.025) 60px 61px)' }}>
        <div style={{ position: 'absolute', top: 20, right: -100, pointerEvents: 'none', fontFamily: 'Anton, sans-serif', fontSize: 380, lineHeight: 0.8, color: FANTA, opacity: 0.07, letterSpacing: '-0.04em', whiteSpace: 'nowrap' }}>2026</div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: FANTA, letterSpacing: '0.2em' }}>{t('hero.hashtag')}</span>
            <span style={{ height: 1, width: 60, background: FANTA, display: 'inline-block' }}></span>
            <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>{t('hero.season')} · {t('hero.week')} {played.length}</span>
          </div>

          <h1 style={{ fontFamily: 'Anton, sans-serif', fontWeight: 400, fontSize: 'clamp(40px, 6vw, 90px)', lineHeight: 0.92, letterSpacing: '-0.02em', margin: '28px 0 0', textTransform: 'uppercase' }}>
            {t('hero.line1')}<br />
            {t('hero.line2')} <span style={{ color: FANTA }}>{t('hero.accent')}</span>
          </h1>

          {/* Scoring formula button */}
          <div style={{ position: 'relative', display: 'inline-block', marginTop: 24 }}>
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => router.push('/scoring')}
              style={{
                background: 'rgba(255,107,26,0.1)',
                border: `1px solid ${FANTA}66`,
                color: FANTA,
                padding: '10px 20px',
                fontFamily: 'Anton, sans-serif',
                fontSize: 14,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>●</span> {t('hero.scoringBtn')}
            </button>

            {showTooltip && (
              <div ref={tooltipRef} style={{
                position: 'absolute',
                left: 0,
                top: 'calc(100% + 10px)',
                background: '#0a0a0a',
                border: `2px solid ${FANTA}`,
                padding: '20px 24px',
                zIndex: 200,
                minWidth: 280,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, color: FANTA, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 14 }}>
                  {t('hero.tooltipTitle')}
                </div>
                {[
                  { text: t('hero.tooltipGoals'), pts: '+ 5' },
                  { text: t('hero.tooltipAssists'), pts: '+ 3' },
                  { text: t('hero.tooltipAttend'), pts: '+ 2' },
                ].map(row => (
                  <div key={row.text} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: 15, color: '#f4f1ea' }}>{row.text}</span>
                    <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, color: FANTA }}>{row.pts}</span>
                  </div>
                ))}
                <div style={{ fontSize: 12, color: '#a09b94', marginTop: 12, letterSpacing: '0.06em' }}>{t('hero.tooltipHint')}</div>
              </div>
            )}
          </div>

          {/* Leaderboard */}
          {top1 && (
            <div className="mob-hero-top1" style={{ marginTop: 32, background: FANTA, color: '#0a0a0a', padding: '40px 48px', display: 'grid', gridTemplateColumns: 'auto auto 1fr auto', gap: 40, alignItems: 'center', clipPath: 'polygon(0 0, 100% 0, 98% 100%, 2% 100%)' }}>
              <JerseyNumber n={1} size={180} color="#0a0a0a" />
              <div>
                <Avatar p={top1} size={140} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{t('hero.mvp')}</div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(40px, 6vw, 80px)', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '0.01em', marginTop: 10 }}>
                  {top1.first_name} {top1.last_name}
                </div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 14, fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  <span>#{top1.num} {roleLabel(top1.role)}</span>
                  <span>"{top1.nick}"</span>
                  <span>{t('hero.goals')} {top1.stat_goals} · {t('hero.assists')} {top1.stat_assists}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <JerseyNumber n={Math.round(top1.stat_points)} size={120} color="#0a0a0a" />
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 4 }}>{t('hero.points')}</div>
              </div>
            </div>
          )}

          {(top2 || top3) && (
            <div className="mob-hero-top2-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
              {[top2, top3].filter(Boolean).map((p, i) => p && (
                <div key={p.id} className="mob-hero-top2-3-card" style={{ background: 'var(--card)', padding: '28px 32px', display: 'grid', gridTemplateColumns: 'auto auto 1fr auto', gap: 20, alignItems: 'center', borderLeft: `4px solid ${FANTA}` }}>
                  <JerseyNumber n={i + 2} size={80} color={FANTA} />
                  <Avatar p={p} size={80} />
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>#{p.num} {roleLabel(p.role)}</div>
                    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 32, lineHeight: 0.95, textTransform: 'uppercase', marginTop: 4 }}>{p.first_name} {p.last_name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <JerseyNumber n={Math.round(p.stat_points)} size={52} color="var(--ink)" />
                    <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{t('hero.points')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {rest.length > 0 && (
            <div className="mob-hero-rest" style={{ marginTop: 16, background: 'var(--card)', padding: '8px 0' }}>
              {rest.map((p, i) => {
                const max = rest[0]?.stat_points || 1;
                const w = max > 0 ? (p.stat_points / max) * 100 : 0;
                return (
                  <div key={p.id} className="mob-hero-rest-row" style={{ display: 'grid', gridTemplateColumns: '64px 1fr 1fr 70px', alignItems: 'center', gap: 20, padding: '10px 28px', borderBottom: i < rest.length - 1 ? '1px solid var(--line)' : 'none' }}>
                    <JerseyNumber n={i + 4} size={22} color="var(--muted)" />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar p={p} size={32} />
                      <div>
                        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{p.first_name} {p.last_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>#{p.num} · {roleLabel(p.role)}</div>
                      </div>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,107,26,0.12)' }}>
                      <div style={{ width: `${w}%`, height: '100%', background: FANTA }}></div>
                    </div>
                    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: FANTA, textAlign: 'right' }}>{Math.round(p.stat_points)}</div>
                  </div>
                );
              })}
            </div>
          )}

          {board.length === 0 && (
            <div style={{ marginTop: 40, padding: '60px', textAlign: 'center', color: 'var(--muted)', fontFamily: 'Anton, sans-serif', fontSize: 24, background: 'var(--card)', borderLeft: `4px solid ${FANTA}` }}>
              {t('hero.noData')}
            </div>
          )}
        </div>
      </section>

      {/* SCHEDULE — moved above squad, next-match-focused layout */}
      <section id="schedule" className="mob-p-section" style={{ padding: '80px 48px' }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase' }}>{t('sections.s04')}</div>
          <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(48px, 6vw, 80px)', lineHeight: 0.92, textTransform: 'uppercase', marginTop: 12 }}>{t('schedule.title')}</h2>
        </div>

        {/* Featured next match */}
        {upcoming.length > 0 && (() => {
          const next = upcoming[0];
          const d = daysUntil(next.date);
          const countdown = d <= 0 ? t('schedule.countdownToday') : `${d} ${t('schedule.countdownDays')}`;
          return (
            <div className="mob-nextmatch" style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.8fr', gap: 0, marginBottom: 28, background: 'var(--card)', borderLeft: `5px solid ${FANTA}`, overflow: 'hidden' }}>
              {/* Image side */}
              <div className="mob-nextmatch-img" style={{ position: 'relative', minHeight: 380, background: '#0a0a0a', backgroundImage: next.image_url ? `url(${resolveImg(next.image_url)})` : 'repeating-linear-gradient(45deg, transparent 0 30px, rgba(255,107,26,0.06) 30px 31px)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}>
                <div style={{ position: 'absolute', top: 18, left: 18, background: FANTA, color: '#0a0a0a', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '6px 14px' }}>
                  ▶ {t('schedule.nextMatch')}
                </div>
                <div style={{ position: 'absolute', bottom: 18, right: 18, background: 'rgba(10,10,10,0.85)', color: FANTA, fontFamily: 'Anton, sans-serif', fontSize: 22, letterSpacing: '0.02em', padding: '8px 16px', textTransform: 'uppercase' }}>
                  ⏱ {countdown}
                </div>
              </div>
              {/* Info side */}
              <div style={{ padding: '40px 48px', display: 'grid', gridTemplateRows: 'auto 1fr auto', height: '100%' }}>
                {/* Top: Week & teams */}
                <div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>{t('hero.week')} {next.week}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(40px, 5vw, 56px)', color: FANTA, textTransform: 'uppercase' }}>Lon Fanta FC</div>
                    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, color: 'var(--muted)', textTransform: 'uppercase' }}>{t('schedule.vs')}</div>
                    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(40px, 5vw, 56px)', textTransform: 'uppercase' }}>{next.opponent}</div>
                  </div>
                </div>

                {/* Middle: Spacer */}
                <div />

                {/* Bottom: Date & time & venue */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{fmtDate(next.date)}</div>
                    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(48px, 6vw, 72px)', color: FANTA, marginTop: 6 }}>{next.time || '17:30'}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>{t('schedule.kickoff')}</div>
                  </div>
                  {next.venue && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>📍 {t('schedule.venue')}</div>
                      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(36px, 5vw, 52px)', marginTop: 6, textTransform: 'uppercase' }}>{next.venue}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Other upcoming + recent results */}
        <div className="mob-schedule-cols" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 32 }}>
          <div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: FANTA, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 14 }}>▶ {t('schedule.otherUpcoming')}</div>
            {upcoming.length <= 1 ? (
              <div style={{ color: 'var(--muted)', fontSize: 14, padding: '20px 0' }}>{t('schedule.noUpcoming')}</div>
            ) : upcoming.slice(1).map(m => (
              <div key={m.id} style={{ background: 'var(--card)', padding: '16px 18px', marginBottom: 16, display: 'grid', gridTemplateColumns: '160px 1fr', gap: 18, alignItems: 'stretch', borderLeft: `3px solid ${FANTA}`, minHeight: 160 }}>
                <div style={{ width: 160, height: 160, background: '#0a0a0a', backgroundImage: m.image_url ? `url(${resolveImg(m.image_url)})` : 'none', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {!m.image_url && <JerseyNumber n={m.week} size={36} color={FANTA} />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{m.opponent}</div>
                  <div style={{ fontSize: 16, color: 'var(--muted)' }}>{fmtDate(m.date)}</div>
                  <div style={{ fontSize: 16, color: 'var(--muted)' }}>{m.venue}</div>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, color: FANTA, marginTop: 6 }}>{m.time || '17:30'}</div>
                </div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: FANTA, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 14 }}>◆ {t('schedule.recentResults')}</div>
            {played.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: 14, padding: '20px 0' }}>—</div>
            ) : [...played].reverse().slice(0, 6).map(m => (
              <div key={m.id} style={{ background: 'var(--card)', padding: '10px 12px', marginBottom: 8, display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', fontSize: 12 }}>
                <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 13, textTransform: 'uppercase' }}>{m.opponent}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{fmtDate(m.date)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 15, color: 'var(--ink)', fontWeight: 600, minWidth: 32, textAlign: 'center' }}>{m.score}</div>
                  <div style={{ width: 22, height: 22, background: m.result === 'W' ? FANTA : m.result === 'D' ? 'var(--muted)' : '#aa2222', color: m.result === 'W' ? '#0a0a0a' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton, sans-serif', fontSize: 10, flexShrink: 0 }}>{m.result}</div>
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 13, textTransform: 'uppercase' }}>Lon Fanta</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SQUAD */}
      <section id="squad" className="mob-p-section" style={{ padding: '80px 48px' }}>
        <div className="mob-section-hdr" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
          <div>
            <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase' }}>{t('sections.s02')}</div>
            <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(48px, 6vw, 80px)', lineHeight: 1.0, textTransform: 'uppercase', marginTop: 16 }}>{t('squad.title')}</h2>
            <p style={{ color: 'var(--muted)', fontSize: 15, marginTop: 14 }}>{players.length} {t('squad.subtitle')}</p>
          </div>
          <Link href="/players" style={{ background: FANTA, color: '#0a0a0a', padding: '14px 24px', textDecoration: 'none', fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {t('squad.viewAll')}
          </Link>
        </div>

        {players.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)', fontFamily: 'Anton, sans-serif', fontSize: 20, background: 'var(--card)' }}>
            {t('squad.noData')}
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Navigation arrows */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <button
                onClick={() => goSquad('prev')}
                style={{ background: 'rgba(255,107,26,0.1)', border: `1px solid ${FANTA}44`, color: FANTA, width: 44, height: 44, fontFamily: 'Anton, sans-serif', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >‹</button>
              <div style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '0.1em' }}>
                {squadPage + 1} / {totalSquadPages}
              </div>
              <button
                onClick={() => goSquad('next')}
                style={{ background: 'rgba(255,107,26,0.1)', border: `1px solid ${FANTA}44`, color: FANTA, width: 44, height: 44, fontFamily: 'Anton, sans-serif', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >›</button>
            </div>

            {/* Carousel */}
            <div style={{ paddingTop: 110, overflow: 'visible' }}>
              <div
                key={animKey}
                className={`${slideClass} mob-squad-grid`}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}
              >
                {squadVisible.map(p => {
                  return (
                    <div key={p.id} style={{ background: 'var(--card)', paddingTop: 150, paddingLeft: 16, paddingRight: 16, paddingBottom: 18, position: 'relative', borderLeft: `4px solid ${FANTA}`, overflow: 'visible' }}>
                      {/* Large avatar overflowing the card top */}
                      <div style={{ position: 'absolute', top: -110, left: 16 }}>
                        <img
                          src={p.image_url ? `${BASE}${p.image_url}` : DEFAULT_AVATAR}
                          alt={p.first_name}
                          width={240} height={240}
                          style={{ objectFit: 'cover', clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)', display: 'block' }}
                        />
                      </div>
                      <div style={{ position: 'absolute', top: 8, right: 10, fontFamily: 'Anton, sans-serif', fontSize: 72, lineHeight: 0.85, color: 'rgba(128,128,128,0.08)', letterSpacing: '-0.02em' }}>{p.num}</div>
                      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, letterSpacing: '0.02em', textTransform: 'uppercase', position: 'relative', marginTop: 4 }}>{p.first_name} {p.last_name}</div>
                      <div style={{ fontSize: 11, color: FANTA, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 3, fontWeight: 700 }}>#{p.num} · {roleLabel(p.role)}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, fontStyle: 'italic' }}>"{p.nick}"</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dot indicators */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
              {Array.from({ length: totalSquadPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSlideClass(i > squadPage ? 'slide-from-right' : 'slide-from-left');
                    setAnimKey(k => k + 1);
                    setSquadPage(i);
                  }}
                  style={{ width: i === squadPage ? 20 : 6, height: 6, background: i === squadPage ? FANTA : 'var(--line)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* NEWS */}
      <section id="news" className="mob-p-section" style={{ padding: '80px 48px', background: 'var(--alt-bg)', borderTop: `1px solid ${FANTA}33` }}>
        <div className="mob-section-hdr" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
          <div>
            <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase' }}>{t('sections.s03')}</div>
            <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(48px, 6vw, 80px)', lineHeight: 0.92, textTransform: 'uppercase', marginTop: 12 }}>{t('news.title')}</h2>
          </div>
          <Link href="/news" style={{ background: FANTA, color: '#0a0a0a', padding: '14px 24px', textDecoration: 'none', fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {t('news.viewAll')}
          </Link>
        </div>
        {articles.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)', fontFamily: 'Anton, sans-serif', fontSize: 20, background: 'var(--card)', borderLeft: `4px solid ${FANTA}` }}>
            {t('news.noData')}{' '}
            <Link href="/admin/news-management" style={{ color: FANTA }}>{t('news.addNews')}</Link>
          </div>
        ) : (
          <div className="mob-news-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {articles.slice(0, 6).map((article, i) => (
              <Link key={article.id} href={`/news/${article.id}`} style={{
                textDecoration: 'none', color: 'inherit', background: 'var(--card)', overflow: 'hidden', display: 'block',
                gridRow: i === 0 ? 'span 2' : 'auto',
                gridColumn: i === 0 ? 'span 2' : 'auto',
              }}>
                <div style={{
                  aspectRatio: i === 0 ? '16/9' : '3/2',
                  background: 'var(--alt-bg)',
                  backgroundImage: article.image_url ? `url(${BASE}${article.image_url})` : 'repeating-linear-gradient(135deg, transparent 0 14px, rgba(0,0,0,0.08) 14px 15px)',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  position: 'relative',
                }}>
                  {article.tag && (
                    <div style={{ position: 'absolute', top: 14, left: 14, background: FANTA, color: '#0a0a0a', padding: '4px 10px', fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {article.tag}
                    </div>
                  )}
                </div>
                <div style={{ padding: i === 0 ? '24px' : '18px' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{fmtDate(article.published_at)}</div>
                  <h3 style={{ fontFamily: 'Anton, sans-serif', fontSize: i === 0 ? 32 : 18, lineHeight: 1.05, letterSpacing: '0.01em', textTransform: 'uppercase', marginTop: 6, marginBottom: 8 }}>{article.title}</h3>
                  {article.excerpt && <p style={{ color: 'var(--muted)', fontSize: i === 0 ? 14 : 12, lineHeight: 1.55, margin: 0 }}>{article.excerpt}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* VIDEO — YouTube-style: big player left, recommended list right */}
      {(activeVideo || recommendations.length > 0) && (
        <section id="video" className="mob-p-section" style={{ padding: '80px 48px', background: 'var(--bg)', borderTop: `1px solid ${FANTA}33` }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase' }}>■ {t('video.label')}</div>
            <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(40px, 5vw, 72px)', lineHeight: 0.92, textTransform: 'uppercase', marginTop: 12 }}>
              {lang === 'en' && videoHighlight?.title_en ? videoHighlight.title_en : (videoHighlight?.title || t('video.fallbackTitle'))}
            </h2>
          </div>

          <div className="mob-video-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 1fr', gap: 24, alignItems: 'start' }}>
            {/* Main player (left) — larger */}
            <div>
              <div style={{ position: 'relative', width: '100%', maxWidth: 1152, aspectRatio: '16/9', background: '#0a0a0a', borderLeft: `4px solid ${FANTA}` }}>
                {activeVideo && (
                  <iframe
                    src={toYoutubeEmbed(activeVideo.url)}
                    title={activeVideo.title || 'Video'}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                  />
                )}
              </div>
              {activeVideo?.title && (
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(16px, 1.8vw, 22px)', lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: '0.01em', marginTop: 16 }}>
                  {activeVideo.title}
                </div>
              )}
            </div>

            {/* Recommendations (right) — larger */}
            <div className="mob-video-recs" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: FANTA, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                {t('video.recommended')}
              </div>
              {recommendations.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: 14, padding: '12px 0' }}>{t('video.noVideos')}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 960, overflowY: 'auto', paddingRight: 6 }}>
                  {recommendations.map(v => {
                    const isActive = activeVideo?.url === v.url;
                    return (
                      <button
                        key={v.videoId}
                        onClick={() => setActiveVideo({ url: v.url, title: v.title })}
                        style={{
                          display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'stretch',
                          background: isActive ? 'rgba(255,107,26,0.12)' : 'var(--card)',
                          border: isActive ? `1px solid ${FANTA}` : '1px solid transparent',
                          padding: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', overflow: 'hidden',
                        }}
                      >
                        <div style={{ position: 'relative', width: 320, aspectRatio: '16/9', background: '#0a0a0a', flexShrink: 0 }}>
                          <img src={v.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          {isActive && <div style={{ position: 'absolute', top: 8, left: 8, background: FANTA, color: '#0a0a0a', fontFamily: 'Anton, sans-serif', fontSize: 12, padding: '5px 10px', letterSpacing: '0.08em' }}>▶</div>}
                        </div>
                        <div style={{ padding: '8px 12px', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <div style={{ fontSize: 16, lineHeight: 1.35, color: 'var(--ink)', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {v.title}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>{v.published ? fmtDate(v.published) : ''}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              <a
                href={videoHighlight?.channel_url || 'https://www.youtube.com/@fclonfanta'}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop: 18, display: 'inline-block', color: FANTA, fontFamily: 'Anton, sans-serif', fontSize: 14, letterSpacing: '0.04em', textTransform: 'uppercase', textDecoration: 'none' }}
              >
                {t('video.watchChannel')}
              </a>
            </div>
          </div>
        </section>
      )}

      {/* CTA Dashboard */}
      <section className="mob-p-section" style={{ padding: '64px 48px', background: FANTA, color: '#0a0a0a', position: 'relative', overflow: 'hidden' }}>
        <div className="mob-cta-inner" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 40 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{t('cta.label')}</div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(40px, 5vw, 80px)', lineHeight: 0.92, textTransform: 'uppercase', marginTop: 8 }}>
              {t('cta.title1')}<br />{t('cta.title2')}
            </div>
          </div>
          <Link href="/dashboard" style={{ background: '#0a0a0a', color: FANTA, padding: '24px 40px', textDecoration: 'none', fontFamily: 'Anton, sans-serif', fontSize: 22, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {t('cta.btn')}
          </Link>
        </div>
      </section>

      {/* ABOUT — moved to bottom */}
      <section id="intro" className="mob-p-section" style={{ padding: '80px 48px', background: 'var(--alt-bg)', borderTop: `1px solid ${FANTA}33` }}>
        <div className="mob-intro-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 56, alignItems: 'stretch' }}>
          <div>
            <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase' }}>{t('sections.s01')}</div>
            {aboutData?.banner_image_url && (
              <img
                src={`${BASE}${aboutData.banner_image_url}`}
                alt="Lon Fanta FC"
                style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', marginTop: 16, marginBottom: 8 }}
              />
            )}
            <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(48px, 5vw, 80px)', lineHeight: 0.92, textTransform: 'uppercase', letterSpacing: '0.01em', marginTop: 16 }}>{t('intro.label')}</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--muted)', margin: 0 }}>
              {t('intro.body')}
            </p>
            <div className="mob-stats-grid" style={{ marginTop: 36, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { n: 2019, l: t('intro.founded') },
                { n: players.length, l: t('intro.members') },
                { n: teamStats.wins, l: t('intro.wins') },
                { n: teamStats.gf, l: t('intro.goals') },
              ].map(s => (
                <div key={s.l} style={{ background: 'var(--bg)', padding: '20px 16px', borderTop: `3px solid ${FANTA}` }}>
                  <JerseyNumber n={s.n} size={48} color="var(--ink)" />
                  <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 8 }}>{s.l}</div>
                </div>
              ))}
            </div>
            <Link href="/about" className="btn-learn-more">
              <span className="btn-text-wrap">
                <span className="btn-label-primary">{t('intro.learnMore')}</span>
                <span className="btn-label-hover">{t('intro.learnMoreHover')}</span>
              </span>
              <span className="btn-arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
