'use client';

import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FANTA } from '../lib/types';

const FORMULA = [
  { action: 'Bàn thắng', en: 'Goal scored', pts: 5, color: FANTA, icon: '⚽' },
  { action: 'Kiến tạo', en: 'Assist', pts: 3, color: '#2a6fdb', icon: '🅰' },
  { action: 'Điểm danh', en: 'Attendance', pts: 2, color: '#1f8a5b', icon: '✓' },
];

const EXAMPLES = [
  { name: 'Ví dụ 1', goals: 2, assists: 1, attend: 5, total: 2 * 5 + 1 * 3 + 5 * 2 },
  { name: 'Ví dụ 2', goals: 0, assists: 3, attend: 8, total: 0 * 5 + 3 * 3 + 8 * 2 },
  { name: 'Ví dụ 3', goals: 5, assists: 2, attend: 10, total: 5 * 5 + 2 * 3 + 10 * 2 },
];

export default function ScoringPage() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', fontFamily: '"Space Grotesk", system-ui, sans-serif', minHeight: '100vh' }}>
      <Header />

      <main className="mob-p-main" style={{ padding: '64px 48px 100px', maxWidth: 960, margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 24 }}>
          <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>← Trang chủ</Link>
          {' '}/ Cách tính điểm
        </div>

        {/* Hero */}
        <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(56px, 8vw, 96px)', lineHeight: 0.88, textTransform: 'uppercase', letterSpacing: '0.01em', margin: 0 }}>
          CÁCH TÍNH<br /><span style={{ color: FANTA }}>ĐIỂM</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 16, marginTop: 16, maxWidth: 540, lineHeight: 1.6 }}>
          Mỗi cầu thủ trong mùa giải được tính điểm dựa trên đóng góp thực tế trên sân — bàn thắng, kiến tạo, và điểm danh đều có giá trị.
        </p>

        {/* Formula cards */}
        <div className="mob-scoring-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 48 }}>
          {FORMULA.map((f) => (
            <div key={f.action} style={{
              background: 'var(--card)',
              borderTop: `4px solid ${f.color}`,
              padding: '36px 28px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -16, right: -8, fontFamily: 'Anton, sans-serif', fontSize: 120, lineHeight: 0.8, color: f.color, opacity: 0.07, letterSpacing: '-0.04em' }}>{f.pts}</div>
              <div style={{ fontSize: 14, color: f.color, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
                {f.icon}
              </div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{f.action}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{f.en}</div>
              <div style={{ marginTop: 20, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 72, lineHeight: 0.85, color: f.color, letterSpacing: '-0.02em' }}>{f.pts}</span>
                <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, color: 'var(--muted)' }}>điểm</span>
              </div>
            </div>
          ))}
        </div>

        {/* Full formula */}
        <div style={{ marginTop: 48, background: 'var(--card)', borderLeft: `4px solid ${FANTA}`, padding: '32px 40px' }}>
          <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>Công thức đầy đủ</div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(24px, 3vw, 40px)', lineHeight: 1.2, letterSpacing: '0.01em', textTransform: 'uppercase' }}>
            <span style={{ color: FANTA }}>Điểm</span> = Bàn × <span style={{ color: FANTA }}>5</span> + Kiến tạo × <span style={{ color: '#2a6fdb' }}>3</span> + Điểm danh × <span style={{ color: '#1f8a5b' }}>2</span>
          </div>
        </div>

        {/* Examples */}
        <div style={{ marginTop: 48 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 20 }}>Ví dụ tính điểm</div>
          <div style={{ display: 'grid', gap: 12 }}>
            {EXAMPLES.map((ex) => (
              <div key={ex.name} className="mob-scoring-ex-row" style={{ background: 'var(--card)', padding: '20px 28px', display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: 24, alignItems: 'center' }}>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, textTransform: 'uppercase' }}>{ex.name}</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: FANTA }}>{ex.goals}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>Bàn</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: '#2a6fdb' }}>{ex.assists}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>Kiến tạo</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: '#1f8a5b' }}>{ex.attend}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>Điểm danh</div>
                </div>
                <div style={{ textAlign: 'right', borderLeft: `2px solid ${FANTA}`, paddingLeft: 20 }}>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 36, color: FANTA }}>= {ex.total}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>Điểm</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: 64 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 24 }}>Câu hỏi thường gặp</div>
          {[
            { q: 'Dữ liệu được cập nhật như thế nào?', a: 'Điểm số được đồng bộ tự động từ Google Sheets mỗi khi có người truy cập trang web. Dữ liệu gốc được nhập thủ công sau mỗi trận đấu.' },
            { q: 'Điểm danh được tính thế nào?', a: 'Mỗi trận có mặt (bất kể thời gian thi đấu) tính 1 lần điểm danh. Cầu thủ vắng mặt không được tính.' },
            { q: 'MVP mùa giải là ai?', a: 'MVP là cầu thủ có tổng điểm cao nhất theo công thức trên, tính đến thời điểm hiện tại.' },
          ].map(faq => (
            <div key={faq.q} style={{ marginBottom: 20, padding: '20px 24px', background: 'var(--card)', borderLeft: `3px solid var(--line)` }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 10 }}>{faq.q}</div>
              <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.65, margin: 0 }}>{faq.a}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 56, display: 'flex', gap: 16 }}>
          <Link href="/" style={{ background: FANTA, color: '#0a0a0a', padding: '16px 32px', textDecoration: 'none', fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            ← Bảng xếp hạng
          </Link>
          <Link href="/dashboard" style={{ background: 'var(--card)', color: 'var(--ink)', padding: '16px 32px', textDecoration: 'none', fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase', border: `1px solid var(--line)` }}>
            Dashboard →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
