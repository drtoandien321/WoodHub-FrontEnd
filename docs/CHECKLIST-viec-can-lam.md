# Checklist việc cần làm (sau khi cập nhật web + mobile)

Tình trạng: code FE web và mobile đã sửa xong theo tài liệu BE mới (đổi tên model, danh sách model của tôi, chỉnh màu/kích thước cho model AI).
Web `vite build` thành công, mobile bundle Android thành công. **Chưa test với BE thật / trên máy thật.**

Chỉ repo **FE** (`drtoandien321/WoodHub-FrontEnd`) có thay đổi chưa commit. Repo **BE** (`xuanmai000/woodhub-be`) đã pull mới nhất, không có gì cần push.

---

## Bước 1 — Commit và push repo FE

Chạy trong thư mục `woodhub` (gốc repo FE):

```bash
cd woodhub
git status
git add -A
git commit -m "feat: app mobile Android (Expo) + model AI: đổi tên, model của tôi, chỉnh màu/kích thước"
git push origin main
```

Nếu `git push` báo bị từ chối (rejected), chạy `git pull --rebase origin main` rồi push lại.
Lưu ý: `git add -A` sẽ xoá các file mobile cũ (bản mock) và thêm toàn bộ mobile mới — đúng ý, vì app đã được viết lại.

## Bước 2 — Test web (khoảng 10 phút)

1. Chạy web: `cd woodhub/web && npm run dev`, đăng nhập một tài khoản thật.
2. Vào **Custom Studio** → tải 1 ảnh đồ gỗ → chờ AI dựng 3D (tốn 1 lượt `design`).
3. Ở bước chỉnh sửa, kiểm tra: đổi màu (Màu gốc / Óc chó / Sồi / Anh đào), kéo kích thước, thấy mô hình đổi theo.
4. Lưu thiết kế → mở `/custom/designs` → bấm **Model 3D của tôi** → kiểm tra tên model đã đổi theo tên thiết kế, thử "Đổi tên".
5. Nếu bước lưu báo lỗi 400 về màu/chất liệu: chụp màn hình lỗi gửi mình, đó là chỗ BE kiểm tra danh sách tuỳ chọn.

## Bước 3 — Build APK mới và test trên máy Android thật

APK cũ chưa có các thay đổi mới, cần build lại:

```bash
cd woodhub/mobile
npm install
eas login
eas build -p android --profile preview
```

Khi xong, mở link EAS trên điện thoại Android để tải và cài APK (bật "Cài từ nguồn không xác định" nếu máy hỏi).
Nếu terminal hỏi "Install and run on an emulator?" → gõ `n`.

Test lần lượt trên máy thật:

| # | Cần kiểm tra | Kỳ vọng |
|---|---|---|
| 1 | Đăng ký → OTP → đăng nhập | Vào được trang chủ |
| 2 | Trang chủ, Cửa hàng, chi tiết sản phẩm | Tải được dữ liệu thật (lần đầu có thể chậm 30–60 giây vì Render ngủ) |
| 3 | Thiết kế → Chọn mẫu 3D → xem 3D | Xoay/chụm được, đổi màu, kéo kích thước, giá ước tính đổi |
| 4 | **Đặt vào phòng bằng AR** | Mở Scene Viewer của Google, đặt được đồ vào phòng (cần máy hỗ trợ ARCore) |
| 5 | Thiết kế → Từ ảnh của bạn → chụp/chọn ảnh | AI dựng 3D (1–3 phút), tự mở trình xem khi xong |
| 6 | Chỉnh màu/kích thước model AI → Lưu | Lưu được, hiện trong "Model 3D của tôi" |
| 7 | Gửi yêu cầu báo giá cho xưởng | Tạo được, xem ở tab Báo giá |
| 8 | Báo giá: đề xuất giá khác / chấp nhận / từ chối | Trạng thái đổi đúng |
| 9 | Xưởng gần bạn | Hỏi quyền vị trí, hiện danh sách xưởng |
| 10 | Chat AI | Trả lời, hiện sản phẩm gợi ý |
| 11 | Gói dịch vụ → nâng cấp → hiện mã QR | Quét thanh toán thử, trạng thái tự đổi khi trả tiền |

Ghi lại bước nào lỗi (kèm ảnh chụp màn hình) để mình sửa.

## Bước 4 — Hỏi thành viên BE (gửi nguyên văn)

1. Khi tạo báo giá (`POST /quotes`), `customDesignId` có nhận **thiết kế nháp (draft)** không, hay bắt buộc đã `completed`? (Quyết định có phải trừ thêm 1 lượt `design` khi gửi báo giá cho model AI hay không.)
2. Có thể liên kết **sản phẩm ↔ mô hình 3D** trong API `/products/{id}` không? (Hiện trang sản phẩm đang dùng mẫu 3D tham khảo theo loại.)
3. Model AI có `editableOptions` dạng `{ color: ["default","walnut","oak","cherry"], material: ["wood"] }` (khoá số ít, giá trị là tên) khác với template (`colors`/`materials` hex). Có chủ ý không? FE đã xử lý cả 2 dạng.
4. Đã xác nhận trên Render biến `CORS_ALLOWED_ORIGINS` có `https://woodhub.io.vn` và `https://www.woodhub.io.vn` chưa?

## Bước 5 — Hạn chế cần báo nhóm / giảng viên

- AR chỉ hiện **mô hình gốc**: màu và kích thước chỉnh trong app chưa mang sang AR.
- Màu là **nhuộm lên texture** (không sơn lại hoàn toàn); kích thước chỉnh chỉ để **tham khảo**, số đo thật do xưởng chốt.
- Chưa có đăng nhập Google, giỏ hàng/đặt mua trên mobile.
- Chưa hỗ trợ iPhone (xem `mobile/README.md`; muốn có phải cần tài khoản Apple Developer 99 USD/năm).
- Tài liệu hướng dẫn build/chạy: `mobile/README.md`.
