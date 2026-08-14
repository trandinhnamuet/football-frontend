# Hướng dẫn bật tracking traffic (GA4)

Áp dụng cho cả **trecome.vn** (repo này) và **lonfantafc.com** (`football-frontend`).

Đã xong: code trên cả hai site, và hộp thư `it@trecome.vn` dùng để đăng ký tài
khoản Google (bước 1). Còn lại: tạo property GA4 và điền 4 biến môi trường.

Chưa điền env thì mọi thứ **im lặng không làm gì**: không có thẻ script nào được
nhúng, `/admin/analytics` báo "chưa cấu hình". Không có nguy cơ site lỗi.

---

## 0. Vì sao chọn GA4

| Tiêu chí | GA4 |
|---|---|
| Chi phí | Miễn phí tới 10 triệu event/tháng — hai site này còn cách rất xa hạn mức |
| Dữ liệu | Người dùng, phiên, nguồn traffic, thiết bị, khu vực, hành vi theo trang, realtime |
| Tích hợp | Nối thẳng Search Console, Google Ads, Looker Studio |
| API | Data API mở, nên mới dựng được màn hình thống kê riêng như trong repo này |

**Hạn chế cần biết trước:**

- **Ad-blocker chặn ~10–25% lượt truy cập ở VN.** Số GA4 luôn thấp hơn thực tế.
  Vì vậy trecome.vn chạy thêm Vercel Analytics (đo ở phía edge, không bị chặn) để
  đối chiếu. Chênh lệch giữa hai con số chính là phần GA4 đang hụt.
- **Lưu dữ liệu chi tiết mặc định chỉ 2 tháng.** Phải tự đổi lên 14 tháng — xem
  bước 7. Báo cáo tổng hợp thì giữ lâu hơn.
- **Số liệu trễ 24–48h mới ổn định.** Realtime có ngay, nhưng báo cáo ngày hôm nay
  còn nhảy.

---

## 1. Đăng nhập bằng đúng tài khoản Google

Dùng **`it@trecome.vn`** — tài khoản Google dùng chung của công ty. Mọi dịch vụ
Google (Analytics, Search Console, Cloud Console, Ads…) đều đăng ký qua tài khoản
này, không dùng Gmail cá nhân.

**Vì sao không dùng Gmail cá nhân:** tài sản số của công ty (property GA, project
Cloud, tài khoản Ads) sẽ gắn vào một cá nhân. Người đó nghỉ việc, đổi số điện
thoại, hay chỉ đơn giản là mất máy — công ty mất quyền truy cập, và Google gần
như không có đường khôi phục cho tình huống đó.

**Vì sao không dùng Google Workspace:** Workspace bắt trỏ bản ghi MX của
`trecome.vn` về Google, sẽ phá mail server iRedMail công ty đang tự vận hành trên
`103.28.33.163`. Không đáng đánh đổi.

### Lần đầu: tạo Google Account cho địa chỉ này

Google Account **không bắt buộc phải là Gmail** — tạo được từ địa chỉ email có sẵn:

1. Vào <https://accounts.google.com/signup>.
2. Bấm **"Use your existing email instead"** (link nhỏ dưới ô chọn tên Gmail).
3. Nhập `it@trecome.vn`.
4. Google gửi mã xác minh → đọc mã tại <https://mail.trecome.vn/mail/> hoặc
   <https://webmail.trecome.vn/>, đăng nhập bằng chính `it@trecome.vn`.
   Mật khẩu hộp thư nằm trong `trecome-server/server-state.md` (**không** commit
   vào repo này).

> Hộp thư đã được cấu hình sẵn để **nhận ngay** thư từ Google — greylisting đã
> được tắt riêng cho luồng `@google.com` và `@.google.com`. Nếu mã vẫn chưa về sau
> 1–2 phút, kiểm tra thư mục Spam trước khi bấm gửi lại.

### Bắt buộc làm ngay sau khi tạo xong

Tài khoản này là **điểm chết duy nhất** — mất nó là mất toàn bộ dữ liệu analytics,
project Cloud và về sau có thể cả tài khoản Ads. Nên ngay sau khi tạo:

- [ ] Bật **2-Step Verification**, ưu tiên **Authenticator app** hơn SMS
- [ ] Lưu bộ **backup codes** vào nơi ít nhất 2 người trong công ty truy cập được
- [ ] Thêm **recovery email** là một hộp thư khác của công ty (ví dụ
      `postmaster@trecome.vn`), **không** phải mail cá nhân
- [ ] Thêm **recovery phone** là số dùng lâu dài của công ty
- [ ] Trong GA4, cấp thêm quyền **Administrator** cho ít nhất một người thật
      (Admin → Property access management) — để lỡ mất tài khoản chung vẫn còn
      đường vào

---

## 2. Tạo property GA4 (làm 2 lần, mỗi site 1 property)

1. Vào <https://analytics.google.com> → biểu tượng **bánh răng (Admin)** góc dưới trái.
2. **Create → Property**.
3. Property name: `trecome.vn` (lần sau: `lonfantafc.com`).
   - Reporting time zone: **(GMT+07:00) Vietnam**
   - Currency: **Vietnamese Dong (VND)**
4. Điền ngành nghề / quy mô → **Next** → chọn mục tiêu → **Create** → đồng ý điều khoản.

> Hai site nên nằm **cùng một Account**, khác **Property**. Cùng account thì
> quản lý quyền một chỗ; khác property thì số liệu không lẫn vào nhau.

## 3. Tạo data stream để lấy Measurement ID

1. Trong property vừa tạo: **Admin → Data collection and modification → Data streams**.
2. **Add stream → Web**.
   - Website URL: `https://trecome.vn` (hoặc `https://lonfantafc.com`)
   - Stream name: đặt gì cũng được
   - **Bật Enhanced measurement** (mặc định đã bật — bắt buộc phải bật, vì hai site
     đều là SPA Next.js và chuyển trang client-side chỉ được ghi nhận nhờ tính năng
     này).
3. **Create stream**. Màn hình chi tiết stream hiện **MEASUREMENT ID** dạng
   `G-XXXXXXXXXX` → đây là giá trị của `NEXT_PUBLIC_GA_ID`.

## 4. Lấy Property ID (dãy số)

**Admin → Property details** (hoặc Property settings). Góc trên bên phải có
**PROPERTY ID** dạng `512345678`.

⚠️ Đây **không phải** `G-XXXXXXXXXX`. Hai mã khác nhau, dùng cho hai việc khác nhau:

| Mã | Dạng | Dùng để |
|---|---|---|
| Measurement ID | `G-XXXXXXXXXX` | Trình duyệt **gửi** dữ liệu lên GA |
| Property ID | `512345678` | Server của ta **đọc** dữ liệu từ GA về |

## 5. Tạo Service Account để màn hình dashboard đọc được số liệu

Bước này chỉ cần làm **một lần**, dùng chung cho cả hai property.

1. Vào <https://console.cloud.google.com> → tạo project mới, ví dụ `trecome-analytics`.
2. **APIs & Services → Library** → tìm **"Google Analytics Data API"** → **Enable**.
3. **IAM & Admin → Service Accounts → Create service account**.
   - Tên: `analytics-reader`
   - Bước "Grant this service account access to project": **bỏ qua**, không cần role nào.
   - **Done**.
4. Bấm vào service account vừa tạo → tab **Keys** → **Add key → Create new key → JSON**
   → file `.json` tự tải về. **Giữ kỹ, Google không cho tải lại.**
5. Copy **email** của service account (dạng `analytics-reader@trecome-analytics.iam.gserviceaccount.com`).
6. Quay lại GA4 → **Admin → Property access management** → dấu **+** → **Add users**
   - Email: dán email service account ở trên
   - Role: **Viewer**
   - Bỏ tick "Notify new users by email"
   - **Add**
7. **Lặp lại bước 6 cho property còn lại.**

### Chuyển file JSON thành một dòng để đặt vào env

File JSON có xuống dòng nên dán thẳng vào ô env hay bị hỏng. Mã hoá base64 cho chắc:

```powershell
# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\duong-dan\key.json")) | Set-Clipboard
```

```bash
# Linux / macOS / Git Bash
base64 -w0 key.json
```

Chuỗi base64 đó là giá trị của `GA_SERVICE_ACCOUNT_KEY`. (Code chấp nhận cả JSON
thô lẫn base64 — nhưng base64 an toàn hơn hẳn khi copy-paste.)

---

## 6. Điền biến môi trường

Bốn biến, giống nhau ở cả hai site:

| Biến | Giá trị | Ai dùng |
|---|---|---|
| `NEXT_PUBLIC_GA_ID` | `G-XXXXXXXXXX` | Trình duyệt — nhúng gtag.js |
| `GA_PROPERTY_ID` | `512345678` | Server — gọi GA4 Data API |
| `GA_SERVICE_ACCOUNT_KEY` | chuỗi base64 ở bước 5 | Server — xác thực với Google |
| `ADMIN_PASSWORD` | mật khẩu tự đặt | Cổng vào `/admin/analytics` |

> ⚠️ `NEXT_PUBLIC_GA_ID` được **nhúng cứng vào bundle lúc build**. Đổi giá trị này
> thì phải **build lại**, restart không đủ.

### trecome.vn (Vercel)

1. Vercel Dashboard → project → **Settings → Environment Variables**.
2. Thêm cả 4 biến, tick môi trường **Production** (và Preview nếu muốn test trước).
3. **Deployments → Redeploy** bản mới nhất (bắt buộc, vì `NEXT_PUBLIC_*` nhúng lúc build).

Ngoài ra vào tab **Analytics** của project bật **Web Analytics** — đây là lớp đo
thứ hai (Vercel Analytics), độc lập với GA4 và không cần biến môi trường nào.

### lonfantafc.com (VPS 103.28.33.163)

Server đọc env từ **`.env.local`** (không phải `.env.production`). Bốn khoá đã
được thêm sẵn vào file đó dưới dạng rỗng, `ADMIN_PASSWORD` đã điền sẵn bằng giá
trị lấy từ `/root/football-backend/.env`. Chỉ cần điền 3 khoá GA còn lại:

```bash
ssh root@103.28.33.163
cd /root/football-frontend
nano .env.local               # điền NEXT_PUBLIC_GA_ID, GA_PROPERTY_ID, GA_SERVICE_ACCOUNT_KEY
bash /root/deploy-fe.sh       # pull + build + pm2 restart
```

Hoặc làm tay:

```bash
pm2 stop football-frontend    # giải phóng RAM, VPS chỉ có 3.8GB
npm run build                 # BẮT BUỘC — NEXT_PUBLIC_GA_ID nhúng lúc build
pm2 restart football-frontend --update-env
pm2 logs football-frontend --lines 30
```

`ADMIN_PASSWORD` ở frontend phải **trùng** `ADMIN_PASSWORD` trong
`/root/football-backend/.env` — màn hình analytics dùng chung mật khẩu với các
trang admin còn lại.

---

## 7. Đổi thời gian lưu dữ liệu lên 14 tháng

Mặc định GA4 chỉ giữ 2 tháng dữ liệu chi tiết. Nên đổi ngay, vì đổi muộn **không
khôi phục được** phần đã bị xoá:

**Admin → Data collection and modification → Data retention** →
"Event data retention" đổi từ *2 months* sang **14 months** → **Save**.

---

## 8. Kiểm tra sau khi bật

| Kiểm tra | Cách làm | Kết quả đúng |
|---|---|---|
| gtag đã nhúng chưa | Mở site → F12 → tab Network → lọc `gtag` | Có request tới `googletagmanager.com/gtag/js` |
| GA có nhận dữ liệu không | GA4 → **Reports → Realtime** | Thấy 1 người đang online (chính mình) |
| Dashboard chạy chưa | Vào `/admin/analytics`, nhập mật khẩu | Hiện số liệu thay vì banner lỗi |

Nếu dashboard báo **"GA từ chối truy cập property…"** → chưa làm mục 6 của bước 5
(chưa thêm email service account vào Property access management với quyền Viewer).

Nếu báo **"Invalid grant: account not found"** → `GA_SERVICE_ACCOUNT_KEY` sai,
hoặc service account đã bị xoá trên Google Cloud.

Property vừa tạo thì **24–48 giờ đầu** báo cáo theo ngày sẽ trống hoặc rất ít —
đó là bình thường, Realtime vẫn phải có ngay.

---

## Những gì code đã làm sẵn

| Việc | Ở đâu |
|---|---|
| Nhúng gtag.js (no-op khi thiếu env) | `components/GoogleAnalytics.tsx` |
| Gọi GA4 Data API bằng service account | `lib/ga.ts` |
| API trả số liệu cho dashboard | `app/api/analytics/route.ts` |
| Cổng mật khẩu | `lib/admin-auth.ts`, `app/api/admin/session/route.ts` |
| Màn hình thống kê | `app/admin/analytics/` |
| Chặn Google index khu admin | `app/robots.ts` |
| Bắn event `generate_lead` khi gửi form liên hệ | `components/ContactForm.tsx` |

Bên `football-frontend` cấu trúc tương đương, đặt trong `app/lib/` và `app/components/`,
riêng phần xác thực dùng lại `AdminGuard` + header `x-admin-password` sẵn có.
