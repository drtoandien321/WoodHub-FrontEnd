import { WORKSHOP, W_PROFILE } from '../../api/mock/workshopPortalData.js';
import ProfileCapabilityView from '../../components/supplier/ProfileCapabilityView.jsx';

export default function WorkshopPortfolio() {
  return (
    <ProfileCapabilityView
      name={WORKSHOP.name}
      description={WORKSHOP.description}
      profile={W_PROFILE}
      subtitle="Hồ sơ xưởng hiển thị với khách hàng — năng lực gia công, ảnh công trình và cam kết chất lượng."
    />
  );
}
