import { Link, useLocation, useNavigate } from "react-router-dom";
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
  const [homeDropdownOpen, setHomeDropdownOpen] = useState(false);
  const [homeHoveredIndex, setHomeHoveredIndex] = useState(null);
  const navigate = useNavigate();

  // Scroll helper: navigate to home then scroll to section (if needed)
  const scrollToSection = (id) => {
    if (!id) return;
    const doScroll = () => {
      const el = document.getElementById(id);
      if (!el) return;

      // Try to compute navbar height to offset the sticky nav
      const navEl = document.querySelector("nav");
      const navHeight = navEl ? navEl.offsetHeight : 80;

      // Prefer scrolling so the top of the element (title) sits just under the nav
      const elementTop = el.getBoundingClientRect().top + window.pageYOffset;
      const offset = 12; // small breathing room
      const target = Math.max(0, Math.round(elementTop - navHeight - offset));

      window.scrollTo({ top: target, behavior: "smooth" });
    };

    if (isHome) {
      doScroll();
    } else {
      navigate("/");
      // Wait a bit for the page to render then scroll
      setTimeout(doScroll, 200);
    }
  };

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
            <div className="hidden md:flex items-center space-x-1 overflow-visible">
              <div
                style={{ position: "relative" }}
                onMouseEnter={() => setHomeDropdownOpen(true)}
                onMouseLeave={() => {
                  setHomeDropdownOpen(false);
                  setHomeHoveredIndex(null);
                }}
              >
                <Button
                  onClick={() => navigate("/")}
                  variant={isActive("/") ? "default" : "ghost"}
                  className={`cursor-pointer font-semibold ${
                    isActive("/")
                      ? "bg-green-600 hover:bg-green-700"
                      : "text-green-700 hover:text-green-800 hover:bg-green-200"
                  }`}
                >
                  Home
                </Button>

                {/* Desktop dropdown implemented with inline styles and JS-controlled hover */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "100%",
                    paddingTop: 8,
                    zIndex: 1200,
                    opacity: homeDropdownOpen ? 1 : 0,
                    visibility: homeDropdownOpen ? "visible" : "hidden",
                    transition: "opacity 180ms ease",
                    pointerEvents: homeDropdownOpen ? "auto" : "none",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid rgba(229,231,235,1)",
                      borderRadius: 8,
                      boxShadow: "0 8px 20px rgba(2,6,23,0.08)",
                      padding: "6px 0",
                      width: 224,
                    }}
                  >
                    {[
                      ["Upcoming Events", "upcoming-events"],
                      ["Exhibits", "exhibits"],
                      ["Membership", "membership"],
                      ["Today's Activities", "todays-activities"],
                      ["Our Map", "our-map"],
                    ].map(([label, id], idx) => (
                      <button
                        key={id}
                        onClick={() => {
                          scrollToSection(id);
                          setHomeDropdownOpen(false);
                        }}
                        onMouseEnter={() => setHomeHoveredIndex(idx)}
                        onMouseLeave={() => setHomeHoveredIndex(null)}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 14px",
                          background:
                            homeHoveredIndex === idx
                              ? "#ecfdf5"
                              : "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "#065f46",
                          fontSize: 14,
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
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
              <Button
                onClick={() =>
                  navigate("/shop", { state: { anchor: "all-products" } })
                }
                variant={isActive("/shop") ? "default" : "ghost"}
                className={`cursor-pointer font-semibold ${
                  isActive("/shop")
                    ? "bg-green-600 hover:bg-green-700"
                    : "text-green-700 hover:text-green-800 hover:bg-green-200"
                }`}
              >
                Gift Shop
              </Button>
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
              {/* Home quick section links */}
              <div className="pl-3 grid grid-cols-2 gap-2">
                <Button
                  variant="ghost"
                  className="justify-start text-sm text-green-700 hover:text-green-800 hover:bg-green-50"
                  onClick={() => scrollToSection("upcoming-events")}
                >
                  Upcoming
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start text-sm text-green-700 hover:text-green-800 hover:bg-green-50"
                  onClick={() => scrollToSection("exhibits")}
                >
                  Exhibits
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start text-sm text-green-700 hover:text-green-800 hover:bg-green-50"
                  onClick={() => scrollToSection("membership")}
                >
                  Membership
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start text-sm text-green-700 hover:text-green-800 hover:bg-green-50"
                  onClick={() => scrollToSection("todays-activities")}
                >
                  Today's Acts
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start text-sm text-green-700 hover:text-green-800 hover:bg-green-50"
                  onClick={() => scrollToSection("weather-conditions")}
                >
                  Weather
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start text-sm text-green-700 hover:text-green-800 hover:bg-green-50"
                  onClick={() => scrollToSection("our-map")}
                >
                  Map
                </Button>
              </div>
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
              <Button
                onClick={() =>
                  navigate("/shop", { state: { anchor: "all-products" } })
                }
                variant={isActive("/shop") ? "default" : "ghost"}
                className="w-full justify-start font-semibold text-green-700 hover:text-green-800 hover:bg-green-200"
              >
                Gift Shop
              </Button>
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
