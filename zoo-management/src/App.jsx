import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { toast } from "sonner";

// Components
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";

// Pages
import { HomePage } from "./pages/HomePage.jsx";
import { AnimalsPage } from "./pages/AnimalsPage";
import { AttractionsPage } from "./pages/AttractionsPage";
import { ShopPage } from "./pages/ShopPage";
import { FoodPage } from "./pages/FoodPage";
import { TicketsPage } from "./pages/TicketsPage";
import { CartPage } from "./pages/CartPage.jsx";
import { CustomerDashboard } from "./pages/CustomerDashboard.jsx";
import { OrderHistoryPage } from "./pages/OrderHistoryPage";

// Staff Portals
import { VeterinarianPortal } from "./pages/staff/VeterinarianPortal.jsx";
import { ZookeeperPortal } from "./pages/staff/ZookeeperPortal.jsx";
import { GiftShopPortal } from "./pages/staff/GiftShopPortal.jsx";
import { ConcessionPortal } from "./pages/staff/ConcessionPortal.jsx";
import { AdminPortal } from "./pages/AdminPortal.jsx";

// Login
import { LoginPage } from "./pages/LoginPage";

import { Toaster } from "./components/ui/sonner";
import { DataProvider } from "./data/DataContext";
import { PricingProvider } from "./data/PricingContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Page titles mapping
const PAGE_TITLES = {
  "/": "Home",
  "/animals": "Animals",
  "/attractions": "Exhibits",
  "/shop": "Gift Shop",
  "/food": "Food & Dining",
  "/tickets": "Tickets & Pricing",
  "/cart": "Shopping Cart",
  "/customer-dashboard": "My Dashboard",
  "/order-history": "Order History",
  "/staff-portal": "Staff Portal",
  "/admin-portal": "Admin Portal",
  "/login": "Login",
};

// Protected Route Component
function ProtectedRoute({
  children,
  requireAuth = true,
  requireCustomer = false,
  requireEmployee = false,
}) {
  const { isAuthenticated, userType } = useAuth();

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireCustomer && userType !== "customer") {
    return <Navigate to="/" replace />;
  }

  if (requireEmployee && userType !== "employee") {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppContent() {
  const { user, userType, role, login, logout, initialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [pageKey, setPageKey] = useState(0);

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem("cart", JSON.stringify(cart));
    } else {
      localStorage.removeItem("cart");
    }
  }, [cart]);

  // Update document title when location changes
  useEffect(() => {
    const pageTitle = PAGE_TITLES[location.pathname] || "WildWood Zoo";
    document.title = `${pageTitle} | WildWood Zoo`;
  }, [location.pathname]);

  // Scroll to top when location changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLogin = (loggedInUser, type, userRole) => {
    login(loggedInUser, type, userRole);

    // Navigate based on type and role
    if (type === "employee") {
      if (userRole === "admin" || userRole === "supervisor") {
        navigate("/admin-portal");
      } else {
        navigate("/staff-portal");
      }
    } else if (type === "customer") {
      navigate("/customer-dashboard");
    }
  };

  const handleLogout = async () => {
    // Clear cart state before logging out
    clearCart();
    // Call the original logout function from AuthContext
    await logout();
  };

  const addToCart = (item) => {
    // Prevent adding items to the cart from logged-in admin/staff contexts
    // but allow anonymous users to click buttons (they'll be prompted to log in)
    if (
      (user && userType !== "customer") ||
      location.pathname.startsWith("/admin")
    ) {
      toast.error("Adding items to cart is disabled for admin/staff users.");
      return;
    }

    setCart((prevCart) => {
      // Prevent adding more than one membership to the cart
      if (item.type === "membership") {
        const hasMembership = prevCart.some((i) => i.type === "membership");
        if (hasMembership) {
          toast.error(
            "You can only have one membership in the cart at a time."
          );
          return prevCart;
        }
      }
      const existingItem = prevCart.find(
        (i) => i.id === item.id && i.type === item.type
      );
      if (existingItem) {
        // For membership items, don't increase quantity beyond 1
        if (item.type === "membership") {
          toast.error(
            "Membership already in cart. Proceed to checkout or remove it before adding another."
          );
          return prevCart;
        }
        return prevCart.map((i) =>
          i.id === item.id && i.type === item.type
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id, type) => {
    setCart((prevCart) =>
      prevCart.filter((item) => !(item.id === id && item.type === type))
    );
  };

  const updateCartQuantity = (id, type, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id, type);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id && item.type === type ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Staff Portal Router Component
  const StaffPortalRouter = () => {
    const employee = user;

    switch (role) {
      case "veterinarian":
        return <VeterinarianPortal user={employee} onLogout={handleLogout} />;
      case "zookeeper":
        return <ZookeeperPortal user={employee} onLogout={handleLogout} />;
      case "giftshop":
        return <GiftShopPortal user={employee} onLogout={handleLogout} />;
      case "concession":
        return <ConcessionPortal user={employee} onLogout={handleLogout} />;
      /* Manager role mapping removed: supervisors will fall through to default behavior */
      default:
        return <Navigate to="/" replace />;
    }
  };

  // Don't show nav/footer for staff and admin portals and login page
  const showNavAndFooter = ![
    "/staff-portal",
    "/admin-portal",
    "/login",
  ].includes(location.pathname);

  // Calculate total cart items
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Show loading state while checking session
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {showNavAndFooter && (
        <Navigation onLogout={handleLogout} cartCount={cartCount} />
      )}

      <Routes>
        {/* Public Routes - Accessible to everyone */}
        <Route path="/" element={<HomePage />} />
        <Route path="/animals" element={<AnimalsPage key={pageKey} />} />
        <Route
          path="/attractions"
          element={<AttractionsPage key={pageKey} />}
        />
        {/* Allow cart actions only for customers (not staff/admin) */}
        <Route
          path="/shop"
          element={
            <ShopPage
              addToCart={addToCart}
              allowCartActions={
                userType === "customer" &&
                !location.pathname.startsWith("/admin")
              }
            />
          }
        />
        <Route
          path="/food"
          element={
            <FoodPage
              addToCart={addToCart}
              allowCartActions={
                userType === "customer" &&
                !location.pathname.startsWith("/admin")
              }
            />
          }
        />
        <Route
          path="/tickets"
          element={
            <TicketsPage
              addToCart={addToCart}
              cart={cart}
              allowCartActions={
                userType === "customer" &&
                !location.pathname.startsWith("/admin")
              }
            />
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute requireAuth requireCustomer>
              <CartPage
                cart={cart}
                removeFromCart={removeFromCart}
                updateCartQuantity={updateCartQuantity}
                clearCart={clearCart}
              />
            </ProtectedRoute>
          }
        />

        {/* Login Route */}
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

        {/* Customer Protected Routes */}
        <Route
          path="/customer-dashboard"
          element={
            <ProtectedRoute requireAuth requireCustomer>
              <CustomerDashboard user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-history"
          element={
            <ProtectedRoute requireAuth requireCustomer>
              <OrderHistoryPage user={user} />
            </ProtectedRoute>
          }
        />

        {/* Employee Protected Routes */}
        <Route
          path="/staff-portal"
          element={
            <ProtectedRoute requireAuth requireEmployee>
              <StaffPortalRouter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-portal"
          element={
            <ProtectedRoute requireAuth requireEmployee>
              <AdminPortal user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showNavAndFooter && <Footer />}
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PricingProvider>
        <DataProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </DataProvider>
      </PricingProvider>
    </AuthProvider>
  );
}
