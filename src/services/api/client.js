"use client";
import axios from "axios";

/** Access token lives in memory only; the refresh token is an HttpOnly cookie handled by the browser. */
let accessToken = null;
const listeners = new Set();
export const getAccessToken = () => accessToken;
export function setAccessToken(t) {
  accessToken = t;
  listeners.forEach((fn) => fn(t));
}
export const onTokenChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export const api = axios.create({ baseURL: "/api", withCredentials: true, timeout: 15000 });

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshing = null;
/** Single-flight refresh: concurrent 401s share one refresh call. */
export function refreshSession() {
  if (!refreshing) {
    refreshing = axios.post("/api/auth/refresh", null, { withCredentials: true })
      .then((r) => { setAccessToken(r.data.data.accessToken); return r.data.data; })
      .catch((e) => { setAccessToken(null); throw e; })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

const RETRYABLE = ["TOKEN_EXPIRED", "INVALID_TOKEN"];
api.interceptors.response.use((r) => r, async (error) => {
  const { config, response } = error;
  if (response?.status === 401 && RETRYABLE.includes(response.data?.error?.code) && !config._retried) {
    config._retried = true;
    await refreshSession();
    return api(config);
  }
  return Promise.reject(error);
});

/** Normalized error for UI: { code, message, details } */
export function apiError(err) {
  const e = err?.response?.data?.error;
  if (e) return e;
  if (err?.code === "ECONNABORTED") return { code: "TIMEOUT", message: "The server took too long to respond. Try again." };
  return { code: "NETWORK", message: "Cannot reach the server. Check your connection and try again." };
}

/** Unwraps { success, data }. */
export const get = (url, params) => api.get(url, { params }).then((r) => r.data.data);
export const post = (url, body, config) => api.post(url, body, config).then((r) => r.data.data);
export const patch = (url, body) => api.patch(url, body).then((r) => r.data.data);
export const del = (url) => api.delete(url).then((r) => r.data.data);
