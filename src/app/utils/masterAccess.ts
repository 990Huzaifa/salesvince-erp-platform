import { getAuthSession } from "./auth";

export const canAccessMasterRoute = () => {
  const session = getAuthSession();

  if (!session?.accessToken) {
    return false;
  }

  // Replace this with your final master access condition later.
  return true;
};
