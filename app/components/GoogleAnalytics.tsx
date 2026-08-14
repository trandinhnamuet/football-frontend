import Script from 'next/script';

/**
 * Nhúng Google tag (gtag.js) cho GA4.
 *
 * Không set NEXT_PUBLIC_GA_ID thì component không render gì cả — nhờ vậy môi
 * trường dev và preview không bắn dữ liệu rác vào property production.
 *
 * Điều hướng client-side của Next không cần bắn page_view thủ công: bật
 * "Enhanced measurement" trong GA4 (mặc định bật) là GA tự ghi nhận qua
 * History API. Bắn thêm ở đây sẽ thành đếm hai lần.
 */
export default function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
      </Script>
    </>
  );
}
