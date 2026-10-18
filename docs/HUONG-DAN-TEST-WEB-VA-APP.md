# Hướng dẫn test WoodHub (Web 3 role + App Android)

> Dành cho 2 thành viên làm tester. Test xong ghi kết quả vào bảng ở **mục 9** (Pass / Fail + mô tả + ảnh chụp màn hình).
> Web production: https://woodhub.io.vn · API: https://woodhub-be.onrender.com/api

---

## 0. Chuẩn bị chung

| Mục | Hướng dẫn |
|---|---|
| Trình duyệt | Chrome mới nhất. Mỗi role dùng **cửa sổ ẩn danh riêng** (hoặc đăng xuất trước khi đổi role) để không lẫn phiên đăng nhập |
| Lần đầu chậm | Server BE (Render) "ngủ" khi lâu không dùng → request đầu có thể mất **30–60 giây**. Chờ rồi tải lại, **không tính là lỗi** |
| Ngôn ngữ | Góc phải header có nút **VI / EN** — test cả 2 ngôn ngữ ở các trang chính |
| Giao diện tối | Nút mặt trăng trên header — kiểm tra chữ vẫn đọc được |
| Responsive | F12 → biểu tượng điện thoại, kiểm tra 375px (điện thoại) và 768px (tablet) |
| Ghi lỗi | Chụp màn hình + ghi: trang, các bước, kết quả thực tế, kết quả mong đợi. Nếu có lỗi đỏ: F12 → Console → chụp lại |

### Tài khoản test

| Role | Cách có tài khoản |
|---|---|
| **Customer** (cá nhân / doanh nghiệp) | Tự đăng ký ở `/register` bằng email thật (nhận OTP). Tạo **1 tài khoản cá nhân** và **1 tài khoản doanh nghiệp** (có Tên công ty, MST, Địa chỉ công ty) |
| **Supplier** — Nhà cung cấp (manufacturer) và **Xưởng mộc** (workshop) | Do **Admin tạo** (mục 5.2) — lần đăng nhập đầu hệ thống bắt **đổi mật khẩu** |
| **Admin** | Hỏi Toàn (không ghi mật khẩu vào tài liệu/nhóm chat chung) |

> Chạy thử **không cần BE** (mock): trong `woodhub/web/.env` đặt `VITE_USE_MOCK=true`, chạy `npm run dev`, mở http://localhost:5173. Ở chế độ mock mọi email/mật khẩu đều đăng nhập được: `admin@woodhub.vn` → Admin, `ncc@woodhub.vn` → Nhà cung cấp, `xuong@woodhub.vn` → Xưởng mộc, email khác → Customer. Dữ liệu mock chỉ để xem giao diện, không phản ánh BE thật.

---

## 1. Test khách vãng lai (chưa đăng nhập)

| # | Việc làm | Kết quả mong đợi |
|---|---|---|
| 1.1 | Mở `/` | Trang chủ hiện hero, menu: Cửa hàng · Thiết kế Custom · Xưởng & Nhà cung cấp · Doanh nghiệp B2B · Giới thiệu. **Không còn mục "Không gian"** |
| 1.2 | Gõ `/rooms` trên thanh địa chỉ | Hiện trang 404 (đã gỡ tính năng) |
| 1.3 | **Cửa hàng** → di chuột vào menu "Cửa hàng" | Mega menu mở; không có nhóm "Không gian phòng" |
| 1.4 | Cửa hàng → lọc theo danh mục / vật liệu / giá tối đa / "Có 3D" / "Tùy chỉnh được"; sắp xếp theo giá | Danh sách đổi đúng, nút xóa bộ lọc hoạt động, không có bộ lọc "Không gian" |
| 1.5 | Mở 1 sản phẩm | Có ảnh, giá, biến thể, mô tả; nút thêm vào giỏ |
| 1.6 | Thêm vào giỏ khi chưa đăng nhập | Thêm được; **biểu tượng giỏ hiện chính xác số lượng** (ô tròn nhỏ ở góc, số không bị cắt) |
| 1.7 | `/suppliers` → lọc/tìm xưởng → mở hồ sơ 1 xưởng | Danh sách + hồ sơ (năng lực, portfolio, chi nhánh, đánh giá) hiển thị |
| 1.8 | `/b2b`, `/about`, `/pricing`, `/contact` | Hiển thị đủ nội dung; gửi form liên hệ báo thành công |
| 1.9 | `/custom` → `/custom/models` → mở 1 mẫu 3D | Xoay/phóng được mô hình; đổi màu, đổi kích thước → giá ước tính đổi |
| 1.10 | Mở chatbot (nút tròn góc phải dưới) | Mở khung chat, gửi câu hỏi nhận được trả lời (nếu báo lỗi 502 → ghi lại, đã biết lỗi phía AI provider) |
| 1.11 | Mở `/checkout`, `/orders`, `/profile` khi chưa đăng nhập | Tự chuyển về `/login` |
| 1.12 | Mở `/admin/dashboard` hoặc `/portal/supplier/dashboard` khi chưa đăng nhập | Chuyển về `/login` |

---

## 2. Test Customer (cá nhân)

### 2.1 Đăng ký / đăng nhập
| # | Việc làm | Mong đợi |
|---|---|---|
| 2.1.1 | `/register` — bỏ trống / sai định dạng email / mật khẩu yếu | Báo lỗi cụ thể từng ô |
| 2.1.2 | Đăng ký hợp lệ → nhận OTP trong email → `/verify-otp` nhập sai OTP rồi nhập đúng | Sai: báo lỗi; đúng: vào hệ thống đã đăng nhập |
| 2.1.3 | Bấm "Gửi lại OTP" | Nhận OTP mới (có thời gian chờ giữa các lần) |
| 2.1.4 | Đăng xuất → Đăng nhập lại; thử sai mật khẩu | Sai: báo lỗi; đúng: tên hiển thị "Chào, …" ở header |
| 2.1.5 | `/forgot-password` → nhận email → `/reset-password` | Đổi mật khẩu thành công, đăng nhập được bằng mật khẩu mới |
| 2.1.6 | "Đăng nhập bằng Google" | Mở popup Google, đăng nhập được (nếu lỗi origin → ghi lại) |

### 2.2 Mua hàng (B2C) — **trọng tâm vừa làm lại giao diện**

> ⚠️ **Lưu ý:** API đơn hàng B2C **chưa có ở BE** — bước "Đặt hàng" và trang `/orders` hiện chạy **giả lập** (không lưu lên server, nhà cung cấp sẽ không thấy đơn). Test các bước này để kiểm tra **giao diện và luồng**, không kỳ vọng đơn xuất hiện ở portal nhà cung cấp/admin.
| # | Việc làm | Mong đợi |
|---|---|---|
| 2.2.1 | Thêm 2 sản phẩm khác nhau vào giỏ → vào `/cart` | Mỗi dòng có ảnh, tên, nhà cung cấp, bộ chỉnh số lượng **− / +**, thành tiền, nút xóa (thùng rác) |
| 2.2.2 | Bấm **−** khi số lượng = 1 | Sản phẩm bị xóa khỏi giỏ |
| 2.2.3 | Tăng số lượng | Tạm tính và thanh tiến độ "Mua thêm … để miễn phí vận chuyển" đổi theo. Từ **5.000.000đ** trở lên: hiện "được miễn phí vận chuyển" |
| 2.2.4 | Giỏ trống | Hiện trạng thái trống + nút "Vào cửa hàng" |
| 2.2.5 | **Tiến hành thanh toán** → `/checkout` | Thanh 3 bước (Giỏ hàng ✓ → Thanh toán → Hoàn tất); khung "Địa chỉ giao hàng" và "Phương thức thanh toán"; cột tóm tắt đơn bên phải |
| 2.2.6 | Phương thức thanh toán | **Chỉ có 1 phương thức: Chuyển khoản ngân hàng** (không còn VNPay/MoMo), kèm 3 bước hướng dẫn |
| 2.2.7 | Bấm "Đặt hàng" khi còn trống ô | Nút bị khóa; chạm vào ô rồi bỏ ra → hiện lỗi đỏ dưới ô (họ tên, SĐT `0xxxxxxxxx`, địa chỉ ≥ 5 ký tự, quận/huyện) |
| 2.2.8 | Điền đủ → **Đặt hàng** | Thấy "Đang xử lý…" rồi chuyển sang `/orders/:id`; giỏ hàng được làm trống |
| 2.2.9 | `/orders` và chi tiết đơn | Đơn mới có trong danh sách; trang chi tiết hiển thị địa chỉ, sản phẩm, trạng thái, phương thức "Chuyển khoản ngân hàng" |
| 2.2.10 | Cho phép vị trí (GPS) ở checkout | Nếu nhà cung cấp có chi nhánh có tọa độ → hiện danh sách "Chọn chi nhánh gần bạn" kèm khoảng cách (km) |
| 2.2.11 | Giao diện điện thoại (375px) | Cột tóm tắt xuống dưới form, không tràn ngang, nút bấm được |

### 2.3 Custom Design (AI + 3D)
| # | Việc làm | Mong đợi |
|---|---|---|
| 2.3.1 | `/custom/studio` | Wizard nhiều bước: Nguồn → Chuẩn bị ảnh → Dựng 3D → Kết quả → Chỉnh sửa → Lưu |
| 2.3.2 | Tải 1 ảnh đồ gỗ → bắt đầu dựng 3D | Có thanh tiến trình, xong trong 1–3 phút, tự chuyển sang bước kết quả |
| 2.3.3 | Chỉnh màu (Màu gốc/Óc chó/Sồi/Anh đào) và kích thước | Mô hình đổi theo; giá ước tính đổi |
| 2.3.4 | Lưu thiết kế → `/custom/designs` | Thiết kế có trong danh sách |
| 2.3.5 | `/custom/my-models` | Danh sách model AI; thử **Đổi tên** |
| 2.3.6 | Hạn mức (gói Free) | Hết lượt → hiện thông báo/gợi ý nâng cấp rõ ràng, không treo |

### 2.4 Báo giá & đơn custom
| # | Việc làm | Mong đợi |
|---|---|---|
| 2.4.1 | Từ thiết kế/hồ sơ xưởng → **Gửi yêu cầu báo giá** | Tạo được; thấy ở `/quotes` |
| 2.4.2 | Mở chi tiết báo giá; khi xưởng trả giá: **chấp nhận / đề xuất giá khác / từ chối** | Trạng thái đổi đúng, lịch sử các vòng báo giá hiển thị |
| 2.4.3 | Báo giá chốt → `/custom-orders` và chi tiết | Có đơn custom, tiến độ sản xuất cập nhật khi xưởng đổi trạng thái |
| 2.4.4 | Chat với xưởng (từ báo giá/hồ sơ xưởng) | Gửi/nhận tin nhắn theo thời gian thực; đóng tab mở lại vẫn còn lịch sử |

### 2.5 Gói đăng ký & tài khoản
| # | Việc làm | Mong đợi |
|---|---|---|
| 2.5.1 | `/pricing` | 3 gói, gói đang dùng ghi "Đang sử dụng" |
| 2.5.2 | Chọn gói trả phí | Hiện **mã QR** thanh toán + số tiền + nội dung; bấm đóng không bị lỗi |
| 2.5.3 | `/account/subscription` | Thấy gói hiện tại, hạn dùng, lịch sử, hạn mức đã dùng |
| 2.5.4 | `/profile` | Xem/sửa họ tên, SĐT; lưu thành công |

---

## 3. Test Customer doanh nghiệp (B2B)

| # | Việc làm | Mong đợi |
|---|---|---|
| 3.1 | Đăng ký loại **Doanh nghiệp** với Tên công ty, MST, Địa chỉ | Đăng ký + OTP thành công; `/profile` hiển thị thông tin công ty |
| 3.2 | Bỏ trống MST khi chọn Doanh nghiệp | Báo lỗi hợp lệ (BE kiểm tra) |
| 3.3 | `/b2b` → gửi **yêu cầu báo giá số lượng lớn** (sản phẩm + số lượng) | Tạo được, thấy ở `/quotes` |
| 3.4 | Mua hàng như 2.2 | Hoạt động như khách cá nhân |

---

## 4. Test Supplier — Nhà cung cấp (manufacturer) · `/portal/supplier`

> Đăng nhập bằng tài khoản do Admin tạo. **Lần đầu bắt đổi mật khẩu** (`/change-password`) — kiểm tra bước này.

| # | Menu | Việc làm | Mong đợi |
|---|---|---|---|
| 4.1 | Đăng nhập lần đầu | Bị chuyển sang đổi mật khẩu; đổi xong vào portal | Không vào được portal trước khi đổi |
| 4.2 | Tổng quan | Xem KPI, biểu đồ doanh thu, đơn gần đây, hiệu suất chi nhánh | Hiển thị không lỗi *(một số số liệu còn là dữ liệu mẫu — xem Tóm tắt dự án)* |
| 4.3 | Chi nhánh | Thêm chi nhánh (chọn vị trí trên bản đồ Goong), sửa, xóa | Lưu được; chi nhánh có tọa độ xuất hiện ở gợi ý gần của khách |
| 4.4 | Sản phẩm | Thêm sản phẩm: tên, mô tả, danh mục, vật liệu, giá; thêm **biến thể**; tải **nhiều ảnh**, đặt ảnh chính | Lưu được; đổi trạng thái nháp/đang bán/ẩn; xóa được |
| 4.5 | Sản phẩm → tồn kho | Nhập tồn theo chi nhánh, điều chỉnh, xóa | Số lượng cập nhật đúng |
| 4.6 | Kiểm tra phía khách | Sản phẩm vừa tạo (trạng thái đang bán) hiện ở `/shop` | Có; sản phẩm nháp/ẩn thì **không** hiện |
| 4.7 | Đơn hàng | Xem đơn, cập nhật trạng thái *(dữ liệu mẫu — chưa nối BE, chỉ kiểm tra giao diện)* | Giao diện hoạt động, không lỗi trắng trang |
| 4.8 | Đánh giá / Hồ sơ & Năng lực / Báo cáo / Cài đặt | Mở từng trang | Hiển thị, không lỗi trắng trang |
| 4.9 | Chat | Nhận tin của khách, trả lời | Hai chiều, realtime |
| 4.10 | Phân quyền | Gõ `/admin/users` và `/portal/workshop/dashboard` | Chuyển sang trang **403** |

---

## 5. Test Supplier — Xưởng mộc (workshop) · `/portal/workshop`

| # | Menu | Việc làm | Mong đợi |
|---|---|---|---|
| 5.1 | Đăng nhập | Đăng nhập tài khoản xưởng | Vào `/portal/workshop/dashboard` (không phải portal nhà cung cấp) |
| 5.2 | Tổng quan | Xem KPI, đơn custom đang xử lý | Hiển thị không lỗi |
| 5.3 | Đơn custom & Báo giá | Nhận yêu cầu báo giá từ khách → **báo giá** (giá, thời gian) / thương lượng / từ chối | Trạng thái và số vòng báo giá khớp phía khách |
| 5.4 | Tiến độ sản xuất | Cập nhật các bước sản xuất | Khách thấy tiến độ ở `/custom-orders/:id` |
| 5.5 | Hồ sơ & Năng lực / Portfolio | Cập nhật năng lực, ảnh portfolio | Hiện ở trang công khai `/suppliers/:id` |
| 5.6 | Đánh giá / Báo cáo / Cài đặt | Mở từng trang | Không lỗi |
| 5.7 | Chat | Trả lời khách | Realtime hai chiều |

---

## 6. Test Admin · `/admin`

| # | Menu | Việc làm | Mong đợi |
|---|---|---|---|
| 6.1 | Đăng nhập admin | Vào `/admin` | **Tự chuyển sang `/admin/dashboard` (Tổng quan)** |
| 6.2 | **Tổng quan** | Đổi bộ lọc thời gian: 7 / 30 / 90 ngày / Toàn bộ | Các thẻ KPI, biểu đồ, bảng đều tải lại, không nháy trắng |
| 6.2a | | Thẻ KPI: Doanh thu, Tổng người dùng, Gói đang hoạt động, MRR | Số liệu khớp `Thanh toán` và `Người dùng` |
| 6.2b | | Biểu đồ: Doanh thu / Người dùng mới / Task AI / Đơn custom theo ngày | Ngày không có dữ liệu = 0 (đường liền); rê chuột vào cột/điểm thấy chú thích |
| 6.2c | | Phân bố theo vai trò, trạng thái NCC, trạng thái sản phẩm | Tổng các phần = tổng tương ứng |
| 6.2d | | Bảng "Gói bán chạy", "Xưởng doanh thu cao" | Có dữ liệu hoặc "Chưa có dữ liệu"; bấm tên xưởng mở chi tiết |
| 6.2e | | Đăng nhập bằng customer rồi mở `/admin/dashboard` | Trang 403 |
| 6.3 | Người dùng | Tìm kiếm, lọc, mở chi tiết, xóa người dùng thử | Phân trang đúng; xóa có hộp xác nhận |
| 6.4 | Nhà cung cấp | **Tạo tài khoản NCC** (chọn loại: nhà cung cấp / xưởng mộc), duyệt, tạm khóa, mở lại | Tài khoản mới đăng nhập được và bị ép đổi mật khẩu lần đầu |
| 6.5 | Danh mục | Thêm / sửa / xóa danh mục (cây cha–con) | Xuất hiện đúng ở bộ lọc `/shop` |
| 6.6 | Vật liệu | Thêm / sửa / xóa | Xuất hiện ở bộ lọc `/shop` |
| 6.7 | Gói đăng ký | Xem tất cả gói (kể cả đã tắt), tạo/sửa/bật-tắt | `/pricing` hiển thị đúng thay đổi |
| 6.8 | Thanh toán | Lọc theo trạng thái / khoảng ngày, mở chi tiết giao dịch, xem thống kê | Doanh thu tính theo giao dịch **đã thanh toán**; sai định dạng ngày báo lỗi dễ hiểu |

---

## 7. Test App Android (Expo)

### 7.1 Cài app
1. Nhận **link APK** từ Toàn (build EAS) → mở link trên điện thoại Android → tải → cài (bật "Cài từ nguồn không xác định" nếu hỏi).
2. Hoặc chạy bằng Expo Go: `cd woodhub/mobile && npm install && npx expo start`, quét QR.
3. Máy cần hỗ trợ **ARCore** để test AR (kiểm tra danh sách máy của Google).

### 7.2 Các luồng cần test

| # | Màn hình | Việc làm | Mong đợi |
|---|---|---|---|
| 7.1 | Onboarding | Mở app lần đầu | Các màn giới thiệu, vuốt được, nút bỏ qua/bắt đầu |
| 7.2 | Đăng ký / OTP / Đăng nhập | Như web 2.1 | Vào được trang chủ; nút Google hiện thông báo "chưa hỗ trợ" (đã biết) |
| 7.3 | Trang chủ, Cửa hàng, Chi tiết sản phẩm | Duyệt, lọc, mở sản phẩm | Dữ liệu thật tải về (lần đầu có thể chậm 30–60 giây) |
| 7.4 | Xem 3D | Mở mô hình 3D | Xoay / chụm phóng mượt, đổi màu, kéo kích thước, giá ước tính đổi |
| 7.5 | **AR** | "Đặt vào phòng bằng AR" | Mở Scene Viewer của Google; quét sàn, đặt/xoay/phóng được. Máy không hỗ trợ → màn "Thiết bị chưa hỗ trợ AR" |
| 7.6 | Thiết kế → Chọn mẫu 3D | Chọn mẫu, chỉnh, lưu | Lưu thành công |
| 7.7 | Thiết kế → Từ ảnh | Chụp/chọn ảnh → AI dựng 3D | Thanh tiến trình, 1–3 phút, tự mở trình xem khi xong; cấp quyền camera/thư viện ảnh |
| 7.8 | Model 3D của tôi | Xem danh sách, đổi tên | Đổi tên lưu được |
| 7.9 | Báo giá | Gửi yêu cầu báo giá cho xưởng; xem tab Báo giá; đề xuất giá khác / chấp nhận / từ chối | Trạng thái đổi đúng, khớp với web |
| 7.10 | Xưởng gần bạn | Cho phép vị trí | Danh sách xưởng kèm khoảng cách |
| 7.11 | Chat AI | Hỏi gợi ý nội thất | Trả lời, có thẻ sản phẩm gợi ý |
| 7.12 | Gói dịch vụ | Nâng cấp → mã QR | Hiện QR; trạng thái tự đổi khi thanh toán |
| 7.13 | Hồ sơ | Đổi giao diện sáng/tối, đăng xuất | Hoạt động; đăng xuất về màn đăng nhập |
| 7.14 | Mất mạng | Tắt wifi/4G rồi thao tác | Báo lỗi dễ hiểu, không treo/văng app |
| 7.15 | Xoay màn hình / nút Back | Dùng nút Back Android ở nhiều màn | Quay lại đúng màn trước, không thoát app đột ngột |

**Hạn chế đã biết của app (không tính là lỗi):** AR chỉ hiển thị mô hình gốc (màu/kích thước chỉnh chưa mang sang AR); chưa có đăng nhập Google; chưa có giỏ hàng/đặt mua trên app (luồng chính là thiết kế → báo giá); chưa hỗ trợ iPhone.

---

## 8. Kiểm tra chéo giữa các role (luồng end-to-end)

Làm theo thứ tự, mỗi bước do 1 role thực hiện, **dùng 3 cửa sổ trình duyệt khác nhau**:

1. **Admin** tạo 1 tài khoản Nhà cung cấp mới.
2. **Nhà cung cấp** đăng nhập → đổi mật khẩu → tạo chi nhánh + 1 sản phẩm (có ảnh, tồn kho) và để trạng thái *đang bán*.
3. **Customer** thấy sản phẩm ở `/shop` → thêm giỏ → đặt hàng (chuyển khoản). *(Đơn B2C hiện giả lập — bước 4–5 chưa kiểm tra được cho đến khi BE có API đơn hàng.)*
4. ~~Nhà cung cấp thấy đơn → cập nhật trạng thái.~~ *(chờ BE)*
5. ~~Customer thấy trạng thái đơn đổi.~~ *(chờ BE)*
6. **Admin** mở `/admin/dashboard` → số liệu (người dùng, nhà cung cấp, sản phẩm) tăng tương ứng.
7. Lặp lại với **Xưởng mộc**: Customer gửi yêu cầu báo giá custom → Xưởng báo giá → Customer chấp nhận → đơn custom → Xưởng cập nhật tiến độ.

---

## 9. Bảng ghi kết quả

| Mã test | Người test | Thiết bị / trình duyệt | Pass / Fail | Mô tả lỗi (nếu có) | Ảnh chụp |
|---|---|---|---|---|---|
| ví dụ: 2.2.8 | Tên | Chrome 130 / Windows | Fail | Bấm Đặt hàng báo lỗi 500 | link ảnh |

**Mức độ lỗi gợi ý:** *Chặn* (không dùng được luồng chính) · *Nặng* (sai kết quả/mất dữ liệu) · *Nhẹ* (giao diện, chính tả) · *Góp ý* (UX có thể tốt hơn).
