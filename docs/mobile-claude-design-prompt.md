# Prompt cho Claude Design — App Android WoodHub

> Copy toàn bộ phần trong khung bên dưới dán vào Claude Design. Nếu Claude Design cho đính kèm file, đính kèm thêm ảnh chụp trong `docs/phase4-screenshots/` và `docs/phase5-screenshots/` để nó bám đúng phong cách của web.

---

````
Hãy thiết kế giao diện ứng dụng di động Android tên "WoodHub" — nền tảng nội thất gỗ có AR/3D. Mục tiêu: một prototype có thể bấm được (clickable) cho luồng chính, cộng thêm bộ màn hình đầy đủ để đội phát triển dựng bằng React Native (Expo). Toàn bộ nội dung hiển thị bằng TIẾNG VIỆT.

## 1. Sản phẩm là gì
WoodHub kết nối khách hàng với xưởng mộc và nhà cung cấp nội thất gỗ. Điểm khác biệt: khách xem sản phẩm bằng 3D, ĐẶT THỬ VÀO CĂN PHÒNG THẬT BẰNG AR, tự thiết kế đồ nội thất tuỳ chỉnh (chọn mẫu 3D hoặc chụp ảnh để AI dựng thành mô hình 3D), rồi gửi yêu cầu báo giá cho xưởng và thương lượng giá/thời gian giao.
=> AR/3D là LÕI của app. Mọi màn hình nên dẫn người dùng về "xem 3D" và "đặt vào phòng bằng AR" một cách tự nhiên.

## 2. Đối tượng và ngữ cảnh
- Khách hàng cá nhân, 20–45 tuổi, đang tìm đồ nội thất cho nhà/phòng, dùng một tay trên điện thoại.
- App phát hành dạng file APK (không lên Google Play). Chỉ Android, màn hình 360–412dp, dọc (portrait).
- Giao diện sáng là chính, có phiên bản tối (dark).

## 3. Hệ thống thiết kế (bám đúng web hiện có)
Màu (sáng): nền ivory #F4EFE6 · chủ đạo walnut #5B4232 (chữ trên nền chủ đạo: #F8F4EC) · phụ oak #B08968 · nhấn gold #C9A227 (dùng cho GIÁ CHỐT và điểm nhấn AR) · forest #3F5E4E (thành công/đã chốt) · cảnh báo #D9912E · lỗi đỏ gạch dịu.
Màu (tối): nền nâu rất đậm (~#201A14), chủ đạo oak sáng #C89B6E, gold giữ nguyên độ sáng đủ tương phản. Chữ chính ivory.
Font: Be Vietnam Pro cho nội dung và nút; Lora (serif) cho tiêu đề lớn và giá tiền nổi bật. Hỗ trợ đủ dấu tiếng Việt.
Phong cách: ấm, sang, tối giản, cảm giác "xưởng mộc cao cấp"; bo góc lớn (card 20–24dp, nút 14–16dp); đổ bóng nhẹ; ảnh/mô hình 3D là nhân vật chính, ít chữ.
Thành phần: thanh tab dưới 5 mục, nút chính walnut, nút phụ viền, chip lọc, card sản phẩm, bottom sheet (dùng nhiều thay cho popup), badge trạng thái dạng pastel (nền nhạt + chữ đậm cùng tông), skeleton khi tải.
Khả năng tiếp cận: vùng chạm ≥ 48dp, tương phản chữ ≥ 4.5:1, cỡ chữ tối thiểu 14sp.
Định dạng: tiền "11.000.000 ₫"; ngày "dd/MM/yyyy"; số lượng "×2".
Biểu tượng: nét đơn giản (outline), đồng nhất một bộ.

## 4. Điều hướng
Thanh tab dưới (5 mục), mục giữa nổi bật vì là lõi của app:
1. Khám phá (Home)
2. Cửa hàng
3. Thiết kế (mục giữa, nút tròn nổi, biểu tượng khối 3D)  ← lõi
4. Báo giá
5. Tôi

Nút nổi "Trợ lý AI" (bong bóng chat) ở góc dưới phải các màn hình Khám phá, Cửa hàng, chi tiết sản phẩm.

## 5. Danh sách màn hình cần thiết kế (theo thứ tự ưu tiên)

### A. Lõi AR/3D (làm kỹ nhất)
1. **Trình xem 3D toàn màn hình** (màn quan trọng nhất): mô hình xoay được ở giữa trên nền gradient ivory→oak nhạt, nút quay lại, nút tải/đang tải mô hình (thanh tiến độ), thanh công cụ chỉnh dưới dạng bottom sheet kéo lên: hàng chip MÀU (6 màu gỗ), chip CHẤT LIỆU (Sồi, Óc chó, Thông, Cao su), 3 slider KÍCH THƯỚC (Rộng/Cao/Sâu, đơn vị cm) và dòng GIÁ ƯỚC TÍNH thay đổi theo lựa chọn. Nút lớn nổi bật màu gold "Đặt vào phòng bằng AR" (biểu tượng camera + khối 3D) và nút phụ "Lưu thiết kế".
2. **Hướng dẫn AR / trạng thái AR** (mô phỏng lớp phủ trên khung camera): (a) xin quyền camera, (b) "Di chuyển điện thoại để quét sàn" với hình minh hoạ, (c) đã đặt vật thể: nút chụp ảnh, nút xoay, nút thu/phóng, nút "Xong", (d) thiết bị không hỗ trợ AR: thông báo thân thiện + gợi ý xem 3D thường.
3. **Chi tiết sản phẩm**: ảnh lớn có chuyển đổi "Ảnh | 3D" (tab nhỏ), nút "Xem AR" nổi trên ảnh, tên, giá, vật liệu, kích thước, nhà cung cấp + chi nhánh (chỉ ghi Quận, Thành phố), nút "Yêu cầu báo giá", nút hỏi Trợ lý AI.

### B. Thiết kế tuỳ chỉnh (mục tab giữa)
4. **Trang vào Thiết kế**: hai thẻ lớn: "Chọn mẫu 3D có sẵn" và "Tạo từ ảnh của bạn" (biểu tượng camera, ghi chú "AI dựng mô hình 3D trong 1–3 phút"). Bên dưới: "Thiết kế của tôi" (lưới thumbnail 2 cột, có trạng thái nháp/hoàn chỉnh).
5. **Thư viện mẫu 3D**: lưới 2 cột, chip lọc loại đồ (Sofa, Ghế, Bàn, Tủ, Kệ, Giường, Trang trí), ô tìm kiếm; mỗi thẻ có huy hiệu "3D".
6. **Tạo từ ảnh – chuẩn bị**: chọn "Chụp ảnh" hoặc "Chọn từ thư viện", xem trước ảnh, công tắc "Tách nền", gợi ý chụp ảnh (đủ sáng, vật thể ở giữa), nút "Bắt đầu dựng 3D".
7. **Đang dựng 3D**: vòng tiến độ lớn, các bước (Tải ảnh lên → AI phân tích → Dựng mô hình → Hoàn tất), dòng "Bạn có thể thoát ra, thông báo sẽ hiện khi xong", nút "Huỷ"; trạng thái LỖI có nút "Thử lại" và "Đổi ảnh khác".
8. **Kết quả → chỉnh sửa → lưu**: dùng lại Trình xem 3D (màn 1), thêm màn đặt tên thiết kế và lưu thành công với hai nút "Đặt vào phòng bằng AR" và "Gửi yêu cầu báo giá".

### C. Báo giá và thương lượng
9. **Danh sách yêu cầu báo giá**: thanh tab ngang (Tất cả · Chờ phản hồi · Đang thương lượng · Đã chốt · Đã từ chối). Mỗi card có: ảnh thiết kế, tên xưởng, badge trạng thái, "Số lượng: 2 · Quận 7, TP.HCM", rồi khối giá theo ĐÚNG 4 trạng thái:
   - Chờ phản hồi: chữ mờ "Chưa có báo giá".
   - Đang thương lượng: "11.000.000 ₫ /sp", dòng nhỏ "Tổng: 22.000.000 ₫ (×2)", "Xưởng đề xuất · 3 vòng · ~10 ngày" (hoặc "Bạn đề xuất").
   - Đã chốt: giá màu GOLD, to, đậm; "Tổng: 19.000.000 ₫ (×2)"; "Giá đã chốt · ~12 ngày · dự kiến 19/10/2026".
   - Đã từ chối: giá gạch ngang, mờ, "Giá cuối cùng".
10. **Chi tiết báo giá**: tiêu đề thiết kế + nút xem 3D/AR, lịch sử các vòng ra giá dạng timeline (mỗi vòng: ai ra giá, giá, số ngày, thời điểm, ghi chú), nút "Chấp nhận" / "Từ chối" / "Trả giá khác" (mở bottom sheet nhập giá + số ngày), và trạng thái "Đã chốt: đơn hàng được tạo".
11. **Gửi yêu cầu báo giá** (bottom sheet): chọn xưởng (danh sách có khoảng cách), số lượng (bộ tăng giảm), địa điểm, ghi chú, nút Gửi.
12. **Xưởng gần bạn**: bản đồ phía trên + danh sách thẻ xưởng bên dưới (tên, quận, khoảng cách "2,4 km", đánh giá sao, nút "Gửi yêu cầu"); trạng thái chưa cấp quyền vị trí.

### D. Khám phá và Trợ lý AI
13. **Onboarding** (3 màn trượt, có thể bỏ qua): "Xem đồ nội thất bằng 3D", "Đặt thử vào phòng bằng AR", "Tự thiết kế, nhận báo giá từ xưởng mộc".
14. **Đăng nhập / Đăng ký / Nhập mã OTP 6 số / Quên mật khẩu**, có nút "Đăng nhập với Google".
15. **Khám phá (Home)**: lời chào, ô tìm kiếm, banner hero lớn "Đặt thử vào phòng bạn bằng AR" (nút "Thử ngay"), chip loại đồ, hàng cuộn ngang "Mẫu 3D nổi bật" (thẻ có huy hiệu AR), lưới "Sản phẩm mới".
16. **Cửa hàng**: tìm kiếm, nút Lọc mở bottom sheet (loại, chất liệu, khoảng giá bằng slider 2 đầu, sắp xếp), lưới 2 cột, mỗi thẻ có ảnh, tên, giá, huy hiệu "3D" nếu có.
17. **Trợ lý AI** (màn chat): bong bóng người dùng (walnut) và trợ lý (nền sáng), thẻ sản phẩm gợi ý ngay trong chat gồm ảnh nhỏ, tên, "Bàn · Gỗ sồi", giá, và 2 chip lý do ("Đúng loại bàn", "Trong tầm giá"); ô nhập có nút gửi; trạng thái: đang gõ, "AI đang khởi động, có thể mất vài chục giây…", hết lượt (429) có nút "Nâng cấp gói", lỗi có nút "Thử lại"; nút "Lịch sử trò chuyện" và "Cuộc trò chuyện mới" ở thanh trên.

### E. Tài khoản và gói
18. **Tôi (Hồ sơ)**: ảnh đại diện, tên, email, mục: Thiết kế của tôi, Yêu cầu báo giá, Gói của tôi, Xưởng gần bạn, Cài đặt (giao diện sáng/tối), Đăng xuất.
19. **Gói của tôi / Bảng giá**: hiện hạn mức tháng này dạng thanh tiến độ ("Thiết kế 3D: 3/5 lượt", "Chat AI: 12/20 lượt") và danh sách 3 gói dạng thẻ cuộn ngang. DỮ LIỆU THẬT:
   - Free — Miễn phí: Thiết kế 3D 5 lượt/tháng · Chat AI 20 lượt/tháng.
   - B2C Premium AR/3D — 79.000 ₫/tháng: "Tất cả quyền lợi của gói Free, thêm:" Chat AI không giới hạn.
   - Custom Design Premium / Verified — 299.000 ₫/tháng: "Tất cả quyền lợi của gói B2C Premium AR/3D, thêm:" Thiết kế 3D không giới hạn.
   Gói đang dùng có huy hiệu "Gói hiện tại" và nút "Đang sử dụng" (mờ, không bấm được).
20. **Thanh toán gói** (bottom sheet cao): khối "Bạn sẽ nhận được" (quyền lợi + hiệu lực dự kiến), ảnh QR lớn, số tiền, "Nội dung chuyển khoản: SUB…" có nút Sao chép, nút "Lưu ảnh QR" (vì không thể tự quét QR trên cùng điện thoại), thời hạn QR; các trạng thái: "Đang chờ thanh toán…", "Thanh toán thành công", "QR đã hết hạn — Tạo mã mới".

(Không thiết kế: giỏ hàng, thanh toán đơn hàng, cổng quản trị xưởng/admin — những phần này nằm ở web.)

## 6. Trạng thái bắt buộc phải có trên các màn chính
Đang tải (skeleton), trống (có minh hoạ + nút hành động), lỗi (có "Thử lại"), mất mạng, đang tải mô hình 3D nặng (thanh tiến độ), xin quyền (camera, vị trí, thư viện ảnh) với giải thích vì sao cần, hết lượt dùng theo gói.

## 7. Dữ liệu mẫu để bạn điền vào thiết kế (hãy dùng cho thật)
- Sản phẩm: "Bàn ăn gỗ sồi 6 ghế" 8.500.000 ₫ · "Kệ sách óc chó 5 tầng" 6.200.000 ₫ · "Bàn làm việc gỗ thông" 3.100.000 ₫ · "Tủ TV gỗ óc chó 1,8 m" 7.400.000 ₫.
- Xưởng/nhà cung cấp: "Xưởng Mộc Tân Phát" (Quận 7) · "Nội Thất An Phát" (Gò Vấp) · "Xưởng Gỗ Việt" (Thủ Đức) · "Mộc Sài Gòn" (Quận 12).
- Người dùng: "Nguyễn Văn An", an.nguyen@example.com.

## 8. Cách trình bày kết quả tôi muốn
1. Bắt đầu bằng 1 trang tổng quan "bản đồ màn hình" (luồng điều hướng).
2. Prototype bấm được cho 3 luồng: (i) Khám phá → Chi tiết sản phẩm → Trình xem 3D → AR; (ii) Thiết kế → Tạo từ ảnh → Đang dựng → Kết quả → Lưu → Gửi báo giá; (iii) Báo giá → Chi tiết → Trả giá → Chấp nhận.
3. Sau đó là các màn còn lại, mỗi màn có bản sáng và bản tối.
4. Ghi chú ngắn bên cạnh mỗi màn: thành phần chính và hành vi (để lập trình viên đọc).
5. Giữ mọi thứ khả thi để dựng bằng React Native: tránh hiệu ứng kính mờ phức tạp, bóng quá nhiều lớp, hoặc thành phần chỉ có trên iOS.
````

---

## Gợi ý khi dùng
- Nếu Claude Design chỉ làm được vài màn mỗi lượt, hãy yêu cầu theo nhóm: **A (lõi AR/3D) → B (thiết kế) → C (báo giá) → D → E**, và luôn nhắc "giữ nguyên hệ thống thiết kế đã tạo ở lượt đầu".
- Sau khi có thiết kế, gửi lại cho mình (ảnh hoặc link) để mình dựng app theo đúng từng màn và nối API thật.
