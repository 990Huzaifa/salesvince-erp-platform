export type AuthPermission = {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthRole = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  permissions: AuthPermission[];
};

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  role: AuthRole;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
  signedInAt: string;
};

const AUTH_STORAGE_KEY = "snd_master_auth";

const readStoredSession = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
};

export const getAuthSession = () => readStoredSession();

export const getAuthToken = () => getAuthSession()?.accessToken ?? "";

export const isAuthenticated = () => Boolean(getAuthToken());

export const setAuthSession = (session: AuthSession) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

export const clearAuthSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};
