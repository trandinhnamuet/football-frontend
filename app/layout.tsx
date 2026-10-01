import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppContextProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import BottomNav from './components/BottomNav';
import GoogleAnalytics from './components/GoogleAnalytics';
import VisitTracker from './components/VisitTracker';
import PwaRegister from './components/PwaRegister';
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from './lib/seo';

// Mặc định cho mọi trang; từng trang (trang chủ, tin tức, hồ sơ thành viên…)
// ghi đè title/description/openGraph của riêng nó. KHÔNG đặt openGraph.url ở
// đây — trước kia url cố định về trang chủ khiến Facebook/Zalo coi mọi link là
// trang chủ và hiện cùng một preview.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_TAGLINE,
  applicationName: SITE_NAME,
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-64.png', sizes: '64x64', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  // iOS không đọc manifest cho "Thêm vào màn hình chính" — cần các thẻ này.
  appleWebApp: {
    capable: true,
    title: 'Lon Fanta',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: SITE_NAME,
    description: SITE_TAGLINE,
    type: 'website',
    locale: 'vi_VN',
    siteName: SITE_NAME,
    // og:image tags are emitted automatically from app/opengraph-image.tsx
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_TAGLINE,
    // twitter:image tags are emitted automatically from app/twitter-image.tsx
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Cho phép nội dung tràn xuống dưới thanh trạng thái / tai thỏ khi chạy
  // dạng app; CSS dùng env(safe-area-inset-*) để chừa chỗ.
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Apply saved theme before first paint to avoid flash */}
        <script dangerouslySetInnerHTML={{
          __html: `(function(){var t=localStorage.getItem('lffc_theme')||'dark';document.documentElement.setAttribute('data-theme',t);})();`
        }} />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <AppContextProvider>
          <AuthProvider>
            {children}
            <BottomNav />
          </AuthProvider>
        </AppContextProvider>
        {/* Hai lop do song song: GA4 cho buc tranh tong hop, VisitTracker ghi
            tung luot kem IP va visitor ID vao DB cua minh. */}
        <GoogleAnalytics />
        <VisitTracker />
        <PwaRegister />
      </body>
    </html>
  );
}
