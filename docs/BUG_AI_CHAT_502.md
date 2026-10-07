# Bug: `POST /api/ai-chat/sessions/{sessionId}/messages` trả 502 khi gọi từ FE

> Gửi cho thành viên BE. Mục tiêu: xác định lỗi nằm ở **BE (Spring)**, **service AI (Python/Render)** hay **dữ liệu request từ FE**.

## 1. Hiện tượng

- Từ UI (khung chat nổi, đăng nhập thật, `VITE_USE_MOCK=false`): gửi tin → **502** (`ERR_BAD_RESPONSE`), lặp lại ở nhiều lần gửi.
  - Ví dụ session: `9de25c09-5165-46f4-9640-11e45afa9ace`
  - Tin gửi: "tôi muốn tìm bàn giá từ 3 đến 5 củ"
- Từ Swagger: **cùng endpoint, cùng loại tin nhắn → 200**, có `suggestedProducts` đúng shape mới (`id, name, price, category, supplier, material, dimensions, area_cm2, seats, seats_estimated, colors, image_url, reasons`).
  - Body Swagger: `{"content": "tôi muốn mua 1 cái bàn giá tầm 3 đến 5 củ", "lat": 0, "lng": 0}`
- Theo tài liệu BE: 502 = AI lỗi/timeout (BE rollback, hoàn lượt `ai_chat`).

## 2. Khác biệt giữa Swagger (OK) và FE (502)

| | Swagger | FE |
|---|---|---|
| `lat`/`lng` | luôn gửi `0` / `0` | gửi tọa độ thật nếu user đã cấp quyền vị trí; **bỏ hẳn 2 field** nếu chưa có |
| Thời điểm | sau khi service AI đã "thức" | có thể gặp cold start |
| Token | token admin/user test | token user đăng nhập thật |
| Nội dung tin | có dấu, đủ câu | có dấu, câu ngắn hơn |

## 3. Các phép thử cần BE chạy (cùng 1 session, gọi liên tiếp)

Dùng Swagger hoặc curl, cùng `sessionId` và cùng token. Ghi lại **status + response body + thời gian phản hồi** của từng phép.

| # | Body | Mục đích | Kết quả mong đợi nếu BE đúng |
|---|---|---|---|
| T1 | `{"content":"tôi muốn tìm bàn giá từ 3 đến 5 củ"}` (**không có** lat/lng) | Kiểm tra field tùy chọn bị thiếu | 200 |
| T2 | `{"content":"tôi muốn tìm bàn giá từ 3 đến 5 củ","lat":null,"lng":null}` | Kiểm tra giá trị null | 200 |
| T3 | `{"content":"tôi muốn tìm bàn giá từ 3 đến 5 củ","lat":10.77,"lng":106.69}` | Tọa độ thật (TP.HCM) | 200 |
| T4 | `{"content":"tôi muốn tìm bàn giá từ 3 đến 5 củ","lat":0,"lng":0}` | Đối chứng với Swagger đã chạy | 200 |
| T5 | `{"content":"xin chào"}` | Câu không có sản phẩm → AI trả `suggestedProducts` null/rỗng | 200, không lỗi parse |
| T6 | Lặp lại T4 sau khi để service AI không có request ≥ 15 phút | Kiểm tra cold start | 200 (có thể chậm) hoặc 502 |

**Cách đọc kết quả:**
- T1/T2 lỗi, T4 OK → lỗi do thiếu/`null` `lat,lng` (BE hoặc AI chưa xử lý field tùy chọn).
- T3 lỗi, T4 OK → lỗi khi có tọa độ thật (logic "tìm xưởng gần" ở AI).
- T1–T4 đều OK nhưng T6 lỗi → cold start/timeout của service AI (Render free).
- T5 lỗi → AI trả shape khác (không có sản phẩm), BE parse `AgentResponse` lỗi.
- Tất cả OK trên Swagger nhưng FE vẫn 502 → so sánh token/user (xem mục 4).

## 4. Kiểm tra phía BE

1. **Log BE (Render → Logs)** tại thời điểm FE gọi: tìm stack trace / dòng "AI" quanh request 502. Cần biết 502 do:
   - timeout khi gọi service Python (timeout đặt bao nhiêu giây?),
   - service Python trả 5xx,
   - lỗi parse `AgentResponse` JSON (field mới/`null`),
   - hết lượt `ai_chat` bị map nhầm sang 502.
2. **Log service AI (Python)**: request nhận được có `lat`/`lng` không, body thế nào, lỗi gì.
3. **Timeout BE → AI**: Render free ngủ sau ~15 phút, đánh thức mất 30–60 giây. Timeout hiện tại có đủ không? Có retry khi gọi lần đầu không?
4. **Khác biệt user**: tài khoản dùng trên FE có gói/lượt `ai_chat` khác tài khoản test Swagger không? Gói hết lượt phải trả **429**, không phải 502.
5. **CORS/gateway**: 502 có thể do Render/proxy trả khi BE quá thời gian phản hồi. Xem response 502 có phải JSON của Spring (`status/error/path`) hay HTML của proxy.

## 5. Thông tin FE sẽ cung cấp thêm

Sau khi cập nhật code, Console của FE in ra khi gặp lỗi:
```
[AI chat] gửi tin lỗi: ERR_BAD_RESPONSE 502
response: {...}
request body: {"content":"...","lat":...,"lng":...}
```
Hãy dán 2 dòng `response` và `request body` này vào ticket để so với các phép thử T1–T6.

## 6. Mong muốn

- BE trả **lỗi rõ nghĩa** thay vì 502 chung: ví dụ `504`/`message: "AI timeout"` khi timeout, `502` + `message` chi tiết khi AI trả lỗi, để FE hiển thị đúng và dễ debug.
- Xác nhận `lat`/`lng` thật sự **tùy chọn** (không gửi hoặc `null` vẫn phải trả 200).
