# Audit Report — WoodHub (Phase 1, chỉ đọc code)

> Ngày: 2026-10-09 · Phạm vi: `backend/` (Spring Boot), `web/` (React + Vite), cấu hình triển khai.
> **Không có thay đổi code nào** trong phase này. Chưa chạy bất kỳ test/seed/migration nào lên DB.
> Đường dẫn tính từ `woodhub/`. Số dòng là của bản code tại thời điểm audit.

---

## 0. Những điểm KHÁC với mô tả nhiệm vụ (cần bạn biết trước)

| # | Mô tả trong prompt | Thực tế trong code | Hệ quả |
|---|---|---|---|
| 1 | Schema quản lý bằng **Flyway** | **Không có Flyway.** `pom.xml` không có dependency; `application.properties:20` đặt `ddl-auto=validate`; `backend/sql/` chỉ có 2 file lẻ (`refresh_tokens.sql`, `user_last_seen.sql`). Phần lớn schema (enum `payment_status`, bảng `quote_offers`…) **không được version hoá trong repo**. | Quy tắc "tạo migration Flyway mới" không áp dụng được nguyên văn. Cần bạn chọn cách đổi schema (xem câu hỏi ở cuối). |
| 2 | Tính năng gói "Free: 30 tin nhắn/ngày" (ví dụ) | Hạn mức tính **theo THÁNG** (`UsageLimitServiceImpl:36,187`, key `YYYY-MM`, múi giờ VN). Free hiện: `ai_chat=20`, `design=5`, `export=5`, `ar_3d=5` / tháng. | Nhãn hiển thị phải ghi "/tháng". |
| 3 | DB Supabase "riêng", chỉ dùng cho test | Project ref DB local = `cqxieqbwgvftdumoekce`. URL ảnh sản phẩm trong response của **BE production** (`woodhub-be.onrender.com`) cũng nằm ở `cqxieqbwgvftdumoekce.supabase.co/storage/...`. | **Rất có thể production dùng chung DB này** → xem AUD-001. |
| 4 | "Card/modal không hiển thị tính năng của gói" | Code `PricingSection.jsx:92-99` **đã render** `plan.displayFeatures`. Nguyên nhân là dữ liệu: cả 3 gói trên production có `displayFeatures: []` (đã xác nhận bằng `GET /api/subscription-plans`). Modal thì thật sự chưa có phần này. | Phase 5 chủ yếu là **nhập dữ liệu + sửa modal**, không cần migration/đổi API. |
| 5 | Tên gói: Free / gói giữa / Custom Design Premium / Verified | Production có đúng 3 gói: `free` (0đ), `B2C Premium AR/3D` (79.000đ), `Custom Design Premium / Verified` (299.000đ). Không có tính năng "Verified" nào trong code (đã bỏ badge verified khỏi UI). | Không được quảng cáo "Verified" nếu chưa làm. |
| 6 | FE có thể có E2E | FE không có test framework (`package.json` không có script test). BE chỉ có 2 test sơ sài (`WoodHubApplicationTests`, `PasswordHashGeneratorTest`). | Phase 2 phải dựng từ đầu. |

---

## 1. Kiến trúc thực tế

**Backend** (`backend/src/main/java/exe/woodhub`): `controller → service (interface) → service/implement → repository (Spring Data JPA) → entity`. Có `dto`, `exception`, `scheduler` (2 job: hết hạn payment mỗi 5 phút, hết hạn subscription mỗi giờ), `security` (JWT filter), `config` (Security, WebSocket/STOMP, Swagger). 28 controller. Auth là **JWT tự viết** (jjwt, HS256, access 15 phút, refresh 7 ngày lưu DB), không dùng Supabase Auth. Supabase chỉ dùng làm Postgres + Storage. Lỗi auth: không có `AuthenticationEntryPoint` nên request chưa đăng nhập nhận **403** thay vì 401.

**Frontend** (`web/src`): React 19 + Vite, React Router, TanStack Query, Zustand (auth/cart/chat/studio), axios. Một instance `http` trong `api/client.js` (timeout 60s, interceptor gắn `Authorization: Bearer`, tự refresh khi 401/403). Mọi API đi qua `call(realCall, mockKey)`: `VITE_USE_MOCK` hoặc endpoint chưa nằm trong `REAL_ENDPOINTS` → dùng `mockAdapter`. i18n `react-i18next` (vi/en), dark mode daisyUI.

**Deploy:** Vercel (FE) · Render free (BE, region Singapore, Docker) · Python AI trên Render free · Supabase (DB + Storage).

## 2. Bản đồ luồng nghiệp vụ (rút gọn, theo code)

- **Auth:** đăng ký → OTP email (Brevo) → token; đăng nhập; Google OAuth; refresh; logout thu hồi refresh token. FE gọi `ensureFreeSubscription()` sau khi đăng nhập (`services/subscription.js`).
- **Catalog/Cart/Order:** `/shop`, `/product/:id`, giỏ hàng (localStorage), checkout. (Checkout/đơn hàng B2C phần lớn còn mock — `Checkout`/`Orders` không có endpoint BE trong `REAL_ENDPOINTS`.)
- **Custom → Báo giá:** Studio (6 bước, Meshy) → `POST /custom/designs` → `POST /quotes` (customer chọn workshop) → workshop `POST /quotes/{id}/offers` (giá + lead time) → bên kia `accept`/`reject`/ra giá lại → accept tạo `custom_orders` (snapshot `unitPrice`, `leadTimeDays`).
- **Gói đăng ký:** Free → `POST /subscriptions` (không qua thanh toán). Trả phí → `POST /payments/subscription` (tạo `payments` pending + QR SePay, hết hạn 15 phút) → user chuyển khoản → SePay gọi `POST /payments/webhook/sepay` → BE đối chiếu → `activatePlan` → FE poll `GET /payments/{id}` mỗi 4s.
- **Chat:** REST tạo hội thoại + STOMP realtime (`convertAndSendToUser`), CONNECT xác thực JWT.
- **AI chat:** BE gọi Python (Gemini), trừ lượt `ai_chat` trước khi gọi, lỗi → 502 và hoàn lượt.
- **Admin/Supplier portal:** `/admin/*`, `/portal/*` (đã có thêm trang Admin Payments).

---

## 3. Danh sách vấn đề

### Critical

**AUD-001 — Production và DB "test" là MỘT (ĐÃ XÁC NHẬN)** · Critical (quy trình)
- Bằng chứng: project ref `cqxieqbwgvftdumoekce` ở `backend/.env` (`DB_USERNAME`) trùng với host Storage trong response của BE production. `render.yaml` không ghi DB (biến `sync:false`), nên không thể kết luận 100% từ code.
- Hậu quả: seed data / test webhook / migration chạy lên DB này sẽ ghi vào **dữ liệu thật** (user thật, đơn thật, payment thật).
- **Xác nhận (SELECT chỉ đọc qua Supabase MCP):** project `cqxieqbwgvftdumoekce` ("xuanmai000's Project", chỉ có 1 project trong tài khoản) có đúng 3 gói giống production (`free`, `B2C Premium AR/3D` 79.000, `Custom Design Premium / Verified` 299.000), 27 sản phẩm, 13 user, 22 payment, 14 subscription. Người dùng đã chọn **tiếp tục dùng DB này** cho E2E với dữ liệu `[E2E]` + script dọn riêng (quyết định ghi nhận 2026-10-09).
- Đề xuất ban đầu (không chọn): tạo **project Supabase thứ hai** (free) cho dev/test, hoặc dùng Postgres local (Docker) cho E2E. **Dừng Phase 2 cho tới khi bạn quyết định.**

### High

**AUD-002 — Gia hạn gói trả phí MIỄN PHÍ** · High · `service/implement/UserSubscriptionServiceImpl.java:120-141`, `controller/UserSubscriptionController.java:59-63`
- `POST /api/subscriptions/me/renew` cộng thêm 1 tháng vào `endDate` của gói đang active mà **không cần thanh toán**. Chỉ cần đăng nhập + đang có gói trả phí → gọi vô hạn lần để có hạn vô thời hạn.
- Nguyên nhân gốc: endpoint gia hạn được viết trước khi có luồng thanh toán SePay, không được gỡ/nối vào payment.
- Đề xuất: bỏ endpoint (hoặc chuyển thành "tạo payment gia hạn" và chỉ cộng hạn trong webhook). FE đang dùng `renewMySubscription` (`REAL_ENDPOINTS`).

**AUD-003 — Hết hạn/huỷ gói trả phí KHÔNG tự về Free → mất toàn bộ tính năng (429)** · High · `UsageLimitServiceImpl.java:171-185`, `scheduler/SubscriptionExpiryScheduler.java`, `web/src/services/subscription.js:13-27`
- Job chỉ đổi `active → expired`. Không có bản ghi Free mới. Không có gói active ⇒ `planFeatureLimits()` rỗng ⇒ mọi `limit = 0` ⇒ AI chat / thiết kế đều **429**.
- FE chỉ gọi `ensureFreeSubscription()` ngay sau khi **đăng nhập**. User giữ phiên (refresh token 7 ngày) qua lúc gói hết hạn sẽ bị khoá tới khi đăng nhập lại. `cancelMySubscription` cũng để user không có gói.
- Đề xuất: (a) BE: khi không có gói active thì **coi như Free** (fallback theo gói `free`) trong `planFeatureLimits`; hoặc job hạ về Free; (b) FE: gọi `ensureFreeSubscription` khi nhận 429/404 từ `/subscriptions/me`.

**AUD-004 — Webhook không khoá khi gọi trùng đồng thời + mua lại làm mất thời gian còn lại** · High (phần mất thời gian) / Medium (phần race) · `PaymentServiceImpl.java:137-168`, `UserSubscriptionServiceImpl.java:72-97`
- Kiểm tra idempotent chỉ là `if status == paid return` (đọc rồi ghi). Không có `@Lock`/`@Version` (đã grep: toàn repo **không có** `@Version`/`@Lock`). Hai request webhook cùng lúc (SePay retry) cùng đọc `pending` ⇒ `activatePlan` chạy 2 lần. DB có `uq_one_active_subscription` (unique một gói active/user) nên lần chạy thứ 2 thường **văng lỗi 500** thay vì tạo 2 gói active (SePay sẽ gọi lại, lần sau idempotent). `payments.provider_txn_id` **không có unique index**.
- `activatePlan` luôn huỷ gói cũ và tính 1 tháng từ **bây giờ**: mua lại cùng gói khi còn 20 ngày ⇒ **mất 20 ngày đã trả** (không cộng dồn như `renew`).
- Đề xuất: khoá hàng (`SELECT … FOR UPDATE` / `@Lock(PESSIMISTIC_WRITE)` trên `findByTxnRef`), unique `provider_txn_id`; cộng dồn hạn khi cùng gói.

### Medium

**AUD-005 — Webhook vẫn kích hoạt cho payment đã `expired`/quá hạn QR** · Medium · `PaymentServiceImpl.java:144,161`
- Chỉ chặn `paid`. Payment `expired` (job 5 phút) hoặc `pending` nhưng đã quá `expiresAt` vẫn thành `paid` nếu tiền đến. Đây có thể là **mong muốn** (tiền đã nhận thì nên kích hoạt) — cần bạn quyết định chính sách; hiện chưa có test và chưa được ghi lại.

**AUD-006 — Chuyển thiếu tiền nhiều lần không cộng dồn** · Medium · `PaymentServiceImpl.java:149-159`
- Mỗi webhook thiếu tiền ghi đè `paidAmount`/`providerTxnId`/`rawResponse`. Hai lần chuyển 50% = 0 giao dịch hợp lệ, tiền mất dấu. Cần quy trình hoàn/đối soát thủ công.

**AUD-007 — Xác thực webhook & log** · Medium · `PaymentServiceImpl.java:120,133`
- So khớp API key bằng `String.equals` (không constant-time). Không đối chiếu `accountNumber` trong payload với `sepayAccount`. `log.warn(... payload={})` ghi **toàn bộ payload** (tên/số tài khoản người chuyển) vào log Render.
- `SEPAY_WEBHOOK_API_KEY` bắt buộc qua env (không có default) — tốt.

**AUD-008 — Trừ hạn mức không an toàn khi đồng thời** · Medium · `UsageLimitServiceImpl.java:60-90`
- Đọc `used_count` → +1 → lưu, không khoá/atomic. Gửi nhiều request song song có thể vượt hạn mức (và `consume` vẫn trừ lượt rồi mới gọi AI; lỗi AI được hoàn qua rollback giao dịch).

**AUD-009 — Hết hạn báo giá không được lưu & không có job** · Medium · `QuoteServiceImpl.java:322-331` + `makeOffer/acceptOffer/rejectOffer`
- `applyExpiry` set `expired` rồi service ném `ResponseStatusException` → `@Transactional` **rollback** nên trạng thái `expired` không được ghi. Không có scheduler cho quote (chỉ 2 job). `getMyQuotes/getIncomingQuotes` không áp dụng hết hạn ⇒ danh sách có thể hiện "Chờ phản hồi/Đang thương lượng" cho báo giá đã quá hạn.

**AUD-010 — Accept offer đồng thời trả 500 thay vì 409** · Low · `QuoteServiceImpl.java:246-249`
- Chỉ kiểm tra `existsByQuoteRequest` rồi insert. **DB đã chặn trùng đơn** (`custom_orders_quote_request_id_key` UNIQUE, `uq_one_accepted_offer`), nên không có đơn trùng; lỗi chỉ là client nhận 500 thay vì 409.

**AUD-011 — Danh sách báo giá không trả giá/thời gian (liên quan Phase 4)** · Medium · `dto/QuoteRequestResponse.java` (`summary()` truyền `offers = null`)
- Dữ liệu **đã có** (`quote_offers.price` NUMERIC(12,2), `lead_time_days`, `offered_by`, `status`, `created_at`; `custom_orders.unit_price/lead_time_days`) nhưng API danh sách không trả ⇒ FE `MyQuotes.jsx:44-55` không thể hiện giá/thời gian.

**AUD-012 — Schema không version hoá** · Medium · xem mục 0.1. Mọi thay đổi cột/enum chỉ làm được thủ công trên Supabase; `ddl-auto=validate` sẽ làm BE **không khởi động** nếu entity và DB lệch.

**AUD-013 — Gần như không có test tự động** · Medium · xem mục 0.6.

**AUD-014 — Hai giới hạn gói không được thực thi ở đâu cả** · Medium · `UsageFeature`: `export`, `ar_3d`
- Chỉ `design` (Ai3DGeneration, CustomDesign hoàn chỉnh) và `ai_chat` (AiChatServiceImpl:91) gọi `consume()` ở BE. `export` và `ar_3d` chỉ có endpoint `POST /usage/{feature}/consume` mà **FE không gọi** (đã grep). Hai mục này hiện chỉ hiển thị ở trang "Gói của tôi", không giới hạn gì thật ⇒ **không được quảng cáo** như tính năng gói.

### Low

- **AUD-015 — 401 trả thành 403** · Low · `SecurityConfig.java` (không có `AuthenticationEntryPoint`). FE vá bằng cách coi 403 như hết hạn token (`web/src/api/client.js` interceptor) ⇒ mỗi 403 "đúng nghĩa" tốn thêm một lượt refresh + gọi lại.
- **AUD-016 — Swagger/OpenAPI công khai trên production** · Low · `SecurityConfig.java:58-60` (đang dùng làm health check).
- **AUD-017 — STOMP chỉ xác thực lúc CONNECT, không phân quyền SUBSCRIBE** · Low · `StompAuthChannelInterceptor.java:37-45`. Hiện an toàn vì chat dùng `convertAndSendToUser`, nhưng broker `/topic`,`/queue` đang bật; nếu sau này phát tin lên `/topic/...` thì mọi user đã đăng nhập đều nghe được.
- **AUD-018 — CORS mặc định cho `https://*.vercel.app`** · Low · `application.properties:107`. Nếu production không đặt `CORS_ALLOWED_ORIGINS`, bất kỳ app Vercel nào gọi được API (auth bằng header nên rủi ro thấp). Cần xác nhận biến trên Render.
- **AUD-019 — Giá trị mặc định cố định trong `application.properties`** · Low · host pooler Supabase, `DB_USERNAME` mặc định (chứa project ref), Google client id, email người gửi. Không có password/key, nhưng nên bỏ default.
- **AUD-020 — Offer cho phép giá 0, `leadTimeDays` = 0/null, `expiresAt` trong quá khứ** · Low · `dto/CreateOfferRequest.java`.
- **AUD-021 — `PaymentStatus.failed` không bao giờ được set** · Low. FE có nhánh "Thanh toán thất bại" nhưng BE chỉ có `pending → paid/expired`.
- **AUD-022 — AI chat trả 502 từ FE** · Low/đang theo dõi · xem `docs/BUG_AI_CHAT_502.md`.

### Giao diện (FE)

- **UI-001 — Badge "Gói hiện tại" đè lên modal thanh toán** · Medium · `PricingSection.jsx:73-75` + `subscription/PaymentQrModal.jsx:44` + `pages/About.jsx:72-76`
  - Modal là `fixed inset-0 z-[80]` render **trực tiếp bên trong** `PricingSection` (không qua portal), và `PricingSection` nằm trong `<section class="relative … overflow-hidden">` của `/about`. Badge là `absolute -top-3` trong card `relative`. Tôi **chưa tái hiện được lỗi bằng cách đọc code** (về lý thuyết `z-[80]` thắng `z:auto`); nghi ngờ có một stacking context ở tổ tiên (transform/filter/backdrop-blur, hoặc layout page transition) khiến modal bị nhốt thấp hơn badge. **Sẽ tái hiện bằng trình duyệt ở Phase 5** rồi sửa ở nguyên nhân gốc (đưa modal ra `createPortal(document.body)`), không chỉ tăng z-index.
- **UI-002 — Card/modal thiếu danh sách tính năng** · Medium · nguyên nhân: `displayFeatures` rỗng ở cả 3 gói (xem mục 0.4); modal chưa có khối "Bạn sẽ nhận được".
- **UI-003 — `PaymentQrModal` không dịch (hard-code tiếng Việt), thiếu a11y** · Medium · `PaymentQrModal.jsx:48-84`: chuỗi "Thanh toán — …", "Mã QR đã hết hạn" không qua i18n; không có Esc để đóng, không khoá focus, dùng `aria-label` cố định thay vì `aria-labelledby`; trạng thái chờ là `loading-dots` mơ hồ.
- **UI-004 — Trang "Gói của tôi"/Pricing không xử lý trường hợp "không có gói active"** · Low · `PricingSection.jsx:35`: `currentPlanId = null` khi gói hết hạn nên không card nào được đánh dấu "Gói hiện tại" (liên quan AUD-003).
- **UI-005 — `MyQuotes` không có giá/thời gian** · xem AUD-011.
- Chưa kiểm tra responsive ~400px và thiếu key i18n toàn app (làm ở Phase 2/5 bằng trình duyệt).

---

## 4. Bảng tổng kết

| Mức độ | Số lượng | ID |
|---|---|---|
| Critical | 1 | AUD-001 |
| High | 3 | AUD-002, AUD-003, AUD-004 |
| Medium | 12 | AUD-005 … AUD-009, AUD-011 … AUD-014 (9 mục), UI-001, UI-002, UI-003 |
| Low | 10 | AUD-010, AUD-015 … AUD-022 (8 mục), UI-004 |
| **Tổng** | **26** (22 AUD + 4 UI) | |


## 5. Đề xuất thứ tự sửa (để bạn chọn ở GATE 1)

1. AUD-001 (quyết định môi trường test) — **chặn mọi phase sau**.
2. AUD-002 (gia hạn miễn phí) → AUD-003 (hết hạn → khoá tính năng) → AUD-004 (webhook trùng/mất thời gian).
3. AUD-009, AUD-011 (cần cho Phase 4), AUD-014 (liên quan Phase 5: không quảng cáo `export`/`ar_3d`).
4. UI-001/UI-002/UI-003 (Phase 5).
5. Phần Low để sau.

> Mọi mục AUD-002/003/004/005/006/007/008/009/010 là thay đổi **BE** và một số cần sửa hành vi API ⇒ theo quy tắc 4/5 mình sẽ không tự làm khi chưa được bạn duyệt từng mục.
