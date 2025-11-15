import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import {
  Shield,
  User,
  LogOut,
  ShoppingCart,
  Settings,
  Briefcase,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { ZooLogo } from "./ZooLogo";
import { useState, useEffect } from "react";

export function Navigation({ onLogout, cartCount = 0 }) {
  const { user, userType, isAdmin } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isActive = (path) => location.pathname === path;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showHamburger, setShowHamburger] = useState(false);

  // Close mobile menu on navigation change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Show hamburger only when viewport width is below a fixed threshold (776px)
  useEffect(() => {
    const CHECK_WIDTH = 776; // px
    const check = () => setShowHamburger(window.innerWidth < CHECK_WIDTH);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <nav
      className="sticky top-0 z-50 shadow-sm border-b transition-colors duration-150 text-emerald-700"
      style={{ backgroundColor: "rgba(180, 255, 249)" }}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2 text-green-800">
            <ZooLogo size={60} />
            <span className="text-xl font-semibold text-green-800">
              WildWood Zoo
            </span>
          </div>

          {/* Center navigation - can shrink; hidden on small screens (desktop only) */}
          <div className="flex-1 flex justify-center min-w-0">
            <div className="hidden md:flex items-center space-x-1 overflow-x-auto">
              <Link to="/">
                <Button
                  variant={isActive("/") ? "default" : "ghost"}
                  className={`cursor-pointer font-semibold ${
                    isActive("/")
                      ? "bg-green-600 hover:bg-green-700"
                      : "text-green-700 hover:text-green-800 hover:bg-green-200"
                  }`}
                >
                  Home
                </Button>
              </Link>
              <Link to="/animals">
                <Button
                  variant={isActive("/animals") ? "default" : "ghost"}
                  className={`cursor-pointer font-semibold ${
                    isActive("/animals")
                      ? "bg-green-600 hover:bg-green-700"
                      : "text-green-700 hover:text-green-800 hover:bg-green-200"
                  }`}
                >
                  Animals
                </Button>
              </Link>
              <Link to="/attractions">
                <Button
                  variant={isActive("/attractions") ? "default" : "ghost"}
                  className={`cursor-pointer font-semibold ${
                    isActive("/attractions")
                      ? "bg-green-600 hover:bg-green-700"
                      : "text-green-700 hover:text-green-800 hover:bg-green-200"
                  }`}
                >
                  Exhibits
                </Button>
              </Link>
              <Link to="/shop">
                <Button
                  variant={isActive("/shop") ? "default" : "ghost"}
                  className={`cursor-pointer font-semibold ${
                    isActive("/shop")
                      ? "bg-green-600 hover:bg-green-700"
                      : "text-green-700 hover:text-green-800 hover:bg-green-200"
                  }`}
                >
                  Gift Shop
                </Button>
              </Link>
              <Link to="/food">
                <Button
                  variant={isActive("/food") ? "default" : "ghost"}
                  className={`cursor-pointer font-semibold ${
                    isActive("/food")
                      ? "bg-green-600 hover:bg-green-700"
                      : "text-green-700 hover:text-green-800 hover:bg-green-200"
                  }`}
                >
                  Food
                </Button>
              </Link>
              <Link to="/tickets">
                <Button
                  variant={isActive("/tickets") ? "default" : "ghost"}
                  className={`cursor-pointer font-semibold ${
                    isActive("/tickets")
                      ? "bg-green-600 hover:bg-green-700"
                      : "text-green-700 hover:text-green-800 hover:bg-green-200"
                  }`}
                >
                  Tickets & Pricing
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile hamburger - visible on small screens */}
          {showHamburger && (
            <div>
              <button
                aria-label="Toggle navigation"
                onClick={() => setMobileOpen((s) => !s)}
                className="p-2 rounded-md border border-transparent text-green-700 hover:bg-green-50 active:bg-green-100"
              >
                {/* simple hamburger */}
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 5h14v2H3V5zm0 4h14v2H3V9zm0 4h14v2H3v-2z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {user && userType === "customer" && (
              <>
                <Link to="/cart">
                  <Button
                    variant={isActive("/cart") ? "default" : "ghost"}
                    size="sm"
                    className={`cursor-pointer relative font-semibold ${
                      isActive("/cart")
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "text-green-700 hover:text-green-800 hover:bg-green-200"
                    }`}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {cartCount > 0 && (
                      <span className="ml-1 text-xs font-semibold">
                        ({cartCount})
                      </span>
                    )}
                  </Button>
                </Link>
                <Link to="/customer-dashboard">
                  <Button
                    variant={
                      isActive("/customer-dashboard") ? "default" : "ghost"
                    }
                    size="sm"
                    className={`cursor-pointer font-semibold ${
                      isActive("/customer-dashboard")
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "text-green-700 hover:text-green-800 hover:bg-green-200"
                    }`}
                  >
                    <User className="h-4 w-4 mr-2" />
                    My Account
                  </Button>
                </Link>
                <Button
                  variant="default"
                  size="sm"
                  onClick={onLogout}
                  aria-label="Logout"
                  className="bg-green-600 text-white rounded-full px-3 py-1.5 shadow-sm hover:bg-green-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors duration-150"
                >
                  <LogOut className="h-4 w-4 mr-2 text-white" />
                  <span className="font-semibold">Logout</span>
                </Button>
              </>
            )}

            {!user && (
              <Link to="/login">
                <Button
                  variant="default"
                  size="sm"
                  aria-label="Login"
                  className="bg-green-600 text-white rounded-full px-3 py-1.5 shadow-sm hover:bg-green-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors duration-150 font-semibold"
                >
                  Login
                </Button>
              </Link>
            )}

            {user && userType === "employee" && isAdmin && (
              <Link to="/admin-portal">
                <Button
                  variant="default"
                  size="sm"
                  aria-label="Admin Portal"
                  className="bg-green-600 text-white rounded-full px-3 py-1.5 shadow-sm hover:bg-green-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors duration-150"
                >
                  <Settings className="h-4 w-4 mr-2 text-white" />
                  <span className="font-semibold">Admin Portal</span>
                </Button>
              </Link>
            )}

            {user && userType === "employee" && !isAdmin && (
              <Link to="/staff-portal">
                <Button
                  variant="default"
                  size="sm"
                  aria-label="Back to Portal"
                  className="bg-green-600 text-white rounded-full px-3 py-1.5 shadow-sm hover:bg-green-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors duration-150 font-semibold"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Back to Portal
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile dropdown (stacked) - only render when the hamburger is allowed */}
        {mobileOpen && showHamburger && (
          <div className="bg-white border-t border-green-100">
            <div className="px-4 py-3 space-y-2">
              <Link to="/">
                <Button
                  variant={isActive("/") ? "default" : "ghost"}
                  className="w-full justify-start font-semibold text-green-700 hover:text-green-800 hover:bg-green-200"
                >
                  Home
                </Button>
              </Link>
              <Link to="/animals">
                <Button
                  variant={isActive("/animals") ? "default" : "ghost"}
                  className="w-full justify-start font-semibold text-green-700 hover:text-green-800 hover:bg-green-200"
                >
                  Animals
                </Button>
              </Link>
              <Link to="/attractions">
                <Button
                  variant={isActive("/attractions") ? "default" : "ghost"}
                  className="w-full justify-start font-semibold text-green-700 hover:text-green-800 hover:bg-green-200"
                >
                  Exhibits
                </Button>
              </Link>
              <Link to="/shop">
                <Button
                  variant={isActive("/shop") ? "default" : "ghost"}
                  className="w-full justify-start font-semibold text-green-700 hover:text-green-800 hover:bg-green-200"
                >
                  Gift Shop
                </Button>
              </Link>
              <Link to="/food">
                <Button
                  variant={isActive("/food") ? "default" : "ghost"}
                  className="w-full justify-start font-semibold text-green-700 hover:text-green-800 hover:bg-green-200"
                >
                  Food
                </Button>
              </Link>
              <Link to="/tickets">
                <Button
                  variant={isActive("/tickets") ? "default" : "ghost"}
                  className="w-full justify-start font-semibold text-green-700 hover:text-green-800 hover:bg-green-200"
                >
                  Tickets & Pricing
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
