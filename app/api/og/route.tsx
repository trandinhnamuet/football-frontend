import { ImageResponse } from 'next/og';

const FANTA = '#ff6b1a';
const BG = '#0a0a0a';

async function getNextMatch() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(`${baseUrl}/api/matches`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    if (!res.ok) return null;
    const matches = await res.json();
    const upcoming = matches.filter((m: any) => new Date(m.date) > new Date());
    return upcoming.length > 0 ? upcoming[0] : null;
  } catch (e) {
    return null;
  }
}

export async function GET() {
  try {
    const match = await getNextMatch();

    if (!match) {
      return new ImageResponse(
        (
          <div
            style={{
              fontSize: 60,
              color: FANTA,
              background: BG,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Anton',
              flexDirection: 'column',
              padding: '40px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 80, marginBottom: 20, fontWeight: 'bold' }}>⚽</div>
            <div>LON FANTA FC</div>
            <div style={{ fontSize: 32, color: '#666', marginTop: 20 }}>
              Đội bóng phong trào Hà Nội
            </div>
          </div>
        ),
        { width: 1200, height: 630 }
      );
    }

    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };

    const daysUntil = (date: string) => {
      const now = new Date();
      const d = new Date(date);
      const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff;
    };

    const d = daysUntil(match.date);
    const countdown = d <= 0 ? 'HÔM NAY!' : `${d} NGÀY`;

    return new ImageResponse(
      (
        <div
          style={{
            background: BG,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '60px',
            fontFamily: 'Anton',
            color: '#fff',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 40,
              gap: 16,
            }}
          >
            <div
              style={{
                fontSize: 40,
                color: FANTA,
                fontWeight: 'bold',
                paddingRight: 16,
                borderRight: `3px solid ${FANTA}`,
              }}
            >
              ⚽
            </div>
            <div style={{ fontSize: 48, fontWeight: 'bold' }}>TRẬN KẾ TIẾP</div>
          </div>

          {/* Match Info Grid */}
          <div
            style={{
              display: 'flex',
              gap: 40,
              flex: 1,
              alignItems: 'center',
            }}
          >
            {/* Left: Teams */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
                flex: 1,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 24,
                    color: '#888',
                    marginBottom: 8,
                    letterSpacing: '0.1em',
                  }}
                >
                  TUẦN {match.week}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <div
                    style={{
                      fontSize: 64,
                      color: FANTA,
                      fontWeight: 'bold',
                      flex: 1,
                    }}
                  >
                    LON FANTA
                  </div>
                  <div style={{ fontSize: 48, color: '#666' }}>VS</div>
                  <div
                    style={{
                      fontSize: 64,
                      fontWeight: 'bold',
                      flex: 1,
                      textAlign: 'right',
                    }}
                  >
                    {match.opponent.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Date & Time */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 32,
                alignItems: 'flex-end',
                borderLeft: `3px solid ${FANTA}`,
                paddingLeft: 32,
                minWidth: 280,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 20,
                    color: '#888',
                    marginBottom: 8,
                    letterSpacing: '0.1em',
                  }}
                >
                  NGÀY
                </div>
                <div style={{ fontSize: 48, fontWeight: 'bold' }}>
                  {formatDate(match.date)}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 20,
                    color: '#888',
                    marginBottom: 8,
                    letterSpacing: '0.1em',
                  }}
                >
                  GIỜ
                </div>
                <div
                  style={{
                    fontSize: 56,
                    fontWeight: 'bold',
                    color: FANTA,
                  }}
                >
                  {match.time || '17:30'}
                </div>
              </div>

              {match.venue && (
                <div>
                  <div
                    style={{
                      fontSize: 20,
                      color: '#888',
                      marginBottom: 8,
                      letterSpacing: '0.1em',
                    }}
                  >
                    SÂN
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 'bold' }}>
                    {match.venue}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Countdown Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 40,
              paddingTop: 40,
              borderTop: `2px solid ${FANTA}33`,
            }}
          >
            <div style={{ fontSize: 32, color: '#888' }}>
              lonfantafc.com
            </div>
            <div
              style={{
                background: FANTA,
                color: BG,
                padding: '12px 32px',
                borderRadius: 8,
                fontSize: 32,
                fontWeight: 'bold',
                letterSpacing: '0.05em',
              }}
            >
              ⏱ {countdown}
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (error) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 60,
            color: FANTA,
            background: BG,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Anton',
          }}
        >
          LON FANTA FC
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }
}
