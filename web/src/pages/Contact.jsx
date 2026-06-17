import ContactSection from '../components/sections/ContactSection.jsx';

// Trang /contact chỉ render lại ContactSection (cùng phần dùng trong trang gộp /about)
export default function Contact() {
  return (
    <div className="py-6">
      <ContactSection />
    </div>
  );
}
