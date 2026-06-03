import { createBrowserRouter } from "react-router";
import RequireAuth from "./components/RequireAuth";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import TenantList from "./pages/TenantList";
import TenantDetail from "./pages/TenantDetail";
import ModuleManagement from "./pages/ModuleManagement";
import PlatformUsers from "./pages/PlatformUsers";
import ActivityLogs from "./pages/ActivityLogs";
import Billing from "./pages/Billing";
import SubscriptionDetail from "./pages/SubscriptionDetail";
import MasterLogin from "./pages/Login";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/master/login",
    Component: MasterLogin,
  },
  {
    Component: RequireAuth,
    children: [
      {
        path: "/master",
        Component: Layout,
        children: [
          { index: true, Component: Dashboard },
          { path: "tenants", Component: TenantList },
          { path: "tenants/:tenantId", Component: TenantDetail },
          { path: "modules", Component: ModuleManagement },
          { path: "users", Component: PlatformUsers },
          { path: "activity", Component: ActivityLogs },
          { path: "billing", Component: Billing },
          { path: "billing/subscriptions/:subscriptionId", Component: SubscriptionDetail },
          { path: "settings", Component: Settings },
          { path: "*", Component: NotFound },
        ],
      },
    ],
  },
]);
