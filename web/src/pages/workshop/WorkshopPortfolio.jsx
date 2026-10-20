import ProfileCapabilityView from '../../components/supplier/ProfileCapabilityView.jsx';

// Xưởng không có catalog sản phẩm → portfolio chỉ thêm bằng link ảnh (allowProducts=false)
export default function WorkshopPortfolio() {
  return (
    <ProfileCapabilityView
      subtitle="Hồ sơ xưởng hiển thị với khách hàng — giới thiệu và ảnh công trình đã làm."
      settingsPath="/portal/workshop/settings"
    />
  );
}
