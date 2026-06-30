/*
 * workshopPortalData.js — MOCK cho Portal XƯỞNG MỘC (workshop: nhận đơn CUSTOM theo yêu cầu,
 * KHÔNG có catalog cố định, KHÔNG nhiều chi nhánh). Self-contained; thay bằng API sau.
 * Khác hẳn manufacturer: trọng tâm là đơn custom → báo giá → tiến độ sản xuất 5 bước.
 */
const IMG = '/mockdataimage';

export const WORKSHOP = {
  id: 'ws_tanphat',
  name: 'Xưởng Mộc Tân Phát',
  initials: 'TP',
  email: 'xuong@tanphatwood.vn',
  hotline: '0907 888 999',
  address: 'KCN Tân Bình, Q. Tân Bình, TP. Hồ Chí Minh',
  description:
    'Xưởng Mộc Tân Phát chuyên nhận thiết kế và gia công nội thất gỗ tự nhiên theo yêu cầu. Đội ngũ thợ lành nghề, máy móc hiện đại, cam kết đúng mẫu — đúng tiến độ.',
  contactName: 'Anh Lê Tân Phát',
  joinDate: '05/2022',
  status: 'active',
};

export const W_DASHBOARD = {
  kpis: [
    { key: 'newCustom', label: 'Đơn custom mới', value: 12, delta: 10.5, icon: 'inbox' },
    { key: 'quotePending', label: 'Chờ báo giá', value: 5, delta: 0, icon: 'quote' },
    { key: 'producing', label: 'Đang sản xuất', value: 8, delta: 4.0, icon: 'hammer' },
    { key: 'rating', label: 'Đánh giá trung bình', value: '4.9/5', delta: 0.1, icon: 'star' },
  ],
  revenue7d: [
    { date: '22/06', value: 14_000_000 }, { date: '23/06', value: 22_000_000 }, { date: '24/06', value: 18_000_000 },
    { date: '25/06', value: 31_000_000 }, { date: '26/06', value: 26_000_000 }, { date: '27/06', value: 35_000_000 }, { date: '28/06', value: 29_000_000 },
  ],
  secondary: [
    { key: 'orders', label: 'Đơn custom', value: '86', hint: 'Tổng đơn đã nhận', to: '/portal/workshop/orders', icon: 'inbox' },
    { key: 'producing', label: 'Đang sản xuất', value: '8', hint: 'Theo dõi tiến độ', to: '/portal/workshop/production', icon: 'hammer' },
    { key: 'customers', label: 'Khách hàng', value: '320', hint: 'Đã hợp tác', to: '/portal/workshop/reviews', icon: 'users' },
    { key: 'reviews', label: 'Đánh giá', value: '152', hint: 'Từ khách hàng', to: '/portal/workshop/reviews', icon: 'star' },
  ],
};

// Đơn custom & báo giá
export const W_ORDERS = [
  {
    id: 'CUS-2041', date: '28/06/2025 09:20', customerName: 'Anh Hoàng Nam', customerPhone: '0909 111 222',
    title: 'Tủ bếp chữ L gỗ sồi', image: `${IMG}/Tủ quần áo 3 cánh gỗ MDF phủ melamine.jpg`,
    specs: 'Dài 3.2m, gỗ sồi tự nhiên, sơn PU mờ', qty: 1, status: 'quote_pending', step: 'received',
  },
  {
    id: 'CUS-2040', date: '27/06/2025 15:10', customerName: 'Chị Lan Phương', customerPhone: '0908 333 444',
    title: 'Bàn ăn 8 ghế mặt liền', image: `${IMG}/Bàn ăn gỗ sồi 6 ghế.jpg`,
    specs: 'Mặt gỗ óc chó nguyên tấm 2.2m', qty: 1, status: 'quoted', step: 'designing', quotedPrice: 24_000_000, quotedDays: 18,
  },
  {
    id: 'CUS-2039', date: '25/06/2025 11:00', customerName: 'Anh Quốc Việt', customerPhone: '0933 555 666',
    title: 'Kệ tivi treo tường', image: `${IMG}/Kệ tivi gỗ óc chó 1m8.jpg`,
    specs: 'Dài 1.8m, gỗ óc chó, kèm ngăn kéo', qty: 1, status: 'producing', step: 'producing', quotedPrice: 9_500_000, quotedDays: 12,
  },
  {
    id: 'CUS-2038', date: '22/06/2025 14:30', customerName: 'Chị Mỹ Linh', customerPhone: '0977 777 888',
    title: 'Giường ngủ gỗ sồi 1m8', image: `${IMG}/Giường ngủ gỗ sồi 1m6.jpg`,
    specs: 'Đầu giường bọc nệm, gỗ sồi', qty: 1, status: 'producing', step: 'finishing', quotedPrice: 16_000_000, quotedDays: 15,
  },
  {
    id: 'CUS-2035', date: '18/06/2025 10:05', customerName: 'Anh Đức Anh', customerPhone: '0966 999 000',
    title: 'Bàn làm việc chân chữ A', image: `${IMG}/Bàn làm việc gỗ thông chân chữ A.jpg`,
    specs: 'Gỗ thông, dài 1.4m', qty: 2, status: 'completed', step: 'delivering', quotedPrice: 7_200_000, quotedDays: 10,
  },
];

export const W_PROFILE = {
  cover: `${IMG}/Bàn làm việc gỗ thông chân chữ A.jpg`,
  strengths: ['Nhận thiết kế theo yêu cầu', 'Gỗ tự nhiên 100%', 'Bản vẽ 3D miễn phí', 'Bảo hành 2–5 năm'],
  capabilities: [
    { label: 'Loại sản phẩm', value: 'Bàn, ghế, tủ, kệ, giường, vách' },
    { label: 'Khổ tối đa', value: 'Rộng 300 cm' },
    { label: 'Gỗ hỗ trợ', value: 'Sồi, óc chó, tần bì, cao su' },
    { label: 'Công suất', value: '30–40 đơn / tháng' },
  ],
  portfolio: [
    `${IMG}/Bàn ăn gỗ sồi 6 ghế.jpg`, `${IMG}/Kệ sách gỗ óc chó 5 tầng.jpg`, `${IMG}/Kệ tivi gỗ óc chó 1m8.jpg`,
    `${IMG}/Giường ngủ gỗ sồi 1m6.jpg`, `${IMG}/Tủ quần áo 3 cánh gỗ MDF phủ melamine.jpg`, `${IMG}/Bàn làm việc gỗ thông chân chữ A.jpg`,
  ],
  certs: ['Xưởng xác minh WoodHub', 'Cam kết gỗ tự nhiên', '8 năm kinh nghiệm'],
};

export const W_REVIEWS_SUMMARY = {
  average: 4.9, total: 152,
  distribution: [{ star: 5, count: 138 }, { star: 4, count: 10 }, { star: 3, count: 3 }, { star: 2, count: 1 }, { star: 1, count: 0 }],
};
export const W_REVIEWS = [
  { id: 'wr1', name: 'Anh Hoàng Nam', date: '20/06/2025', rating: 5, product: 'Tủ bếp chữ L gỗ sồi', text: 'Xưởng làm đúng mẫu, đường nét sắc sảo, giao đúng hẹn. Rất ưng!', replied: true },
  { id: 'wr2', name: 'Chị Lan Phương', date: '14/06/2025', rating: 5, product: 'Bàn ăn óc chó nguyên tấm', text: 'Mặt gỗ đẹp tự nhiên, tư vấn nhiệt tình từ bản vẽ đến thành phẩm.', replied: false },
  { id: 'wr3', name: 'Anh Quốc Việt', date: '08/06/2025', rating: 4, product: 'Kệ tivi treo tường', text: 'Sản phẩm chắc chắn, thi công gọn gàng. Sẽ quay lại.', replied: false },
];

export const W_REPORTS = {
  kpis: [
    { label: 'Doanh thu', value: 175_000_000, money: true, delta: 9.8 },
    { label: 'Đơn custom', value: 86, delta: 6.2 },
    { label: 'Giá trị đơn TB', value: 12_300_000, money: true, delta: 4.5 },
    { label: 'Tỷ lệ đúng hẹn', value: '94%', delta: 1.6 },
  ],
  ordersByStatus: [
    { key: 'quote_pending', label: 'Chờ báo giá', value: 5 },
    { key: 'quoted', label: 'Đã báo giá', value: 9 },
    { key: 'producing', label: 'Đang sản xuất', value: 8 },
    { key: 'completed', label: 'Hoàn thành', value: 60 },
    { key: 'cancelled', label: 'Đã hủy', value: 4 },
  ],
  topItems: [
    { name: 'Tủ bếp custom', sold: 18, revenue: 64_000_000, growth: 14.0 },
    { name: 'Bàn ăn nguyên tấm', sold: 12, revenue: 52_000_000, growth: 9.5 },
    { name: 'Kệ tivi treo tường', sold: 15, revenue: 28_000_000, growth: 6.0 },
    { name: 'Giường ngủ gỗ sồi', sold: 9, revenue: 31_000_000, growth: -2.0 },
  ],
  alerts: [
    { tone: 'warning', text: '5 đơn đang chờ báo giá' },
    { tone: 'error', text: '2 đơn sản xuất sắp trễ hẹn' },
    { tone: 'info', text: '3 đơn cần cập nhật tiến độ' },
  ],
};

export const findWOrder = (id) => W_ORDERS.find((o) => o.id === id);
