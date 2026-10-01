import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { getHomeSummary, matchDayLabel, daysToMatch, HomeSummary } from './lib/homeSummary';

// Image metadata — Next auto-emits og:image:type / width / height from these.
export const alt = 'Lon Fanta FC — Trận kế tiếp, kết quả & tin mới nhất';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Regenerate (and CDN-cache) the image at most every 5 minutes.
// This keeps the og image statically optimized, so crawlers (Messenger, Zalo,
// Facebook) get an instant, already-rendered PNG instead of waiting for a
// request-time render that can time out and produce no preview.
export const revalidate = 300;

const FANTA = '#ff6b1a';
const BG = '#0a0a0a';
const PANEL = '#161616';
const MUTED = '#8a8a8a';
const RESULT_COLOR: Record<string, string> = { W: FANTA, D: '#6b6b6b', L: '#aa2222' };
const RESULT_WORD: Record<string, string> = { W: 'THẮNG', D: 'HÒA', L: 'THUA' };

async function logoDataUrl(): Promise<string | null> {
  try {
    const buf = await readFile(join(process.cwd(), 'public', 'images', 'fanta-logo.png'));
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch { return null; }
}

function clip(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

function Card({ s, logo }: { s: HomeSummary; logo: string | null }) {
  const { next, last, stats, latest } = s;
  const d = next ? daysToMatch(next) : null;
  const countdown = d === null ? '' : d <= 0 ? 'HÔM NAY!' : d === 1 ? 'NGÀY MAI' : `CÒN ${d} NGÀY`;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', background: BG, color: '#fff', fontFamily: 'sans-serif' }}>
      {/* Cột trái: nhận diện đội + thành tích mùa */}
      <div style={{ width: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', background: FANTA, color: BG }}>
        {logo
          ? <img src={logo} width={170} height={170} style={{ objectFit: 'contain' }} />
          : <div style={{ fontSize: 120, display: 'flex' }}>⚽</div>}
        <div style={{ fontSize: 44, fontWeight: 800, marginTop: 18, letterSpacing: '-0.01em', whiteSpace: 'nowrap', display: 'flex' }}>LON FANTA FC</div>
        <div style={{ fontSize: 22, fontWeight: 600, marginTop: 6, display: 'flex' }}>Đội bóng phong trào Hà Nội</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, display: 'flex' }}>#ĐamMêBấtTận</div>
        {stats && stats.played > 0 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 30 }}>
            {[
              { n: stats.wins, l: 'THẮNG' },
              { n: stats.draws, l: 'HÒA' },
              { n: stats.losses, l: 'THUA' },
            ].map(x => (
              <div key={x.l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: BG, color: '#fff', padding: '10px 16px', minWidth: 88 }}>
                <div style={{ fontSize: 40, fontWeight: 800, color: FANTA, display: 'flex' }}>{x.n}</div>
                <div style={{ fontSize: 15, letterSpacing: '0.12em', color: '#bbb', display: 'flex' }}>{x.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cột phải: trận kế tiếp, kết quả gần nhất, tin mới */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '44px 48px 36px' }}>
        {next ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 22, letterSpacing: '0.2em', color: FANTA, fontWeight: 700, display: 'flex' }}>TRẬN KẾ TIẾP</div>
              <div style={{ fontSize: 22, letterSpacing: '0.16em', color: MUTED, display: 'flex' }}>{`· TUẦN ${next.week}`}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 12, gap: 20 }}>
              <div style={{ fontSize: 30, color: MUTED, fontWeight: 700, display: 'flex' }}>VS</div>
              <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1, display: 'flex' }}>{clip(next.opponent.toUpperCase(), 16)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 22 }}>
              <div style={{ fontSize: 32, fontWeight: 700, display: 'flex' }}>{matchDayLabel(next)}</div>
              {next.time && <div style={{ fontSize: 32, fontWeight: 800, color: FANTA, display: 'flex' }}>{next.time}</div>}
              {countdown && (
                <div style={{ fontSize: 22, fontWeight: 800, background: FANTA, color: BG, padding: '6px 14px', display: 'flex' }}>{countdown}</div>
              )}
            </div>
            {next.venue && (
              <div style={{ fontSize: 24, color: '#cfcfcf', marginTop: 10, display: 'flex' }}>
                {`📍 ${clip(next.venue, 40)} · Sân ${next.pitch_size || 7} người`}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 22, letterSpacing: '0.2em', color: FANTA, fontWeight: 700, display: 'flex' }}>LỊCH THI ĐẤU</div>
            <div style={{ fontSize: 56, fontWeight: 800, marginTop: 12, display: 'flex' }}>Sắp công bố trận mới</div>
          </div>
        )}

        <div style={{ flex: 1, display: 'flex' }} />

        {last && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: PANEL, padding: '14px 18px', borderLeft: `6px solid ${RESULT_COLOR[last.result] || FANTA}` }}>
            <div style={{ fontSize: 18, letterSpacing: '0.14em', color: MUTED, display: 'flex' }}>KẾT QUẢ GẦN NHẤT</div>
            <div style={{ fontSize: 22, fontWeight: 800, background: RESULT_COLOR[last.result] || FANTA, color: last.result === 'W' ? BG : '#fff', padding: '2px 10px', display: 'flex' }}>
              {RESULT_WORD[last.result] || last.result}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, display: 'flex' }}>{`${last.goals_for} - ${last.goals_against}`}</div>
            <div style={{ fontSize: 26, color: '#ddd', display: 'flex' }}>{clip(last.opponent, 22)}</div>
          </div>
        )}

        {latest && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: PANEL, padding: '14px 18px', marginTop: 12, borderLeft: `6px solid ${FANTA}` }}>
            <div style={{ fontSize: 18, letterSpacing: '0.14em', color: MUTED, display: 'flex', flexShrink: 0 }}>TIN MỚI</div>
            <div style={{ fontSize: 24, fontWeight: 700, display: 'flex' }}>{clip(latest.title, 46)}</div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, fontSize: 22, color: MUTED }}>
          <div style={{ display: 'flex' }}>www.lonfantafc.com</div>
          <div style={{ display: 'flex' }}>Lịch đấu · Đội hình · Highlight</div>
        </div>
      </div>
    </div>
  );
}

export default async function Image() {
  const [summary, logo] = await Promise.all([getHomeSummary(), logoDataUrl()]);
  try {
    return new ImageResponse(<Card s={summary} logo={logo} />, { ...size });
  } catch {
    return new ImageResponse(
      (
        <div style={{ fontSize: 72, fontWeight: 800, color: FANTA, background: BG, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          LON FANTA FC
        </div>
      ),
      { ...size },
    );
  }
}
