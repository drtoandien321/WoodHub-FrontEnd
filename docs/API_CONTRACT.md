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

## 0. Quy ước tên field TỌA ĐỘ (đọc trước khi code BẤT KỲ tính năng nào liên quan vị trí)

> Nhầm tên field toạ độ giữa 3 ngữ cảnh dưới đây là lỗi thật đã xảy ra khi lập kế hoạch tính
> năng GPS (2026-07) — ghi lại đây để không lặp lại. **Tự self-check bảng này trước khi commit
> bất kỳ dòng code nào đọc/ghi toạ độ**, ở mọi module (Store, Checkout, Custom order...).

| Ngữ cảnh | Tên field | Ví dụ | Nguồn |
|---|---|---|---|
| Trình duyệt trả về (Geolocation API) | `coords.latitude`, `coords.longitude` | `position.coords.latitude` | `navigator.geolocation.getCurrentPosition(position => ...)` |
| Body JSON gửi lên BE (tạo/sửa Store) | `latitude`, `longitude` | `{ "latitude": 10.77, "longitude": 106.70 }` | `CreateStoreRequest` / `UpdateStoreRequest` / `StoreResponse` |
| Query param của API gợi ý vị trí gần | `lat`, `lng` | `GET /stores/nearby/workshops?lat=10.77&lng=106.70` | `GET /stores/nearby/*` (3 endpoint) |

**Lưu ý quan trọng:** `latitude`/`longitude` trong `Store` entity/DTO **KHÔNG `NOT NULL`** ở BE
(cột DB không có ràng buộc, service chỉ validate range nếu có giá trị) — BE cố ý cho phép
`null` để 3 API gợi ý gần tự lọc `WHERE latitude IS NOT NULL` thay vì chặn cứng dữ liệu cũ.
**Việc bắt buộc nhập toạ độ khi supplier tạo chi nhánh MỚI là quyết định của FE** (data-quality
gate — chi nhánh không toạ độ sẽ vô hình với mọi tính năng gợi ý sau này), **không phải vì BE
ép buộc**. Khi SỬA chi nhánh cũ chưa có toạ độ, FE không chặn cứng — chỉ nhắc bổ sung.

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

## 3. Orders 🔒

> ⚠️ Luồng `POST /orders` giả lập cũ đã **bỏ**. Xem mục **Orders & Checkout** ở cuối file (theo `woodhub-be/docs/order-checkout-fe.md`).

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
- Quote flow: `POST /quotes` (yêu cầu báo giá từ xưởng), supplier portal CRUD
- Webhook VNPay/MoMo khi tích hợp thanh toán thật

## Thứ tự ưu tiên cho BE (theo critical path)
1. `GET /products`, `GET /products/:id`, `GET /products/featured` — **mở khóa cả FE lẫn AI service**
2. `POST /auth/register`, `POST /auth/login` + JWT filter
3. `POST /custom/designs`, `POST /custom/match`
4. `POST /orders`, `GET /orders/:id`

---

## Admin — Quản lý thanh toán (chỉ admin, chỉ đọc)

| Endpoint | Ghi chú |
| --- | --- |
| `GET /api/admin/payments` | Query: `status` (pending/paid/failed/expired), `purpose` (subscription/order), `from`, `to` (ISO-8601, **dùng hậu tố `Z`**, lọc theo `createdAt`), `q` (txnRef/email/tên), `page`, `size`, `sort`. Trả Spring Page **phẳng** (`content`, `totalElements`, `totalPages`, `number`, `size`…). |
| `GET /api/admin/payments/{id}` | `AdminPaymentResponse`; 404 nếu không có. |
| `GET /api/admin/payments/stats?from&to` | `{ totalRevenue, totalCount, paidCount, pendingCount, failedCount, expiredCount, dailyRevenue[{date,revenue,count}] }`. Doanh thu theo `paidAmount` + `paidAt`; các `*Count` theo `createdAt`. |

`AdminPaymentResponse`: `id, purpose, provider, status, amount, paidAmount|null, txnRef, providerTxnId|null, expiresAt|null, paidAt|null, createdAt, userId, userEmail, userFullName, planId|null, planName|null`.
Lỗi: 401 chưa đăng nhập · 403 không phải admin · 400 sai định dạng ngày.

## AI Chat — shape `suggestedProducts` (đã đổi)

Passthrough từ AI, FE đọc phòng thủ (field có thể thiếu): `id, name, price (số VND), category, material|null, image_url, reasons[]`, có thể thêm `colors, dimensions, seats`. Dùng `id` để link `/product/:id`.
Cold start (Render free) có thể chậm vài chục giây hoặc 502 → FE hiện lời nhắn chờ + nút "Thử lại". Câu "Bạn cần đăng nhập…" là nội dung AI trả với HTTP 200, không phải lỗi auth.

## AI Chat — xem lại lịch sử (FE đã dùng)

- `GET /api/ai-chat/sessions` → `AiChatSessionResponse[]` (mới cập nhật trước). FE hiển thị ở màn "Lịch sử trò chuyện" trong khung chat; phiên chưa có `title` (chưa có tin nhắn) bị ẩn, trừ phiên đang mở.
- `GET /api/ai-chat/sessions/{id}/messages` → chỉ chủ phiên (403 nếu không phải chủ). FE lưu `sessionOwnerId` cùng `sessionId` và tự bỏ phiên khi đổi tài khoản/đăng xuất.

## Cart 🔒 — giỏ hàng server-side (FE đã dùng)

Nguồn chi tiết: `woodhub-be/docs/cart-address-fe.md`. Giỏ **chỉ cho user đã đăng nhập** (FE: khách chưa login bấm "Thêm vào giỏ" → `/login`, không có giỏ guest / không merge).

| Endpoint | Ghi chú |
| --- | --- |
| `GET /api/cart` | Tự tạo giỏ rỗng nếu chưa có |
| `POST /api/cart/items` | `{ variantId, quantity 1..999 }` — đã có thì **cộng dồn**. 404 không có biến thể · 409 SP ngừng bán |
| `PUT /api/cart/items/{itemId}` | `{ quantity }` — **ghi đè**. `itemId` = id dòng giỏ, **không phải** `variantId` |
| `DELETE /api/cart/items/{itemId}` | Xoá 1 dòng |
| `DELETE /api/cart` | Xoá sạch |

Mọi endpoint trả **toàn bộ** `CartResponse { id, items[], totalItems, totalQuantity, subtotal, updatedAt }`.
`CartItemResponse { id, variantId, productId, productName, sku, color, dimensions, imageUrl, unitPrice, quantity, lineTotal, priceAtAddition, addedAt }` — `unitPrice` là giá hiện tại, khác `priceAtAddition` thì FE báo "giá đã thay đổi".

## Addresses 🔒 — sổ địa chỉ giao hàng (FE đã dùng: `/account/addresses`)

| Endpoint | Ghi chú |
| --- | --- |
| `GET /api/addresses` | `UserAddressResponse[]` — mặc định đứng đầu, rồi mới nhất trước |
| `POST /api/addresses` | → `201`. Địa chỉ đầu tiên tự thành mặc định |
| `PUT /api/addresses/{id}` | ⚠️ **Ghi đè toàn bộ** — field không gửi (kể cả `latitude/longitude`) bị set `null`. FE luôn gửi đủ body |
| `DELETE /api/addresses/{id}` | → `204`. Xoá địa chỉ mặc định → BE đề bạt địa chỉ mới nhất |
| `PATCH /api/addresses/{id}/default` | Đặt mặc định, trả chính địa chỉ đó |

Body: `{ recipientName*, recipientPhone*, addressLine*, ward?, district?, city*, latitude?, longitude?, isDefault? }`.
Response thêm `id, isDefault, hasCoordinates, createdAt, updatedAt`. `hasCoordinates=false` → không dùng được để checkout (FE bắt khách ghim map trước).

## Orders & Checkout 🔒 (FE đã dùng: /checkout, /orders, /orders/:id)

| Endpoint | Ghi chú |
| --- | --- |
| `POST /api/orders/checkout` | Body `{ addressId, note?, couponCodes? }` (FE dùng cách này; địa chỉ phải `hasCoordinates`). Hoặc nhập tay `{ recipientName, recipientPhone, addressLine, ward?, district?, city, latitude, longitude, locationSource?, saveAddress? }`. → `201 { orders: OrderResponse[], payment: PaymentResponse, grandTotal }` |
| `GET /api/orders?status=&page=&size=` | `Page<OrderResponse>`, mặc định `createdAt,desc` |
| `GET /api/orders/{id}` | Chỉ chủ đơn (khác → 404) |
| `POST /api/orders/{id}/cancel` | Chỉ khi `pending_payment`, sai → 409 |
| `GET /api/promotions/lookup?code=` | `PromotionResponse` · 404 không có · 400 hết hiệu lực (lượt dùng chỉ kiểm khi checkout) |

- BE **tự** tách đơn theo supplier, chọn chi nhánh gần nhất, tính ship (Haversine), áp coupon, tạo **1 payment chung** (1 QR) và **xoá giỏ**. FE không gửi giá/phí ship.
- Poll `GET /api/payments/{paymentId}` tới `paid` → webhook đã tự chuyển mọi đơn `pending_payment → paid`.
- Trạng thái: `pending_payment → paid → confirmed → processing → shipping → delivered → completed`; nhánh `cancelled`, `refunded`.
- ⚠️ **Spring Page thật là dạng lồng** (BE bật `@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)`): `{ content, page: { size, number, totalElements, totalPages } }` — docs BE ghi dạng phẳng là chưa đúng. FE đọc `data.page ?? data`.

## Xử lý đơn · Khuyến mãi · Phí ship (portal supplier/admin — FE đã dùng)

Nguồn: `woodhub-be/docs/promotions-admin-fe.md`.

| Endpoint | Ai dùng | FE |
| --- | --- | --- |
| `GET /api/supplier/orders?status=&page=` · `PUT /api/supplier/orders/{id}/status` | supplier (đơn của mình, khác chủ → 403) | `/portal/supplier/orders` |
| `GET /api/admin/orders?status=&page=` · `PUT /api/admin/orders/{id}/status` | admin (mọi đơn) | `/admin/orders` |
| `GET/POST /api/promotions` · `GET/PUT/DELETE /api/promotions/{id}` | admin (KM toàn sàn) + supplier (KM `product` cho SP của mình) — BE tự lọc danh sách theo vai trò | `/admin/promotions`, `/portal/supplier/promotions` |
| `GET/PUT /api/admin/shipping-config` | admin | `/admin/shipping-config` |

- Body đổi trạng thái: `{ status, note? }`. Luật chuyển (sai → 409) — FE giữ bản sao ở `web/src/utils/orderStatus.js` để chỉ hiện nút hợp lệ:
  `pending_payment → cancelled` · `paid → confirmed|cancelled|refunded` · `confirmed → processing|cancelled|refunded` · `processing → shipping|cancelled|refunded` · `shipping → delivered|refunded` · `delivered → completed|refunded` · `completed → refunded`. `pending_payment → paid` chỉ do webhook.
- Khuyến mãi: `free_shipping` chỉ cho `type=shipping`; `percentage` ∈ (0,100]; `fixed_amount` > 0; `type=product` bắt buộc `productIds`; trùng mã → 409.
- Ship config: `{ baseFee, perKmFee, freeRadiusKm, freeShipThreshold|null, maxFeeCap|null }` — `null` = tắt ngưỡng/trần.

## Subscription — ví lượt & credit pack (FE đã dùng: `/account/subscription`, `/admin/credit-packs`)

Nguồn: `woodhub-be/docs/subscription-fe.md` (mục 4b).

- `GET /api/usage/me`: **không còn `ar_3d`** (AR không giới hạn). Mỗi dòng thêm `purchasedRemaining` (lượt đã mua, không reset; `null` nếu tính năng không bán lượt). BE trừ hạn mức tháng trước, hết mới trừ ví; chỉ khi **cả hai = 0** mới 429 → FE coi "hết lượt" khi `remaining + purchasedRemaining === 0`.
- `GET /api/credit-packs` (cần đăng nhập) → gói đang bán `{ id, name, displayName, feature, credits, price, isActive, sortOrder }`.
- `POST /api/payments/credit-pack { packId }` → `PaymentResponse` (`purpose: 'credit_pack'`, `planName = null`) → poll `GET /api/payments/{id}` tới `paid` → lượt tự vào ví. Gói giá 0 → 400.
- Admin: `GET/POST /api/admin/credit-packs`, `PUT/DELETE /api/admin/credit-packs/{id}` — body `{ name, displayName, feature?, credits, price, isActive?, sortOrder? }`.

## Admin Dashboard — traffic GA4 (FE đã dùng: khối "Lượt truy cập website")

- `GET /api/admin/dashboard/traffic?from&to&limit` → `{ totals{activeUsers,newUsers,sessions,pageViews,engagementRate,avgSessionSeconds}, bySource[], byDay[], topPages[], realtime|null }`. Bỏ trống from/to = 30 ngày gần nhất.
- `503` = BE chưa cấu hình GA → FE **ẩn** khối · `502` = GA lỗi/hết quota → FE báo lỗi tại khối. Dữ liệu trễ 24–48h (trừ realtime).

## Reviews — đánh giá sản phẩm & nhà cung cấp (FE đã dùng: `/product/:id`, `/suppliers/:id`, portal "Đánh giá")

| Endpoint | Ghi chú |
| --- | --- |
| `GET /api/reviews?targetType=product\|supplier&targetId=&page=&size=` | Công khai. `Page<ReviewResponse>` mới nhất trước |
| `GET /api/reviews/summary?targetType=&targetId=` | Công khai. `{ average, count }` — **không có phân bố sao** (FE tự tính từ các đánh giá đã tải) |
| `POST /api/reviews` | `{ targetType, targetId, rating 1..5, comment? ≤2000 }` → 201. 409 đã đánh giá rồi · 403 tự đánh giá SP/cửa hàng của mình |
| `PUT /api/reviews/{id}` · `DELETE /api/reviews/{id}` | Chỉ người viết (khác → 403) |

`ReviewResponse { id, userId, userName, targetType, targetId, rating, comment, createdAt, updatedAt }`.
FE chỉ cho role `customer` viết. BE **chưa có**: API "đánh giá của tôi" (FE tìm theo `userId` trong trang đầu) và API phản hồi đánh giá cho nhà cung cấp.
