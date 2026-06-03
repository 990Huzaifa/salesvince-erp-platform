import { Navigate, Outlet, useLocation } from "react-router";
import { canAccessMasterRoute } from "../utils/masterAccess";

export default function RequireAuth() {
  const location = useLocation();

  if (!canAccessMasterRoute()) {
    return <Navigate to="/master/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
