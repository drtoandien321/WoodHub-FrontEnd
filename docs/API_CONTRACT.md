# WoodHub — API Contract (FE ↔ BE)

> **Nguồn sự thật duy nhất** cho team BE (Spring Boot) và FE (web + mobile).
> FE đã viết sẵn mock adapter trả về ĐÚNG các shape dưới đây
> (`web/src/api/mock/mockAdapter.js`). BE chỉ cần trả đúng shape → FE đổi
> `VITE_USE_MOCK=false` là chạy, không sửa UI.

**Base URL:** `http://localhost:8080/api` (dev) — cấu hình qua `VITE_API_URL`.

**Auth:** JWT Bearer. FE tự đính header qua axios interceptor:
`Authorization: Bearer <token>`. Endpoint có 🔒 yêu cầu token hợp lệ —
BE trả `401` nếu thiếu/sai (FE bắt 401 → tự logout).

**Quy ước chung:**
- JSON camelCase (DB snake_case → map ở tầng DTO, đúng convention đã chốt trong CLAUDE.md)
- Tiền: VND, kiểu số nguyên (không float — tránh sai số làm tròn)
- Thời gian: ISO 8601 UTC (`2026-06-11T08:30:00Z`) — khớp TIMESTAMPTZ trong schema
- Lỗi: `{ "message": "...", "code": "PRODUCT_NOT_FOUND" }` + đúng HTTP status

---

## 1. Auth

### POST /auth/register
```jsonc
// Request
{
  "email": "a@gmail.com",
  "password": "secret123",      // BE: BCrypt hash, KHÔNG bao giờ lưu plaintext
  "name": "Nguyễn Văn A",
  "role": "customer",           // "customer" | "supplier"
  "supplierInfo": {             // chỉ khi role = supplier
    "name": "Xưởng Mộc ABC",
    "address": "123 Lý Thường Kiệt, Tân Bình"
  }
}
// Response 201
{
  "token": "eyJhbGci...",
  "user": { "id": "uuid", "name": "Nguyễn Văn A", "email": "a@gmail.com", "role": "customer" }
}
```
Lỗi: `409 EMAIL_TAKEN`, `400 VALIDATION_ERROR`.

### POST /auth/login
```jsonc
// Request
{ "email": "a@gmail.com", "password": "secret123" }
// Response 200 — cùng shape register
{ "token": "...", "user": { "id", "name", "email", "role" } }
```
Lỗi: `401 INVALID_CREDENTIALS`.

> Ghi chú bảo mật: MVP lưu token ở localStorage (nhanh, đủ demo).
> Production nên chuyển httpOnly cookie + refresh token để chống XSS —
> đã ghi chú tại `web/src/stores/authStore.js`.

## 2. Products (B2C catalog)

### GET /products
Query params (đều optional): `category`, `material`, `minPrice`, `maxPrice`,
`sort` (`price_asc` | `price_desc`), `page` (mặc định 1), `pageSize` (mặc định 12).
```jsonc
// Response 200
{
  "items": [
    {
      "id": "uuid",
      "name": "Bàn ăn gỗ sồi Scandi",
      "category": "table",          // slug danh mục
      "material": "oak",
      "price": 5900000,
      "stock": 12,
      "rating": 4.8,
      "supplierId": "uuid",
      "supplierName": "Xưởng Mộc Tân Bình",
      "hasModel3d": true,
      "image": "https://...",       // URL ảnh (FE mock dùng SVG inline)
      "description": "..."
    }
  ],
  "page": 1,
  "pageSize": 12,
  "total": 57,
  "categories": [ { "id": "table", "name": "Bàn" } ]   // cho filter pills
}
```

### GET /products/featured
`{ "items": [ ...tối đa 4 product... ] }` — landing page.

### GET /products/:id
Product đầy đủ + `"related": [ ...product cùng category... ]`. Lỗi: `404`.

## 3. Orders 🔒 (checkout giả lập — scope MVP)

### POST /orders
```jsonc
// Request
{
  "items": [ { "productId": "uuid", "name": "...", "price": 5900000, "qty": 2 } ],
  "address": { "fullName": "...", "phone": "09xx", "street": "...", "district": "..." },
  "paymentMethod": "vnpay"   // "vnpay" | "momo" | "bank" — MVP chỉ lưu, KHÔNG gọi cổng thật
}
// Response 201
{
  "id": "uuid",
  "status": "pending_payment",  // enum: pending_payment | processing | shipping | completed | cancelled
  "items": [...], "address": {...}, "paymentMethod": "vnpay",
  "total": 11800000,            // ⚠️ BE TỰ TÍNH từ giá trong DB — không tin total/price từ client
  "createdAt": "2026-06-11T08:30:00Z",
  "timeline": [ { "status": "pending_payment", "at": "..." } ]
}
```
> ⚠️ BE phải lấy `price` theo `productId` từ DB rồi tự tính `total`.
> Client có thể sửa payload — nguyên tắc "never trust the client".

### GET /orders/:id
Cùng shape trên. `403` nếu đơn không thuộc user, `404` nếu không tồn tại.

## 4. Custom (configurator 3D + matching)

### GET /custom/product-types
```jsonc
{ "items": [ { "id": "table", "name": "Bàn", "emoji": "🪵", "desc": "Bàn ăn, bàn làm việc..." } ] }
```

### POST /custom/designs 🔒
```jsonc
// Request
{
  "productType": "cabinet",                                  // table | cabinet | shelf | chair
  "dimensions": { "width": 280, "height": 220, "depth": 60 }, // cm, số nguyên
  "materialId": "walnut",                                     // oak | walnut | ash | pine
  "finishId": "dark"                                          // natural | dark | white | black
}
// Response 201
{ "id": "uuid", ...request..., "estimatedPrice": 12740000, "createdAt": "..." }
```
> **BE validate giới hạn kích thước theo loại** — bảng limits trong
> `web/src/api/mock/customData.js` (`PRODUCT_TYPE_DEFAULTS`). FE chặn bằng slider
> nhưng validate thật phải ở BE.
> **BE tự tính `estimatedPrice`** — công thức MVP (FE chỉ hiển thị tạm):
> `thể tích m³ × đơn_giá_vật_liệu × hệ_số_finish + 500_000`, làm tròn 10.000đ.
> Đơn giá: oak 18tr/m³, walnut 34tr, ash 15tr, pine 9tr.
> Hệ số finish: natural 1.0, dark 1.08, white 1.12, black 1.15.

### GET /custom/designs/:id 🔒
Design đã lưu. `404` nếu không có.

### POST /custom/match 🔒
```jsonc
// Request
{ "designId": "uuid" }
// Response 200
{
  "designId": "uuid",
  "matches": [
    {
      "id": "uuid", "name": "Nội thất Gia Phát", "district": "Thủ Đức, TP.HCM",
      "rating": 4.9, "completedJobs": 98, "leadTimeDays": 21,
      "score": 71            // 0–100, đã sort giảm dần
    }
  ]
}
```
**Thuật toán RULE-BASED (đúng scope MVP — KHÔNG AI), port y nguyên từ
`mockAdapter.matchWorkshops`:**
1. **Lọc cứng:** xưởng phải (a) làm được `productType`, (b) `maxWidthCm >= dimensions.width`, (c) hỗ trợ `materialId` — dữ liệu từ bảng capability của supplier.
2. **Chấm điểm:** `score = (rating/5)×50 + (1 − min(leadTimeDays,30)/30)×30 + min(completedJobs/150, 1)×20`
3. Sort score giảm dần.

## 5. Workshops (trang Suppliers)

### GET /workshops
```jsonc
// Response 200
{
  "items": [
    {
      "id": "uuid",
      "name": "Xưởng Mộc Tân Bình",
      "district": "Tân Bình, TP.HCM",
      "rating": 4.8,
      "completedJobs": 124,
      "leadTimeDays": 14,
      "capability": { "types": ["table", "shelf", "chair"], "maxWidthCm": 240, "materials": ["oak", "ash", "rubber"] }
    }
  ]
}
```

## 5b. Plans (trang Pricing)

### GET /plans
```jsonc
// Response 200
{
  "items": [
    {
      "id": "plan_b2c_premium",
      "group": "b2c",       // "b2c" | "supplier" | "custom" — đúng 3 nhóm theo spec B.1
      "name": "B2C Premium AR/3D",
      "pricePerMonth": 49000,
      "features": ["Xem AR/3D không giới hạn", "..."]
    }
  ]
}
```
> MVP: chưa có payment thật. Nút "Đăng ký gói" — chưa login → redirect `/login` kèm
> `state.from`; đã login → hiện thông báo "Luồng thanh toán subscription sẽ có ở V1".

## 5c. Contact

### POST /contact
```jsonc
// Request
{ "name": "Nguyễn Văn A", "email": "a@gmail.com", "subject": "Hợp tác xưởng mộc", "message": "..." }
// Response 200
{ "ok": true }
```
> MVP: BE chỉ cần lưu lại / gửi email nội bộ, không cần phản hồi tự động cho người gửi.

## 6. Để dành V1 (FE chưa gọi, đừng làm vội)
- `POST /auth/refresh` — refresh token
- `POST /cart/merge` — gộp giỏ guest khi login
- `GET /orders` — danh sách đơn của user
- Quote flow: `POST /quotes` (yêu cầu báo giá từ xưởng), supplier portal CRUD
- Webhook VNPay/MoMo khi tích hợp thanh toán thật

## Thứ tự ưu tiên cho BE (theo critical path)
1. `GET /products`, `GET /products/:id`, `GET /products/featured` — **mở khóa cả FE lẫn AI service**
2. `POST /auth/register`, `POST /auth/login` + JWT filter
3. `POST /custom/designs`, `POST /custom/match`
4. `POST /orders`, `GET /orders/:id`
