# Phương án sửa FE — sau đợt test production 5 role (20/10/2026)

> Test thật trên woodhub.io.vn với 5 tài khoản (customer cá nhân, customer doanh nghiệp, NCC retailer,
> xưởng workshop, admin). Phần **BE cần làm** nằm ở `docs/word/WoodHub_BE_Changes.docx` (+ `BE_MISSING.md`).
> Mục nào ghi **[chờ BE]** thì FE chỉ làm được sau khi BE có API.

## Những gì đã chạy đúng (không cần sửa)
Đăng nhập theo role, giỏ hàng, checkout + QR, huỷ đơn, mã giảm giá, chat NCC (thu nhỏ/mở lại),
Text→3D + refine thật (Meshy, chỉ trừ 1 lượt), màn 429 hết lượt, hồ sơ + portfolio NCC/xưởng (API thật),
báo giá/sản xuất xưởng, toàn bộ trang admin + GA4. Phí ship 51.450 ₫ cho 10,29 km là **đúng cấu hình**
(15.000 + 7,29 km × 5.000), không phải bug.

---

## Đợt A — Lỗi hiển thị nhanh (≈ 1 ngày, không cần BE)

| # | Vấn đề | Cách sửa | File |
|---|---|---|---|
| A1 | Nút nổi (bong bóng chat NCC + trợ lý AI) **đè nút "Upgrade texture"/"Edit design"** ở Custom Studio | Thêm `padding-bottom` cho vùng nút điều hướng của wizard bằng biến CSS `--floating-safe-area` (≈ 96px) khi có widget nổi; hoặc đưa thanh nút bước 4 thành `sticky bottom` với `pr-24` | `Step4Result.jsx`, `CustomStudio.jsx` |
| A2 | Trang 404 viết cứng "Trang này chưa được đóng" (sai chữ, không i18n) | Đổi sang key `notFound.title/desc` ở vi/en | `pages/NotFound.jsx` |
| A3 | Trang `/b2b` vẫn mời "Register a business account" khi đã đăng nhập business | Đọc `user.customerType`: business → CTA "Gửi yêu cầu báo giá" / "Hồ sơ công ty"; guest → giữ CTA đăng ký | `pages/B2b.jsx` |
| A4 | Chi tiết báo giá/đơn custom dùng chung cho khách & xưởng → xưởng thấy "← My quote requests" | Lấy nhãn quay lại theo role (`supplier` → "← Yêu cầu báo giá" / "← Đơn sản xuất") | `QuoteDetail.jsx`, `CustomOrderDetail.jsx` |
| A5 | **Lẫn ngôn ngữ**: portal + trang Gói của tôi + nhãn trạng thái quote/custom order viết cứng tiếng Việt trong khi UI đang English | Bước 1: gom nhãn trạng thái vào `utils/quoteStatus.js`, `utils/customOrderStatus.js` qua `t()`. Bước 2 (dần dần): chuyển label portal sang i18n theo từng trang. Nếu team chốt portal **chỉ tiếng Việt** thì ngược lại: dịch nốt nút "Chat with customers" về VI cho đồng nhất | nhiều file |
| A6 | Dashboard NCC & xưởng hiện KPI **giả** (320.500.000 ₫, 4.9/5…) không có nhãn | Thêm banner "dữ liệu minh hoạ" giống trang Báo cáo; KPI "Đơn mới / Chờ xử lý" tính tạm từ `/supplier/orders` và `/quotes/incoming` thật (đã có API) | `SupplierDashboard.jsx`, `WorkshopDashboard.jsx` |
| A7 | Lỗi từ BE luôn tiếng Việt (vd "Không tìm thấy mã khuyến mãi") khi UI English | Map theo `errorCode` nếu BE trả (xem docx BE); trước mắt map theo HTTP status + ngữ cảnh (coupon 404 → `checkout.couponNotFound`) | `utils/apiError.js` (mới) |

## Đợt B — Tính năng FE còn thiếu, BE đã có API (≈ 2–3 ngày)

| # | Vấn đề | Cách làm |
|---|---|---|
| B1 | Khách doanh nghiệp **không có hồ sơ công ty** (MST, tên, địa chỉ xuất VAT) dù BE có `GET/PUT /api/users/me/business-profile` | Thêm tab "Hồ sơ doanh nghiệp" ở `/profile` khi `customerType=business`; hook `useBusinessProfile`; validate MST 10/13 số |
| B2 | Ô "Location" khi gửi báo giá nhận chuỗi rác ("qu") | Thay input tự do bằng **chọn từ sổ địa chỉ** (`useAddresses`) + nút "Thêm địa chỉ"; gửi chuỗi địa chỉ đầy đủ | `RequestQuoteModal.jsx` |
| B3 | Model AI tên trùng "Model AI (Meshy)" | Sau khi gen xong (bước 4) hiện ô đặt tên, gợi ý sẵn từ prompt (text-to-3D) → `PUT /custom/models/{id}`; trang "Model 3D của tôi" hiện thêm ngày tạo + nguồn (ảnh/chữ) |
| B4 | Gỡ workaround "403 → refresh" trong `client.js` (BE đã trả 401 từ `dd9c087`) | Xoá nhánh 403 trong interceptor, test lại hết hạn token |
| B5 | Video hero trống (TODO) | Chờ team marketing gửi file → điền `HERO_VIDEO_URL` |

## Đợt C — Chờ BE (làm ngay khi BE xong API tương ứng trong docx)

| # | Tính năng FE | Phụ thuộc BE |
|---|---|---|
| C1 | Checkout hiện **phí ship + giảm giá trước khi đặt** (hiện chỉ biết sau khi bấm đặt) | `POST /api/orders/preview` |
| C2 | Xưởng **xem thiết kế 3D khách gửi** trong chi tiết báo giá (poster + nút xem 3D + cấu hình) | `designSnapshot` mở rộng + quyền xem design |
| C3 | Thanh toán / đặt cọc **đơn custom** (QR giống đơn thường), địa chỉ giao, trạng thái giao | Custom order payment + shipping |
| C4 | Nút "Thanh toán lại" cho đơn chờ thanh toán; tự ẩn đơn quá hạn | `POST /orders/{id}/payment` + job huỷ đơn quá hạn |
| C5 | Bước 5 Custom Studio: đổi chất liệu **thật** thay vì tint màu | Retexture API |
| C6 | Admin: trang quản lý **mẫu 3D** (upload GLB/poster, editableOptions) | API admin CRUD mẫu 3D |
| C7 | Admin: khoá/mở user, kiểm duyệt review, giám sát quote/custom order, xem liên hệ | các API admin tương ứng |
| C8 | Form Liên hệ gửi thật | `POST /api/contact` |
| C9 | Báo cáo & dashboard NCC/xưởng thật, bật lại "Xuất báo cáo" | API thống kê supplier |
| C10 | Luồng **B2B báo giá sản phẩm số lượng lớn** gửi nhiều NCC + thông tin VAT trên đơn | B2B quote + VAT invoice |
| C11 | Chuông thông báo portal, trả lời đánh giá | Notifications + review reply |

## Thứ tự đề xuất
1. **Đợt A** ngay (lỗi nhìn thấy khi demo, rủi ro thấp) → 1 nhánh `fix/qa-round2`.
2. **B1, B2, B3** (giá trị cao cho demo B2B/custom).
3. Đợt C theo thứ tự BE giao: C2 + C3 (luồng custom là điểm khác biệt chính) → C1/C4 → C6 → phần còn lại.
