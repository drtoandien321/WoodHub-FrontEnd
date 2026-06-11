/*
 * Dữ liệu gói subscription cho trang Pricing — đúng 3 nhóm theo spec B.1:
 * B2C Premium AR/3D (khách mua lẻ), Supplier SaaS (xưởng/NCC), Custom Design Premium/Verified (khách custom).
 * Đợt MVP: chưa có payment thật — FE chỉ hiển thị, nút "Đăng ký gói" theo trạng thái login (xem Pricing.jsx).
 */
export const PLANS = [
  {
    id: 'plan_b2c_premium',
    group: 'b2c',
    name: 'B2C Premium AR/3D',
    pricePerMonth: 49_000,
    features: [
      'Xem AR/3D không giới hạn cho mọi sản phẩm',
      'Tư vấn AI ưu tiên — phản hồi nhanh hơn',
      'Lưu không giới hạn cấu hình phòng đã thử AR',
      'Miễn phí vận chuyển cho đơn từ 2 triệu',
    ],
  },
  {
    id: 'plan_supplier_saas',
    group: 'supplier',
    name: 'Supplier SaaS',
    pricePerMonth: 499_000,
    features: [
      'Đăng sản phẩm không giới hạn lên sàn B2C',
      'Dashboard quản lý đơn hàng & tồn kho',
      'Ưu tiên xuất hiện trong kết quả ghép xưởng (matching)',
      'Báo cáo doanh thu & hiệu suất hàng tháng',
    ],
  },
  {
    id: 'plan_custom_premium',
    group: 'custom',
    name: 'Custom Design Premium/Verified',
    pricePerMonth: 99_000,
    features: [
      'Ưu tiên ghép với xưởng đã xác minh (verified)',
      'Không giới hạn số lượt chỉnh thiết kế 3D',
      'Hỗ trợ kỹ thuật 1-1 trước khi chốt đơn',
      'Bảo hành mở rộng cho sản phẩm custom',
    ],
  },
];
