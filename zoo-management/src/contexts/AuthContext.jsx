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
    let primarySucceeded = false;

    try {
      // Primary: call configured backend to clear httpOnly cookie
      await authAPI.logout();
      primarySucceeded = true;
    } catch (error) {
      // Log error but don't fail — we'll attempt a sensible fallback below
      console.error("Logout API call failed:", error);
    }

    // Only attempt same-origin fallback if primary failed and the configured
    // API host is different from the current page host. This avoids issuing
    // duplicate logout requests when the primary already succeeded.
    if (!primarySucceeded && typeof window !== "undefined") {
      try {
        const apiBase =
          import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        let apiHost = null;
        try {
          apiHost = new URL(apiBase).host;
        } catch (e) {
          // If parsing fails, skip the fallback
          apiHost = null;
        }

        // Only call same-origin fallback when the API host differs from page host
        if (!apiHost || apiHost !== window.location.host) {
          await fetch(`/api/auth/logout`, {
            method: "POST",
            credentials: "include",
          });
        } else {
          // If API host equals page host, no fallback needed
          console.debug(
            "Skipping same-origin fallback logout (API host equals page host)"
          );
        }
      } catch (err) {
        // Non-fatal: fallback may fail if no proxy exists
        console.debug("Fallback same-origin logout failed:", err);
      }
    }

    // Re-validate session to confirm the cookie was cleared server-side.
    try {
      const sessionAfter = await authAPI.validateSession();
      if (sessionAfter && sessionAfter.user) {
        console.warn("Session still present after logout attempt.");
      }
    } catch (e) {
      console.debug("Session re-check failed:", e);
    }

    // Always clear local state even if API fails or session remains.
    setUser(null);
    setUserType(null);
    setRole(null);
    // Clear cart from localStorage (not auth-related but user-specific)
    localStorage.removeItem("cart");
    localStorage.removeItem("currentPage");
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
