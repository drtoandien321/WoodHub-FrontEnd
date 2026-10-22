# Yêu cầu BE: Đánh giá WoodHub (web + app) và tặng 5 lượt thiết kế

> Người yêu cầu: FE (Toàn) · Ngày 22/10/2026 · Trạng thái: **chờ BE**
> FE đã làm sẵn theo đúng shape bên dưới (mock-first). Tính năng **đang ẩn trên production** cho tới khi BE xong và FE
> thêm 5 mockKey vào `REAL_ENDPOINTS` (xem mục 6). Lý do: nếu để mock chạy trên production, khách sẽ thấy "+5 lượt"
> nhưng không được cộng lượt thật.

## 1. Mục đích

- Thu thập đánh giá **về chính nền tảng WoodHub** (trải nghiệm web / app), tách khỏi đánh giá sản phẩm / NCC (bảng
  `reviews` hiện có).
- Dashboard admin, ô KPI thứ 4 "Đánh giá người dùng": điểm trung bình web + app, kèm điểm sản phẩm / NCC.
- Khuyến khích khách đánh giá: **lần đầu** gửi đánh giá (có sao + nội dung) thì được tặng **5 lượt thiết kế**, cộng
  vào số dư lượt đã mua (`user_credit_balances`, feature `design`).

**Vì sao không dùng bảng `reviews`:** cột `target_type` chỉ có `product | supplier` và `target_id` NOT NULL. Đánh giá
nền tảng không trỏ tới đối tượng nào, nhét vào sẽ phải bịa `target_id` và làm sai mọi truy vấn đánh giá sản phẩm.

## 2. Nơi khách gửi đánh giá (FE)

| Nơi | Khi nào | `context` gửi lên |
|---|---|---|
| Popup "Bạn chấm WoodHub mấy sao?" | Ngay khi đơn B2C thanh toán thành công (màn Checkout chuyển sang `paid`) | `after_order` |
| Footer: nút "Đánh giá WoodHub" | Bất cứ lúc nào | `footer` |
| Landing page: khối "Bạn thấy WoodHub thế nào?" | Bất cứ lúc nào | `landing` |
| App mobile (sau này) | Gọi cùng API, `platform` = `android` / `ios` | tuỳ màn |

Chưa đăng nhập → FE chuyển sang trang đăng nhập. Popup chỉ hiện khi khách **chưa từng** đánh giá (`GET /feedback/me`
trả 404) và chưa bấm "Để sau" trong phiên đó.

## 3. Database

```sql
CREATE TYPE feedback_platform AS ENUM ('web', 'android', 'ios');
CREATE TYPE feedback_context  AS ENUM ('after_order', 'footer', 'landing', 'app');

CREATE TABLE platform_feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform        feedback_platform NOT NULL,
  context         feedback_context  NOT NULL,
  rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT NOT NULL CHECK (char_length(trim(comment)) BETWEEN 10 AND 1000),
  app_version     TEXT,                       -- mobile gửi; web để null
  reward_credits  INT NOT NULL DEFAULT 0,     -- số lượt đã tặng cho bản ghi này (5 hoặc 0)
  is_hidden       BOOLEAN NOT NULL DEFAULT false, -- admin ẩn nội dung spam (điểm vẫn tính? → xem mục 5)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)                  -- mỗi tài khoản 1 đánh giá / nền tảng, gửi lại = sửa
);
CREATE INDEX idx_platform_feedback_created ON platform_feedback (created_at DESC);
```

## 4. Endpoint

Mọi lỗi theo chuẩn BE-13 (`errorCode` luôn có). FE đã có bản dịch cho các mã ghi ở đây.

### 4.1 `GET /api/feedback/me` (đăng nhập)
Đánh giá của tôi trên `platform` (query, mặc định `web`). Chưa có → **404** `FEEDBACK_NOT_FOUND`.
```json
{ "id": "uuid", "platform": "web", "rating": 5, "comment": "Dễ dùng…", "rewardCredits": 5,
  "createdAt": "2026-10-22T03:00:00Z", "updatedAt": "2026-10-22T03:00:00Z" }
```

### 4.2 `POST /api/feedback` (đăng nhập, email đã xác thực)
Body: `{ "platform": "web", "context": "after_order", "rating": 1..5, "comment": "10–1000 ký tự", "appVersion"?: "1.2.0" }`
- Chưa có bản ghi `(user, platform)` → tạo mới (**201**). Đã có → cập nhật rating/comment (**200**), KHÔNG tặng thêm.
- **Tặng lượt (trong cùng transaction):** nếu tài khoản **chưa từng được tặng** ở bất kỳ nền tảng nào
  (`SUM(reward_credits) = 0` theo user) → `reward_credits = 5` và gọi
  `balanceRepository.addCredits(userId, "design", 5)` (hàm đang dùng khi mua gói lượt, `CreditPackServiceImpl.grantCredits`).
  → Mỗi tài khoản nhận thưởng **1 lần duy nhất**, sửa đánh giá hay đánh giá thêm trên app cũng không nhận lại.
- Chỉ role `customer` được nhận thưởng (supplier/admin vẫn gửi được đánh giá, `rewardCredits = 0`).
- Response:
```json
{ "feedback": { …như 4.1… }, "rewardGranted": true, "rewardCredits": 5, "designCreditBalance": 12 }
```
- Lỗi: `VALIDATION_FAILED` (thiếu sao / comment < 10 ký tự), `EMAIL_NOT_VERIFIED` (403),
  `FEEDBACK_RATE_LIMITED` (429 — sửa quá 5 lần / ngày, chống spam).

### 4.3 `GET /api/feedback/summary` (công khai, cho landing)
```json
{ "avgRating": 4.6, "count": 128 }
```
Chỉ tính bản ghi `is_hidden = false`. Cache 10 phút là đủ.

### 4.4 `GET /api/admin/feedback` (admin) — Pageable `page,size,sort=createdAt,desc`
Lọc: `platform`, `rating`, `hidden`, `from`, `to`. Phần tử:
```json
{ "id": "uuid", "userId": "uuid", "userEmail": "a@b.vn", "userFullName": "Nguyễn A", "platform": "web",
  "context": "after_order", "rating": 4, "comment": "…", "rewardCredits": 5, "hidden": false,
  "appVersion": null, "createdAt": "…" }
```

### 4.5 `GET /api/admin/feedback/summary` (admin) — `from`, `to` tuỳ chọn (như dashboard)
```json
{ "avgRating": 4.6, "count": 128,
  "byPlatform": { "web": { "avgRating": 4.7, "count": 100 }, "android": { "avgRating": 4.3, "count": 20 },
                  "ios": { "avgRating": 4.5, "count": 8 } },
  "distribution": { "1": 2, "2": 3, "3": 10, "4": 40, "5": 73 },
  "rewardedUsers": 96 }
```

## 5. Quy tắc nghiệp vụ cần BE chốt

1. **Thưởng 1 lần / tài khoản** (đề xuất ở trên). Muốn thưởng lại mỗi năm thì đổi điều kiện thành "chưa được tặng
   trong 365 ngày".
2. **Bắt buộc có nội dung ≥ 10 ký tự** để nhận thưởng — tránh bấm 5 sao cho có để lấy lượt.
3. **Chống tạo nhiều tài khoản để lấy lượt:** chỉ thưởng khi email đã xác thực (OTP). Nếu vẫn bị lạm dụng, thêm điều kiện
   "đã có ít nhất 1 đơn `paid`".
4. **Admin ẩn đánh giá spam** (`is_hidden`): ẩn khỏi landing; điểm trung bình trên dashboard admin vẫn tính để không
   "làm đẹp" số liệu. Ẩn KHÔNG thu hồi lượt đã tặng.

## 6. FE đã làm (chờ bật)

| mockKey (`api/client.js`) | Endpoint |
|---|---|
| `getMyPlatformFeedback` | `GET /feedback/me` |
| `submitPlatformFeedback` | `POST /feedback` |
| `getPlatformFeedbackSummary` | `GET /feedback/summary` |
| `getAdminFeedback` | `GET /admin/feedback` |
| `getAdminFeedbackSummary` | `GET /admin/feedback/summary` |

BE xong → thêm 5 key trên vào `REAL_ENDPOINTS` là tính năng tự hiện trên production (hàm `endpointReady()` quyết định
hiện/ẩn). Không phải sửa component.
