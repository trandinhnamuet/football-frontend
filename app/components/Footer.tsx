const FANTA = '#FF6B1A';

export default function Footer() {
  return (
    <footer style={{ padding: '60px 48px 36px', background: 'var(--bg)', borderTop: `1px solid ${FANTA}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 48 }}>
        <div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 64, lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '0.01em', color: 'var(--ink)' }}>
            LON FANTA <span style={{ color: FANTA }}>FC</span>
          </div>
          <div style={{ fontSize: 12, marginTop: 12, color: FANTA, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>#ĐamMêBấtTận</div>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 20, maxWidth: 360, lineHeight: 1.55 }}>
            Đội bóng phong trào Hà Nội. Đá là vào trận, ra trận là cười.
          </p>
        </div>
        <div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: FANTA, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Theo dõi</div>
          <a href="https://youtube.com" target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 12, color: 'var(--ink)', textDecoration: 'none', fontFamily: 'Anton, sans-serif', fontSize: 22, letterSpacing: '0.02em', textTransform: 'uppercase' }}>▶ YOUTUBE</a>
          <a href="https://facebook.com" target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 6, color: 'var(--ink)', textDecoration: 'none', fontFamily: 'Anton, sans-serif', fontSize: 22, letterSpacing: '0.02em', textTransform: 'uppercase' }}>▶ FACEBOOK</a>
        </div>
        <div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: FANTA, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Sân nhà</div>
          <div style={{ marginTop: 12, fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
            Sân Mỹ Đình A · Q. Nam Từ Liêm, Hà Nội<br />
            Thứ 7 · 17:30
          </div>
        </div>
      </div>
      <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--line)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
        <span>© 2026 LON FANTA FC</span>
        <span>ĐÁ THẬT · VUI THẬT</span>
      </div>
    </footer>
  );
}
