# Yêu cầu BE: API thống kê lượt truy cập (Google Analytics) cho Admin Dashboard

> Gửi: bạn phụ trách BE (Mai Xuân Tín) · Người viết: Nguyễn Tuấn Toàn (FE)
> Mục tiêu: Admin Dashboard hiển thị **số người truy cập web** (kể cả khách chưa đăng nhập), lấy từ **Google Analytics 4** (GA4) — mentor yêu cầu theo dõi lượng người vào web khi đăng link lên Facebook/TikTok.

---

## 1. Bối cảnh và lý do

- Dashboard hiện tại (`/api/admin/dashboard/*`) chỉ có số liệu từ database: tổng user, user mới, `activeRecently`… Tất cả đều là **người đã đăng ký/đăng nhập**. Khách vào xem web rồi thoát **không có trong DB**.
- FE đã gắn **GA4** vào `woodhub.io.vn` (Measurement ID `G-59TB3LFEZX`, đo mọi trang công khai, có ghi nhận nguồn UTM: `facebook`, `tiktok`…). Dữ liệu nằm ở Google.
- **Hướng C:** BE gọi **Google Analytics Data API (v1)**, tổng hợp và trả về 1 endpoint mới; FE vẽ thẻ KPI/biểu đồ cùng kiểu với các dashboard hiện có.

Lý do không để FE gọi GA trực tiếp: Data API cần **service account** (khoá bí mật), tuyệt đối không được đặt ở FE.

## 2. Việc cần làm (theo thứ tự)

### 2.1 Cấu hình phía Google (làm 1 lần — Toàn sẽ hỗ trợ truy cập GA)

1. Vào Google Cloud Console → chọn/tạo project → **APIs & Services → Library** → bật **Google Analytics Data API**.
2. **IAM & Admin → Service Accounts → Create** (vd `woodhub-ga-reader`). Tạo **JSON key** và tải về. **Không commit file này lên Git.**
3. Vào GA4 → **Quản trị → Property access management** → thêm **email của service account** với vai trò **Viewer** (chỉ cần quyền xem).
4. Lấy **Property ID** (dãy số, **không phải** `G-XXXX`): GA4 → Quản trị → **Property details** → "Property ID". (Số `16151477246` trong màn hình Data stream là *Stream ID*, không dùng.)

### 2.2 Cấu hình BE (biến môi trường, không hardcode)

| Biến | Ý nghĩa |
|---|---|
| `GA_PROPERTY_ID` | Property ID dạng số (vd `123456789`) |
| `GA_CREDENTIALS_JSON` | Nội dung file JSON key của service account (trên Render: dán vào Environment) |

Nếu thiếu 1 trong 2 biến → endpoint trả **503** với message rõ ràng (FE sẽ ẩn khối thống kê truy cập, không làm hỏng dashboard).

### 2.3 Thư viện (Maven)

```xml
<dependency>
  <groupId>com.google.analytics</groupId>
  <artifactId>google-analytics-data</artifactId>
  <!-- lấy bản ổn định mới nhất tại thời điểm làm -->
</dependency>
```

Dùng `BetaAnalyticsDataClient` (gọi `runReport`, và `runRealtimeReport` nếu làm phần realtime).

## 3. Đặc tả endpoint

Theo đúng quy ước của `docs/admin-dashboard-fe.md` (cùng tiền tố, chỉ admin, chỉ đọc, `from`/`to` ISO-8601 tùy chọn).

### `GET /api/admin/dashboard/traffic`

- Auth: `Authorization: Bearer <accessToken>`, **chỉ role `admin`** (`401` chưa đăng nhập, `403` không phải admin).
- Query: `from`, `to` (ISO-8601, tùy chọn; bỏ trống = **30 ngày gần nhất**), `limit` (mặc định `5`, tối đa `20` — áp cho `bySource` và `topPages`).
- Gợi ý: đổi `from`/`to` sang `YYYY-MM-DD` (múi giờ Asia/Ho_Chi_Minh) khi gọi GA, vì GA nhận theo ngày.

**Response `DashboardTrafficResponse`:**

```jsonc
{
  "totals": {
    "activeUsers": 1280,           // GA metric: activeUsers   — "bao nhiêu người vào web"
    "newUsers": 910,               // newUsers
    "sessions": 1750,              // sessions
    "pageViews": 6400,             // screenPageViews
    "engagementRate": 0.62,        // engagementRate (0..1)
    "avgSessionSeconds": 94        // averageSessionDuration (giây)
  },
  "bySource": [                    // dimension: sessionSource + sessionMedium, sắp theo users giảm dần
    { "source": "facebook", "medium": "social", "users": 640, "sessions": 800 },
    { "source": "tiktok",   "medium": "social", "users": 410, "sessions": 520 },
    { "source": "(direct)", "medium": "(none)", "users": 120, "sessions": 150 }
  ],
  "byDay": [                       // dimension: date, sắp theo ngày tăng dần, chỉ ngày CÓ dữ liệu
    { "date": "2026-10-01", "users": 55, "sessions": 70, "pageViews": 240 }
  ],
  "topPages": [                    // dimension: pagePath, sắp theo views giảm dần
    { "path": "/shop", "views": 1200, "users": 700 }
  ],
  "realtime": { "activeUsers": 7 } // runRealtimeReport (30 phút gần nhất) — TÙY CHỌN, có thể làm sau
}
```

Ghi chú: `date` trả `YYYY-MM-DD` (GA trả `YYYYMMDD`, BE đổi giúp) để FE dùng lại hàm "điền 0 cho ngày trống" như các biểu đồ khác.

### Ánh xạ sang GA Data API (`runReport`)

| Khối | Dimensions | Metrics |
|---|---|---|
| `totals` | (không) | `activeUsers`, `newUsers`, `sessions`, `screenPageViews`, `engagementRate`, `averageSessionDuration` |
| `bySource` | `sessionSource`, `sessionMedium` | `activeUsers`, `sessions` |
| `byDay` | `date` | `activeUsers`, `sessions`, `screenPageViews` |
| `topPages` | `pagePath` | `screenPageViews`, `activeUsers` |

Có thể gom 4 truy vấn vào 1 lần gọi `batchRunReports` để giảm số request.

## 4. Lưu ý quan trọng

1. **Cache phía BE (5–10 phút)** theo cặp `from/to/limit`. GA Data API có **hạn mức** (quota) theo property; dashboard mở liên tục sẽ dễ vượt nếu không cache. Có thể dùng Spring Cache + Caffeine.
2. **Độ trễ dữ liệu:** GA4 cập nhật báo cáo thường chậm **vài giờ đến 24–48 giờ**; chỉ phần `realtime` là tức thời. Cần ghi chú này ở UI (FE sẽ hiển thị "Dữ liệu có thể trễ tới 24 giờ").
3. **Loại traffic nội bộ:** FE đã **không gửi** `page_view` cho `/admin` và `/portal`, nên số liệu chỉ gồm trang công khai.
4. **Bảo mật:** JSON key không commit, không log nội dung credentials, không trả bất kỳ thông tin cấu hình GA nào ra response.
5. **Xử lý lỗi:** GA lỗi/hết quota → trả `502` (kèm message ngắn) thay vì `500`; thiếu cấu hình → `503`. FE hiển thị thông báo thân thiện, các khối khác của dashboard vẫn chạy bình thường.

## 5. Tiêu chí hoàn thành (để FE nghiệm thu)

- [ ] Swagger có `GET /api/admin/dashboard/traffic`, đúng shape ở mục 3.
- [ ] Gọi bằng token admin → 200; token customer/supplier → 403; không token → 401.
- [ ] `from/to` sai định dạng → 400 (giống các endpoint dashboard hiện có).
- [ ] Sau khi Toàn đăng bài Facebook/TikTok kèm link UTM, `bySource` hiện `facebook`/`tiktok` (có thể trễ).
- [ ] Cập nhật thêm mục này vào `docs/admin-dashboard-fe.md` của repo BE.

## 6. Phía FE sẽ làm sau khi BE xong

Thêm hàm `getAdminDashboardTraffic`, hook, và khối "Lượt truy cập" trong `/admin/dashboard` (thẻ Users/Sessions/PageViews, biểu đồ theo ngày, bảng nguồn truy cập Facebook/TikTok/Direct, top trang). Trong lúc chờ BE, FE giữ mock đúng shape trên nên BE chỉ cần trả đúng shape là cắm vào chạy.
