//frontend/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

interface User {
  id: number;
  name: string;
  email: string;
  role: users_role;
  lab_id?: number; // Assigned lab for custodians
}

// Backend enum types for type safety
export type users_role = "Admin" | "Custodian";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Check LocalStorage on load (Persist login after refresh)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;

    try {
      const response = await api.get("/users/profile");

      const updatedUser = response.data;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      console.log("User data refreshed successfully:", updatedUser);
    } catch (error: any) {
      console.error("Failed to refresh user data:", error);

      // Only logout on authentication errors (401/403), not on server errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log("Authentication error, logging out...");
        logout();
      } else {
        // For other errors, just log them but don't logout
        console.error(
          "Server error during refresh:",
          error.response?.data || error.message,
        );
        throw error; // Re-throw to let the caller handle it
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
