# WoodHub — Sàn nội thất gỗ B2C · B2B · Custom

Monorepo MVP cho đồ án EXE101 (FPT University HCMC).

```
woodhub/
├── web/                  # React 19 + Vite — web app chính (ĐÃ BUILD PASS)
├── mobile/               # Expo SDK 54 — app di động (scaffold, chưa test máy thật)
├── docs/API_CONTRACT.md  # Contract FE ↔ BE — team BE đọc file này TRƯỚC TIÊN
└── ANTIGRAVITY_PROMPT.md # Prompt cho AI agent khi phát triển tiếp
```

## Chạy web (2 phút)
```bash
cd web
npm install
npm run dev        # mở http://localhost:5173
```
Mặc định chạy **mock mode** — không cần BE. Khi BE sẵn sàng:
```bash
cp .env.example .env   # sửa VITE_USE_MOCK=false, VITE_API_URL=...
```

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
