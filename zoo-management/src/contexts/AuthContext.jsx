/**
 * AuthContext - Authentication state management
 *
 * Manages user authentication for both customers and employees
 * Provides login, logout, and user state management
 * Auth state is session-only (no localStorage) - relies on httpOnly cookies
 */

import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/customerAPI";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [role, setRole] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionData = await authAPI.validateSession();
        if (sessionData) {
          setUser(sessionData.user);
          setUserType(sessionData.userType);
          setRole(sessionData.role);
        }
      } catch (error) {
        // Session check failing is expected for non-logged-in users
        // Only log unexpected errors
        if (error.message !== "Not authenticated") {
          console.error("Unexpected session check error:", error);
        }
      } finally {
        setInitialized(true);
      }
    };

    checkSession();
  }, []);

  const login = (userData, type, userRole = null) => {
    setUser(userData);
    setUserType(type);
    setRole(userRole);
  };

  const logout = async () => {
    try {
      // Call backend to clear httpOnly cookie
      await authAPI.logout();
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      // Always clear local state even if API fails
      setUser(null);
      setUserType(null);
      setRole(null);
      // Clear cart from localStorage (not auth-related but user-specific)
      localStorage.removeItem("cart");
      localStorage.removeItem("currentPage");
    }
  };

  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const isAuthenticated = !!user && !!userType;
  const isCustomer = userType === "customer";
  const isEmployee = userType === "employee";
  const isAdmin = role === "admin" || role === "supervisor";

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        role,
        initialized,
        isAuthenticated,
        isCustomer,
        isEmployee,
        isAdmin,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
