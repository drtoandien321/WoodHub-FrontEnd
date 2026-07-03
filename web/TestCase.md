# WoodHub — Test Cases (FE ↔ BE Integration)

> Cập nhật: 2026-07-03 — sau khi hoàn thành 7 module tích hợp backend + dọn code thừa.
>
> **Cách đọc trạng thái:**
> | Nhãn | Ý nghĩa |
> |---|---|
> | ✅ **BE thật** | Đã nối backend Spring Boot thật, **đã verify bằng curl/script** với DB thật |
> | 🟡 **Mock** | UI chạy đầy đủ nhưng dữ liệu giả (mockAdapter / data tĩnh) — BE chưa nối hoặc chưa có |
> | 🔵 **Chưa xử lý** | Chưa code hoặc mới có định hướng |

---

## 0. Chuẩn bị môi trường test

| Bước | Nội dung |
|---|---|
| Backend | `cd backend && ./mvnw spring-boot:run` — cần file `backend/.env` đủ 4 secret (DB_PASSWORD, MAIL_PASSWORD, JWT_SECRET, SUPABASE_SERVICE_KEY). **⚠️ Sửa `.env` xong phải restart backend mới nhận config mới.** |
| Frontend | `cd web && npm run dev` — file `web/.env`: `VITE_USE_MOCK=false`, `VITE_API_URL=http://localhost:8081/api` |
| Chế độ mock | Đổi `VITE_USE_MOCK=true` (hoặc xoá) → toàn bộ chạy mock, không cần backend |
| Tài khoản supplier thật | `xuantinmai1408@gmail.com` (hỏi Tín mật khẩu) — role `supplier`, type `retailer`, hồ sơ "Gỗ xưa" đã active |
| Tài khoản customer thật | Tự đăng ký qua `/register` (cần đọc được email nhận OTP) |
| Tài khoản mock (khi VITE_USE_MOCK=true) | `supplier@woodhub.vn` / `ncc@woodhub.vn` (NCC), `xuong@woodhub.vn` (xưởng), `admin@woodhub.vn`, `newsupplier@woodhub.vn` (demo ép đổi mật khẩu) — mật khẩu bất kỳ |

---

## 1. Module Auth ✅ BE thật (đã verify)

| ID | Luồng | Các bước | Kỳ vọng |
|---|---|---|---|
| AUTH-01 | Đăng ký + OTP | `/register` → điền form → submit → nhập OTP từ email tại `/verify-otp` | Đăng ký trả message; verify xong tự đăng nhập (có token) và về trang chủ |
| AUTH-02 | Đăng ký business | Chọn loại "Doanh nghiệp" → hiện thêm 3 field (tên công ty, MST, địa chỉ) | BE lưu customerType=business + business profile |
| AUTH-03 | Gửi lại OTP | Ở `/verify-otp` bấm "Gửi lại" | Có message; bấm liên tục trong 60s bị BE chặn (hiện lỗi) |
| AUTH-04 | Đăng nhập đúng | `/login` với tài khoản đã verify | Vào đúng trang theo role: customer → trang trước đó/chủ; supplier → `/portal/supplier/dashboard`; admin → `/admin` |
| AUTH-05 | Đăng nhập sai | Sai mật khẩu / email chưa verify | Hiện lỗi rõ ràng; email chưa verify → chuyển sang màn OTP |
| AUTH-06 | Google login | Bấm nút Google ở `/login` | Cần `VITE_GOOGLE_CLIENT_ID` đúng + origin được phép. ⚠️ Trên Render từng lỗi CORS config (env dashboard) — local OK |
| AUTH-07 | Quên mật khẩu | `/forgot-password` → nhập email → OTP → `/reset-password` đặt mật khẩu mới | Đăng nhập được bằng mật khẩu mới |
| AUTH-08 | Ép đổi mật khẩu lần đầu | Đăng nhập tài khoản supplier do admin tạo (mustChangePassword=true) | Bị redirect cứng về `/change-password`, không vào được trang khác cho tới khi đổi xong |
| AUTH-09 | Refresh token | Để access token hết hạn (15 phút) rồi thao tác tiếp | Request 401 → FE tự gọi `/auth/refresh` 1 lần → thao tác thành công, KHÔNG bị logout |
| AUTH-10 | Đăng xuất | Bấm Đăng xuất (Header/Portal) | BE thu hồi refresh token; state local xoá; socket chat ngắt; refresh token cũ không dùng lại được |

## 2. Module User / Profile ✅ BE thật (đã verify)

| ID | Luồng | Các bước | Kỳ vọng |
|---|---|---|---|
| USER-01 | Xem hồ sơ | Đăng nhập → `/profile` | Hiện đúng fullName/email/phone/role/customerType từ `GET /users/me` |
| USER-02 | Sửa hồ sơ | Sửa tên + SĐT → Lưu | Lưu thành công; tên trên Header cập nhật ngay; **email không sửa được** (BE không cho) |
| USER-03 | Đổi mật khẩu tự nguyện | `/profile` → khối đổi mật khẩu → nhập mật khẩu cũ + mới | Sai mật khẩu cũ → lỗi; đúng → đổi thành công, đăng nhập lại bằng mật khẩu mới |

## 3. Module Supplier (browse công khai) ✅ BE thật (đã verify)

| ID | Luồng | Các bước | Kỳ vọng |
|---|---|---|---|
| SUP-01 | Danh sách NCC | `/suppliers` (không cần đăng nhập) | Hiện supplier `active` từ `GET /suppliers/public`; lọc theo loại (retailer/workshop) hoạt động |
| SUP-02 | Hồ sơ NCC | Bấm 1 supplier → `/suppliers/{uuid}` | Hiện businessName, mô tả, liên hệ; **URL là UUID, không phải slug** |
| SUP-03 | Chi nhánh công khai | Xem section "Chi nhánh" trong hồ sơ | Chỉ hiện **Quận + Thành phố** (không lộ địa chỉ chi tiết) — từ `GET /suppliers/{id}/stores` |
| SUP-04 | Portfolio + Reviews | Xem section portfolio, đánh giá | Từ `GET /suppliers/{id}/portfolio` và `GET /reviews?targetType=supplier` + summary (điểm TB, số lượng) |
| SUP-05 | Supplier không tồn tại | Gõ tay UUID sai | Trang báo "không tìm thấy", không crash |

## 4. Module Category / Material ✅ BE thật (đã verify)

| ID | Luồng | Các bước | Kỳ vọng |
|---|---|---|---|
| CAT-01 | Dropdown danh mục/chất liệu | Portal → Thêm sản phẩm → mở 2 dropdown | Load từ `GET /categories` + `GET /materials` thật (UUID id), không phải list cứng |

## 5. Module Product — Portal Nhà cung cấp ✅ BE thật (đã verify)

Đường dẫn: đăng nhập supplier → `/portal/supplier/products`

| ID | Luồng | Các bước | Kỳ vọng |
|---|---|---|---|
| PROD-01 | Danh sách SP của tôi | Mở trang Products | `GET /products/mine` — thấy đủ mọi trạng thái (draft/active/hidden), có ảnh đại diện + "Giá từ" |
| PROD-02 | Tạo SP + biến thể | Thêm sản phẩm → điền tên/danh mục/chất liệu + ≥1 dòng biến thể (SKU/màu/kích thước/giá) → Lưu | 1 request `POST /products` kèm variants; SP mới hiện trong danh sách |
| PROD-03 | Upload ảnh | Trong form (tạo mới: chọn trước, upload sau khi lưu; sửa: upload ngay) | Ảnh lên Supabase Storage; **ảnh đầu tiên tự thành ảnh chính**; nhiều ảnh upload TUẦN TỰ, sortOrder tự nối đuôi |
| PROD-04 | Đổi ảnh chính | Sửa SP → hover ảnh → bấm sao | 1 lệnh PATCH duy nhất; ảnh chính cũ TỰ bỏ (BE lo, FE không gọi 2 lần) |
| PROD-05 | Xoá ảnh | Hover ảnh → thùng rác | Ảnh biến mất, danh sách + trang chi tiết cập nhật |
| PROD-06 | Sửa SP + diff biến thể | Sửa tên/mô tả; thêm dòng biến thể mới; xoá 1 dòng cũ | PUT thông tin; biến thể: có id → PUT, mới → POST, bỏ → DELETE |
| PROD-07 | Ẩn/hiện/xoá SP | Trang chi tiết SP → nút Ẩn / Bỏ ẩn / Xoá | PATCH status; DELETE xoá kèm variants + ảnh; xoá xong về danh sách |
| PROD-08 | Upload file không phải ảnh | Chọn file .txt/.pdf | BE trả 400 "Định dạng ảnh không hợp lệ" — FE không crash |

## 6. Module Store + Inventory — Chi nhánh & Tồn kho ✅ BE thật (đã verify)

Đường dẫn: `/portal/supplier/branches`

| ID | Luồng | Các bước | Kỳ vọng |
|---|---|---|---|
| STORE-01 | Danh sách chi nhánh | Mở trang Chi nhánh | `GET /stores` — chỉ chi nhánh của supplier đang đăng nhập |
| STORE-02 | Tạo/sửa/xoá chi nhánh | Thêm chi nhánh (địa chỉ bắt buộc; phường/quận/thành phố/SĐT tuỳ chọn) → sửa → xoá | POST/PUT/DELETE `/stores`; xoá chi nhánh xoá luôn tồn kho của nó |
| INV-01 | Thêm biến thể vào kho | Chi tiết chi nhánh → "Thêm biến thể" → chọn Sản phẩm → chọn Biến thể → nhập tồn ban đầu | `POST /stores/{id}/inventory/{variantId}`; dòng mới hiện trong bảng kèm SKU/màu/giá (join từ variant) |
| INV-02 | Thêm trùng biến thể | Thêm lại biến thể đã có trong kho chi nhánh này | BE trả **409** — FE hiện đúng message "hãy điều chỉnh tồn kho thay vì thêm mới" |
| INV-03 | Điều chỉnh tồn (delta) | Nhập `+5` hoặc `-3` vào ô Điều chỉnh → Áp dụng | PATCH theo **delta** (không gửi số tuyệt đối); tồn kho cập nhật |
| INV-04 | Xuất quá tồn | Nhập delta âm lớn hơn tồn hiện tại | BE trả **400** "Tồn kho không đủ để xuất; tồn hiện tại là X" — FE alert, số không đổi |
| INV-05 | Xoá khỏi kho | Bấm thùng rác trên dòng tồn kho | DELETE → dòng biến mất |

## 7. Module Chat realtime ✅ BE thật (đã verify STOMP round-trip 2 chiều)

| ID | Luồng | Các bước | Kỳ vọng |
|---|---|---|---|
| CHAT-01 | Khách mở chat với NCC | Đăng nhập customer → `/suppliers/{id}` → "Liên hệ" | `POST /conversations` (idempotent — mở lại vẫn đúng 1 hội thoại); lịch sử cũ load lại đủ (`GET messages`) |
| CHAT-02 | Gửi/nhận realtime | 2 trình duyệt: customer (ChatDrawer) + supplier (hộp thư Portal) cùng online → nhắn qua lại | Tin qua STOMP `/ws`, hiện **ngay** ở cả 2 phía không cần F5; tin của mình bên phải, đối phương bên trái |
| CHAT-03 | Hộp thư Portal | Đăng nhập supplier → bấm "Chat với khách hàng" trên topbar Portal | `GET /conversations?role=supplier` — danh sách khách; badge số tin chưa đọc; mở thread load lịch sử + đánh dấu đã đọc |
| CHAT-04 | Trạng thái online | Supplier đang mở web (socket sống) → customer xem | Presence từ `GET /users/{supplierUserId}/presence`; đóng tab → offline + lastSeenAt |
| CHAT-05 | Fallback REST | Chặn WebSocket (DevTools → block `/ws`) rồi gửi tin | Tin vẫn gửi được qua `POST /conversations/{id}/messages` |
| CHAT-06 | Tự nhắn chính mình | Supplier mở hồ sơ công khai của chính mình → Liên hệ | BE trả 400 "Không thể tự nhắn tin với chính cửa hàng của bạn" |

**Giới hạn đã biết (không phải bug, cần biết khi test):**
- Chat từ **trang sản phẩm** (`/product/:id` → nút chat) chưa hoạt động với BE thật vì catalog công khai còn mock (supplierId giả) — chỉ chat từ **hồ sơ NCC** là luồng thật.
- Danh sách hội thoại Portal không có preview tin cuối cho tới khi mở thread lần đầu (BE không trả nội dung tin cuối).
- Access token hết hạn giữa phiên → socket không tự reconnect bằng token mới (chỉ ngắt đúng khi bấm Đăng xuất).

---

## 8. Các luồng CÒN MOCK 🟡 (UI đầy đủ, dữ liệu giả — test UI được, chưa test BE)

| Khu vực | Trang/tính năng | Ghi chú |
|---|---|---|
| **Catalog công khai** | `/shop`, `/product/:id`, sản phẩm nổi bật ở Landing | Dữ liệu từ `PRODUCTS` mock. **Việc dở quan trọng nhất** — BE Product đã sẵn, chỉ chưa nối trang công khai (shape UI cũ 1 giá/1 ảnh ≠ shape variant thật) |
| **Giỏ hàng → Đặt hàng** | `/cart`, `/checkout`, `/orders`, `/orders/:id` | Cart ở localStorage; order mock. BE chưa có OrderController |
| **Custom 3D** | `/custom/*` (chọn mẫu, configurator, upload ảnh→3D Meshy) | Meshy chưa proxy qua BE; configurator là khối hộp demo |
| **Ghép xưởng** | `/custom/match/:designId` | Matching rule-based chạy trong mockAdapter |
| **AI Chatbot** | Widget nổi góc phải | Rule-based advisor cục bộ, chưa có service AI thật |
| **Portal NCC — các trang phụ** | Dashboard, Đơn hàng, Đánh giá, Hồ sơ, Báo cáo, Cài đặt (`/portal/supplier/*`) | Dùng data tĩnh `manufacturerData.js`. BE chưa có API đơn hàng/dashboard cho supplier |
| **Portal Xưởng mộc** | Toàn bộ `/portal/workshop/*` | Data tĩnh `workshopPortalData.js` |
| **Portal — hồ sơ tự quản lý** | Sửa hồ sơ NCC, portfolio CRUD từ Portal | BE có sẵn `PUT /suppliers/me` + portfolio CRUD nhưng FE chưa nối (đã hoãn từ Module 3) |
| **B2B báo giá** | `/b2b` | Trang giới thiệu tĩnh; luồng báo giá chưa code |
| **Admin** | `/admin` | Placeholder "đang phát triển" |
| **Trang tĩnh** | Contact form submit, Pricing plans | Mock |

## 9. Chưa xử lý 🔵 (chưa có code)

- Đổi tên `manufacturer` → `retailer` toàn FE (route/biến/mock file) — đã chốt hướng từ Pha 0, chưa thực hiện.
- Phí ship + định vị (khoảng cách khách ↔ chi nhánh).
- Xuất hoá đơn VAT cho B2B.
- Socket tự reconnect với token mới sau refresh.
- Upload file đính kèm trong chat (BE nhận `attachmentUrl` nhưng FE chưa có UI chọn file).

---

## 10. Test cross-cutting (mọi chế độ)

| ID | Luồng | Kỳ vọng |
|---|---|---|
| X-01 | Route guard | Chưa đăng nhập vào `/profile`, `/portal/...` → đá về `/login`; customer vào `/portal` → `/403`; supplier bấm "Khu vực của tôi" trên Header → vào đúng portal theo loại |
| X-02 | Redirect portal cũ | Vào `/portal` (link cũ) → tự chuyển `/portal/supplier/dashboard` (portal cũ đã xoá) |
| X-03 | Dark mode + i18n | Đổi theme/ngôn ngữ VI↔EN ở Header → toàn trang đổi theo, F5 vẫn giữ |
| X-04 | Trang trắng sockjs | Mở bất kỳ trang nào — không còn lỗi console `global is not defined` (đã fix trong `vite.config.js`) |
| X-05 | Mock ↔ Real switch | Đổi `VITE_USE_MOCK` rồi restart dev server → app chạy được cả 2 chế độ, không sửa code |

---

## Phụ lục — Code đã dọn (2026-07-03)

Đã xoá (code chết, không ai dùng sau khi có 2 portal mới):
- `pages/portal/` (PortalDashboard/Store/Products/Orders — portal cũ) + route `/portal` cũ trong `App.jsx` (thay bằng redirect)
- `components/layout/PortalLayout.jsx`, `hooks/useSupplier.js`, `api/mock/supplierData.js`
- `components/suppliers/SupplierCapabilities.jsx` (mồ côi từ Module 3)
- Section "SUPPLIER PORTAL (B.6)" trong `api/client.js` + mock tương ứng trong `mockAdapter.js`
- Sửa link Header: supplier giờ trỏ đúng portal theo subtype thay vì `/portal` chết
