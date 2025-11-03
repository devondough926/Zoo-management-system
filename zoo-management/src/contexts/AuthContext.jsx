/**
 * AuthContext - Authentication state management
 *
 * Manages user authentication for both customers and employees
 * Provides login, logout, and user state management
 */

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("currentUser");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [userType, setUserType] = useState(() => {
    try {
      return localStorage.getItem("currentUserType") || null;
    } catch {
      return null;
    }
  });

  const [role, setRole] = useState(() => {
    try {
      return localStorage.getItem("userRole") || null;
    } catch {
      return null;
    }
  });

  // Persist user data to localStorage whenever it changes
  useEffect(() => {
    if (user && userType) {
      localStorage.setItem("currentUser", JSON.stringify(user));
      localStorage.setItem("currentUserType", userType);
      if (role) {
        localStorage.setItem("userRole", role);
      }
    } else {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("currentUserType");
      localStorage.removeItem("userRole");
    }
  }, [user, userType, role]);

  const login = (userData, type, userRole = null) => {
    setUser(userData);
    setUserType(type);
    setRole(userRole);
  };

  const logout = () => {
    setUser(null);
    setUserType(null);
    setRole(null);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("currentUserType");
    localStorage.removeItem("userRole");
    localStorage.removeItem("cart");
    localStorage.removeItem("currentPage");
  };

  const updateUser = (updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem("currentUser", JSON.stringify(updated));
      return updated;
    });
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
