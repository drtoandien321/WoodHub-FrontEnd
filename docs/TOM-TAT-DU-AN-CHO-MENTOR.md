# WoodHub — Tóm tắt dự án (dành cho Mentor)

> Môn: EXE101 · FPT University HCMC · Nhóm 5 người (SE / AI / Digital Marketing / Business Admin)
> Cập nhật: 18/10/2026 · Web: https://woodhub.io.vn · Trạng thái: **MVP đang chạy thật, đang hoàn thiện**

---

## 1. WoodHub là gì?

**WoodHub** là sàn nội thất gỗ hợp nhất **3 mô hình trong 1 nền tảng**:

| Mô hình | Ai mua – ai bán | Ví dụ |
|---|---|---|
| **B2C** — mua đồ có sẵn | Khách cá nhân ↔ nhà cung cấp có catalog | Mua bộ bàn ghế sofa gỗ sồi |
| **B2B** — mua số lượng lớn | Doanh nghiệp ↔ nhà cung cấp (báo giá nhiều vòng, xuất VAT) | Quán cà phê đặt 50 bộ bàn ghế |
| **Custom** — đặt làm theo ý | Khách ↔ **xưởng mộc** (thiết kế 3D → báo giá → sản xuất) | Đặt tủ giày đúng kích thước căn hộ |

**Vấn đề giải quyết:** người mua nội thất gỗ khó hình dung đồ trong nhà mình, khó so sánh giá giữa các xưởng, và việc đặt làm theo yêu cầu thường tốn nhiều vòng trao đổi qua tin nhắn rời rạc.

**Điểm khác biệt so với đối thủ (vd ancuong.com):**
1. **AI tư vấn** — chatbot gợi ý sản phẩm theo nhu cầu.
2. **3D + AR** — xem mô hình 3D, **đặt thử vào căn phòng thật** bằng điện thoại (AR).
3. **AI dựng 3D từ ảnh** — khách chụp/tải 1 bức ảnh đồ gỗ, AI tạo mô hình 3D, khách chỉnh màu/kích thước rồi gửi xưởng báo giá.
4. **Ghép xưởng + báo giá có thương lượng** — gửi thiết kế cho xưởng phù hợp, qua lại nhiều vòng giá, chat trực tiếp, theo dõi tiến độ sản xuất.

## 2. Người dùng & vai trò

| Vai trò | Làm được gì |
|---|---|
| **Khách hàng** (cá nhân) | Mua sản phẩm, thiết kế custom, nhận báo giá, chat với xưởng, dùng AI |
| **Khách hàng doanh nghiệp (B2B)** | Như trên + khai báo MST/công ty, yêu cầu báo giá số lượng lớn |
| **Nhà cung cấp** (có catalog) | Quản lý chi nhánh, sản phẩm, tồn kho, đơn hàng |
| **Xưởng mộc** (nhận đặt làm) | Nhận yêu cầu báo giá, thương lượng giá, cập nhật tiến độ sản xuất, portfolio |
| **Quản trị viên (Admin)** | Quản lý người dùng, nhà cung cấp, danh mục, vật liệu, gói đăng ký, thanh toán, xem dashboard tổng quan |

## 3. Công nghệ

| Lớp | Công nghệ |
|---|---|
| Web (FE) | React 19 + Vite, Tailwind CSS v4 + daisyUI, React Query, Zustand, three.js / model-viewer (3D), i18n Việt–Anh, chế độ sáng/tối. Deploy: **Vercel** |
| App di động | Expo (React Native), Android — dùng chung BE với web; AR qua Google Scene Viewer (ARCore) |
| Backend (BE) | Java **Spring Boot**, PostgreSQL (Supabase), JWT, Swagger. Deploy: **Render** |
| AI | Chatbot tư vấn; dựng 3D từ ảnh qua dịch vụ AI (BE làm proxy, giữ khóa bí mật) |
| Thanh toán | Chuyển khoản ngân hàng/QR (đối soát qua webhook cho gói đăng ký) |
| Bản đồ | Goong Maps (gợi ý chi nhánh/xưởng gần khách, tính khoảng cách) |
| Đo lường | Google Analytics 4 (đã gắn vào web) |

## 4. Những gì ĐÃ LÀM

Chú thích: ✅ chạy thật với BE · 🟡 giao diện đã có, dữ liệu còn mock/đang nối

### 4.1 Tài khoản & bảo mật
- ✅ Đăng ký (cá nhân/doanh nghiệp) → xác thực OTP email → đăng nhập; quên/đặt lại mật khẩu; đăng nhập Google (web).
- ✅ Phân quyền 3 vai trò (JWT), tài khoản nhà cung cấp do Admin tạo và **bắt đổi mật khẩu lần đầu**.
- ✅ Kiểm thử tự động API (52/52 test pass sau đợt rà soát bảo mật, đã sửa các lỗi như gia hạn gói không thanh toán, vượt hạn mức song song…).

### 4.2 Cửa hàng (B2C)
- ✅ Danh mục sản phẩm thật từ BE: lọc theo danh mục (cây cha–con), vật liệu, giá, "có 3D", "tùy chỉnh được"; sắp xếp; phân trang; chi tiết với biến thể + nhiều ảnh.
- ✅ Giao diện **Giỏ hàng** và **Thanh toán** vừa thiết kế lại (thanh tiến độ miễn phí vận chuyển, bộ chỉnh số lượng, tóm tắt đơn, 3 bước thanh toán); **phương thức thanh toán duy nhất: chuyển khoản ngân hàng**.
- 🟡 Tạo đơn hàng B2C: giao diện + luồng đã xong, **API đơn hàng phía BE chưa có** nên đơn đang lưu giả lập (xem mục 5).
- ✅ Gợi ý **chi nhánh gần khách** theo GPS ở bước thanh toán.

### 4.3 Custom Design (điểm nhấn của dự án)
- ✅ Thư viện mẫu 3D; xem 3D xoay/phóng; đổi màu (Màu gốc/Óc chó/Sồi/Anh đào) và kích thước → **giá ước tính**.
- ✅ **AI dựng 3D từ ảnh** (tải ảnh → mô hình 3D, theo dõi tiến trình, thử lại/hủy); "Model 3D của tôi" (đổi tên, quản lý).
- ✅ Lưu thiết kế; **hạn mức theo gói** (Free / Premium / Custom Premium).
- ✅ **AR trên app Android**: đặt mô hình vào phòng thật.

### 4.4 Báo giá & đơn custom
- ✅ Khách gửi yêu cầu báo giá cho xưởng → xưởng báo giá → **thương lượng nhiều vòng** (đề xuất giá khác / chấp nhận / từ chối) → chốt → đơn custom → cập nhật trạng thái sản xuất.
- ✅ **Chat trực tiếp khách ↔ xưởng** theo thời gian thực (WebSocket), lưu lịch sử.
- ✅ Gợi ý **xưởng gần nhất / trong bán kính** theo vị trí khách.

### 4.5 Gói đăng ký & thanh toán
- ✅ 3 gói (Free · B2C Premium AR/3D 79.000đ · Custom Design Premium 299.000đ), trang Bảng giá, "Gói của tôi", hạn mức sử dụng.
- ✅ Thanh toán gói bằng **mã QR** + đối soát tự động qua webhook (đã bảo mật so khớp khóa API).

### 4.6 Portal Nhà cung cấp & Xưởng mộc
- ✅ Quản lý **chi nhánh** (chọn vị trí trên bản đồ), **sản phẩm** (biến thể, nhiều ảnh, ảnh chính, nháp/đang bán/ẩn), **tồn kho theo chi nhánh**.
- ✅ Xưởng: nhận báo giá, thương lượng, cập nhật tiến độ.
- 🟡 Các trang **Tổng quan / Báo cáo / Đơn hàng** của nhà cung cấp hiện hiển thị số liệu mẫu, chờ BE cung cấp API thống kê theo từng nhà cung cấp.

### 4.7 Portal Admin
- ✅ Quản lý **người dùng**, **nhà cung cấp** (tạo/duyệt/khóa), **danh mục**, **vật liệu**, **gói đăng ký**, **thanh toán** (lọc, chi tiết, thống kê doanh thu).
- ✅ **Dashboard tổng quan** *(mới, nối API thật BE vừa cập nhật)*: KPI (doanh thu, người dùng, gói đang hoạt động, MRR ước tính), biểu đồ theo ngày (doanh thu, người dùng mới, task AI, đơn custom), phân bố theo vai trò/trạng thái, xếp hạng gói bán chạy và xưởng doanh thu cao, lọc theo 7/30/90 ngày hoặc toàn bộ.

### 4.8 App di động Android
- ✅ Đăng ký/đăng nhập OTP, cửa hàng, xem 3D, **AR**, thiết kế (chọn mẫu / từ ảnh AI), báo giá, xưởng gần bạn, chat AI, gói dịch vụ (QR). Build APK qua EAS để phát cho nhóm test.

### 4.9 Đo lường truy cập (Google Analytics) — *đang triển khai*
- ✅ Web đã gắn **GA4**: ghi nhận từng lượt xem trang (kể cả điều hướng trong ứng dụng một trang), nhận biết nguồn **Facebook/TikTok** qua tham số UTM trên link chia sẻ; không đếm khu vực nội bộ (Admin/Portal).
- 🟡 Hiển thị số liệu trong Dashboard Admin: đã viết đặc tả gửi BE (`docs/GA-traffic-dashboard-BE.md`), đang chờ BE làm.

### 4.10 Thay đổi sản phẩm gần đây
- Gỡ hoàn toàn mục **"Không gian"** (duyệt theo phòng) khỏi web để tập trung vào các luồng chính.
- Sửa lỗi hiển thị số lượng ở biểu tượng giỏ hàng trên thanh menu.

## 5. Hạn chế hiện tại (nói thẳng để mentor đánh giá đúng)

1. **Đơn hàng B2C chưa có API ở BE** — luồng giỏ → thanh toán → đơn hàng chạy giả lập; thanh toán **chuyển khoản chưa có bước đối soát tự động cho đơn hàng** (chỉ gói đăng ký đã có).
2. Dashboard/báo cáo của **nhà cung cấp & xưởng** còn dùng số liệu mẫu.
3. **AR** chỉ hiển thị mô hình gốc (màu/kích thước chỉnh chưa mang sang AR); cần máy Android hỗ trợ ARCore; **chưa hỗ trợ iPhone**.
4. App chưa có giỏ hàng/đặt mua, chưa có đăng nhập Google.
5. Server BE chạy gói miễn phí nên lần truy cập đầu sau thời gian im lặng có thể chậm 30–60 giây.
6. Gói **79.000đ** hiện chỉ khác gói Free ở **Chat AI không giới hạn** — cần xem lại giá trị gói (đã ghi trong `docs/phase5-plan-features.md`).
7. Chưa có kiểm thử trên nhiều thiết bị/người dùng thật (đang chuẩn bị đợt test chéo 3 vai trò + app: `docs/HUONG-DAN-TEST-WEB-VA-APP.md`).

## 6. SẼ LÀM (lộ trình gợi ý)

| Ưu tiên | Hạng mục | Ghi chú |
|---|---|---|
| 1 | **Đợt test chéo** web 3 vai trò + app, sửa lỗi phát sinh | Tài liệu test đã sẵn sàng |
| 2 | **API đơn hàng B2C** + đối soát chuyển khoản tự động | Cần BE; hoàn thiện luồng mua hàng thật |
| 3 | **Thống kê truy cập GA trong Dashboard Admin** | Đặc tả đã gửi BE |
| 4 | API thống kê thật cho Dashboard/Báo cáo của nhà cung cấp & xưởng | Thay số liệu mẫu |
| 5 | Truyền thông: đăng link kèm UTM lên Facebook/TikTok, theo dõi nguồn khách | Nhóm Marketing phối hợp |
| 6 | Quy trình **B2B đầy đủ** (so sánh nhiều nhà cung cấp, xuất hóa đơn VAT) | Mở rộng từ báo giá hiện có |
| 7 | AR mang theo màu/kích thước đã chỉnh; hỗ trợ iPhone | Cần tài khoản Apple Developer |
| 8 | Nâng gói hosting BE để tránh chậm lần đầu; đa dạng thanh toán (cổng thanh toán) khi có điều kiện | Chi phí vận hành |

## 7. Cách xem sản phẩm

- **Web:** https://woodhub.io.vn
- **API tài liệu (Swagger):** https://woodhub-be.onrender.com/swagger-ui/index.html
- **Mã nguồn:** FE `drtoandien321/WoodHub-FrontEnd` · BE `xuanmai000/woodhub-be`
- **Luồng demo gợi ý (5 phút):** Trang chủ → Cửa hàng → thêm giỏ → Thanh toán chuyển khoản → Thiết kế Custom (chọn mẫu 3D, chỉnh màu/kích thước, xem giá ước tính) → Gửi báo giá cho xưởng → (đăng nhập Admin) Dashboard tổng quan.
