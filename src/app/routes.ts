import { createBrowserRouter, Navigate, useParams } from "react-router";
import { createElement } from "react";
import RequireAuth from "./components/RequireAuth";
import Layout from "./components/Layout";
import Marketing from "./pages/Marketing";
import Dashboard from "./pages/Dashboard";
import TenantList from "./pages/TenantList";
import TenantDetail from "./pages/TenantDetail";
import ModuleManagement from "./pages/ModuleManagement";
import ModuleEntitlements from "./pages/ModuleEntitlements";
import ActivityLogs from "./pages/ActivityLogs";
import Billing from "./pages/Billing";
import InvoiceDetail from "./pages/InvoiceDetail";
import SubscriptionDetail from "./pages/SubscriptionDetail";
import Customers from "./pages/Customers";
import Announcements from "./pages/Announcements";
import FeatureFlags from "./pages/FeatureFlags";
import PlatformUsers from "./pages/PlatformUsers";
import RoleManagement from "./pages/RoleManagement";
import MasterLogin from "./pages/Login";
import Settings from "./pages/Settings";
import SupportTools from "./pages/SupportTools";
import NotFound from "./pages/NotFound";
import WhatsAppTemplates from "./pages/WhatsappTemplates";
import DocumentTemplates from "./pages/DocumentTemplates";

function TenantRedirect() {
  const { tenantId } = useParams();
  return createElement(Navigate, {
    to: tenantId ? `/master/tenants/${tenantId}` : "/master/tenants",
    replace: true,
  });
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Marketing,
  },
  {
    path: "/master/login",
    Component: MasterLogin,
  },
  {
    path: "/tenants",
    element: createElement(Navigate, { to: "/master/tenants", replace: true }),
  },
  {
    path: "/tenants/:tenantId",
    element: createElement(TenantRedirect),
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
          { path: "module-entitlements", Component: ModuleEntitlements },
          { path: "activity", Component: ActivityLogs },
          { path: "billing", Component: Billing },
          { path: "billing/invoices/:invoiceId", Component: InvoiceDetail },
          { path: "billing/subscriptions/:subscriptionId", Component: SubscriptionDetail },
          { path: "customers", Component: Customers },
          { path: "announcements", Component: Announcements },
          { path: "feature-flags", Component: FeatureFlags },
          { path: "users", Component: PlatformUsers },
          { path: "roles", Component: RoleManagement },
          { path: "settings", Component: Settings },
          { path: "support", Component: SupportTools },
          { path: "whatsapp-templates", Component: WhatsAppTemplates },
          { path: "document-templates", Component: DocumentTemplates },
          { path: "*", Component: NotFound },
        ],
      },
    ],
  },
]);
