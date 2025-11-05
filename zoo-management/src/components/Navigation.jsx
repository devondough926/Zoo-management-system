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

export function Navigation({ onLogout, cartCount = 0 }) {
  const { user, userType, isAdmin } = useAuth();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-green-100 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <ZooLogo size={60} />
            <span className="text-xl font-semibold text-green-800">
              WildWood Zoo
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link to="/">
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                className={`cursor-pointer ${
                  isActive("/")
                    ? "bg-green-600 hover:bg-green-700"
                    : "text-green-700 hover:text-green-800 hover:bg-green-50"
                }`}
              >
                Home
              </Button>
            </Link>
            <Link to="/animals">
              <Button
                variant={isActive("/animals") ? "default" : "ghost"}
                className={`cursor-pointer ${
                  isActive("/animals")
                    ? "bg-green-600 hover:bg-green-700"
                    : "text-green-700 hover:text-green-800 hover:bg-green-50"
                }`}
              >
                Animals
              </Button>
            </Link>
            <Link to="/attractions">
              <Button
                variant={isActive("/attractions") ? "default" : "ghost"}
                className={`cursor-pointer ${
                  isActive("/attractions")
                    ? "bg-green-600 hover:bg-green-700"
                    : "text-green-700 hover:text-green-800 hover:bg-green-50"
                }`}
              >
                Exhibits
              </Button>
            </Link>
            <Link to="/shop">
              <Button
                variant={isActive("/shop") ? "default" : "ghost"}
                className={`cursor-pointer ${
                  isActive("/shop")
                    ? "bg-green-600 hover:bg-green-700"
                    : "text-green-700 hover:text-green-800 hover:bg-green-50"
                }`}
              >
                Gift Shop
              </Button>
            </Link>
            <Link to="/food">
              <Button
                variant={isActive("/food") ? "default" : "ghost"}
                className={`cursor-pointer ${
                  isActive("/food")
                    ? "bg-green-600 hover:bg-green-700"
                    : "text-green-700 hover:text-green-800 hover:bg-green-50"
                }`}
              >
                Food
              </Button>
            </Link>
            <Link to="/tickets">
              <Button
                variant={isActive("/tickets") ? "default" : "ghost"}
                className={`cursor-pointer ${
                  isActive("/tickets")
                    ? "bg-green-600 hover:bg-green-700"
                    : "text-green-700 hover:text-green-800 hover:bg-green-50"
                }`}
              >
                Tickets & Pricing
              </Button>
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {user && userType === "customer" && (
              <>
                <Link to="/cart">
                  <Button
                    variant={isActive("/cart") ? "default" : "ghost"}
                    size="sm"
                    className={`cursor-pointer relative ${
                      isActive("/cart")
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "text-green-700 hover:text-green-800 hover:bg-green-50"
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
                    className={`cursor-pointer ${
                      isActive("/customer-dashboard")
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "text-green-700 hover:text-green-800 hover:bg-green-50"
                    }`}
                  >
                    <User className="h-4 w-4 mr-2" />
                    My Account
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLogout}
                  className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            )}

            {!user && (
              <Link to="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white cursor-pointer"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </Link>
            )}

            {user && userType === "employee" && isAdmin && (
              <Link to="/admin-portal">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white cursor-pointer"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Admin Portal
                </Button>
              </Link>
            )}

            {user && userType === "employee" && !isAdmin && (
              <Link to="/staff-portal">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white cursor-pointer"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Back to Portal
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
