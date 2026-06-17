import PricingSection from '../components/sections/PricingSection.jsx';

// Trang /pricing chỉ render lại PricingSection (cùng phần dùng trong trang gộp /about)
export default function Pricing() {
  return (
    <div className="py-6">
      <PricingSection />
    </div>
  );
}
