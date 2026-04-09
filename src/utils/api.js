import axios from "axios";

const api = axios.create({
  baseURL: "https://hotelbooking-backend-eaq3.onrender.com/api"
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("[api.js] Authorization header set:", config.headers.Authorization);
    } else {
      console.log("[api.js] No token found in localStorage");
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("userInfo");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
