"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded credentials as per requirements
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin";

// LocalStorage key for persisting authentication state
// We use localStorage instead of sessionStorage because:
// 1. Users shouldn't need to re-login on every browser tab/window
// 2. Session persistence across page refreshes improves UX
// 3. Authentication state remains even after closing and reopening the browser
// 4. For a production app, we'd use httpOnly cookies with JWT tokens for security
const AUTH_STORAGE_KEY = "crypto-dashboard-auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Restore authentication state from localStorage on initial mount
  // This prevents the login page flash when user is already authenticated
  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth === "true") {
      setIsAuthenticated(true);
    }
    setIsInitialized(true);
  }, []);

  const login = (username: string, password: string): boolean => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      // Persist authentication state to localStorage
      // This allows the user to remain logged in across page refreshes
      localStorage.setItem(AUTH_STORAGE_KEY, "true");
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    // Clear authentication state from localStorage on logout
    // This ensures the user will see the login page on next visit
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  // Don't render children until we've checked localStorage
  // This prevents the protected route redirect flash
  if (!isInitialized) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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
