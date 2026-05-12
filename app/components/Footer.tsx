const FANTA = '#FF6B1A';

const YT_COLOR = '#FF0000';
const FB_COLOR = '#1877F2';
const TT_COLOR = '#010101';

function YoutubeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={YT_COLOR} style={{ flexShrink: 0 }}>
      <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={FB_COLOR} style={{ flexShrink: 0 }}>
      <path d="M24 12.073C24 5.405 18.629 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.884v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  );
}

function TiktokIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={TT_COLOR} style={{ flexShrink: 0, background: '#fff', borderRadius: 3 }}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.83a8.18 8.18 0 0 0 4.78 1.53V6.91a4.85 4.85 0 0 1-1.01-.22z"/>
    </svg>
  );
}

export default function Footer() {
  return (
    <footer style={{ padding: '60px 48px 36px', background: 'var(--bg)', borderTop: `1px solid ${FANTA}` }} className="mob-p-section">
      <div className="mob-footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 48 }}>
        <div>
          <div className="mob-footer-title" style={{ fontFamily: 'Anton, sans-serif', fontSize: 64, lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '0.01em', color: 'var(--ink)' }}>
            LON FANTA <span style={{ color: FANTA }}>FC</span>
          </div>
          <div style={{ fontSize: 12, marginTop: 12, color: FANTA, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>#ĐamMêBấtTận</div>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 20, maxWidth: 360, lineHeight: 1.55 }}>
            Đội bóng phong trào Hà Nội. Đá là vào trận, ra trận là cười.
          </p>
        </div>
        <div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: FANTA, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Theo dõi</div>
          <a href="https://www.youtube.com/@fclonfanta" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, color: 'var(--ink)', textDecoration: 'none', fontFamily: 'Anton, sans-serif', fontSize: 20, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            <YoutubeIcon /> YOUTUBE
          </a>
          <a href="https://www.facebook.com/lonfantafc" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, color: 'var(--ink)', textDecoration: 'none', fontFamily: 'Anton, sans-serif', fontSize: 20, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            <FacebookIcon /> FACEBOOK
          </a>
          <a href="https://www.tiktok.com/@lonfantafc" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, color: 'var(--ink)', textDecoration: 'none', fontFamily: 'Anton, sans-serif', fontSize: 20, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            <TiktokIcon /> TIKTOK
          </a>
        </div>
        <div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: FANTA, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Sân nhà</div>
          <div style={{ marginTop: 12, fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
            Sân Mỹ Đình A · Q. Nam Từ Liêm, Hà Nội<br />
            Thứ 7 · 17:30
          </div>
        </div>
      </div>
      <div className="mob-footer-copy" style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--line)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
        <span>© 2026 LON FANTA FC</span>
        <span>ĐÁ THẬT · VUI THẬT</span>
      </div>
    </footer>
  );
}
