import React, { createContext, useState, useEffect } from "react";
import api from "../utils/api";

export const AuthContext = createContext();

const getAuthPayload = (responseData) => {
  const payload = responseData?.data || responseData || {};
  const token = payload?.token;
  const user = payload?.user;

  if (!token || typeof token !== "string" || !user) {
    return null;
  }

  return { token, user };
};

const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  delete api.defaults.headers["Authorization"];
};

const persistSession = (token, user, setToken, setUser, setIsAuthenticated) => {
  setToken(token);
  setUser(user);
  setIsAuthenticated(true);

  // ✅ attach globally
  api.defaults.headers["Authorization"] = `Bearer ${token}`;

  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ✅ INIT AUTH
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");

        if (!savedToken || !savedUser) {
          return;
        }

        const parsedUser = JSON.parse(savedUser);

        api.defaults.headers["Authorization"] = `Bearer ${savedToken}`;

        // Validate token
        const res = await api.get("/users/profile");
        const profileUser = res?.data?.data || parsedUser;

        persistSession(
          savedToken,
          profileUser,
          setToken,
          setUser,
          setIsAuthenticated
        );
      } catch (err) {
        clearSession();
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // ✅ LOGIN (FIXED)
  const login = async (email, password) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      const response = await api.post("/users/login", {
        email: normalizedEmail,
        password,
      });

      console.log("LOGIN RESPONSE:", response.data);

      const auth = getAuthPayload(response.data);

      if (!auth) {
        return {
          success: false,
          message: "Invalid login response from server",
        };
      }

      const { token, user } = auth;

      persistSession(token, user, setToken, setUser, setIsAuthenticated);

      return { success: true };
    } catch (error) {
      console.error("LOGIN ERROR:", error?.response?.data || error);

      return {
        success: false,
        message:
          error?.response?.data?.message || "Login failed",
      };
    }
  };

  // ✅ REGISTER
  const register = async (firstName, lastName, email, phone, password) => {
    try {
      await api.post("/users/register", {
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        phone,
        password,
        passwordConfirm: password,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error?.response?.data?.message || "Registration failed",
      };
    }
  };

  const logout = () => {
    clearSession();
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  const updateProfile = (nextUser) => {
    if (!nextUser) {
      return;
    }

    setUser(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
