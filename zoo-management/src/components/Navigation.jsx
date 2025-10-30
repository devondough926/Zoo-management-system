import { Button } from "./ui/button";
import {
  Shield,
  User,
  LogOut,
  ShoppingCart,
  Settings,
  Briefcase,
} from "lucide-react";
import { isAdmin, getEmployeeRole } from "../data/mockData";
import { ZooLogo } from "./ZooLogo";

export function Navigation({
  onNavigate,
  currentPage,
  user,
  userType,
  onLogout,
  cartCount = 0,
}) {
  const isActive = (page) => currentPage === page;

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-green-100 sticky top-0 z-[100] shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <ZooLogo size={60} />
            <span className="text-xl font-semibold text-green-800">
              WildWood Zoo
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Button
              variant={isActive("home") ? "default" : "ghost"}
              onClick={() => onNavigate("home")}
              className={`cursor-pointer ${
                isActive("home")
                  ? "bg-green-600 hover:bg-green-700"
                  : "text-green-700 hover:text-green-800 hover:bg-green-50"
              }`}
            >
              Home
            </Button>
            <Button
              variant={isActive("animals") ? "default" : "ghost"}
              onClick={() => onNavigate("animals")}
              className={`cursor-pointer ${
                isActive("animals")
                  ? "bg-green-600 hover:bg-green-700"
                  : "text-green-700 hover:text-green-800 hover:bg-green-50"
              }`}
            >
              Animals
            </Button>
            <Button
              variant={isActive("attractions") ? "default" : "ghost"}
              onClick={() => onNavigate("attractions")}
              className={`cursor-pointer ${
                isActive("attractions")
                  ? "bg-green-600 hover:bg-green-700"
                  : "text-green-700 hover:text-green-800 hover:bg-green-50"
              }`}
            >
              Exhibits
            </Button>
            <Button
              variant={isActive("shop") ? "default" : "ghost"}
              onClick={() => onNavigate("shop")}
              className={`cursor-pointer ${
                isActive("shop")
                  ? "bg-green-600 hover:bg-green-700"
                  : "text-green-700 hover:text-green-800 hover:bg-green-50"
              }`}
            >
              Gift Shop
            </Button>
            <Button
              variant={isActive("food") ? "default" : "ghost"}
              onClick={() => onNavigate("food")}
              className={`cursor-pointer ${
                isActive("food")
                  ? "bg-green-600 hover:bg-green-700"
                  : "text-green-700 hover:text-green-800 hover:bg-green-50"
              }`}
            >
              Food
            </Button>
            <Button
              variant={isActive("tickets") ? "default" : "ghost"}
              onClick={() => onNavigate("tickets")}
              className={`cursor-pointer ${
                isActive("tickets")
                  ? "bg-green-600 hover:bg-green-700"
                  : "text-green-700 hover:text-green-800 hover:bg-green-50"
              }`}
            >
              Tickets & Pricing
            </Button>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {user && userType === "customer" && (
              <>
                <Button
                  variant={isActive("cart") ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onNavigate("cart")}
                  className={`cursor-pointer relative ${
                    isActive("cart")
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
                <Button
                  variant={isActive("customer-dashboard") ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onNavigate("customer-dashboard")}
                  className={`cursor-pointer ${
                    isActive("customer-dashboard")
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "text-green-700 hover:text-green-800 hover:bg-green-50"
                  }`}
                >
                  <User className="h-4 w-4 mr-2" />
                  My Account
                </Button>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate("login")}
                className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white cursor-pointer"
              >
                <Shield className="h-4 w-4 mr-2" />
                Login
              </Button>
            )}

            {user && userType === "employee" && isAdmin(user) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate("admin-portal")}
                className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white cursor-pointer"
              >
                <Settings className="h-4 w-4 mr-2" />
                Admin Portal
              </Button>
            )}

            {user && userType === "employee" && !isAdmin(user) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate("staff-portal")}
                className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white cursor-pointer"
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Back to Portal
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
