import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import SiteLayout from './components/layout/SiteLayout.jsx';
import PortalLayout from './components/layout/PortalLayout.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import Landing from './pages/Landing.jsx';
import PageLoader from './components/ui/PageLoader.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
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
const Orders = lazy(() => import('./pages/Orders.jsx'));
const OrderDetail = lazy(() => import('./pages/OrderDetail.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
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
const Forbidden = lazy(() => import('./pages/Forbidden.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const PortalDashboard = lazy(() => import('./pages/portal/PortalDashboard.jsx'));
const PortalStore = lazy(() => import('./pages/portal/PortalStore.jsx'));
const PortalProducts = lazy(() => import('./pages/portal/PortalProducts.jsx'));
const PortalOrders = lazy(() => import('./pages/portal/PortalOrders.jsx'));

export default function App() {
  const theme = useUiStore((s) => s.theme);

  // daisyUI đọc theme qua data-theme trên <html> — set ở đây để áp dụng cho toàn app
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <Suspense fallback={<PageLoader />}>
      <ScrollToTop />
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
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/custom/match/:designId" element={<WorkshopMatch />} />
          </Route>

          {/* allow=['admin']: chỉ role admin vào được, role khác bị đẩy sang /403 */}
          <Route element={<ProtectedRoute allow={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route path="/403" element={<Forbidden />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Supplier Portal: layout riêng (sidebar + topbar), chỉ role supplier */}
        <Route element={<ProtectedRoute allow={['supplier']} />}>
          <Route path="/portal" element={<PortalLayout />}>
            <Route index element={<PortalDashboard />} />
            <Route path="store" element={<PortalStore />} />
            <Route path="products" element={<PortalProducts />} />
            <Route path="orders" element={<PortalOrders />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
