# Fix Log — Phase 3

> Ngày: 2026-10-09 · Phạm vi được duyệt: nhóm 1 (AUD-002/003/004/004b) + nhóm 2 (AUD-009/020/005, chính sách **B**).
> Mọi sửa BE nằm trong repo `backend/` (remote `xuanmai000/woodhub-be`) — **mỗi lỗi một commit, CHƯA push**.
> Test: `web/e2e` (Playwright, API) chạy trên BE local với DB dùng chung (dữ liệu `[E2E]`, đã dọn).
> **Kết quả sau nhóm 1+2: 46/47 pass; sau nhóm 3: 52/52 pass** (xem phần "Nhóm 3" cuối file).

| ID | Commit (`backend/`) | Test trước → sau |
|---|---|---|
| AUD-002 | `517f3db` | ❌ → ✅ |
| AUD-003 | `9448eea` | ❌ → ✅ |
| AUD-004 | `4d9e916` | ❌ → ✅ |
| AUD-004b | `8eed56b` | ❌ → ✅ |
| AUD-005 (chính sách B) | `d2726d8` | ❌ → ✅ (test viết lại đúng chính sách) |
| AUD-020 | `9726946` | ❌ → ✅ |
| AUD-009 | `6ce5e6d` | ❌ → ✅ |

Quy trình mỗi lỗi: test tái hiện đã **fail** ở lần chạy baseline (xem `docs/e2e-report.md`) → sửa nguyên nhân gốc → biên dịch → commit riêng. Do khởi động lại BE mất ~40 giây, mình sửa lần lượt 7 commit rồi **chạy toàn bộ suite một lần** thay vì chạy lại sau từng commit; nếu có test fail thì sẽ truy về đúng commit (không có lỗi nào xảy ra).

---

## AUD-002 — Gia hạn gói trả phí miễn phí · `fix(subscription)`
- **Nguyên nhân gốc:** `renewMySubscription()` chỉ cộng 1 tháng vào `end_date`, không kiểm tra thanh toán (viết trước khi có SePay).
- **Đã đổi:** `UserSubscriptionServiceImpl.renewMySubscription` giờ ném **402** kèm hướng dẫn; Free vẫn 400, không có gói vẫn 404. File: `UserSubscriptionServiceImpl.java`, `UserSubscriptionController.java` (mô tả Swagger).
- **Vì sao như vậy:** gia hạn thật = thanh toán lại đúng gói đang dùng; webhook + AUD-004b sẽ cộng dồn. Một đường duy nhất cộng hạn ⇒ không còn kẽ hở.
- **Cách khác:** (a) xoá hẳn endpoint — gọn hơn nhưng client cũ nhận 404 khó hiểu; (b) endpoint tự tạo payment gia hạn — thêm API mới, chưa cần.
- **FE đi kèm (chưa commit, xem ghi chú cuối):** `MySubscription.jsx` nút "Gia hạn +1 tháng" mở `PaymentQrModal` cho gói hiện tại; bỏ `useRenewSubscription`, `renewMySubscription` (client + mock + `REAL_ENDPOINTS`).
- ⚠️ **Đổi hành vi API** (endpoint cũ nay 402) — là sửa lỗ hổng, đã nêu rõ.

## AUD-003 — Hết hạn gói → bị khoá mọi tính năng · `fix(usage)`
- **Nguyên nhân gốc:** `planFeatureLimits()` trả `{}` khi không có gói active ⇒ mọi `limit = 0` ⇒ 429. Job hết hạn chỉ đổi `active → expired`.
- **Đã đổi:** `UsageLimitServiceImpl` + `SubscriptionPlanRepository.findFirstByPriceLessThanEqualAndIsActiveTrueOrderBySortOrderAsc`: không có gói active thì lấy hạn mức gói **Free** (giá ≤ 0, đang bán).
- **Vì sao:** sửa tại nơi quyết định hạn mức ⇒ đúng cho mọi đường (hết hạn, huỷ, user mới chưa đăng ký Free, session cũ), không phụ thuộc FE.
- **Cách khác:** job tạo bản ghi Free khi hết hạn — tạo thêm dữ liệu và phải sửa `activatePlan`; fallback đọc đơn giản và an toàn hơn.
- **Lưu ý:** `GET /subscriptions/me` vẫn 404 khi không có gói active (không đổi contract) — FE vẫn hiện "Chưa có gói", nhưng tính năng không còn bị khoá.

## AUD-004 — Webhook đồng thời kích hoạt trùng · `fix(payment)`
- **Nguyên nhân gốc:** kiểm tra idempotent kiểu "đọc status rồi ghi", không khoá. 5 request cùng đọc `pending` ⇒ 5 lần `activatePlan` (trước khi sửa: lịch sử gói +5, cả 5 trả 200).
- **Đã đổi:** `PaymentRepository.findByTxnRefForUpdate` (`@Lock(PESSIMISTIC_WRITE)` ⇒ `SELECT … FOR UPDATE`), `PaymentServiceImpl` dùng nó. Request thứ hai chờ, tới lượt thấy `paid` và thoát.
- **Bằng chứng sau sửa:** log BE ghi payment `…075` "đã thanh toán, kích hoạt gói" **đúng 1 lần**; test `+1` pass.
- **Cách khác:** unique index trên `provider_txn_id` (cần đổi schema, và chỉ chặn ở mức DB bằng lỗi 500); `@Version` (retry phức tạp hơn). Khoá hàng phù hợp nhất cho luồng ngắn này.

## AUD-004b — Mua lại gói còn hạn bị mất ngày · `fix(subscription)`
- **Nguyên nhân gốc:** `activatePlan` luôn tính `end = now + 1 tháng`. Trước khi sửa: còn tới 29/11, mua lại ⇒ 09/11 (**mất 20 ngày**).
- **Đã đổi:** nếu mua lại **đúng gói đang dùng** và còn hạn thì `end = end_hiện_tại + 1 tháng`.
- **Giới hạn đã biết (chủ ý):** đổi sang gói **khác** vẫn tính từ bây giờ — chưa có quy tắc quy đổi giá trị gói cũ (cần bạn quyết định nghiệp vụ nâng/hạ cấp).

## AUD-005 — Trả muộn sau khi QR hết hạn · `fix(payment)` (chính sách B đã chốt)
- **Quyết định:** tiền đã vào ⇒ ghi nhận `paid` và kích hoạt, kể cả payment `expired`/quá `expires_at`.
- **Đã đổi:** `PaymentServiceImpl`: tính `late`; giao dịch trả muộn **và** gói đã ngừng bán ⇒ ghi `paid`, **không** kích hoạt, `log.warn` để admin xử lý; còn lại kích hoạt như thường. Giao dịch muộn nhận ra bằng `paid_at > expires_at`.
- **Test:** viết lại theo chính sách (payment `expired` + đủ tiền ⇒ `paid`, +1 kích hoạt, `paidAt > expiresAt`). Nhánh "muộn + gói đã tắt" **chưa có test tự động** vì cần tắt gói trên DB dùng chung.

## AUD-020 — Offer giá 0 / thời gian 0 · `fix(quote)`
- **Đã đổi:** `CreateOfferRequest`: `price` `@DecimalMin("0", inclusive = false)` (phải > 0); `leadTimeDays` `@Min(1)` (vẫn có thể bỏ trống).
- **Ghi chú:** thắt chặt validation — có thể làm request cũ giá 0 nhận 400 (là mục đích).

## AUD-009 — Hết hạn báo giá không được ghi nhận · `fix(quote)`
- **Nguyên nhân gốc:** (1) `applyExpiry` đặt `expired` rồi service ném 409 ⇒ transaction **rollback**; (2) danh sách không áp hết hạn; (3) không có job.
- **Đã đổi:** `QuoteServiceImpl` (`noRollbackFor = ResponseStatusException` cho cancel/makeOffer/accept/reject; danh sách gọi `expireOverdue` trước khi đọc, không còn `readOnly`), `QuoteRequestRepository.expireOverdue` (bulk JPQL), `QuoteService.expireOverdueQuotes`, và `QuoteExpiryScheduler` (5 phút).
- **Vì sao 3 lớp:** thao tác trực tiếp (ngay lập tức) + liệt kê (hiển thị đúng) + job (dọn nền). `noRollbackFor` an toàn vì các nhánh ném lỗi đều nằm **trước** mọi thay đổi dữ liệu khác.
- **Trade-off:** `GET /quotes/my|incoming` giờ có một câu `UPDATE` (rẻ, chạy theo chỉ mục) — chấp nhận để dữ liệu luôn đúng.

---

## Chưa làm / cần bạn quyết định
- **Nhóm 3** (AUD-007, 008, 010, 015, 016, 018, và các mục Low) — chưa được duyệt. AUD-015 (401 thay vì 403) làm đổi hành vi API và cần phối hợp FE (interceptor đang coi 403 là hết hạn token).
- **Đổi gói khác / nâng cấp giữa kỳ** (AUD-004b): cần quy tắc nghiệp vụ.
- **Chưa push** các commit BE; chưa commit FE/test (xem dưới).

## Trạng thái git (để bạn xem trước khi commit/push)
- `backend/` (repo BE): 7 commit mới, **chưa push**; chưa theo dõi: `sql/e2e/` (seed/cleanup).
- `woodhub/` (repo gốc): nhiều thay đổi **chưa commit** từ các việc trước (AI chat, studio, accountScope, admin payments, e2e…) cộng với phần FE của AUD-002. Mình **không gộp** vào commit nào vì các file (`client.js`, `mockAdapter.js`…) đang chứa cả thay đổi cũ chưa được duyệt commit. Bạn muốn mình tách commit theo chủ đề không?

---

# Nhóm 3 (đã chạy 2026-10-09) — kết quả: **52/52 test pass**

Test mới: `web/e2e/06-hardening.spec.js` (5 test). Baseline đỏ (trước khi sửa): AUD-008, AUD-015, AUD-017 fail; AUD-010 **không tái hiện**.

| ID | Commit (`backend/`, chưa push) | Trước → sau |
|---|---|---|
| AUD-015 | `dd9c087` | ❌ → ✅ (chưa đăng nhập: 403 → **401**) |
| AUD-017 | `a9c9923` | ❌ → ✅ (subscribe `/topic/**` bị ERROR; `/user/queue/messages` vẫn được) |
| AUD-008 | `4b89d74` | ❌ → ✅ (12 request đồng thời, hạn mức 5 ⇒ đúng 5 thành công, 7 bị 429) |
| AUD-007 | `231892c` | (không test được tự động — xem dưới) |
| AUD-010 | — không sửa | đã đúng, giữ test làm hồi quy |

## AUD-015 — 401 thay vì 403 · `fix(security)`
- **Nguyên nhân gốc:** `SecurityConfig` không có `AuthenticationEntryPoint` ⇒ Spring trả 403 cho request chưa xác thực.
- **Đã đổi:** thêm `.exceptionHandling(... authenticationEntryPoint ...)` trả 401 + JSON `{status, error, message}`.
- **FE:** **không đổi** (cố ý). Interceptor đang refresh token cho cả 401 lẫn 403 nên chạy đúng với BE mới và BE cũ. Sau khi BE này lên production, có thể bỏ nhánh 403 trong `web/src/api/client.js` để 403 "thiếu quyền" không còn tốn thêm một lượt refresh. Làm bây giờ thì nếu FE lên trước BE, token hết hạn sẽ không được refresh.

## AUD-017 — SUBSCRIBE không bị kiểm soát · `fix(websocket)`
- **Đã đổi:** `StompAuthChannelInterceptor`: frame `SUBSCRIBE` chỉ được phép tới destination bắt đầu bằng `/user/` và phải có Principal; còn lại ném `MessagingException` (client nhận frame ERROR).
- **An toàn với chat:** đã kiểm tra FE chỉ subscribe `/user/queue/messages` (`chatSocket.js:44`) và BE chỉ phát bằng `convertAndSendToUser`; test xác nhận subscribe này vẫn không lỗi.

## AUD-008 — Vượt hạn mức khi gọi song song · `fix(usage)`
- **Nguyên nhân gốc:** `consume()` đọc `used_count` → +1 → lưu (check-then-act). Baseline: 12 request đồng thời, hạn mức 5 ⇒ **7 qua** (vượt 2) và 5 lỗi 409 do đụng khoá chính lần dùng đầu.
- **Đã đổi:** `UserUsageLimitRepository.tryConsume` — một câu `INSERT … ON CONFLICT DO UPDATE … WHERE used_count < limit RETURNING`; `UsageLimitServiceImpl.consume` dùng nó.
- **Vì sao không dùng khoá hàng user:** `consume` được gọi trong transaction của AI chat/tạo thiết kế (có thể kéo dài tới 60 giây); khoá hàng `users` sẽ chặn mọi cập nhật khác lên user đó trong thời gian đó. Upsert nguyên tử chỉ khoá đúng dòng đếm.
- **Trade-off:** hai request cùng user + cùng tính năng vẫn xếp hàng chờ nhau ở dòng đếm (đúng ý nghĩa của hạn mức).

## AUD-007 — Webhook: so khớp key và log · `fix(payment)`
- **Đã đổi:** `MessageDigest.isEqual` (thời gian không đổi) thay `String.equals`; log cảnh báo chỉ ghi `referenceCode` + số tiền, không in cả payload (tên/số tài khoản người chuyển).
- **Không làm (có chủ ý):** đối chiếu `accountNumber` trong payload với tài khoản nhận. Mình chưa có mẫu payload thật của SePay; nếu tên trường/định dạng khác (tài khoản ảo, tài khoản phụ) thì sẽ **từ chối tiền thật**. Đề xuất: lấy 1–2 log webhook thật rồi mới bật kiểm tra, ban đầu ở chế độ chỉ cảnh báo.
- **Test:** không có test tự động (không quan sát được thời gian so khớp hay nội dung log từ bên ngoài).

## AUD-010 — Không sửa
- 5 vòng × 3 request chấp nhận đồng thời đều cho `201, 409, 409`. DB đã có `custom_orders_quote_request_id_key` (UNIQUE) và `uq_one_accepted_offer`, và lỗi `23505` được ánh xạ thành 409. Log BE vẫn ghi `WARN ... duplicate key` mỗi lần (ồn nhưng vô hại). Audit ban đầu dự đoán 500 là **sai**; hạ xuống "không phải lỗi".

---

## Các mục nhóm 3 mình **chủ động không sửa** và lý do

| ID | Quyết định | Lý do |
|---|---|---|
| AUD-016 Swagger công khai | Không đổi | Render đang dùng `/v3/api-docs` làm health check (`render.yaml`), và nhóm đang dùng Swagger UI trên production để test. Tắt sẽ làm hỏng deploy + quy trình test. Nếu muốn khoá: thêm endpoint health riêng, đổi `healthCheckPath`, rồi mới ẩn Swagger sau đăng nhập admin. |
| AUD-018 CORS mặc định có `https://*.vercel.app` | Không đổi | Chưa xác minh được biến `CORS_ALLOWED_ORIGINS` trên Render (giá trị thật nằm ở Dashboard). Nếu biến chưa đặt và mình bỏ mặc định, FE `woodhubmvp.vercel.app` sẽ bị CORS chặn ⇒ **sập production**. **Việc cần bạn làm:** vào Render → Environment, kiểm tra `CORS_ALLOWED_ORIGINS` có đúng domain cần (vd `https://woodhubmvp.vercel.app,https://woodhub.io.vn,https://www.woodhub.io.vn`) rồi mới bỏ wildcard. Lưu ý domain mới `woodhub.io.vn` cũng phải nằm trong danh sách này. |
| AUD-019 giá trị mặc định trong `application.properties` | Không đổi | Chỉ là host/username Supabase và email gửi (không có mật khẩu/khoá). Bỏ default làm BE không chạy local nếu thiếu `.env`; rủi ro thấp, đổi lợi ít. |
| AUD-021 `PaymentStatus.failed` không bao giờ được đặt | Không đổi | Cần định nghĩa khi nào coi là thất bại (SePay không báo thất bại); là quyết định nghiệp vụ. FE vẫn có nhánh hiển thị. |
| AUD-022 AI chat 502 | Theo dõi riêng | `docs/BUG_AI_CHAT_502.md`; thuộc BE/AI service. |
| UI-004 Gói hết hạn không hiện "Gói hiện tại" | Để Phase 5 | Liên quan trang Bảng giá. |
