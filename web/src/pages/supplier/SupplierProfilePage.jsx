import { MANUFACTURER, M_PROFILE } from '../../api/mock/manufacturerData.js';
import ProfileCapabilityView from '../../components/supplier/ProfileCapabilityView.jsx';

export default function SupplierProfilePage() {
  return (
    <ProfileCapabilityView
      name={MANUFACTURER.name}
      description={MANUFACTURER.description}
      profile={M_PROFILE}
      subtitle="Hồ sơ doanh nghiệp hiển thị với khách hàng — năng lực cung ứng, chứng nhận và hình ảnh thực tế."
    />
  );
}
