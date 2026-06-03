import { API_URL, ASSETS_URL, PLATFORM_DOMAIN } from "./constants";

const stripLeadingSlash = (value: string) => value.replace(/^\/+/, "");
const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const isAbsoluteUrl = (value: string) =>
  /^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:");

export const joinUrl = (baseUrl: string, path = "") => {
  if (!path) {
    return stripTrailingSlash(baseUrl);
  }

  return `${stripTrailingSlash(baseUrl)}/${stripLeadingSlash(path)}`;
};

export const buildApiUrl = (path = "") => joinUrl(API_URL, path);

export const resolveAssetUrl = (assetPath = "", baseUrl = ASSETS_URL) => {
  if (!assetPath) return "";
  if (isAbsoluteUrl(assetPath)) return assetPath;

  return joinUrl(baseUrl, assetPath);
};

export const buildSubdomain = (name: string, domain = PLATFORM_DOMAIN) => {
  const cleanName = name.trim().replace(/\.?$/, "");
  return `${cleanName}.${domain}`;
};

export const buildEmailAddress = (localPart: string, domain = PLATFORM_DOMAIN) => {
  const cleanLocalPart = localPart.trim().replace(/@.*$/, "");
  return `${cleanLocalPart}@${domain}`;
};
