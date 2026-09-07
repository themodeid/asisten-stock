import axios from "axios";

const getBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    // In browser (mobile, tablet, desktop), relative /api uses Next.js proxy rewrite
    return "/api";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3050/api";
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach JWT token to all requests
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("asisten_stock_auth_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor: auto-logout on 401 (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.includes("/login")
    ) {
      // Clear auth data and redirect to login
      localStorage.removeItem("asisten_stock_auth_token");
      localStorage.removeItem("asisten_stock_auth_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const formatIDR = (val: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

export const formatPercent = (val: number): string => {
  const prefix = val > 0 ? "+" : "";
  return `${prefix}${(val || 0).toFixed(2)}%`;
};
