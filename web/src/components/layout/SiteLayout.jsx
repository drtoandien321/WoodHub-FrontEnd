import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

// Layout chung cho mọi trang trừ Landing — Outlet là chỗ render trang con (nested route)
export default function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
