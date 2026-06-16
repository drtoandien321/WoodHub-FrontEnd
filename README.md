# WoodHub — Sàn nội thất gỗ B2C · B2B · Custom

Monorepo MVP cho đồ án EXE101 (FPT University HCMC).

```
woodhub/
├── web/                  # React 19 + Vite — web app chính (ĐÃ BUILD PASS)
├── mobile/               # Expo SDK 54 — app di động (scaffold, chưa test máy thật)
├── backend/              # Spring Boot + PostgreSQL (Supabase) — repo riêng: xuanmai000/woodhub-be
├── docs/API_CONTRACT.md  # Contract FE ↔ BE — team BE đọc file này TRƯỚC TIÊN
└── ANTIGRAVITY_PROMPT.md # Prompt cho AI agent khi phát triển tiếp
```

> ℹ️ **backend/ là repo Git riêng** (nested) — clone từ `xuanmai000/woodhub-be`, vẫn
> push/pull về repo của nó. Repo FE đã `.gitignore` folder `backend/` nên không track nó.

## Trạng thái tích hợp FE ↔ BE
BE (Spring Boot, cổng **8081**) hiện mới có nhóm **Auth + User**. FE đã gắn **login/register**
vào BE thật; các tính năng khác (products, orders, custom, supplier...) **tự động dùng mock**
cho tới khi BE làm xong — danh sách endpoint đã có BE nằm ở `REAL_ENDPOINTS` trong
`web/src/api/client.js`, BE thêm endpoint nào thì thêm key vào đó.

Lưu ý hành vi hiện tại của BE: `register` luôn tạo `role = customer` (chưa hỗ trợ đăng ký
supplier/business); `login` tự xác định role từ tài khoản (bỏ qua role chọn trên form).

## Chạy web (2 phút)
```bash
cd web
npm install
npm run dev        # mở http://localhost:5173
```
File `web/.env` đã set sẵn `VITE_USE_MOCK=false` + `VITE_API_URL=http://localhost:8081/api`
→ login/register gọi BE thật, phần còn lại vẫn mock. Muốn chạy FE độc lập (không cần BE),
đổi `VITE_USE_MOCK=true`.

## Chạy backend (Spring Boot)
```bash
cd backend
./mvnw spring-boot:run     # Windows: mvnw.cmd spring-boot:run — chạy ở http://localhost:8081
```
Swagger UI: http://localhost:8081/swagger-ui/index.html
Cần JDK 17+ và kết nối được Postgres (Supabase) cấu hình trong
`backend/src/main/resources/application.properties`.

> ⚠️ Bảo mật: file properties đang **hardcode mật khẩu Supabase** và đã commit lên GitHub.
> Nên đổi mật khẩu DB và chuyển sang biến môi trường (việc của team BE).

## Chạy mobile
```bash
cd mobile
npx expo install --fix              # align version theo SDK 54
npm install --legacy-peer-deps      # nếu bị lỗi peer dependency
npx expo start                      # quét QR bằng Expo Go
```
⚠️ Khi nối BE thật: sửa `API_URL` trong `mobile/src/api/client.js` thành
**IP LAN của máy chạy BE** (vd `http://192.168.1.x:8080/api`) — `localhost`
trên điện thoại trỏ về chính điện thoại, không phải máy tính.

## Demo path (luồng chấm điểm)
1. Landing → hero → "Khám phá ngay"
2. Shop → filter danh mục → ProductDetail → thêm giỏ
3. Cart → Checkout (cần login — nhập email bất kỳ ở mock mode) → Order
4. Thiết kế Custom → chọn loại → kéo slider kích thước, đổi gỗ/màu trên
   mô hình 3D → "Lưu thiết kế & tìm xưởng" → danh sách xưởng xếp hạng

## Kiến trúc 1 phút cho người mới vào team
- **Mock-first:** UI gọi `src/api/client.js`, không gọi axios trực tiếp.
  Mock adapter trả đúng response shape trong `docs/API_CONTRACT.md` —
  BE trả đúng shape là cắm vào chạy.
- **State chia 2 loại:** server state (sản phẩm, đơn hàng...) → React
  Query; client state (auth, giỏ, cấu hình 3D) → Zustand.
- **3D parametric:** mô hình dựng từ box primitives, scale theo kích
  thước thật (không cần file .glb) — `web/src/components/configurator/`.
- **Matching rule-based:** lọc theo năng lực xưởng + chấm điểm
  rating/tốc độ/kinh nghiệm — `mockAdapter.matchWorkshops`, BE port y nguyên.
