# CLAUDE.md — WoodHub (bản lề nghiệp vụ — ĐỌC TRƯỚC KHI CODE)

> Mục tiêu của file này: bất kỳ ai (dev hoặc AI agent) **đọc xong là hiểu** WoodHub có những
> trang gì, role gì, luồng nghiệp vụ ra sao, cái gì đã có / đang mock / còn định hướng — để
> làm **FE, BE và Database** đúng hướng ngay từ đầu.
>
> Đây là **BẢN LỀ** (tóm tắt + điều hướng), KHÔNG chép lại chi tiết. Nguồn chi tiết:
>
> - **Contract FE↔BE (shape API — nguồn sự thật):** [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md)
> - **Kế hoạch FE/BE/AI:** `../../Idea/files/WoodHub_FE_Plan.md`, `WoodHub_BE_Plan.md`, `WoodHub_AI_Plan.md`
> - **Quy ước dev cá nhân (profile + stack + style):** `../../CLAUDE.md`
> - **Trạng thái tích hợp + cách chạy:** [`README.md`](README.md)
>
> ⚠️ Khi thêm/sửa endpoint: cập nhật `API_CONTRACT.md` TRƯỚC, rồi mới code. FE đang mock-first
> (xem mục 7) nên BE chỉ cần trả đúng shape là FE chạy, không phải sửa UI.

---

---

Hãy đóng vai là 1 Senior Frontend Developer, tiếng Việt giao tiếp, đã có kinh nghiệm 5 năm, đã được training về dự án, hãy dựa vào đây để trả lời các câu hỏi về frontend và UI/UX
Codex sẽ là AI xem và duyệt lại code của bạn

## 0. Quy ước trạng thái (dùng xuyên suốt file)

| Nhãn              | Ý nghĩa                                                                       |
| ----------------- | ----------------------------------------------------------------------------- |
| ✅ **Đã có**      | FE chạy thật (qua mock hoặc BE), dùng được ngay                               |
| 🟡 **Mock**       | FE đã dựng UI + luồng, nhưng dữ liệu giả ở `mockAdapter`, BE chưa có          |
| 🔵 **Định hướng** | Đã chốt hướng nhưng **chưa code** (V1/V2) — phần này cần BE/DB chuẩn bị trước |

---

## 1. WoodHub là gì

Sàn nội thất gỗ hợp nhất **B2C · B2B · Custom**, kết nối khách hàng với **xưởng mộc** và
**nhà cung cấp**. Điểm khác biệt: **AI tư vấn**, **xem 3D/AR tại nhà**, **đặt thiết kế custom**
và **ghép xưởng** tự động.

Monorepo: `web/` (React 19 + Vite — app chính), `mobile/` (Expo, scaffold), `backend/` (Spring
Boot + PostgreSQL/Supabase — repo riêng). DB host trên Supabase, ảnh/model 3D ở Supabase Storage.

---

## 2. Roles & loại tài khoản

Hệ thống có 3 role kỹ thuật (`customer | supplier | admin`), trong đó **customer** và **supplier**
mỗi loại chia 2 **subtype** về nghiệp vụ:

| Role       | Subtype                                                     | Mô tả                                                                                            | Làm được gì                                                         |
| ---------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `customer` | **individual** (cá nhân)                                    | Khách B2C thường                                                                                 | Mua sẵn, đặt custom, chat xưởng                                     |
| `customer` | **business** (B2B)                                          | Doanh nghiệp — có **mã số thuế, địa chỉ, tên công ty**                                           | Mua sẵn + **yêu cầu báo giá số lượng lớn**, xuất hóa đơn VAT        |
| `supplier` | **workshop** (xưởng mộc)                                    | **Không có catalog cố định** — chỉ **nhận custom** hoặc nhận đặt làm theo spec (ảnh/thông số rõ) | Nhận đơn custom, báo giá, chat với khách. Hiện ở trang `/suppliers` |
| `supplier` | **manufacturer** (nhà cung cấp/brand: Nhà Xinh, Dũng Phát…) | **Có catalog** sản phẩm rõ thông số/hình ảnh, **KHÔNG nhận custom**                              | Bán sản phẩm sẵn trên `/shop`, báo giá ship cho B2B                 |
| `admin`    | —                                                           | Quản trị sàn                                                                                     | Duyệt supplier, quản lý hệ thống                                    |

> **Trong code hiện tại:** role = `customer | supplier | admin` (xem `authStore`, `mockAdapter`
> `TEST_ACCOUNTS`). Subtype (individual/business, workshop/manufacturer) **chưa tách rõ ở DB** —
> đây là việc BE/DB cần mô hình hóa (xem mục 6). Dữ liệu mock đã ngầm có 2 loại supplier:
> `WORKSHOPS` (xưởng) và `PRODUCTS.supplierId` (nhà cung cấp có catalog).

**Nhà cung cấp (manufacturer) có thể có NHIỀU CHI NHÁNH** 🔵 — mỗi chi nhánh ở một quận. Hệ quả:

- **Giỏ hàng / sản phẩm:** hiển thị rõ sản phẩm thuộc **chi nhánh quận nào**.
- **Hồ sơ nhà cung cấp:** liệt kê chi nhánh **chỉ theo Quận + Thành phố** (KHÔNG hiện địa chỉ đường chi tiết).

Tài khoản test (mock): `supplier@woodhub.vn` → supplier, `admin@woodhub.vn` → admin, còn lại → customer.

---

## 3. Bản đồ trang (sitemap) theo route + trạng thái

Routes thật trong `web/src/App.jsx`.

### Công khai (SiteLayout: header + footer)

| Route                            | Trang             | Mục đích                                                                                      | Trạng thái                   |
| -------------------------------- | ----------------- | --------------------------------------------------------------------------------------------- | ---------------------------- |
| `/`                              | Landing           | Hero, giới thiệu 3 luồng dùng                                                                 | ✅                           |
| `/shop`, `/shop/:category`       | Shop              | Catalog sản phẩm sẵn (của manufacturer)                                                       | 🟡 (mock catalog)            |
| `/product/:id`                   | ProductDetail     | Chi tiết sản phẩm                                                                             | 🟡                           |
| `/cart`                          | Cart              | Giỏ hàng — SP custom **click xem ảnh/thông số chi tiết**; SP nhiều chi nhánh hiện rõ **quận** | 🟡🔵                         |
| `/custom`                        | CustomSelect      | Điểm vào **luồng Custom duy nhất** (chọn mẫu 3D / upload ảnh)                                 | ✅                           |
| `/custom/models`                 | CustomModels      | Gallery mẫu 3D + **upload ảnh 2D → dựng 3D (Meshy)**                                          | 🟡 (mock Meshy)              |
| `/custom/models/:slug`           | CustomModelViewer | Xem 3D + **AR mobile-web** + chỉnh vật liệu/màu/kích thước → giá+thời gian                    | 🟡                           |
| `/custom/configure/:type`        | CustomConfigure   | Trình chỉnh 3D **mock** (khối hộp "parametric") — bản tạm, **sẽ hợp nhất vào luồng Meshy**    | 🟡                           |
| `/suppliers`                     | Suppliers         | Danh sách **xưởng** (lọc, tìm)                                                                | 🟡                           |
| `/suppliers/:slug`               | SupplierProfile   | Hồ sơ xưởng (năng lực, portfolio, review, liên hệ)                                            | 🟡                           |
| `/b2b`                           | B2b               | Trang giới thiệu B2B                                                                          | ✅ (tĩnh) · luồng báo giá 🔵 |
| `/about`, `/pricing`, `/contact` | —                 | Giới thiệu / Bảng giá / Liên hệ                                                               | ✅ (contact submit 🟡)       |

### Xác thực (AuthLayout riêng, không header/footer)

| Route                 | Mục đích            | Trạng thái              |
| --------------------- | ------------------- | ----------------------- |
| `/login`, `/register` | Đăng nhập / đăng ký | ✅ (gắn BE thật)        |
| `/verify-otp`         | Xác thực OTP email  | ✅ (register→OTP→token) |

### Cần đăng nhập (customer)

| Route                     | Mục đích                                   | Trạng thái           |
| ------------------------- | ------------------------------------------ | -------------------- |
| `/checkout`               | Thanh toán                                 | 🟡                   |
| `/profile`                | Hồ sơ cá nhân                              | 🟡                   |
| `/orders`, `/orders/:id`  | Đơn hàng + chi tiết                        | 🟡                   |
| `/custom/match/:designId` | **Ghép xưởng** phù hợp với thiết kế custom | 🟡 (rule-based mock) |

### Supplier Portal (`/portal`, role `supplier`)

**Dashboard** · Store · Products · Orders — **cả xưởng mộc lẫn nhà cung cấp** đều có, quản lý
gian hàng/sản phẩm/đơn + trả lời chat. 🟡 (mock)

### Admin (`/admin`, role `admin`)

AdminDashboard — 🟡 ("đang phát triển").

### Xuyên suốt

AI Chatbot widget (nổi góc phải) 🟡 · i18n VI/EN ✅ · Dark mode ✅ · Giỏ hàng ✅.

---

## 4. Luồng nghiệp vụ chính

1. **B2C mua sẵn** ✅🟡: Shop → ProductDetail → Cart → Checkout → Orders. Sản phẩm thuộc
   supplier loại _manufacturer_ (có thể nhiều chi nhánh — giỏ hàng hiện rõ quận).
2. **Custom design — MỘT luồng duy nhất** 🟡🔵: `/custom` → khách **chọn mẫu 3D có sẵn** _hoặc_
   **upload ảnh 2D** → **Meshy** chuyển ảnh 2D → mô hình 3D → khách **chỉnh màu / chất liệu /
   kích thước** → ra **giá + thời gian ước tính** → gửi yêu cầu / ghép xưởng.
   > ⚠️ **Không tách 2 loại custom.** _Hiện tại đang là MOCK:_ trình chỉnh 3D dựng từ khối hộp
   > (`/custom/configure/:type`, gọi là "parametric") + thư viện mẫu giả lập — chỉ để demo việc
   > chỉnh 3D + ra giá. **Sẽ thay/hợp nhất bằng Meshy** khi tích hợp (xem memory `meshyai-3d-direction`).
3. **Ghép xưởng + chat báo giá custom (kiểu Shopee)** 🟡🔵: từ thiết kế custom → ghép xưởng phù
   hợp → khách **chat trực tiếp với xưởng**. Khung chat **tự đính các sản phẩm khách đã custom
   3D**, hoặc khách **thêm ảnh 2D + ghi thông số chi tiết** gửi xưởng để chốt **giá + thời gian
   giao**. **Lịch sử chat lưu ở remote DB** → tắt chat/đóng web vẫn còn.
4. **B2B báo giá số lượng lớn** 🔵: doanh nghiệp gửi yêu cầu (sản phẩm/spec + số lượng) → nhiều
   nhà cung cấp báo giá (giá + **phí ship + thời gian giao**) → so sánh → chốt → xuất VAT. Cũng
   qua kênh chat trực tiếp như mục 3.
5. **Supplier Portal + Dashboard** 🟡🔵: **cả xưởng mộc lẫn nhà cung cấp** đều có **Dashboard** +
   quản lý store, sản phẩm, đơn, cập nhật trạng thái, trả lời chat.
6. **AI Chatbot** 🟡🔵: tư vấn/tìm sản phẩm (grounding theo catalog) + **lưu lịch sử trò chuyện** +
   **theo dõi đơn hàng** giúp khách. (Service Python/Gemini riêng — xem `WoodHub_AI_Plan.md`.)
7. **Định vị & phí ship** 🔵: lấy vị trí khách ↔ **chi nhánh** xưởng/nhà cung cấp để tính **khoảng
   cách → phí ship + thời gian giao ước tính** (áp cho cả custom lẫn B2B).

---

## 5. Phạm vi ưu tiên cho BE + DB

Tất cả mảng dưới đây **đều trong tầm ngắm** (theo chốt của chủ dự án). Thứ tự gợi ý theo critical path:

1. **MVP lõi (làm BE+DB thật trước):** Auth/User (+ subtype) → Catalog (products/category/material)
   → Cart/Orders/Checkout.
2. **Custom + Matching:** CustomDesign → Workshops + capability → WorkshopMatch/QuoteRequest.
3. **Supplier Portal + B2B:** Supplier store/products/orders → B2B QuoteRequest.
4. **Realtime/AI (V1):** Chat trực tiếp khách↔supplier; Chatbot (history + order tracking);
   Định vị + phí ship.
5. **Nâng cao (V1–V2):** AI 3D Meshy (BE **proxy** giữ key) + AR `.usdz`.

> Mục "Để dành V1" trong `API_CONTRACT.md` (mục 6) liệt kê endpoint FE chưa gọi — đừng làm vội.

---

## 6. Data model / Entities gợi ý (cho BE + DB)

Suy ra từ UI hiện tại + `API_CONTRACT.md` + mock data + định hướng ở mục 4. Tên cột để BE chốt
(DB `snake_case`, JSON `camelCase`). 🟡/🔵 = chưa có ở mock, cần thiết kế mới.

### Người dùng & supplier

- **users**: `id, full_name, email(unique), password_hash, role(customer|supplier|admin),
customer_type(individual|business) 🔵, email_verified, created_at`. OTP xem bảng riêng.
- **business_profiles** 🔵 (1–1 với user business): `user_id, company_name, tax_code, address, …`.
- **user_locations** 🔵 (cho phí ship): `user_id, label, address, lat, lng, is_default`.
- **suppliers**: `id, user_id(owner), name, supplier_type(workshop|manufacturer) 🔵, verified,
rating, district, lat, lng 🔵, description, experience_years, response_time, …`.
  - workshop thêm **capability**: `types[](table/chair/cabinet/shelf/bed), max_width_cm,
materials[]` (đang ở `WORKSHOPS.capability`).
  - manufacturer: gắn với **products** (catalog).
- **supplier_branches** 🔵 (manufacturer nhiều chi nhánh): `id, supplier_id, district, city,
lat, lng, is_primary`. **Chỉ hiển thị Quận + Thành phố** (không lộ địa chỉ đường). Dùng cho
  giỏ hàng (hiện quận của SP) + tính phí ship theo chi nhánh gần nhất.
- **supplier_reviews** 🟡→: `id, supplier_id, author_name, rating, content, created_at`.

### Catalog

- **categories**, **materials**: bảng tham chiếu (id, name vi/en).
- **products**: `id, supplier_id, name(vi/en), description(vi/en), category_id, material_id,
price(int VND), stock, rating, status, image, has_model_3d, created_at, updated_at`
  (khớp `PRODUCTS` trong mock).

### Mua hàng

- **carts / cart_items** (hiện FE localStorage): `product_id, qty, branch_id 🔵 (chi nhánh →
hiện quận), custom_design_id 🔵 (nếu là SP custom → **click xem ảnh/thông số chi tiết**)`.
- **orders**: `id, user_id, total, shipping_fee 🔵, status(processing|packing|shipping|completed),
shipping_address, distance_km 🔵, eta_days 🔵, created_at`.
- **order_items**: `order_id, product_id, name, qty, price, image, branch_id 🔵`.
- **order_timeline**: `order_id, status, done, at`.

### Custom & matching

- **custom_designs** (1 luồng — 1 thiết kế = 1 mô hình 3D đã tuỳ chỉnh): `id, user_id,
source(template|image), source_image_url, glb_url, usdz_url 🔵, name, material_id, finish_id
(màu), dimensions{w,h,d}|scale, estimate_price, estimate_days, meshy_task_id 🔵,
status(pending|succeeded|failed) 🔵, created_at`.
  > _Hiện mock:_ chỉ lưu `product_type + dimensions + material + finish` (trình chỉnh khối hộp,
  > khớp `POST /custom/designs`). Khi có Meshy: thêm `source / glb_url / usdz_url`.
  > **KHÔNG tách 2 bảng custom — đây là 1 luồng duy nhất.**
- **quote_requests** 🔵: `id, user_id, target_supplier_id, design_id|product_id, qty,
type(custom|b2b), status, quoted_price, quoted_eta, shipping_fee, created_at` (đầu ra của
  ghép xưởng custom **và** báo giá B2B; thường gắn với 1 chat_thread).

### Chat & AI

- **chat_threads** 🔵: `id, customer_id, supplier_id, context_type(custom_design|product|order),
context_id, created_at`.
- **chat_messages** 🔵: `id, thread_id, sender_id, body, attachments[] (ảnh 2D / SP custom đã
dựng / thông số), created_at, read_at`. **Lưu remote DB** → đóng web/chat vẫn còn lịch sử
  (kiểu Shopee). Khung chat tự đính các `custom_designs` của khách.
- **chatbot_conversations** 🔵: `id, user_id, created_at`.
- **chatbot_messages** 🔵: `id, conversation_id, role(user|assistant), content, refs(product_ids|
order_id), created_at` — phục vụ **lịch sử + theo dõi đơn hàng**.

### Khác

- **plans** (Pricing): nhóm `b2c|supplier|custom`, features[]. (xem `GET /plans`.)
- **contacts**: `name, email, subject, message, created_at`.

> Quan hệ chính: user 1–n orders / custom_designs / ai_models; supplier 1–n products /
> reviews; order 1–n order_items; thread 1–n messages; design/product → quote_requests.

---

## 7. Quy ước kỹ thuật (bắt buộc theo)

- **Mock-first:** mọi API qua `web/src/api/client.js` → `call(realCall, mockKey, …)`. Mặc định
  dùng `mockAdapter`; BE làm xong endpoint nào thì thêm `mockKey` vào `REAL_ENDPOINTS` +
  `VITE_USE_MOCK=false`. **Không sửa page/component khi đổi sang BE.**
- **Auth:** JWT Bearer, axios interceptor tự đính header; 401 → tự logout. BE verify JWT ở **mọi**
  endpoint nhạy cảm (FE chặn chỉ là UX).
- **UI:** Tailwind v4 + daisyUI (token màu thương hiệu trong `web/src/index.css`). Không tự đổi
  sang CSS module/Tailwind config riêng.
- **i18n:** react-i18next, thêm key ở **cả** `web/src/i18n/vi.json` và `en.json`. Nội dung
  marketplace (tên xưởng, review…) để tiếng Việt trong data; chỉ label UI mới đưa vào i18n.
- **Tiền:** VND **số nguyên** (không float). Hiển thị qua `formatVnd` (`utils/format.js`).
- **Thời gian:** ISO 8601 UTC ở API; DB `TIMESTAMPTZ`.
- **DB:** cột `snake_case`, JSON API `camelCase` (map ở tầng DTO).
- **Bảo mật key (Meshy/Gemini):** **luôn ở BE proxy**, không bao giờ để ở FE.

---

## 8. Giả định cần bạn xác nhận (Codex/bạn review)

Những điểm dưới mình **suy luận** (chưa có trong UI/contract) — xác nhận để chốt DB:

1. **Subtype** dựng bằng cột (`customer_type`, `supplier_type`) trên cùng bảng, hay tách bảng
   con riêng? (mình đề xuất cột + bảng profile phụ).
2. **Manufacturer vs Workshop:** manufacturer bán catalog ở `/shop`; workshop nhận custom ở
   `/suppliers`. Workshop có được phép có **vài sản phẩm mẫu** để đặt theo spec không?
3. **Phí ship:** tính theo khoảng cách Haversine (lat/lng) hay tích hợp API bản đồ (Google/GHN)?
4. **Chat trực tiếp:** realtime (WebSocket/Supabase Realtime) hay polling ở MVP?
5. **B2B:** business là **subtype của customer** (đề xuất) hay tài khoản/role tách riêng?
6. **AI 3D (Meshy):** giữ ở V1 hay V2? (đang scaffold mock, BE proxy chưa có.)

---

_File này cập nhật khi luồng/role/trang thay đổi. Khi sửa, đồng bộ luôn `API_CONTRACT.md`._
