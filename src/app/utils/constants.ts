const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "https://api.salesvince.app";

export const APP_NAME = "Salevince";
export const API_URL = stripTrailingSlash(apiBaseUrl);
export const APP_URL = stripTrailingSlash(
  import.meta.env.VITE_APP_URL?.trim() ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:5173"),
);
export const ASSETS_URL = stripTrailingSlash(import.meta.env.VITE_ASSETS_URL?.trim() || API_URL);
export const PLATFORM_DOMAIN = import.meta.env.VITE_PLATFORM_DOMAIN?.trim() || "salesvince.app";
export const PUSHER_APP_ID = import.meta.env.VITE_PUSHER_APP_ID?.trim() || "2156576";
export const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY?.trim() || "635e276c41f2ea52c70b";
export const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER?.trim() || "ap2";
export const ITEMS_PER_PAGE = 50;
