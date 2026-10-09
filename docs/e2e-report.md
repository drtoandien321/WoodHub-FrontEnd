# E2E Report — Phase 2 (BE local + Playwright API tests)

> Ngày chạy: 2026-10-09 · Công cụ: `@playwright/test` (chế độ API, không cần trình duyệt) · BE: `backend/` chạy **local cổng 8082**, đã fast-forward lên `origin/main` (commit `90b3c91`).
> **DB: dùng chung với production** (project Supabase `cqxieqbwgvftdumoekce`) theo quyết định của chủ dự án; mọi dữ liệu test có dấu `[E2E]`/`e2e+…@test.woodhub.local`, đã **dọn sạch sau khi chạy** (xác nhận: 0 user E2E còn lại; tổng 13 user / 22 payment / 14 subscription như trước khi chạy).

## Kết quả: 47 test — 39 pass, 8 fail

Cả **8 test fail đều là lỗi thật của hệ thống** (đã dự đoán ở audit), không phải lỗi test.

| # | Test (spec) | Kết quả | ID | Bằng chứng |
|---|---|---|---|---|
| 1 | Chưa đăng nhập → phải 401 (`01-auth`) | ❌ nhận **403** | AUD-015 | `GET /api/quotes/my` không token → 403 |
| 2 | Giá offer/thời gian dự kiến phải > 0 (`03-quotes`) | ❌ nhận **201** | AUD-020 | `price: 0` được chấp nhận |
| 3 | Báo giá quá hạn phải hiện `expired` trong danh sách (`03-quotes`) | ❌ vẫn `pending` | AUD-009 | tạo quote có `expiresAt` trong quá khứ; ra giá bị 409 nhưng danh sách vẫn `pending` |
| 4 | Gia hạn gói trả phí phải cần thanh toán (`04-subscriptions`) | ❌ nhận **200** | **AUD-002** | `endDate` 2026-10-29 → **2026-11-29** không có payment nào |
| 5 | Gói hết hạn phải rơi về Free (`04-subscriptions`) | ❌ nhận **429** | **AUD-003** | user có gói `expired`, không còn gói active ⇒ `POST /usage/ai_chat/consume` bị chặn |
| 6 | Payment đã `expired` không nên tự kích hoạt (`05-webhook`) | ❌ thành **paid** | AUD-005 | webhook đúng mã + đủ tiền vẫn kích hoạt gói (là *chính sách* cần bạn chọn) |
| 7 | Mua lại gói khi còn hạn phải cộng dồn (`05-webhook`) | ❌ mất ngày | **AUD-004b** | gói còn tới 2026-11-29, mua lại ⇒ `endDate` về **2026-11-09** (**mất 20 ngày đã trả**) |
| 8 | 5 webhook đồng thời cho 1 giao dịch (`05-webhook`) | ❌ kích hoạt 5 lần | **AUD-004** | cả 5 trả 200; lịch sử gói tăng **+5** thay vì +1; log BE ghi "đã thanh toán, kích hoạt gói" 5 lần cho cùng 1 payment |

## 39 test pass (hành vi ĐÚNG đã được xác nhận)

- **Auth:** đăng nhập đúng trả token + role; sai mật khẩu/email không tồn tại bị từ chối (4xx, không lộ token); token rác bị chặn; `/users/me` đúng người.
- **Phân quyền:** khách B **không** xem được báo giá/giao dịch của khách A; danh sách `/quotes/my` chỉ của mình; khách không gọi được `/quotes/incoming`; xưởng thấy đủ báo giá gửi tới mình; khách không vào được API admin (payments, subscriptions, usage của người khác → 403); admin đọc được payments/stats; danh sách gói công khai.
- **Báo giá:** luồng đầy đủ (gửi → xưởng ra giá + thời gian → khách trả giá → xưởng chốt → tạo đơn, `unitPrice` và `leadTimeDays` khớp); bên ra giá không tự chấp nhận offer của mình (403); từ chối offer → `rejected`; báo giá đã kết thúc không ra giá thêm (409); huỷ 2 lần → 409; không dùng thiết kế của người khác (403).
- **Gói/thanh toán:** tạo payment `pending` với QR đúng số tiền + nội dung (`SUB` + 12 ký tự), hạn ~15 phút; Free không qua thanh toán (400); không đăng ký thẳng gói trả phí (400); Free không gia hạn (400); hạn mức Free hiển thị đúng; hết lượt → 429.
- **Webhook SePay:** sai key/thiếu header → 401; tiền RA bị bỏ qua; nội dung sai mã/mã không tồn tại → bỏ qua (200); thiếu tiền → vẫn `pending`; đủ tiền → `paid` + gói Premium active; dư tiền → `paid`; gọi trùng **tuần tự** chỉ kích hoạt 1 lần; thanh toán qua payment tạo bằng API → trạng thái chuyển `paid` (đúng như modal sẽ thấy khi poll).

## Chưa kiểm thử (ngoài phạm vi lần này) và lý do

- **Giao diện (Playwright trình duyệt):** cần tải Chromium (~150 MB) — làm ở Phase 4/5 khi test card báo giá và modal thanh toán. Chưa kiểm tra dark/light, VI/EN, responsive 400px.
- **Giỏ hàng → đặt hàng:** BE chưa có endpoint đơn hàng B2C thật (FE vẫn mock), không có gì để test E2E.
- **QR hết hạn qua scheduler (5 phút):** dùng payment seed trạng thái `expired` để kiểm tra hành vi webhook; chưa chờ job chạy thật.
- **Refresh token / logout**, đăng ký + OTP (gửi email Brevo thật nên cố ý không tự động hoá).

## Thông tin vận hành khi chạy E2E (để bạn/đồng đội tự chạy lại)

1. BE local trong Terminal (JDK 17 — JDK 25 + sandbox lỗi `Unable to establish loopback connection`), cổng 8082, biến `SEPAY_*` là giá trị **giả**, `JPA_SHOW_SQL=false`.
2. Seed: chạy `backend/sql/e2e/seed.sql` trên Supabase. Dọn: `backend/sql/e2e/cleanup.sql` (chỉ xoá user `e2e+…` và dữ liệu của họ). **Chạy lại bộ test cần cleanup → seed lại** (vì webhook đổi trạng thái payment).
3. `web/e2e/.env.e2e` (đã gitignore) chứa URL API local và khoá webhook **test**.
4. Chạy: `cd web && npx playwright test` (kết quả JSON ở `web/test-results/e2e.json`).

## Phát hiện mới / điều chỉnh audit sau khi chạy test

- **AUD-004 nặng hơn dự đoán:** không phải "lỗi 500", mà là **kích hoạt trùng thật sự** (5/5 thành công). `uq_one_active_subscription` không ngăn được vì mỗi lần kích hoạt huỷ gói cũ rồi tạo gói mới trong cùng giao dịch.
- **AUD-004b xác nhận bằng số liệu** (mất 20 ngày).
- **Code BE local cũ hơn production 4 commit** (thiếu `AdminPaymentController`): đã `git merge --ff-only origin/main` trong `backend/` (không có commit cục bộ nào bị ảnh hưởng). Lần chạy đầu trên code cũ cho 2 fail "giả" ở admin payments; sau khi cập nhật thì pass.
- **Lỗi của chính seed/test (đã sửa, ghi lại để minh bạch):** 3 mã `txn_ref` seed chỉ có 11 ký tự sau `SUB` (BE yêu cầu 12) ⇒ webhook bỏ qua; `cleanup.sql` dùng sai tên cột `order_id` (đúng là `custom_order_id`); chế độ `serial` của Playwright làm bỏ qua các test sau lỗi đầu tiên.
- **Dữ liệu lịch sử:** gói của user thật không bị đụng; mọi thay đổi chỉ trên user `e2e+…`.
