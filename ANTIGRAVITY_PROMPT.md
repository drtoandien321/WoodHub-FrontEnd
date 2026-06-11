# ANTIGRAVITY PROMPT — WoodHub MVP

> Copy toàn bộ phần dưới đây vào Antigravity (hoặc agent AI khác) khi cần
> phát triển tiếp codebase này. Prompt đã nhúng đủ context để agent không
> phá vỡ các quyết định kiến trúc đã chốt.

---

Bạn là developer tiếp quản monorepo **WoodHub** — sàn TMĐT nội thất gỗ
(B2C / B2B / Custom) cho đồ án EXE101, FPT University HCMC. Deadline gấp
(demo trong ~2 tuần), ưu tiên CHẠY ĐƯỢC hơn hoàn hảo.

## Cấu trúc repo
```
woodhub/
├── web/        # React 19 + Vite 6 — ĐÃ BUILD PASS, đừng đổi stack
├── mobile/     # Expo SDK 54 — scaffold xong, CHƯA install/test trên máy thật
└── docs/
    └── API_CONTRACT.md   # Nguồn sự thật FE ↔ BE — đọc TRƯỚC khi viết API
```

## Stack & quyết định KHÓA (không đổi nếu không có lý do rất mạnh)
- **Web:** React 19 + Vite, Tailwind CSS v4 + daisyUI v5 (theme `woodhub`
  khai báo trong `web/src/index.css` bằng `@plugin` — KHÔNG có
  tailwind.config.js, đó là cách của Tailwind v4, đừng "sửa lỗi" này).
  React Router v7, TanStack React Query v5 (server state), Zustand v5
  (client state: auth/cart/configurator), axios, @react-three/fiber v9 +
  drei v10 (web), motion v12.
- **Mobile:** Expo SDK 54, react 19.1.0 + react-native 0.81.5 (bộ version
  đã được verify tương thích — nếu npm install lỗi peer deps, dùng
  `npx expo install --fix` rồi `npm install --legacy-peer-deps`).
  @react-three/fiber/native + expo-gl cho 3D, KHÔNG dùng drei trong
  mobile (hỗ trợ native flaky).
- **Mock-first:** mọi API đi qua `web/src/api/client.js` (mobile:
  `mobile/src/api/client.js`). `VITE_USE_MOCK=true` → mock adapter;
  `false` → BE thật. KHÔNG gọi axios/fetch trực tiếp trong component.
- **Scope MVP đã chốt (KHÔNG mở rộng):** configurator 3D chỉ
  size/material/màu; matching xưởng RULE-BASED (không AI); checkout
  GIẢ LẬP (không VNPay/MoMo thật); không admin UI, không B2B flow,
  không i18n.
- **Convention:** code/biến tiếng Anh camelCase, UI text tiếng Việt,
  comment giải thích "tại sao" bằng tiếng Việt. Secret qua .env.

## Design tokens (đồng bộ web + mobile, đừng chế màu mới)
ivory `#F4EFE6` (nền) · walnut `#5B4232` (primary) · oak `#B08968` ·
gold `#C9A227` (accent) · forest `#3F5E4E`. Fonts web: Be Vietnam Pro
(body) + Lora (display). Mobile: `src/theme/colors.js`.

## Trạng thái hiện tại
- **Web HOÀN CHỈNH cho demo path:** Landing (hero kiểu RIVR đã đổi brand,
  thiếu video — điền `HERO_VIDEO_URL` trong
  `web/src/components/hero/Hero.jsx`) → Login/Register → Shop (filter
  trên URL) → ProductDetail → Cart → Checkout giả lập → OrderDetail;
  Custom: chọn loại → Configurator 3D (mô hình parametric từ box, xem
  `FurnitureModel.jsx`) → lưu design → WorkshopMatch rule-based.
- **Mobile scaffold xong:** 4 tab (Home/Shop/Custom/Cart) + 6 screens,
  cùng API contract và công thức giá với web. CHƯA chạy `npm install`.

## Việc tiếp theo theo thứ tự ưu tiên
1. **Chạy thử mobile trên Expo Go:** `cd mobile && npx expo install --fix
   && npm install --legacy-peer-deps && npx expo start`. Sửa lỗi runtime
   nếu có (nghi ngờ chính: phiên bản expo-gl/three — nếu Canvas crash,
   kiểm tra `npx expo install expo-gl` đã align version chưa).
2. **Nối BE Spring Boot:** làm theo đúng thứ tự trong mục "Thứ tự ưu tiên
   cho BE" cuối `docs/API_CONTRACT.md`. Trả đúng shape là FE chạy —
   test bằng cách đặt `VITE_USE_MOCK=false`.
3. **Polish demo:** video hero, ảnh sản phẩm thật thay SVG placeholder
   (mock data: `web/src/api/mock/data.js`), texture vân gỗ cho 3D
   (thay `meshStandardMaterial color` bằng map trong `FurnitureModel.jsx`).
4. KHÔNG làm: admin UI, B2B, thanh toán thật, AI matching — ngoài scope.

## Cách verify công việc
- Web: `cd web && npm run build` phải pass; chạy `npm run dev` và đi hết
  demo path: landing → shop → detail → cart → checkout → order; custom →
  configure → save → match.
- Logic matching có thể test nhanh không cần UI:
  `node --input-type=module -e "import {mockAdapter} from './src/api/mock/mockAdapter.js'; ..."`
- Mobile: chạy được trên Expo Go, đi hết 4 tab, configurator xoay được
  và giá đổi theo slider.
