import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
});

// ✅ REQUEST INTERCEPTOR → Attach token
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

// ✅ RESPONSE INTERCEPTOR → safer handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || "";

    const isAuthRequest =
      requestUrl.includes("/users/login") ||
      requestUrl.includes("/users/register");

    // ❗ Only logout on REAL auth failure
    if (
      error.response?.status === 401 &&
      !isAuthRequest &&
      error.response?.data?.message !== "No token provided"
    ) {
      console.warn("Session expired. Logging out...");

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.assign("/login");
    }

    return Promise.reject(error);
  }
);

export default api;