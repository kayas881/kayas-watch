import axios from "axios";

export const TOKEN_KEY = "saral_watch_token";
export const api = axios.create({ baseURL: "/api", headers: { "Content-Type": "application/json" } });
api.interceptors.request.use(config => { const token = localStorage.getItem(TOKEN_KEY); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
api.interceptors.response.use(response => response, error => { if (error.response?.status === 401 && !location.pathname.startsWith("/login")) { localStorage.removeItem(TOKEN_KEY); location.assign("/login"); } return Promise.reject(error); });
export function message(error: unknown) { return axios.isAxiosError(error) ? (error.response?.data?.error || error.message) : error instanceof Error ? error.message : "Something went wrong"; }
