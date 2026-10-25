# BE — Việc cần làm sau QA audit 25/10/2026

> Nguồn: `qa-audit/` (BUG_REPORT, REGRESSION_RESULTS). Mỗi mục đã đối chiếu source `woodhub-be@7c19810` (main) và DB production
> (chỉ đọc). FE đã xử lý phần của mình; các mục dưới đây là **gốc ở BE**. Ưu tiên theo thứ tự.

---

## 1. OBS-08 — Tiền về cho đơn đã huỷ chỉ được ghi log (ưu tiên cao — liên quan tiền)

**Hiện trạng (đã đúng một phần):**

- `OrderServiceImpl.cancelMyOrder` khoá payment trước khi huỷ (chống tranh chấp với webhook) và `syncPaymentAmount` bớt
  số tiền QR khi còn đơn khác cùng lần checkout. ✔
- Khi **huỷ hết** đơn của một payment, `syncPaymentAmount` thấy `amount = 0` → **bỏ qua**, payment vẫn `pending` tới khi
  `PaymentExpiryScheduler` chuyển `expired`. Thực tế production: đơn `[QA]` WH20261025-7NDXQY huỷ 05:29Z, payment
  `056088c4…` vẫn `pending` tới 05:43Z.
- Nếu khách vẫn quét QR cũ: `PaymentServiceImpl.markOrdersPaid` (dòng ~378) ghi payment `paid`, giữ đơn `cancelled`, và chỉ
  `log.warn("… cần admin hoàn tiền")`. **Không có thông báo, không có cờ trong DB, không có bộ lọc ở Admin Payments** →
  admin chỉ biết khi đọc log Render (log Render free bị xoá sau vài ngày).

**Đề xuất:**

1. Huỷ đơn cuối cùng của payment → set payment `expired` (hoặc thêm giá trị `cancelled` vào enum `payment_status` — cần
   migration `ALTER TYPE … ADD VALUE`). Webhook vẫn nhận tiền nếu đến (chính sách AUD-005 giữ nguyên).
2. Webhook gặp đơn huỷ thủ công: ngoài log, **ghi trạng thái cần hoàn tiền** — vd cột `orders.refund_required_at` hoặc
   dùng sẵn `refund_amount` + ghi `order_status_history` note "Cần hoàn tiền", và gửi notification cho admin.
3. `GET /admin/payments` thêm filter `needsRefund=true` (payment `paid` mà mọi đơn `cancelled`) để FE admin hiện danh sách.

**Test:** huỷ đơn duy nhất → payment không còn `pending`; giả lập webhook cho đơn đã huỷ → admin thấy trong danh sách cần
hoàn tiền + có notification.

---

## 2. BUG-017 — Ngày hoàn thành dự kiến tính từ lúc tạo đơn

- **Gốc:** `dto/QuoteRequestResponse.java:96-97`
  `completion = order.getCreatedAt()…plusDays(days)` — đơn custom tạo ngay khi chốt báo giá (`awaiting_deposit`), xưởng chưa
  làm. Đơn `CO-20261009-YEQ8J2` (chờ cọc từ 09/10) hiện "dự kiến 15/10/2026" — ngày đã qua.
- **FE đã làm:** ẩn ngày nếu đã qua (`utils/quoteSummary.js`, deploy `004f451`). Đây chỉ là che triệu chứng.
- **Đề xuất:** tính từ lúc đơn chuyển sang `deposit_paid` (đã có `CustomOrderStatusHistory`); chưa đặt cọc → `null`.
  Nên trả thêm cùng giá trị ở `CustomOrderResponse` để trang chi tiết đơn hiển thị nhất quán.

---

## 3. BUG-021 — API portal NCC không kiểm loại NCC

- **Gốc:** chỉ `StoreServiceImpl:55` (xưởng tối đa 1 chi nhánh) và `QuoteServiceImpl:115,519` (chỉ xưởng nhận báo giá
  custom) xét `SupplierType`. `ProductServiceImpl`, `PromotionServiceImpl`, `/api/supplier/orders` **không** xét → xưởng
  gọi thẳng API vẫn tạo được sản phẩm catalog / khuyến mãi.
- **FE đã làm:** `ProtectedRoute supplierPortal` chặn xưởng vào `/portal/supplier/*` (deploy `3ef8c73`).
- **Chủ dự án đã chốt (25/10):** xưởng **không** có catalog, chỉ nhận custom (CLAUDE.md §8 câu 2).
- **Cần làm:** chặn `workshop` ở service tạo/sửa/xoá product + variant + ảnh, promotion và `/api/supplier/orders`
  (403, errorCode mới vd `SUPPLIER_TYPE_NOT_ALLOWED`; thêm vào `ErrorCode` + bảng BE-13 để FE dịch). Dữ liệu cũ: kiểm tra
  `SELECT count(*) FROM products p JOIN suppliers s ON s.id = p.supplier_id WHERE s.type = 'workshop'` trước khi bật chặn.

---

## 4. BUG-001 — Branch chưa push

Repo `woodhub-be`, branch `fix/platform-feedback-rls` (`8f05e3c`): thêm `ALTER TABLE platform_feedback ENABLE ROW LEVEL
SECURITY;` vào `sql/platform_feedback.sql`. Lệnh đã chạy trên production 25/10 — branch chỉ để file SQL khớp DB. Cần review + push/PR.

---

## 5. BUG-006 — Cảnh báo Supabase advisor (đã xử lý phần an toàn)

| Cảnh báo | Trạng thái |
|---|---|
| `function_search_path_mutable`: `public.set_updated_at`, `public.bump_conversation_on_message` | **Đã sửa trên production 25/10** (chủ dự án duyệt) — migration `fix_function_search_path`: `ALTER FUNCTION … SET search_path = public, pg_temp`. Advisor không còn báo. **Team BE:** thêm 2 lệnh này vào file `sql/*.sql` tương ứng để repo khớp DB |
| `extension_in_public`: `vector` 0.8.0 | **Giữ nguyên (chấp nhận WARN).** Cột `product_variants.embedding` đang dùng kiểu `vector` (AI tìm kiếm); chuyển schema có thể làm query `<=>` của AI service lỗi nếu `search_path` không có `extensions` |
| `rls_enabled_no_policy` (INFO, 57 bảng) | Đúng thiết kế: chặn hết anon/authenticated qua PostgREST; BE dùng role `postgres` (BYPASSRLS) |

---

## 6. OBS-09 — Task AI 3D treo `processing`

- **DB production:** 2 task `processing` không đổi từ 07/10 15:00Z và 08/10 18:23Z.
- **Gốc:** `Ai3DGenerationServiceImpl.getTask` (dòng ~221) chỉ gọi `provider.getStatus` khi client GET; không có `@Scheduled` nào
  (chỉ có Payment/Quote/Subscription/Notification scheduler). Khách đóng tab → task không bao giờ chuyển terminal.
- **Đề xuất:** scheduler 5 phút đồng bộ task chưa terminal (giới hạn số lượng/lần), và quá N giờ (vd 2h) thì set `failed`
  + hoàn lượt `design` nếu đã trừ. Dashboard tính "đang treo" riêng.

## 7. Ghi chú khác

- Swagger UI công khai trên production (OBS-06) — cân nhắc tắt `springdoc.swagger-ui.enabled` ở profile prod.
- `refresh_tokens` ≈ 607 dòng / 14 user (OBS-04) — thêm job xoá token hết hạn/đã thu hồi.
