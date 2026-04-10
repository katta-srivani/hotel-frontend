import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || "";
    const isAuthRequest = requestUrl.includes("/users/login") || requestUrl.includes("/users/register");
    const protectedPathPrefixes = [
      "/my-bookings",
      "/billing",
      "/profile",
      "/favorites",
      "/checkout",
      "/admin",
    ];
    const isOnProtectedPath = protectedPathPrefixes.some((prefix) =>
      window.location.pathname.startsWith(prefix)
    );

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userInfo");

      // Redirect only when user is on protected screens.
      if (isOnProtectedPath && window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
