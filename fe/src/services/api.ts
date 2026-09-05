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

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("jarvis_auth_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

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
