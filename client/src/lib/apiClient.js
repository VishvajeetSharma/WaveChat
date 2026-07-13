import axios from "axios";
import env from "../config/env.js";

export const TOKEN_STORAGE_KEY = "chat_token";

export const apiClient = axios.create({ baseURL: `${env.apiUrl}/api` });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function extractApiError(err, fallback) {
  return err?.response?.data?.error || fallback || "Something went wrong";
}

export default apiClient;
