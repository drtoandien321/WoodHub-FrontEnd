import ProfileCapabilityView from '../../components/supplier/ProfileCapabilityView.jsx';

export default function SupplierProfilePage() {
  return (
    <ProfileCapabilityView
      subtitle="Hồ sơ doanh nghiệp hiển thị với khách hàng — giới thiệu và hình ảnh thực tế."
      settingsPath="/portal/supplier/settings"
      allowProducts
    />
  );
}
