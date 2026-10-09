# Phase 4 — Khảo sát dữ liệu: giá thương lượng & thời gian dự kiến (GATE 4)

> Chỉ khảo sát, **chưa viết code**. Kết luận chính: **không cần migration** — dữ liệu đã có đủ; chỉ cần thêm field vào response danh sách báo giá.

## 1. Dữ liệu đã có trong DB

| Cần hiển thị | Nguồn có sẵn | Ghi chú |
|---|---|---|
| Giá đề xuất từng vòng | `quote_offers.price` NUMERIC(12,2) | **Đơn giá / sản phẩm**, không phải tổng |
| Ai đề xuất | `quote_offers.offered_by` (`workshop` \| `customer`) | |
| Thời điểm đề xuất | `quote_offers.created_at` | |
| Trạng thái vòng | `quote_offers.status` (`pending`/`accepted`/`rejected`/`superseded`) | |
| Thời gian dự kiến (ngày) | `quote_offers.lead_time_days` INT, nullable | Form xưởng (`QuoteDetail.jsx:145`) đã bắt buộc nhập, BE đã validate ≥ 1 (AUD-020) |
| Giá chốt | offer có `status = accepted`; snapshot ở `custom_orders.unit_price` | Có thêm `custom_orders.total_amount` (cột GENERATED = unit_price × quantity, **không map** trong entity) |
| Ngày chốt | `custom_orders.created_at` | |
| Số vòng thương lượng | `count(quote_offers)` theo `quote_request_id` | |
| Cập nhật lần cuối | `quote_requests.updated_at` | Có trong DB nhưng **chưa có trong DTO** |

## 2. Còn thiếu

| Field | Tình trạng | Đề xuất |
|---|---|---|
| Tất cả field trên ở **API danh sách** (`GET /api/quotes/my`, `/incoming`) | `QuoteRequestResponse.summary()` truyền `offers = null` ⇒ không có giá/thời gian | Thêm field tổng hợp (mục 3) |
| `estimatedCompletionDate` | **Không lưu ở đâu cả** | **Tính ra** = ngày chốt + `leadTimeDays` (không cần cột mới) |
| `updatedAt` | Chưa có trong DTO | Thêm vào DTO |

## 3. Đề xuất API (chỉ THÊM field, tương thích ngược)

Thêm vào `QuoteRequestResponse` (áp dụng cả `/my` và `/incoming`, `GET /{id}` cũng nhận được):

```jsonc
{
  "latestOfferPrice": 11000000,        // đơn giá của vòng mới nhất; null nếu chưa có offer
  "latestOfferBy": "workshop",         // "workshop" | "customer"; null nếu chưa có offer
  "finalPrice": 9500000,               // đơn giá CHỐT; chỉ có khi status = accepted
  "finalTotal": 19000000,              // finalPrice × quantity (tiện cho FE)
  "estimatedDays": 12,                 // lead time của offer mới nhất (hoặc offer đã chốt); null nếu không có
  "estimatedCompletionDate": "2026-10-21", // chỉ khi accepted: ngày chốt + estimatedDays
  "negotiationRounds": 3,              // số offer
  "updatedAt": "2026-10-09T13:00:00Z"
}
```

- **Hiệu năng (tránh N+1):** trong `getMyQuotes/getIncomingQuotes` chạy **đúng 2 truy vấn bổ sung cho cả trang** (không phải mỗi báo giá một lần): `quote_offers WHERE quote_request_id IN (…)` và `custom_orders WHERE quote_request_id IN (…)`, rồi gộp trong bộ nhớ.
- **Phân quyền:** không đổi (đã đúng: khách chỉ thấy báo giá của mình, xưởng chỉ thấy báo giá gửi tới mình — có test E2E).
- **Tiền:** `BigDecimal` / `NUMERIC`, đơn vị VND. FE định dạng bằng `Intl.NumberFormat('vi-VN', …)`.

## 4. Hiển thị trên card (theo bảng của bạn, có chỉnh cho khớp dữ liệu)

| Trạng thái | Giá | Thời gian dự kiến |
|---|---|---|
| `pending` | "Chưa có báo giá" (mờ) | ẩn |
| `negotiating` | `latestOfferPrice` + nhãn "Xưởng đề xuất"/"Bạn đề xuất" + "· N vòng" | "~X ngày" nếu có |
| `accepted` | `finalPrice` nổi bật (gold) + tổng `finalTotal` | "~X ngày · dự kiến dd/MM/yyyy" |
| `rejected` | giá offer cuối (gạch ngang, mờ) | ẩn |
| `expired` / `cancelled` | như `rejected` (mờ); nếu chưa có offer thì "Chưa có báo giá" | ẩn |

## 5. Mình cần bạn quyết định (GATE 4)

1. **Tên giá trị `latestOfferBy`:** giữ `workshop`/`customer` (đang dùng ở `QuoteOfferResponse.offeredBy`, FE đã quen) **(khuyến nghị)** hay đổi thành `SUPPLIER`/`CUSTOMER` như prompt? Đổi sẽ lệch với field `offeredBy` hiện có.
2. **`estimatedCompletionDate`:** **tính từ ngày chốt + số ngày** (không migration, khuyến nghị) hay lưu cột riêng khi xưởng xác nhận sản xuất (cần SQL mới trong `backend/sql/`, và phải có chỗ cho xưởng nhập)? Ngày tính ra chỉ là *ước lượng*, vì xưởng có thể bắt đầu sản xuất sau ngày chốt.
3. **Số tiền hiển thị:** `price` là **đơn giá**. Mình đề xuất card ghi "11.000.000 ₫/sp" và, khi `quantity > 1`, thêm dòng "Tổng: 22.000.000 ₫ (×2)". Đồng ý?
4. *(Tuỳ chọn)* **Timeline lịch sử thương lượng** ở trang chi tiết: trang chi tiết đã liệt kê các vòng offer kèm giá và thời gian; mình có thể làm lại thành dạng timeline có mốc thời gian + nhãn bên đề xuất. Làm hay để sau?

Khi bạn trả lời, mình sẽ làm theo thứ tự: BE (DTO + 2 truy vấn gộp + test E2E) → FE (card + i18n VI/EN + mock + test hiển thị) → chụp 4 trạng thái (dark/light, mobile) cho GATE 5.

---

# Kết quả triển khai (đã làm theo khuyến nghị cả 4 điểm; timeline để sau)

## Backend (`backend/`, commit `03d9842`, chưa push) — không có migration
- `QuoteRequestResponse` thêm: `latestOfferPrice`, `latestOfferBy` (`workshop|customer`), `finalPrice`, `finalTotal`, `estimatedDays`, `estimatedCompletionDate` (ngày chốt + số ngày, giờ VN), `negotiationRounds`, `updatedAt`. Field cũ giữ nguyên.
- Danh sách dùng **2 truy vấn gộp** cho cả trang (`QuoteOfferRepository.findByQuoteRequestInOrderByCreatedAtAsc`, `CustomOrderRepository.findByQuoteRequestIn`) — không N+1. Chi tiết `GET /quotes/{id}` cũng có các field tổng hợp.
- Phân quyền không đổi (có test E2E).

## Frontend (chưa commit — xem ghi chú git ở `fix-log.md`)
- `utils/quoteSummary.js` — `quoteCardModel()` (logic hiển thị thuần) + `formatDay()`.
- `components/quote/QuotePricing.jsx` — vẽ khối giá/thời gian; gold = token `accent` (có bản dark riêng).
- `pages/MyQuotes.jsx` — gắn `QuotePricing`; **sửa luôn** nhãn trạng thái lấy từ i18n (trước đó cứng tiếng Việt).
- `i18n/vi.json`, `en.json` — nhóm `quote.card.*` (có số ít/số nhiều cho "vòng").
- `api/mock/mockAdapter.js` — `withQuoteSummary()` mirror BE để chạy được ở chế độ mock.

## Kiểm thử
| Loại | Kết quả |
|---|---|
| E2E API mới `07-quote-summary.spec.js` (8 test) | ✅ pass |
| Toàn bộ E2E API (BE local) | ✅ **60/60** |
| Unit logic hiển thị `e2e/unit/quote-summary.spec.js` (12 test: 4 trạng thái, thiếu field, giá rác, locale VI/EN, định dạng VND) | ✅ **12/12** |
| Giao diện thật (mock) — 4 trạng thái + 2 biên (khách đề xuất không có số ngày, số lượng 1) | ✅ light + dark, 375px mobile, VI + EN; không tràn ngang |

Ảnh chụp: `docs/phase4-screenshots/quotes-mobile-light.jpg`, `quotes-mobile-dark.jpg`.

## Chưa làm / lưu ý
- **Timeline lịch sử thương lượng** (để sau theo lựa chọn của bạn). Trang chi tiết đã có danh sách vòng giá + thời gian.
- Chưa test với **BE thật qua giao diện** (UI chạy ở chế độ mock). Contract BE đã được E2E xác nhận, mock bám đúng shape.
- Card cho **xưởng** (`/incoming`) dùng chung API nên đã có dữ liệu, nhưng trang xưởng chưa gắn `QuotePricing` (prop `viewer="workshop"` đã sẵn).
- `estimatedCompletionDate` là **ước lượng** (ngày chốt + số ngày), không phải cam kết sản xuất.
