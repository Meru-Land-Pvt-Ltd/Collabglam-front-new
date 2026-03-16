import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.20:1000";
const TOKEN_KEY = "token";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export function setAuthToken(token?: string) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}

// ✅ always attach token (no more unauthorized due to timing)
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
