import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import SiteLayout from './components/layout/SiteLayout.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import Landing from './pages/Landing.jsx';
import PageLoader from './components/ui/PageLoader.jsx';
import { useUiStore } from './stores/uiStore.js';

/*
 * React.lazy + Suspense = code splitting: mỗi nhóm trang build thành bundle riêng,
 * chỉ tải khi user thực sự vào. Quan trọng nhất với Configurator (chứa three.js ~600KB)
 * — nếu import thẳng, khách vào landing page cũng phải tải cả three.js.
 */
const Shop = lazy(() => import('./pages/Shop.jsx'));
const ProductDetail = lazy(() => import('./pages/ProductDetail.jsx'));
const Cart = lazy(() => import('./pages/Cart.jsx'));
const Checkout = lazy(() => import('./pages/Checkout.jsx'));
const OrderDetail = lazy(() => import('./pages/OrderDetail.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const CustomSelect = lazy(() => import('./pages/CustomSelect.jsx'));
const CustomConfigure = lazy(() => import('./pages/CustomConfigure.jsx'));
const WorkshopMatch = lazy(() => import('./pages/WorkshopMatch.jsx'));
const Suppliers = lazy(() => import('./pages/Suppliers.jsx'));
const B2b = lazy(() => import('./pages/B2b.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Pricing = lazy(() => import('./pages/Pricing.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

export default function App() {
  const theme = useUiStore((s) => s.theme);

  // daisyUI đọc theme qua data-theme trên <html> — set ở đây để áp dụng cho toàn app
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Landing đứng riêng: hero full-screen, không dùng layout chung */}
        <Route path="/" element={<Landing />} />

        {/* Các trang còn lại dùng SiteLayout (header + footer) qua nested route */}
        <Route element={<SiteLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:category" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/custom" element={<CustomSelect />} />
          <Route path="/custom/configure/:type" element={<CustomConfigure />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/b2b" element={<B2b />} />
          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/contact" element={<Contact />} />

          {/* ProtectedRoute: chưa login thì đẩy về /login (xem routes/ProtectedRoute.jsx) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/custom/match/:designId" element={<WorkshopMatch />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
