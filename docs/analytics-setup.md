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
- **Không có IP, không có mã định danh khách, không xem được từng lượt lẻ.** GA4
  dùng IP để suy ra vị trí rồi vứt bỏ; Data API không trả IP, cũng không trả
  `client_id`. Mọi thứ đều đã gộp sẵn.
- **Lưu dữ liệu chi tiết mặc định chỉ 2 tháng.** Phải tự đổi lên 14 tháng — xem
  bước 7. Báo cáo tổng hợp thì giữ lâu hơn.
- **Số liệu trễ 24–48h mới ổn định.** Realtime có ngay, nhưng báo cáo ngày hôm nay
  còn nhảy.

Hai hạn chế đầu được bù bằng **lớp đo thứ hai tự viết** — xem
[Nhật ký truy cập tự lưu](#nhật-ký-truy-cập-tự-lưu) ở cuối tài liệu. Hai lớp chạy
song song, không thay thế nhau.

---

## 1. Đăng nhập bằng đúng tài khoản Google

Dùng **`it@trecome.vn`** — tài khoản Google dùng chung của công ty. Mọi dịch vụ
Google (Analytics, Search Console, Cloud Console, Ads…) đều đăng ký qua tài khoản
này, không dùng Gmail cá nhân.

**Vì sao không dùng Gmail cá nhân:** tài sản số của công ty (property GA, project
Cloud, tài khoản Ads) sẽ gắn vào một cá nhân. Người đó nghỉ việc, đổi số điện
thoại, hay chỉ đơn giản là mất máy — công ty mất quyền truy cập, và Google gần
như không có đường khôi phục cho tình huống đó.

**Vì sao không dùng Google Workspace:** tốn ~6–7 USD/người/tháng cho thứ mà công
ty đã tự vận hành được bằng iRedMail trên `103.28.33.163`. (Workspace *không* bắt
đổi MX như nhiều người tưởng — nó xác minh domain bằng bản ghi TXT và cho tắt
dịch vụ Gmail để giữ mail server riêng. Lý do bỏ qua thuần tuý là chi phí.)

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

#### Nếu gặp "This phone number has been used too many times"

Google giới hạn số tài khoản mà một số điện thoại được dùng để xác minh, và hạn
mức reset rất chậm (tính bằng tháng). Cách xử lý:

- **Đừng để nó chặn tiến độ.** Tạo GA4 property + Cloud project bằng một tài khoản
  Google sẵn có và chạy tracking trước; bàn giao sang `it@trecome.vn` sau. Quy
  trình bàn giao xem mục [Chuyển quyền sang it@trecome.vn sau](#chuyển-quyền-sang-ittrecomevn-sau)
  bên dưới — dữ liệu không mất, không phải gắn lại tag.
- **Mua SIM riêng cho công ty** (~50–70k) — đây mới là lời giải lâu dài chứ không
  phải chữa cháy. Số cá nhân gắn vào tài khoản dùng chung thì người đó nghỉ việc
  hay đổi số là mất đường khôi phục, đúng cái rủi ro checklist bên trên nói tới.
  Cắm SIM vào một máy cũ để ở văn phòng, dùng làm recovery phone luôn.
- Trước khi mua SIM có thể thử nhanh: đổi sang mạng 4G thay vì wifi văn phòng,
  hoặc tạo tài khoản từ **Settings → Add account** trên máy Android — một số flow
  Google không hỏi số điện thoại. Tỉ lệ ăn thua không cao nhưng mất 2 phút.

> ⚠️ **Không** dùng dịch vụ nhận SMS ảo/online. Google nhận diện được phần lớn dải
> số đó và khoá tài khoản về sau — mất tài khoản khi đã dựng GA property và Cloud
> project lên đó thì thiệt hơn nhiều so với tiền một cái SIM. Số ảo cũng dùng chung
> với người lạ, ai cũng gửi được yêu cầu khôi phục mật khẩu vào đó.

> **Ghi chú về Google Workspace:** Workspace xác minh sở hữu domain bằng bản ghi
> **TXT**, không bắt buộc đổi MX — vẫn có thể tắt dịch vụ Gmail và giữ nguyên
> iRedMail. Sở dĩ không chọn Workspace là vì chi phí ~6–7 USD/người/tháng, chứ
> không phải vì nó phá mail server.

#### Chuyển quyền sang it@trecome.vn sau

Đã đối chiếu tài liệu Google, các mốc dưới đây là bắt buộc và đúng thứ tự.

**Điều kiện tiên quyết:** `it@trecome.vn` phải **đã là một Google Account** thì mới
thêm vào GA được — *"You can only add users whose email addresses are registered in
Google accounts."* Nên vẫn phải giải quyết chuyện SIM, chỉ là không bị chặn ngay.

**1. Google Analytics** — cấp quyền ở **cấp Account**, không phải cấp Property:

> *"If you add a user at the account level, then that user also has access to all the
> properties in the account, with the same set of permissions. If you add a user at
> the property level, then the user has access to only that property."*

→ Admin → **Account access management** (không phải *Property* access management) →
thêm `it@trecome.vn` với vai trò **Administrator**. Cấp ở Account thì tự động phủ
xuống mọi property bên dưới.

Gỡ tài khoản cũ **sau** khi đã thêm xong: *"if you are the last user who has the
Administrator role, you cannot delete yourself"* — nên nếu làm ngược thứ tự sẽ bị
chặn.

**2. Google Cloud** — có thêm một bước dễ bỏ sót:

> *"If your project is not part of an organization, you must use the Google Cloud
> console to grant the Owner role"* (gcloud/API **không** làm được), và *"the user
> must be granted the owner role using the Cloud Platform Console and must explicitly
> accept the invitation."*

→ IAM & Admin → Grant access → `it@trecome.vn` → role **Owner** → Google gửi lời mời
qua email, phải mở hộp thư `it@trecome.vn` **bấm chấp nhận** thì quyền mới có hiệu lực.

**Nên giữ 2 owner thay vì gỡ sạch tài khoản cũ:** *"A Project resource becomes
orphaned if it does not have an owner… we recommend that more than one owner be
associated with the project at all times."*

**Những thứ KHÔNG bị ảnh hưởng khi đổi chủ:**

- Dữ liệu lịch sử trong GA4 — thuộc về property, không thuộc về người dùng
- `NEXT_PUBLIC_GA_ID` và tag trên site — không phải gắn lại
- `GA_SERVICE_ACCOUNT_KEY` — service account là tài nguyên **của project**, không
  gắn với owner là người, nên đổi owner không làm hỏng key

**Nếu sau này muốn chuyển hẳn property sang một Analytics Account khác** (thay vì chỉ
đổi người quản trị): Admin → Move property. *"All reporting data associated with a
property is moved (not copied) to the destination account"*, tracking ID giữ nguyên
nên không phải retag. Nhưng: cần vai trò Administrator + Editor ở **cả hai** account,
không chuyển được nếu property đã liên kết Google Ad Manager hoặc hai account thuộc
hai Google Marketing Platform organization khác nhau, và **change history cũ ở lại
account nguồn**.

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

Cả hai site đều tự host trên VPS `103.28.33.163` và đọc env từ **`.env.local`**
(không phải `.env.production`).

### trecome.vn — pm2 `trecome-nextjs`, cổng 3006

Đã điền đủ 4 biến từ 2026-08-15. Nếu cần đổi:

```bash
ssh root@103.28.33.163
cd /root/trecome-nextjs
nano .env.local
npm run build                          # BẮT BUỘC — NEXT_PUBLIC_GA_ID nhúng lúc build
pm2 restart trecome-nextjs --update-env
```

> trecome.vn từng chạy trên Vercel, đã chuyển về VPS ngày 2026-08-15 vì
> serverless function của Vercel chạy khác region với edge nên route server-side
> mất ~1.1s đo từ VN (tự host: ~0.07s). Chi tiết trong `trecome-server/server-state.md`.

### lonfantafc.com — pm2 `football-frontend`, cổng 3004

Đã điền đủ 4 biến từ 2026-08-15. Nếu cần đổi:

```bash
ssh root@103.28.33.163
cd /root/football-frontend
nano .env.local
bash /root/deploy-fe.sh       # pull + build + pm2 restart
```

`ADMIN_PASSWORD` ở frontend phải **trùng** `ADMIN_PASSWORD` trong
`/root/football-backend/.env` — màn hình analytics dùng chung mật khẩu với các
trang admin còn lại.

### Giá trị đang dùng

| | trecome.vn | lonfantafc.com |
|---|---|---|
| `NEXT_PUBLIC_GA_ID` | `G-ZH6Y0L07QD` | `G-WC5QTXMQJ0` |
| `GA_PROPERTY_ID` | `550034057` | `550028447` |
| `GA_SERVICE_ACCOUNT_KEY` | chung một service account `analytics-reader@trecome-analytics.iam.gserviceaccount.com` | |
| `ADMIN_PASSWORD` | xem `trecome-server/server-state.md` | trùng backend |

> Máy chỉ có 3.8GB RAM và đã chạy iRedMail + 3 app Node. Đã tạo swap 2GB
> (`/swapfile`) để `next build` không bị OOM — đừng xoá.

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

---

## Nhật ký truy cập tự lưu

Lớp đo thứ hai, **chạy song song với GA4**, có ở cả hai web tại `/admin/visitors`
(tách riêng khỏi `/admin/analytics`, hai màn hình có link qua lại).

### Vì sao cần thêm

| GA4 | Nhật ký tự lưu |
|---|---|
| Không cho IP thô | Lưu IP từng lượt |
| Không cho mã định danh khách | `visitor_id` sinh ở trình duyệt, mình toàn quyền |
| Chỉ trả số đã gộp | Xem được từng lượt lẻ, tìm theo IP / visitor / đường dẫn |
| Bị ad-blocker chặn ~10–25% | Beacon về chính domain nên không chặn được |
| Có phễu, so sánh nhóm, dự đoán | Không có — vẫn cần GA4 cho những thứ đó |

### Cách hoạt động

1. `VisitTracker` (nhúng trong root layout) sinh `visitor_id` lưu **localStorage**
   và `session_id` lưu **sessionStorage**, mỗi lần đổi route thì `sendBeacon` về
   `/api/track`.
2. `/api/track` lọc bot theo user-agent, bỏ qua nếu cùng khách + cùng đường dẫn
   trong 5 giây, chặn quá 120 bản ghi/phút mỗi IP, kiểm dạng UUID rồi mới ghi.
   **Luôn trả 204** kể cả khi bỏ qua hoặc lỗi.
3. Ghi vào bảng `visits` của database `webstats` trên MariaDB ngay trên VPS.
   Hai site dùng chung bảng, phân biệt bằng cột `site`.
4. `/api/visitors` (yêu cầu đăng nhập admin) trả số liệu cho màn hình.

Khu `/admin` **không** bị đo — mình tự vào thì tính vào thống kê chỉ làm nhiễu.

### Env

| Biến | trecome.vn | lonfantafc.com |
|---|---|---|
| `STATS_SITE` | `trecome` | `lonfanta` |
| `STATS_DB_HOST` | `127.0.0.1` | `127.0.0.1` |
| `STATS_DB_USER` | `webstats` | `webstats` |
| `STATS_DB_PASS` | xem `trecome-server/server-state.md` | |
| `STATS_DB_NAME` | `webstats` | `webstats` |

Không set thì tính năng tự tắt: beacon vẫn trả 204 nhưng không ghi gì, màn hình
báo "chưa cấu hình". Không có nguy cơ site lỗi.

### Vận hành

```bash
# Xem nhanh trong DB
mysql --defaults-extra-file=/root/.my.webstats.cnf -e \
  "SELECT site, COUNT(*) luot, COUNT(DISTINCT visitor_id) khach, COUNT(DISTINCT ip) ip
     FROM visits GROUP BY site;" webstats

# Dọn dữ liệu quá hạn (cron đã chạy 3h sáng hằng ngày, giữ 365 ngày)
/root/prune-visits.sh 365
```

### Hai cái bẫy đã dính, đừng lặp lại

**Múi giờ.** MariaDB chạy `Asia/Ho_Chi_Minh` nên `DATETIME` lưu giờ +07. Pool
mysql2 phải khai `timezone: '+07:00'`. Để `'Z'` là lệch đúng 7 tiếng, và bug này
chỉ lộ ra khi nhìn màn hình chứ test API không thấy.

**Giả mạo IP.** IP lấy từ `X-Real-IP` do nginx đặt, **không** lấy phần tử đầu của
`X-Forwarded-For` — đoạn đó client tự khai. Điều này chỉ an toàn khi cổng ứng
dụng (3004/3005/3006) không mở ra internet. Mở cổng ra ngoài là mất luôn tính
tin cậy của cột IP.

### Riêng tư

Đang lưu IP thô, không cắt bớt. IP là dữ liệu cá nhân theo **Nghị định 13/2023**;
nếu web có khách EU thì cần nêu trong chính sách riêng tư. Muốn giảm rủi ro có
thể ẩn danh octet cuối (`123.45.67.0`) — đổi ở `recordVisit()` trong `lib/visits.ts`.
