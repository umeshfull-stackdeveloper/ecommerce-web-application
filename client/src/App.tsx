import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks/reduxHooks';

// Layouts
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ToastContainer from './components/common/ToastContainer';
import CompareDrawer from './components/common/CompareDrawer';
import AIShoppingAssistant from './components/common/AIShoppingAssistant';
import socketService from './socket/socketService';

// Pages
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetails from './pages/ProductDetails';
import CartPage from './pages/CartPage';
import Auth from './pages/Auth';
import Checkout from './pages/Checkout';
import MockCheckout from './pages/MockCheckout';
import OrderSuccess from './pages/OrderSuccess';
import OrderFailed from './pages/OrderFailed';
import Orders from './pages/Orders';
import Wishlist from './pages/Wishlist';
import ChatSupport from './pages/ChatSupport';

// Dashboards
import AdminDashboard from './pages/dashboard/AdminDashboard';
import SellerDashboard from './pages/dashboard/SellerDashboard';

// Guards
function CustomerGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
}

function SellerGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  return isAuthenticated && user?.role === 'SELLER' 
    ? <>{children}</> 
    : <Navigate to="/auth" replace />;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  return isAuthenticated && user?.role === 'ADMIN' 
    ? <>{children}</> 
    : <Navigate to="/auth" replace />;
}

export default function App() {
  const themeMode = useAppSelector((state) => state.theme.mode);
  const { accessToken } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (themeMode === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [themeMode]);

  useEffect(() => {
    if (accessToken) {
      socketService.connect(accessToken);
    } else {
      socketService.disconnect();
    }
    return () => {
      socketService.disconnect();
    };
  }, [accessToken]);

  return (
    <Router>
      <div className="flex min-h-screen flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
        <Navbar />
        
        <main className="flex-grow mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Catalog />} />
            <Route path="/product/:slug" element={<ProductDetails />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/payment/mock-checkout" element={<MockCheckout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/order-failed" element={<OrderFailed />} />

            {/* Customer Guarded Routes */}
            <Route path="/checkout" element={<CustomerGuard><Checkout /></CustomerGuard>} />
            <Route path="/orders" element={<CustomerGuard><Orders /></CustomerGuard>} />
            <Route path="/wishlist" element={<CustomerGuard><Wishlist /></CustomerGuard>} />
            <Route path="/chat" element={<CustomerGuard><ChatSupport /></CustomerGuard>} />

            {/* Seller Guarded Routes */}
            <Route path="/seller" element={<SellerGuard><SellerDashboard /></SellerGuard>} />

            {/* Admin Guarded Routes */}
            <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
        <ToastContainer />
        <CompareDrawer />
        <AIShoppingAssistant />
      </div>
    </Router>
  );
}
