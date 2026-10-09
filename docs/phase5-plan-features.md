# Phase 5 — Khảo sát: tính năng của gói + lỗi modal (GATE 6)

> Chỉ khảo sát, **chưa viết code**. Dữ liệu gói lấy từ `GET /api/subscription-plans` trên production (công khai, chỉ đọc) và từ code.

## 1. Dữ liệu gói hiện đến từ đâu

- Bảng `subscription_plans` trong DB, API công khai `GET /api/subscription-plans` — **không hardcode trong FE**.
- Mỗi gói có 2 cột JSONB đã sẵn dùng:
  - `feature_limits` — **giới hạn có hiệu lực thật**, vd `{"design":5,"ai_chat":20,"ar_3d":5,"export":5}` (`-1` = không giới hạn).
  - `display_features` — danh sách dòng chữ marketing do admin nhập (trang Admin → Gói đăng ký đã có ô nhập).
- API **đã trả cả hai field** ⇒ **không cần migration, không đổi API**.
- **Vì sao card không hiện tính năng:** FE (`PricingSection.jsx:92`) chỉ vẽ `displayFeatures`, mà cả 3 gói trên production đang để `displayFeatures: []`. `featureLimits` chưa được FE dùng ở trang Bảng giá.

## 2. Bảng Gói × Tính năng (dữ liệu production + mức độ thực thi trong code)

| Tính năng | Free (0đ) | B2C Premium AR/3D (79.000đ) | Custom Design Premium / Verified (299.000đ) | Thực thi trong code |
|---|---|---|---|---|
| **Thiết kế 3D** (`design`) | 5 / tháng | 5 / tháng | Không giới hạn | ✅ **BE chặn thật** (`Ai3DGenerationServiceImpl`, `CustomDesignServiceImpl` gọi `consume`) |
| **Chat AI** (`ai_chat`) | 20 / tháng | Không giới hạn | Không giới hạn | ✅ **BE chặn thật** (`AiChatServiceImpl`) |
| **AR / 3D** (`ar_3d`) | 5 / tháng | 5 / tháng | Không giới hạn | ⚠️ **Có số liệu nhưng KHÔNG thực thi.** Trình xem AR (`ModelViewer.jsx`, `ar-modes`) mở được vô hạn cho mọi người, không nơi nào trừ lượt |
| **Xuất file** (`export`) | 5 / tháng | 5 / tháng | Không giới hạn | ❌ **Không có tính năng xuất file nào** trong ứng dụng |
| Huy hiệu "Verified" | — | — | (tên gói) | ❌ Không có tính năng/huy hiệu nào (đã gỡ khỏi UI) |
| Hỗ trợ ưu tiên, ưu đãi khác | — | — | — | ❌ Không có trong code |

Hạn mức **tính theo tháng** (múi giờ VN), không phải theo ngày.

### Điều rút ra cần bạn biết
1. Hiện tại **gói 79.000đ khác Free ở đúng một điểm: Chat AI không giới hạn** (thiết kế, AR/3D, xuất file giống hệt Free). Tên gói "AR/3D" dễ khiến khách nghĩ AR là quyền lợi trả phí, nhưng AR đang miễn phí không giới hạn cho mọi người.
2. Gói 299.000đ khác ở: **Thiết kế 3D không giới hạn** (+ AR/xuất file "không giới hạn" nhưng chưa có gì để giới hạn).
3. Nguyên tắc của bạn: *không hiển thị tính năng chưa implement như thể đã có.* Vì vậy chỉ có **Thiết kế 3D** và **Chat AI** đủ điều kiện hiển thị dưới dạng quyền lợi có số liệu.

## 3. Đề xuất lưu và hiển thị dữ liệu (không cần migration)

**Nguồn duy nhất = `feature_limits` (có thực thi) + `display_features` (admin viết thêm).**

- FE dựng các dòng từ `featureLimits` theo thứ tự cố định `design → ai_chat`, nhãn lấy từ **i18n theo `key`** (vi/en), giá trị: `-1` → "Không giới hạn", `n` → "n lượt/tháng", `0` hoặc thiếu → dòng mờ có dấu ✗.
- `display_features` (nếu admin nhập) hiện thêm bên dưới như dòng phụ.
- `ar_3d`, `export`: **ẩn** (xem câu hỏi 1).
- Gói cao hơn thêm dòng đầu "Tất cả quyền lợi của gói <tên gói trước>, thêm:" và chỉ liệt kê phần khác biệt.
- Vì lấy từ `featureLimits`, khi admin đổi hạn mức thì bảng giá **tự đổi theo**, không thể lệch với hạn mức thật.

Trade-off: dùng nhãn i18n cố định theo key (đề xuất) thay vì lưu sẵn `vi`/`en` trong DB → không cần đổi schema, nhưng key mới phải thêm vào FE. Với 4 key cố định (`UsageFeature`) là phù hợp.

## 4. Lỗi modal thanh toán — UI-001 (đã tìm ra nguyên nhân gốc)

**Tái hiện được** bằng trình duyệt thật (trang `/about`, mở modal): trong chuỗi tổ tiên của modal có một `div` với `transform: matrix(1,0,0,1,0,0)`.
- Nguồn: `SiteLayout.jsx:19` — hiệu ứng chuyển trang `motion.div` với `animate={{ y: 0 }}`; sau khi chạy xong Framer Motion **để lại** `transform`.
- Hệ quả (quy tắc CSS): phần tử `position: fixed` nằm trong tổ tiên có `transform` **không còn bám theo khung nhìn** mà bám theo tổ tiên đó, và bị nhốt trong một stacking context riêng. Modal `fixed inset-0` trở thành lớp phủ theo **chiều cao cả trang**, nằm lệch vị trí; badge "Gói hiện tại" (`absolute`) cùng khu vực nên chồng/lấn lên mép modal.
- **Không chỉ riêng modal này:** mọi modal `fixed` render trong trang dưới `SiteLayout` đều dính (vd `RequestQuoteModal`).

**Cách sửa đề xuất (sửa nguyên nhân gốc, không vá z-index):**
1. `SiteLayout.jsx`: hiệu ứng chuyển trang chỉ dùng `opacity` (bỏ `y`) ⇒ không còn `transform` ⇒ sửa cho **toàn bộ** modal.
2. `PaymentQrModal` render qua **portal** (`createPortal` vào `document.body`) để không phụ thuộc cấu trúc cây (phòng thủ nếu sau này có tổ tiên `transform`/`filter` khác).

## 5. Những việc UI sẽ làm (theo yêu cầu của bạn)

- **Card Bảng giá:** dòng tính năng (✓/✗, số lượng), "Tất cả quyền lợi của gói … thêm:", 3 card cao bằng nhau + nút luôn ở đáy, gói đang dùng → "Đang sử dụng" (disabled, không mở modal), gói Free không mở modal QR, danh sách dài thì thu gọn/mở rộng trên mobile, tăng độ tương phản dòng mô tả dưới tiêu đề "Bảng giá".
- **Modal:** khối "Bạn sẽ nhận được" (tên gói, giá/chu kỳ, 3–5 tính năng chính + "Xem tất cả", thời hạn hiệu lực dự kiến), giữ nguyên QR/số tiền/nội dung CK/hạn QR; thay `•••` bằng trạng thái rõ: "Đang chờ thanh toán…", "Thanh toán thành công", "QR đã hết hạn — Tạo mã mới"; Esc đóng, khoá focus trong modal, `aria-labelledby`; dịch VI/EN (hiện đang cứng tiếng Việt); mobile cuộn được và QR vẫn dễ thấy.
- **UI-004:** user không có gói active được xem là đang dùng **Free** (khớp hạn mức thật sau sửa AUD-003) nên card Free hiện "Đang sử dụng".
- **Thời hạn hiệu lực:** BE không trả ngày bắt đầu/kết thúc dự kiến. FE sẽ tính **ước lượng**: "1 tháng kể từ khi thanh toán"; nếu đang dùng đúng gói và còn hạn, ghi "cộng dồn vào hạn hiện tại (còn tới dd/MM/yyyy → mới tới dd/MM/yyyy)" (khớp AUD-004b).

## 6. Câu hỏi cần bạn chọn (GATE 6)

1. **`ar_3d` và `export`:** ẩn cả hai khỏi Bảng giá (khuyến nghị — đúng nguyên tắc "không quảng cáo cái chưa có"), hay hiển thị `ar_3d` dạng "Sắp ra mắt giới hạn"? *(Nếu muốn AR thật sự là quyền lợi trả phí thì cần làm thêm tính năng trừ lượt khi mở AR — là việc riêng.)*
2. **Dòng marketing `display_features`:** chỉ dùng phần suy ra từ `featureLimits` (khuyến nghị; admin có thể bổ sung sau trong Admin → Gói đăng ký), hay bạn muốn mình soạn sẵn văn bản đề xuất để bạn nhập?
3. **Tải Chromium (~150 MB, từ Microsoft/Playwright CDN) để chạy test giao diện tự động?** Nếu không, mình kiểm tra giao diện bằng trình duyệt tích hợp (như Phase 4) và chỉ viết unit test cho logic.

---

# Kết quả triển khai (theo lựa chọn GATE 6: ẩn AR/Export · chỉ dùng phần suy ra từ hạn mức · không tải Chromium)

## Đã làm
| Hạng mục | Chi tiết |
|---|---|
| **UI-001 (badge đè/ modal lệch)** | Sửa **nguyên nhân gốc**: `SiteLayout.jsx` chỉ còn fade `opacity` (bỏ `y`) ⇒ wrapper `transform: none` (đã kiểm tra bằng `getComputedStyle`). Thêm **portal** cho `PaymentQrModal`. Kiểm tra: modal nằm trực tiếp dưới `<body>`, căn giữa khung nhìn (448×661 trong 1280×800), overlay là phần tử trên cùng tại vị trí badge. Sửa luôn cho mọi modal `fixed` khác dưới `SiteLayout` (vd `RequestQuoteModal`). |
| **UI-002 card Bảng giá** | Quyền lợi dựng từ `featureLimits` (chỉ **Thiết kế 3D** + **Chat AI**), dòng "Tất cả quyền lợi của gói X, thêm:", 3 card cao bằng nhau, nút luôn ở đáy, thu gọn "Xem thêm" trên mobile (>4 dòng), tiêu đề/mô tả đặt trên nền mờ để đủ tương phản trên ảnh nền `/about`. |
| **Gói đang dùng (UI-004)** | User không có gói active được coi là đang dùng **Free** (khớp hạn mức thật sau AUD-003); card hiện badge "Gói hiện tại" + nút "Đang sử dụng" (disabled, mở modal bị chặn); Free không mở modal QR; chuyển từ gói trả phí về Free có hộp xác nhận (vì huỷ ngay, không hoàn thời gian). |
| **Modal thanh toán** | Khối "Bạn sẽ nhận được" (tên gói, giá/tháng, quyền lợi + "Xem tất cả" khi > 3, hiệu lực dự kiến có tính cộng dồn khi gia hạn đúng gói); trạng thái rõ: tạo QR → "Đang chờ thanh toán…" → "Thanh toán thành công!" / "Mã QR đã hết hạn — Tạo mã mới" / lỗi tạo QR có nút "Thử lại" (trước đây quay vòng vô hạn). QR/số tiền/nội dung CK/hạn QR **giữ nguyên** (chỉ hiển thị dữ liệu BE trả). |
| **Truy cập** | Esc đóng, Tab không thoát khỏi modal, trả focus về nút đã mở, khoá cuộn nền (và khôi phục), `aria-labelledby`, `role="dialog" aria-modal`. Mobile: dạng bottom-sheet, cuộn được. |
| **i18n** | Toàn bộ chuỗi modal và Bảng giá có VI/EN (`pricing.*`, `payment.*`); modal trước đây cứng tiếng Việt. |
| **Gia hạn** | `MySubscription` truyền `plan` + `subscription` cho modal để hiện đúng hạn mới. |

## Kiểm thử
- **Unit** (`web/e2e/unit/plan-features.spec.js`, 13 test) + quote-summary (12) = **25/25 pass**: giá trị `-1/n/0/rác`, chỉ `design`+`ai_chat`, so sánh gói liền trước, dòng admin không lặp, danh sách rỗng/null, `addMonths` như Java `plusMonths` (31/1→28/2, năm nhuận), hiệu lực cộng dồn / không cộng dồn.
- **Giao diện thật** (trình duyệt tích hợp, mock bám đúng dữ liệu production): desktop dark, mobile light, modal desktop dark, modal mobile dark, EN. Luồng `Chọn gói → modal → WAITING → PAID → card đổi "Đang sử dụng"` chạy đúng.
- **Ảnh chụp:** `docs/phase5-screenshots/` — `pricing-desktop-dark.jpg`, `pricing-mobile-light.jpg`, `payment-modal-desktop-dark.jpg`, `payment-modal-mobile-dark.jpg`.

## Chưa kiểm tra / lưu ý
- **Chưa test với BE thật qua giao diện** (mock). Cấu trúc gói mock giờ giống production (3 gói, `displayFeatures` rỗng).
- **Không có test E2E trình duyệt tự động** (bạn chọn không tải Chromium); modal/trạng thái đã kiểm tra bằng trình duyệt tích hợp. Trạng thái "QR hết hạn" và "lỗi tạo QR" chưa quan sát trực quan (logic đơn giản, chưa có bước giả lập trong mock).
- **Ảnh QR** trong mock bị vỡ vì URL `qr.sepay.vn` bị chặn trong môi trường kiểm thử — không ảnh hưởng production.
- **Mock đã sửa 1 lỗi có sẵn**: `getPayment` trả cùng object đã sửa tại chỗ nên React Query không cập nhật; giờ trả bản sao (chỉ ảnh hưởng chế độ mock).
- **Giữ nguyên chủ ý:** `ar_3d`/`export` ẩn; không có tính năng "Verified"; tên gói "B2C Premium AR/3D" vẫn có chữ "AR/3D" dù AR miễn phí cho mọi người (quyết định nhãn gói thuộc về bạn).
- Phần dòng marketing: để trống, admin bổ sung tại **Admin → Gói đăng ký** (`display_features`).
