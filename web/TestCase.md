# WoodHub — Test Cases (FE ↔ BE Integration)

> Cập nhật: 2026-07-07 — sau khi hoàn thành Portal Quản trị (5 module) + tính năng GPS/Vị trí (4 Pha).
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
| Backend | `cd backend && ./mvnw spring-boot:run` — cần file `backend/.env` đủ 4 secret (DB_PASSWORD, MAIL_PASSWORD, JWT_SECRET, SUPABASE_SERVICE_KEY) + `CORS_ALLOWED_ORIGINS` có đủ origin đang test (`http://localhost:5173`, `http://127.0.0.1:5173`...). **⚠️ Sửa `.env` xong phải restart backend mới nhận config mới.** |
| Frontend | `cd web && npm run dev` — file `web/.env`: `VITE_USE_MOCK=false`, `VITE_API_URL=...` (local hoặc Render, **nhớ có `/api`**), `VITE_GOOGLE_CLIENT_ID`, `VITE_GOONG_MAPTILES_KEY`, `VITE_GOONG_API_KEY` |
| Chế độ mock | Đổi `VITE_USE_MOCK=true` (hoặc xoá) → toàn bộ chạy mock, không cần backend |
| Goong domain restriction | Nếu key Goong có giới hạn domain (Dashboard → Keys → Giới Hạn): phải khai đúng cú pháp `http*://domain/*`. Domain có cổng (vd `localhost:5173`) hay bị từ chối nếu không có dấu chấm — dùng `127.0.0.1:5173` thay `localhost:5173` nếu gặp lỗi "Tên miền không hợp lệ", và nhớ `vite.config.js` phải có `server: { host: true }` thì `127.0.0.1` mới thật sự mở được cổng |
| Tài khoản supplier thật | `xuantinmai1408@gmail.com` (hỏi Tín mật khẩu) — role `supplier`, type `retailer`, hồ sơ "Gỗ xưa" đã active |
| Tài khoản customer thật | Tự đăng ký qua `/register` (cần đọc được email nhận OTP) |
| Tài khoản admin thật | Hỏi người tạo tài khoản `admin@gmai.com` lấy mật khẩu, hoặc tự tạo tài khoản test rồi nhờ ai có quyền DB nâng `role='admin'` |
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
| AUTH-06 | Google login | Bấm nút Google ở `/login` | Cần `VITE_GOOGLE_CLIENT_ID` đúng + origin được phép trong Google Cloud Console |
| AUTH-07 | Quên mật khẩu | `/forgot-password` → nhập email → OTP → `/reset-password` đặt mật khẩu mới | Đăng nhập được bằng mật khẩu mới |
| AUTH-08 | Ép đổi mật khẩu lần đầu | Đăng nhập tài khoản supplier do admin tạo (mustChangePassword=true) | Bị redirect cứng về `/change-password`, không vào được trang khác cho tới khi đổi xong |
| AUTH-09 | Refresh token | Để access token hết hạn (15 phút) rồi thao tác tiếp | Request 401 → FE tự gọi `/auth/refresh` 1 lần → thao tác thành công, KHÔNG bị logout |
| AUTH-10 | Đăng xuất | Bấm Đăng xuất (Header/Portal) | BE thu hồi refresh token; state local xoá; socket chat ngắt; refresh token cũ không dùng lại được |
| AUTH-11 | Backend "ngủ" (Render free-tier) | Không ai gọi backend 15+ phút → thử đăng nhập | Loading lâu hơn bình thường (tối đa ~60s, timeout axios đã tăng) thay vì báo lỗi sai — KHÔNG phải bug |

**Biết trước:** `user.supplierType` trong `authStore` **luôn `undefined`** ở chế độ thật (AuthResponse của BE không có field này) → `redirectPathForRole` sau login luôn đưa supplier vào `/portal/supplier/dashboard`, kể cả workshop. Chưa fix (phát hiện lúc làm GPS, ngoài phạm vi lúc đó).

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

## 4. Module Category / Material (browse) ✅ BE thật (đã verify)

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
| STORE-02 | Tạo chi nhánh + bản đồ | Thêm chi nhánh → điền địa chỉ → bấm "Định vị từ địa chỉ" → kéo ghim tinh chỉnh → Lưu | Goong geocode ra toạ độ gần đúng, ghim tự nhảy tới; kéo ghim cập nhật lại `latitude/longitude` (ẩn, không cho gõ tay); `POST /stores` kèm toạ độ |
| STORE-03 | Không định vị mà lưu (tạo mới) | Bỏ qua bấm "Định vị"/click bản đồ, bấm Lưu ngay | FE chặn submit, báo lỗi tại khối bản đồ — **không** gọi API (data-quality gate của FE, BE không bắt buộc) |
| STORE-04 | Địa chỉ geocode không ra kết quả | Gõ địa chỉ vô nghĩa → "Định vị từ địa chỉ" | Hiện lỗi "Không tìm thấy vị trí..."; vẫn cho **click thẳng lên bản đồ** để đặt ghim thủ công (dự phòng) |
| STORE-05 | Workshop giới hạn 1 chi nhánh | Đăng nhập supplier `type=workshop` đã có 1 chi nhánh → vào trang Chi nhánh | Nút "Thêm chi nhánh" bị disable + tooltip; nếu cố gọi API trực tiếp → BE trả 409 "Xưởng sản xuất chỉ được tạo một địa điểm duy nhất" |
| STORE-06 | Sửa chi nhánh cũ chưa có toạ độ | Sửa 1 chi nhánh tạo trước khi có tính năng GPS (toạ độ null) | **Không bị chặn lưu** — chỉ hiện dòng nhắc "Chưa có vị trí — bổ sung để xuất hiện trong gợi ý gần khách hàng" |
| STORE-07 | Sửa/xoá chi nhánh | Sửa thông tin → Lưu; Xoá chi nhánh | PUT/DELETE `/stores`; xoá chi nhánh xoá luôn tồn kho của nó |
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

**Giới hạn đã biết:**
- Chat từ **trang sản phẩm** (`/product/:id` → nút chat) chưa hoạt động với BE thật vì catalog công khai còn mock (supplierId giả) — chỉ chat từ **hồ sơ NCC** hoặc **gợi ý xưởng gần** (mục 9) là luồng thật.
- Danh sách hội thoại Portal không có preview tin cuối cho tới khi mở thread lần đầu.
- Access token hết hạn giữa phiên → socket không tự reconnect bằng token mới (chỉ ngắt đúng khi bấm Đăng xuất).

## 8. Module Admin — Portal Quản trị ✅ BE thật (đã verify)

Đường dẫn: đăng nhập role `admin` → `/admin/*`

| ID | Luồng | Các bước | Kỳ vọng |
|---|---|---|---|
| ADM-01 | Chặn truy cập sai role | Đăng nhập customer/supplier → gõ tay `/admin/...` | Redirect `/403` (`ProtectedRoute allow={['admin']}`) |
| ADM-02 | Danh mục — cây phân cấp | `/admin/categories` → Thêm danh mục (chọn cha) | `GET /categories/tree` — cây lồng nhau đúng cấp; tạo con hiện đúng vị trí |
| ADM-03 | Xoá danh mục có con | Xoá 1 danh mục đang có con | Con tự về gốc (`parentId=null`), không lỗi, không mất con |
| ADM-04 | Xoá danh mục đang có sản phẩm | Xoá 1 danh mục đang gắn với sản phẩm thật | BE trả 409 (đã fix `GlobalExceptionHandler`) — FE hiện "Không thể xóa danh mục này (có thể đang được sử dụng)" |
| ADM-05 | Vật liệu CRUD | `/admin/materials` → Thêm/sửa/xoá | Trùng tên → 409; xoá vật liệu đang có sản phẩm dùng → **an toàn**, sản phẩm tự về `material=null` |
| ADM-06 | Tạo nhà cung cấp | `/admin/suppliers` → Tạo mới → chọn loại retailer/workshop | `POST /suppliers` — 201; toast báo đã gửi email tài khoản; supplier mới `status=active` ngay |
| ADM-07 | Duyệt/khoá supplier | Vào chi tiết 1 supplier → đổi status sang `suspended` rồi `active` lại | `PUT /suppliers/{id}/status` — đổi `suspended` tự hạ role user về `customer`; đổi lại `active` tự nâng lại `supplier` (đăng nhập lại để thấy) |
| ADM-08 | Danh sách người dùng | `/admin/users` | `GET /users` phân trang thật; **không có ô search** (BE không hỗ trợ, cố tình không tự chế) |
| ADM-09 | Sửa/xoá user | Vào chi tiết 1 user → sửa tên/SĐT → Lưu; Xoá user | PUT/DELETE `/users/{id}`; **không tự xoá được chính mình** (chặn ở FE) |

**Giới hạn đã biết:** không có khoá/mở khoá cho user thường (chỉ supplier có cơ chế `suspended`) — BE chưa có API này, đã ghi backlog.

## 9. Module GPS/Vị trí ✅ code xong — Pha 1+2 đã tự test thật, Pha 3+4 chờ dữ liệu thật

| ID | Luồng | Các bước | Kỳ vọng | Trạng thái test |
|---|---|---|---|---|
| GPS-01 | Supplier đặt vị trí chi nhánh | Xem STORE-02 → STORE-04 ở mục 6 | Bản đồ Goong hiện đúng, geocode + kéo ghim hoạt động | ✅ **Đã tự test thật, chạy đúng** |
| GPS-02 | Workshop giới hạn 1 chi nhánh | Xem STORE-05 | Nút disable đúng lúc | ✅ Đã test (logic FE), BE 409 đã xác nhận ở Pha 1 |
| GPS-03 | Xin quyền vị trí sau login | Đăng nhập bằng tài khoản **customer** | Trình duyệt hiện popup xin vị trí; **Cho phép** → lưu toạ độ; **Từ chối** → lưu, F5/đăng nhập lại **không hỏi lại** | ✅ **Đã tự test thật, chạy đúng** |
| GPS-04 | Gợi ý chi nhánh gần lúc checkout | Customer đã cấp quyền vị trí, giỏ hàng có sản phẩm với `supplierId` là **UUID thật** (không phải sản phẩm mock ở `/shop`) → `/checkout` | Hiện khối "Chọn chi nhánh gần bạn" theo từng supplier trong giỏ, sắp gần→xa, hiện đúng km | 🟡 Chưa test — cần sản phẩm thật trong giỏ (catalog `/shop` vẫn mock, xem mục 10) |
| GPS-05 | Không đủ điều kiện gợi ý (checkout) | Chưa cấp quyền vị trí, HOẶC supplier trong giỏ chưa có chi nhánh nào có toạ độ | Khối gợi ý **ẩn hẳn**, checkout chạy bình thường như cũ | 🟡 Chưa test |
| GPS-06 | Gợi ý xưởng gần — custom order | Customer đã cấp quyền vị trí → hoàn tất 1 thiết kế custom → `/custom/match/:designId` | Khối "Xưởng gần bạn" hiện phía trên kết quả rule-based cũ; 2 nút chuyển chế độ "5 gần nhất" / "Theo bán kính" (5/10/20km) hoạt động độc lập (gọi đúng 2 API khác nhau) | 🟡 Chưa test — cần ≥1 xưởng (`workshop`) có toạ độ thật trong DB |
| GPS-07 | CTA trên kết quả gợi ý xưởng | Trong khối GPS-06, bấm "Xem hồ sơ" / "Nhắn tin" | "Xem hồ sơ" → `/suppliers/{id}` thật; "Nhắn tin" → mở chat thật với xưởng đó (module 7) | 🟡 Chưa test cùng GPS-06 |

**Giới hạn đã biết:**
- Gợi ý chi nhánh/xưởng gần **chỉ hiển thị + cho chọn**, KHÔNG đấu nối vào tính phí ship thật (checkout vẫn dùng phí giả định cố định theo ngưỡng subtotal).
- Cả 3 API gợi ý vị trí đều **yêu cầu đăng nhập** — không hoạt động cho khách vãng lai (guest).
- `NearbyStoreResponse` không trả toạ độ → danh sách gợi ý KHÔNG có bản đồ ghim, chỉ list + số km.
- Goong Geocoding/Reverse geocoding — code viết theo tài liệu Goong, **chưa verify được response shape 100% qua tự động hoá** (chỉ verify được lúc bạn tự test thật ở Pha 1) do không có quyền truy cập trình duyệt thật.
- Vite dev server cần `server: { host: true }` (đã thêm) để `127.0.0.1` hoạt động — nếu Goong domain restriction dùng `localhost:5173` mà không qua được validation, đổi sang `127.0.0.1:5173` ở cả Goong Dashboard lẫn thanh địa chỉ trình duyệt.

---

## 10. Các luồng CÒN MOCK 🟡 (UI đầy đủ, dữ liệu giả — test UI được, chưa test BE)

| Khu vực | Trang/tính năng | Ghi chú |
|---|---|---|
| **Catalog công khai** | `/shop`, `/product/:id`, sản phẩm nổi bật ở Landing | Dữ liệu từ `PRODUCTS` mock (`supplierId` giả `sup_01`...). **Việc dở quan trọng nhất** — BE Product đã sẵn, chỉ chưa nối trang công khai; đây cũng là lý do GPS-04/GPS-06 chưa test được end-to-end |
| **Giỏ hàng → Đặt hàng** | `/cart`, `/checkout`, `/orders`, `/orders/:id` | Cart ở localStorage (đã thêm `supplierId/supplierName` cho tính năng GPS); order mock. BE chưa có OrderController |
| **Custom 3D** | `/custom/*` (chọn mẫu, configurator, upload ảnh→3D Meshy) | Meshy chưa proxy qua BE; configurator là khối hộp demo |
| **Ghép xưởng** | `/custom/match/:designId` | Matching rule-based (theo năng lực) vẫn mock; riêng khối "Xưởng gần bạn" (GPS-06) đã là BE thật |
| **AI Chatbot** | Widget nổi góc phải | Rule-based advisor cục bộ, chưa có service AI thật |
| **Portal NCC — các trang phụ** | Dashboard, Đơn hàng, Đánh giá, Hồ sơ, Báo cáo, Cài đặt (`/portal/supplier/*`) | Dùng data tĩnh `manufacturerData.js`. BE chưa có API đơn hàng/dashboard cho supplier |
| **Portal Xưởng mộc** | Toàn bộ `/portal/workshop/*` | Data tĩnh `workshopPortalData.js` |
| **Portal — hồ sơ tự quản lý** | Sửa hồ sơ NCC, portfolio CRUD từ Portal | BE có sẵn `PUT /suppliers/me` + portfolio CRUD nhưng FE chưa nối (đã hoãn từ Module 3) |
| **B2B báo giá** | `/b2b` | Trang giới thiệu tĩnh; luồng báo giá (`quote_requests`) chưa code — đây cũng là lý do CTA ở GPS-07 dùng "Nhắn tin" thay vì "Yêu cầu báo giá" |
| **Trang tĩnh** | Contact form submit, Pricing plans | Mock |

## 11. Chưa xử lý 🔵 (chưa có code)

- Đổi tên `manufacturer` → `retailer` toàn FE (route/biến/mock file) — đã chốt hướng từ Pha 0 module Supplier, chưa thực hiện.
- Khoá/mở khoá tài khoản `customer` thường (chỉ supplier có `suspended`) — chờ BE bổ sung API.
- Tính phí ship thật theo khoảng cách (hiện GPS chỉ gợi ý chọn chi nhánh, không tính lại tiền).
- `quote_requests` (yêu cầu báo giá nhắm đúng 1 xưởng/supplier) — luồng B2B + custom đều đang tạm thay bằng chat trực tiếp.
- Fix `user.supplierType` luôn `undefined` sau login thật (ảnh hưởng redirect workshop, xem ghi chú mục 1).
- Socket chat tự reconnect với token mới sau refresh.
- Upload file đính kèm trong chat (BE nhận `attachmentUrl` nhưng FE chưa có UI chọn file).

---

## 12. Test cross-cutting (mọi chế độ)

| ID | Luồng | Kỳ vọng |
|---|---|---|
| X-01 | Route guard | Chưa đăng nhập vào `/profile`, `/portal/...`, `/admin/...` → đá về `/login`; sai role → `/403`; supplier bấm "Khu vực của tôi" trên Header → vào đúng portal theo loại |
| X-02 | Redirect portal cũ | Vào `/portal` (link cũ) → tự chuyển `/portal/supplier/dashboard`; vào `/admin` → tự chuyển `/admin/users` |
| X-03 | Dark mode + i18n | Đổi theme/ngôn ngữ VI↔EN ở Header → toàn trang đổi theo, F5 vẫn giữ |
| X-04 | Trang trắng sockjs | Mở bất kỳ trang nào — không còn lỗi console `global is not defined` (đã fix trong `vite.config.js`) |
| X-05 | Mock ↔ Real switch | Đổi `VITE_USE_MOCK` rồi restart dev server → app chạy được cả 2 chế độ, không sửa code |
| X-06 | CORS đa domain | App chạy được từ cả `localhost:5173`, `127.0.0.1:5173` lẫn domain Vercel — cần `CORS_ALLOWED_ORIGINS` (BE) liệt kê đủ |

---

## Phụ lục — Lịch sử dọn dẹp / thay đổi hạ tầng

**2026-07-03 — dọn code thừa (portal cũ, orphan files):**
- Xoá `pages/portal/` (portal cũ) + route `/portal` cũ trong `App.jsx` (thay bằng redirect)
- Xoá `components/layout/PortalLayout.jsx`, `hooks/useSupplier.js`, `api/mock/supplierData.js`
- Xoá `components/suppliers/SupplierCapabilities.jsx` (mồ côi từ Module 3)
- Xoá section "SUPPLIER PORTAL (B.6)" trong `api/client.js` + mock tương ứng
- Sửa link Header: supplier trỏ đúng portal theo subtype thay vì `/portal` chết

**2026-07-05..07 — Admin Portal + GPS/Vị trí:**
- Thêm `vite.config.js`: `define.global` (fix sockjs-client "global is not defined"), `server.host: true` (fix `127.0.0.1` không mở được cổng dù cùng máy với `localhost`)
- Thêm `ModalShell.jsx` dùng chung cho Admin (KHÔNG refactor `ProductFormModal`/`StoreFormModal` cũ — theo yêu cầu giữ nguyên)
- `GlobalExceptionHandler` (BE) thêm handler `DataIntegrityViolationException → 409`
- `docs/API_CONTRACT.md` thêm mục 0 — quy ước tên field toạ độ (3 ngữ cảnh khác nhau: `coords.latitude/longitude` browser, `latitude/longitude` body, `lat/lng` query param)
