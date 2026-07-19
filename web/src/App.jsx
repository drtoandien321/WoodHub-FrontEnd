import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SiteLayout from './components/layout/SiteLayout.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import Landing from './pages/Landing.jsx';
import PageLoader from './components/ui/PageLoader.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import ChatWidget from './components/chatbot/ChatWidget.jsx';
import ChatDrawer from './components/chat/ChatDrawer.jsx';
import { useUiStore } from './stores/uiStore.js';

/*
 * React.lazy + Suspense = code splitting: mỗi nhóm trang build thành bundle riêng,
 * chỉ tải khi user thực sự vào. Quan trọng nhất với Configurator (chứa three.js ~600KB)
 * — nếu import thẳng, khách vào landing page cũng phải tải cả three.js.
 */
const Shop = lazy(() => import('./pages/Shop.jsx'));
const ProductDetail = lazy(() => import('./pages/ProductDetail.jsx'));
const RoomsIndex = lazy(() => import('./pages/RoomsIndex.jsx'));
const RoomScenes = lazy(() => import('./pages/RoomScenes.jsx'));
const RoomSceneViewer = lazy(() => import('./pages/RoomSceneViewer.jsx'));
const MyQuotes = lazy(() => import('./pages/MyQuotes.jsx'));
const QuoteDetail = lazy(() => import('./pages/QuoteDetail.jsx'));
const MyCustomOrders = lazy(() => import('./pages/MyCustomOrders.jsx'));
const CustomOrderDetail = lazy(() => import('./pages/CustomOrderDetail.jsx'));
const Cart = lazy(() => import('./pages/Cart.jsx'));
const Checkout = lazy(() => import('./pages/Checkout.jsx'));
const Orders = lazy(() => import('./pages/Orders.jsx'));
const OrderDetail = lazy(() => import('./pages/OrderDetail.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const MySubscription = lazy(() => import('./pages/MySubscription.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const VerifyOtp = lazy(() => import('./pages/VerifyOtp.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const ChangePasswordRequired = lazy(() => import('./pages/ChangePasswordRequired.jsx'));
const CustomSelect = lazy(() => import('./pages/CustomSelect.jsx'));
const CustomConfigure = lazy(() => import('./pages/CustomConfigure.jsx'));
const CustomModels = lazy(() => import('./pages/CustomModels.jsx'));
const CustomModelViewer = lazy(() => import('./pages/CustomModelViewer.jsx'));
const CustomStudio = lazy(() => import('./pages/CustomStudio.jsx'));
const CustomDesigns = lazy(() => import('./pages/CustomDesigns.jsx'));
const WorkshopMatch = lazy(() => import('./pages/WorkshopMatch.jsx'));
const Suppliers = lazy(() => import('./pages/Suppliers.jsx'));
const SupplierProfile = lazy(() => import('./pages/SupplierProfile.jsx'));
const B2b = lazy(() => import('./pages/B2b.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Pricing = lazy(() => import('./pages/Pricing.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));
const Forbidden = lazy(() => import('./pages/Forbidden.jsx'));
// Portal Quản trị viên — /admin/*
const AdminPortalLayout = lazy(() => import('./components/layout/AdminPortalLayout.jsx'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories.jsx'));
const AdminMaterials = lazy(() => import('./pages/admin/AdminMaterials.jsx'));
const AdminSuppliers = lazy(() => import('./pages/admin/AdminSuppliers.jsx'));
const AdminSupplierDetail = lazy(() => import('./pages/admin/AdminSupplierDetail.jsx'));
const AdminSubscriptionPlans = lazy(() => import('./pages/admin/AdminSubscriptionPlans.jsx'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers.jsx'));
const AdminUserDetail = lazy(() => import('./pages/admin/AdminUserDetail.jsx'));
// Portal Nhà cung cấp (manufacturer) — khu vực mới /portal/supplier/*
const SupplierPortalLayout = lazy(() => import('./components/layout/SupplierPortalLayout.jsx'));
const SupplierDashboard = lazy(() => import('./pages/supplier/SupplierDashboard.jsx'));
const SupplierBranches = lazy(() => import('./pages/supplier/SupplierBranches.jsx'));
const SupplierBranchDetail = lazy(() => import('./pages/supplier/SupplierBranchDetail.jsx'));
const SupplierProducts = lazy(() => import('./pages/supplier/SupplierProducts.jsx'));
const SupplierProductDetail = lazy(() => import('./pages/supplier/SupplierProductDetail.jsx'));
const SupplierOrders = lazy(() => import('./pages/supplier/SupplierOrders.jsx'));
const SupplierReviewsPage = lazy(() => import('./pages/supplier/SupplierReviews.jsx'));
const SupplierProfilePage = lazy(() => import('./pages/supplier/SupplierProfilePage.jsx'));
const SupplierReports = lazy(() => import('./pages/supplier/SupplierReports.jsx'));
const SupplierSettings = lazy(() => import('./pages/supplier/SupplierSettings.jsx'));
// Portal Xưởng mộc (workshop) — /portal/workshop/*
const WorkshopPortalLayout = lazy(() => import('./components/layout/WorkshopPortalLayout.jsx'));
const WorkshopDashboard = lazy(() => import('./pages/workshop/WorkshopDashboard.jsx'));
const WorkshopOrders = lazy(() => import('./pages/workshop/WorkshopOrders.jsx'));
const WorkshopProduction = lazy(() => import('./pages/workshop/WorkshopProduction.jsx'));
const WorkshopPortfolio = lazy(() => import('./pages/workshop/WorkshopPortfolio.jsx'));
const WorkshopReviews = lazy(() => import('./pages/workshop/WorkshopReviews.jsx'));
const WorkshopReports = lazy(() => import('./pages/workshop/WorkshopReports.jsx'));
const WorkshopSettings = lazy(() => import('./pages/workshop/WorkshopSettings.jsx'));

export default function App() {
  const theme = useUiStore((s) => s.theme);

  // daisyUI đọc theme qua data-theme trên <html> — set ở đây để áp dụng cho toàn app
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <Suspense fallback={<PageLoader />}>
      <ScrollToTop />
      {/* Chatbot nổi toàn cục — tự ẩn ở trang auth (xem ChatWidget) */}
      <ChatWidget />
      {/* Khung chat với nhà cung cấp (mở từ trang sản phẩm / hồ sơ NCC) */}
      <ChatDrawer />
      <Routes>
        {/* Landing đứng riêng: hero full-screen, không dùng layout chung */}
        <Route path="/" element={<Landing />} />

        {/* Trang xác thực: layout RIÊNG (AuthLayout full màn hình), KHÔNG header/footer */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Ép đổi mật khẩu (tài khoản supplier do admin tạo) — cần đăng nhập, không cần role cụ thể.
            ProtectedRoute tự redirect vào đây nếu user.mustChangePassword=true (xem routes/ProtectedRoute.jsx) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/change-password" element={<ChangePasswordRequired />} />
        </Route>

        {/* Các trang còn lại dùng SiteLayout (header + footer) qua nested route */}
        <Route element={<SiteLayout />}>
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:category" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          {/* Shop by Room (FE-5) — công khai, giống Shop */}
          <Route path="/rooms" element={<RoomsIndex />} />
          <Route path="/rooms/:roomSlug" element={<RoomScenes />} />
          <Route path="/rooms/:roomSlug/scenes/:sceneId" element={<RoomSceneViewer />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/custom" element={<CustomSelect />} />
          <Route path="/custom/models" element={<CustomModels />} />
          <Route path="/custom/models/:slug" element={<CustomModelViewer />} />
          <Route path="/custom/configure/:type" element={<CustomConfigure />} />
          <Route path="/suppliers" element={<Suppliers />} />
          {/* BE không có slug — định danh bằng UUID */}
          <Route path="/suppliers/:id" element={<SupplierProfile />} />
          <Route path="/b2b" element={<B2b />} />
          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/contact" element={<Contact />} />

          {/* ProtectedRoute: chưa login thì đẩy về /login (xem routes/ProtectedRoute.jsx) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/account/subscription" element={<MySubscription />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/custom/match/:designId" element={<WorkshopMatch />} />
            {/* Custom Studio (FE-2): wizard 6 bước, cần đăng nhập vì generate/lưu thiết kế tính vào hạn mức `design` */}
            <Route path="/custom/studio" element={<CustomStudio />} />
            <Route path="/custom/designs" element={<CustomDesigns />} />
            {/* Quote & Order (FE-6, BE-8) — DÙNG CHUNG customer/workshop, allow không giới hạn role
                (chỉ cần đăng nhập) vì QuoteDetail/CustomOrderDetail tự nhận diện vai qua customerId */}
            <Route path="/quotes" element={<MyQuotes />} />
            <Route path="/quotes/:id" element={<QuoteDetail />} />
            <Route path="/custom-orders" element={<MyCustomOrders />} />
            <Route path="/custom-orders/:id" element={<CustomOrderDetail />} />
          </Route>

          <Route path="/403" element={<Forbidden />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Supplier Portal: layout riêng (sidebar + topbar), chỉ role supplier.
            /portal trần (portal cũ đã xoá) → đưa về portal nhà cung cấp cho link cũ khỏi 404. */}
        <Route element={<ProtectedRoute allow={['supplier']} />}>
          <Route path="/portal" element={<Navigate to="/portal/supplier/dashboard" replace />} />

          {/* Portal Nhà cung cấp (manufacturer): /portal/supplier/* */}
          <Route path="/portal/supplier" element={<SupplierPortalLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SupplierDashboard />} />
            <Route path="branches" element={<SupplierBranches />} />
            <Route path="branches/:branchId" element={<SupplierBranchDetail />} />
            <Route path="products" element={<SupplierProducts />} />
            <Route path="products/:productId" element={<SupplierProductDetail />} />
            <Route path="orders" element={<SupplierOrders />} />
            <Route path="reviews" element={<SupplierReviewsPage />} />
            <Route path="profile" element={<SupplierProfilePage />} />
            <Route path="reports" element={<SupplierReports />} />
            <Route path="settings" element={<SupplierSettings />} />
          </Route>

          {/* Portal Xưởng mộc (workshop): /portal/workshop/* */}
          <Route path="/portal/workshop" element={<WorkshopPortalLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<WorkshopDashboard />} />
            <Route path="orders" element={<WorkshopOrders />} />
            <Route path="production" element={<WorkshopProduction />} />
            <Route path="portfolio" element={<WorkshopPortfolio />} />
            <Route path="reviews" element={<WorkshopReviews />} />
            <Route path="reports" element={<WorkshopReports />} />
            <Route path="settings" element={<WorkshopSettings />} />
          </Route>
        </Route>

        {/* Portal Quản trị viên: layout riêng, chỉ role admin. */}
        <Route element={<ProtectedRoute allow={['admin']} />}>
          <Route path="/admin" element={<AdminPortalLayout />}>
            <Route index element={<Navigate to="users" replace />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:id" element={<AdminUserDetail />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="materials" element={<AdminMaterials />} />
            <Route path="suppliers" element={<AdminSuppliers />} />
            <Route path="suppliers/:id" element={<AdminSupplierDetail />} />
            <Route path="subscription-plans" element={<AdminSubscriptionPlans />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
