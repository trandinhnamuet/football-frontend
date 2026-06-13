import type { Metadata } from 'next';
import './globals.css';
import { AppContextProvider } from './contexts/AppContext';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://lonfantafc.com'),
  title: 'Lon Fanta FC',
  description: 'Đội bóng phong trào Hà Nội — #ĐamMêBấtTận',
  openGraph: {
    title: 'Lon Fanta FC',
    description: 'Đội bóng phong trào Hà Nội — #ĐamMêBấtTận',
    type: 'website',
    locale: 'vi_VN',
    url: 'https://lonfantafc.com',
    siteName: 'Lon Fanta FC',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'Lon Fanta FC - Trận đấu sắp tới',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lon Fanta FC',
    description: 'Đội bóng phong trào Hà Nội — #ĐamMêBấtTận',
    images: ['/api/og'],
  },
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
          {children}
        </AppContextProvider>
      </body>
    </html>
  );
}
