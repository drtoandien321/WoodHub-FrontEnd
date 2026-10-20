# BE còn thiếu / cần sửa — tổng hợp từ đợt QA FE (20/10/2026)

> Nguồn: test production woodhub.io.vn + rà toàn bộ source FE, đối chiếu với controller BE
> (`woodhub-be` @ `d9fcaeb`). Mỗi mục ghi **FE đang làm gì tạm thời** để BE biết làm xong thì
> FE chỉ cần thêm key vào `REAL_ENDPOINTS` (mock-first, xem `CLAUDE.md` mục 7).
>
> Mức ưu tiên: **P0** = đang lộ ra với khách/đối tác, ảnh hưởng demo · **P1** = tính năng có UI
> nhưng chạy mock · **P2** = nâng cấp / tối ưu.

---

## P0 — Ảnh hưởng trực tiếp tới demo

### 1. Thư viện mẫu 3D gần như trống
- **Hiện trạng:** `GET /api/custom/models` trên prod chỉ có **1 mẫu** ("Chậu Than", loại decor).
- **Cần:** seed **ít nhất 8–12 mẫu nội thất gỗ** (bàn, ghế, tủ, kệ, giường) có đủ `editableOptions`
  (materials / colors / dimensions). Bước 1 Custom Studio hiện lưới 8 mẫu và trang `/custom/models`
  là gallery, nên với 1 mẫu thì trông như lỗi.
- **FE:** không cần sửa gì.

### 2. Retexture (đổi chất liệu/màu thật bằng AI) chưa có
- **Hiện trạng:** bước 5 "Chỉnh sửa" của Custom Studio vẫn chỉ **tô màu (tint) model ngay trên
  trình duyệt** và scale kích thước. Khách đổi "gỗ óc chó" nhưng model vẫn là texture cũ, chỉ bị
  phủ màu. Đây là lý do bước chỉnh sửa trông như "code cũ".
- **Cần:** endpoint retexture theo Meshy Retexture API, gợi ý:
  - `POST /api/custom/models/{id}/variants` body `{ material, color, prompt? }` → `{ taskId }` (202),
    rồi poll chung `GET /api/custom/ai/tasks/{taskId}`.
  - Kết quả: model biến thể (hoặc cập nhật `modelGlbUrl` của design), kèm `posterUrl`.
  - Nói rõ có trừ lượt `design` hay không.
- **FE:** sẽ thay phần tint ở `Step5Edit.jsx` bằng nút "Áp dụng chất liệu" gọi endpoint này.

### 3. Form Liên hệ không gửi đi đâu
- **Hiện trạng:** `/contact` chạy mock, khách bấm gửi thì thấy "thành công" nhưng **không ai nhận**.
- **Cần:** `POST /api/contact` body `{ name, email, phone?, subject, message }` → 201. Lưu bảng
  `contacts` và/hoặc gửi mail về hộp thư team. Nên giới hạn tần suất theo IP (chống spam).

### 4. Báo cáo / Dashboard của NCC & xưởng là số liệu giả
- **Hiện trạng:** KPI ở Dashboard, toàn bộ trang Báo cáo (`/portal/supplier/reports`,
  `/portal/workshop/reports`) và Dashboard xưởng đều là mock. FE đã gắn banner "dữ liệu minh hoạ"
  và tắt nút "Xuất báo cáo".
- **Cần:** API thống kê cho supplier đang đăng nhập (tương tự `/api/admin/dashboard/*` nhưng lọc
  theo supplier), gợi ý:
  - `GET /api/supplier/stats/summary?from&to` → `{ revenue, orderCount, avgOrderValue, newReviews, rating }`
  - `GET /api/supplier/stats/timeseries?from&to&granularity=day|week` → `[{ date, revenue, orders }]`
  - `GET /api/supplier/stats/top-products?from&to&limit` → `[{ productId, name, sold, revenue }]`
  - Với NCC nhiều chi nhánh: thêm param `storeId`.
  - (Tuỳ chọn) `GET .../export?format=csv` để bật lại nút "Xuất báo cáo".

---

## P1 — Có UI, đang chạy mock hoặc đã phải gỡ bớt

### 5. Hồ sơ supplier thiếu nhiều trường
FE đã nối `PUT /api/suppliers/me` + portfolio. Các trường dưới đây có trong thiết kế nhưng **BE
chưa có cột**, nên FE đã **gỡ khỏi UI** (không để khách nhập rồi mất):
- `logoUrl`, `coverUrl` (ảnh logo và ảnh bìa) + API upload.
- `hqAddress` (địa chỉ trụ sở), `contactName` (người liên hệ).
- Xưởng: **năng lực gia công** (`capability`: loại SP nhận làm, kích thước tối đa, vật liệu, số
  năm kinh nghiệm, thời gian phản hồi), **điểm mạnh**, **chứng nhận**. Đây là dữ liệu để ghép xưởng
  (`/custom/match`) và hiện ở `/suppliers/:slug`.
- **Lưu ý:** `PUT /suppliers/me` hiện **ghi đè toàn bộ**: field không gửi sẽ bị set `null`. FE đang
  gửi đủ để chịu được, nhưng nên đổi sang kiểu **patch** (bỏ qua field `null`) hoặc ghi rõ trong docs.

### 6. Upload ảnh portfolio
- **Hiện trạng:** `POST /api/suppliers/me/portfolio` chỉ nhận `imageUrl` (chuỗi). Xưởng (không có
  catalog) phải **dán link ảnh**, NCC thì gắn được sản phẩm.
- **Cần:** `POST /api/suppliers/me/portfolio/upload` (multipart, giống `/api/products/{id}/images/upload`)
  hoặc 1 endpoint upload ảnh chung `POST /api/uploads/image` → `{ url }`.

### 7. Cài đặt portal: các tab đã gỡ vì chưa có API
FE đã gỡ, ghi lại để làm sau:
- **Thông báo:** bật/tắt email đơn mới, đánh giá mới, sắp hết hàng… → bảng `notification_settings`.
- **Thanh toán / đối soát:** ngân hàng, số tài khoản nhận tiền, chu kỳ đối soát → cần cho việc trả
  tiền cho NCC (hiện `commissionRate` có nhưng chưa có thông tin nhận tiền).
- **Vận hành:** chi nhánh mặc định nhận đơn online, thời gian xử lý mặc định, chính sách đổi trả.
- **Bảo mật:** 2FA, danh sách thiết bị/phiên đăng nhập.
- **Chuông thông báo** trên header portal (đã gỡ): `GET /api/notifications?unread=true` +
  `POST /api/notifications/{id}/read` (có thể đẩy realtime qua cùng kênh chat).

### 8. NCC trả lời đánh giá
- **Hiện trạng:** trang Đánh giá ở portal chỉ xem được.
- **Cần:** `POST /api/reviews/{id}/reply` body `{ content }` (chỉ chủ target), `ReviewResponse` thêm
  `reply { content, createdAt }`.

### 9. Admin khoá/mở tài khoản người dùng
- **Hiện trạng:** `UserController` chỉ có `DELETE /api/users/{id}`, chưa có khoá tạm. (Supplier thì đã
  có `PUT /api/suppliers/{id}/status`.)
- **Cần:** `PUT /api/users/{id}/status` body `{ status: active|locked, reason? }`; login trả 403 rõ
  ràng khi bị khoá.

### 10. Tạo lại mã QR thanh toán đơn hàng
- **Hiện trạng:** QR của đơn hàng chỉ sinh lúc `POST /api/orders/checkout`. Khách đóng popup hoặc QR
  hết hạn thì không có cách lấy lại, chỉ còn cách huỷ đơn.
- **Cần:** `POST /api/orders/{id}/payment` (chỉ khi đơn `pending_payment`) → trả `PaymentResponse`
  (QR mới hoặc QR cũ nếu còn hạn).

---

## P2 — Nâng cấp / tối ưu

### 11. Meshy: chọn model AI
- `MeshyAi3DProvider` chưa gửi `ai_model` nên dùng model mặc định. Đề xuất cho phép cấu hình
  `meshy.ai-model=meshy-6-lite` (nhanh, rẻ) qua env, và cân nhắc `meshy-6` cho bước refine.

### 12. Text → Image → 3D (tuỳ chọn)
- Text-to-3D (đã có, FE đã làm xong) ra hình khối khá thô với đồ nội thất. Một hướng chất lượng hơn:
  sinh ảnh từ prompt (Meshy Text-to-Image hoặc Gemini) cho khách chọn 1 ảnh, sau đó chạy Image-to-3D
  có sẵn. Cần bàn thêm về chi phí lượt.

### 13. Video hero trang chủ
- Hero đang dùng ảnh tĩnh (TODO trong code). Nếu team có video, upload lên Supabase Storage và gửi
  link cho FE (không cần API).

---

## Ghi chú cho FE (không phải việc của BE)
- `/users/me/business-profile` **BE đã có** nhưng FE chưa nối (hồ sơ khách doanh nghiệp: MST, tên
  công ty, địa chỉ xuất VAT), nên làm ở đợt FE kế tiếp.
- `api/client.js` còn workaround "403 → thử refresh token" từ hồi BE trả 403 khi token hết hạn. BE đã
  sửa trả 401 (`dd9c087`), nên có thể gỡ workaround cho gọn.
