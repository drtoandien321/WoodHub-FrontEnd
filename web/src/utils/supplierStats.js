/*
 * supplierStats — tính KPI Dashboard NCC TẠM THỜI từ danh sách đơn thật (GET /supplier/orders).
 *
 * Vì sao tính ở FE: BE chưa có API thống kê cho supplier (docx BE bản 2, mục BE-09). Trước đây Dashboard hiện số
 * giả (doanh thu 320.500.000 ₫…) → đối tác đăng nhập dễ hiểu nhầm. Tính từ đơn thật thì số đúng, chỉ giới hạn
 * ở N đơn mới nhất tải về (STATS_PAGE_SIZE) — trang hiện rõ giới hạn đó. Khi BE có /supplier/stats/* thì thay
 * nguồn dữ liệu, giữ nguyên shape trả về để component không phải sửa.
 *
 * Hàm thuần (không gọi API, không đọc store) → dễ kiểm tra bằng tay / viết test sau này.
 */
export const STATS_PAGE_SIZE = 200;

// Đơn đã thanh toán trở đi mới tính doanh thu; chờ thanh toán / huỷ / hoàn tiền thì không
const REVENUE_STATUSES = new Set(['paid', 'confirmed', 'preparing', 'shipping', 'delivered', 'completed']);
const IN_PROGRESS_STATUSES = new Set(['confirmed', 'preparing', 'shipping']);

const dayKey = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

export function computeOrderStats(orders = [], { days = 7, now = new Date() } = {}) {
  const revenueOrders = orders.filter((o) => REVENUE_STATUSES.has(o.status));
  const amount = (o) => Number(o.totalAmount) || 0; // BigDecimal BE → số (VND nguyên)

  // Doanh thu theo ngày cho `days` ngày gần nhất (kể cả ngày không có đơn = 0 để biểu đồ liền mạch)
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const buckets = new Map();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    buckets.set(dayKey(d), 0);
  }
  for (const o of revenueOrders) {
    const at = new Date(o.placedAt ?? o.createdAt);
    if (at < start) continue;
    const k = dayKey(at);
    if (buckets.has(k)) buckets.set(k, buckets.get(k) + amount(o));
  }
  const revenueByDay = [...buckets].map(([date, value]) => ({ date, value }));

  // Theo chi nhánh: storeId → { address, revenue, orders, completed }
  const branchMap = new Map();
  for (const o of orders) {
    if (!o.storeId) continue;
    const b = branchMap.get(o.storeId) ?? { storeId: o.storeId, address: o.storeAddress, city: o.storeCity, revenue: 0, orders: 0, completed: 0, cancelled: 0 };
    b.orders += 1;
    if (REVENUE_STATUSES.has(o.status)) b.revenue += amount(o);
    if (o.status === 'completed' || o.status === 'delivered') b.completed += 1;
    if (o.status === 'cancelled') b.cancelled += 1;
    branchMap.set(o.storeId, b);
  }
  const branches = [...branchMap.values()].sort((a, b) => b.revenue - a.revenue);

  return {
    revenue: revenueOrders.reduce((s, o) => s + amount(o), 0),
    revenueInRange: revenueByDay.reduce((s, d) => s + d.value, 0),
    paidOrders: revenueOrders.length,
    needConfirm: orders.filter((o) => o.status === 'paid').length,
    inProgress: orders.filter((o) => IN_PROGRESS_STATUSES.has(o.status)).length,
    awaitingPayment: orders.filter((o) => o.status === 'pending_payment').length,
    revenueByDay,
    branches,
  };
}
