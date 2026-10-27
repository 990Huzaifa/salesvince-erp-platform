import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Loader2,
  CalendarDays,
  Wallet,
  Target,
  Package,
  Clock3,
  CircleDollarSign,
  RefreshCw,
  PencilLine,
  CheckCircle2,
  Plus,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { apiJson } from "../utils/api";

type SubscriptionDetailResponse = {
  id: number;
  tenant: {
    id: string;
    code: string;
    name: string;
    email?: string;
    profile?: {
      displayName?: string;
      phone?: string;
      address?: string;
      supportEmail?: string;
      logoUrl?: string | null;
      createdAt?: string;
    } | null;
  };
  plan: {
    id: number;
    title: string;
    slug?: string;
    description?: string | null;
    currency?: string;
    price?: string | number;
    billing_cycle?: "MONTHLY" | "YEARLY";
  };
  subscriptionAddons: Array<{
    id?: number | string;
    code?: string;
    name?: string;
    addon?: {
      id: number;
      name: string;
      description?: string;
      price?: number | string;
    };
    description?: string;
    price?: number | string;
    quantity?: number;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
  billingModel: "SELF_SERVE" | "SALES_DRIVEN";
  paymentMode: "OFFLINE" | "ONLINE";
  collectionType: "AUTO" | "MANUAL";
  status: "ACTIVE" | "TRIAL" | "SUSPENDED" | "CANCELLED" | "PAST_DUE" | "EXPIRED";
  expiresAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type AddonListItem = {
  id: number;
  name: string;
  description: string;
  price: string | number;
  billing_cycle: "MONTHLY" | "YEARLY";
  limitKey: string;
  limitValue: number;
  currency: string;
  is_active: boolean;
};

type AddonListResponse = {
  data: AddonListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
};

type PlanListItem = {
  id: number;
  title: string;
  description: string;
  currency: string;
  price: string | number;
  billing_cycle: "MONTHLY" | "YEARLY";
  slug: string;
  is_active: boolean;
  is_display: boolean;
  plan_limits: Array<{
    id?: number;
    limitKey: string;
    limitValue: number;
  }>;
};

type PlanListResponse = {
  data: PlanListItem[];
  meta: {
    page: number;
    limit: number;
  };
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const staticPlanFeatures = [
  "Up to 50 users",
  "15 modules included",
  "50 GB storage",
  "Priority support",
  "Custom branding",
];

const staticPlanLimits = [
  { key: "Users", value: "50" },
  { key: "Storage", value: "50 GB" },
  { key: "Modules", value: "15" },
];

export default function SubscriptionDetail() {
  const { subscriptionId } = useParams();
  const [subscription, setSubscription] = useState<SubscriptionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addons, setAddons] = useState<AddonListItem[]>([]);
  const [addonsLoading, setAddonsLoading] = useState(true);
  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [showAddAddonModal, setShowAddAddonModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [showEditSubscriptionModal, setShowEditSubscriptionModal] = useState(false);
  const [selectedAddonId, setSelectedAddonId] = useState("");
  const [addonQuantity, setAddonQuantity] = useState(1);
  const [addonSubmitting, setAddonSubmitting] = useState(false);
  const [addonError, setAddonError] = useState("");
  const [removingAddonId, setRemovingAddonId] = useState<number | string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [planError, setPlanError] = useState("");
  const [editStatus, setEditStatus] = useState<SubscriptionDetailResponse["status"]>("ACTIVE");
  const [editCollectionType, setEditCollectionType] = useState<SubscriptionDetailResponse["collectionType"]>("AUTO");
  const [editPaymentMode, setEditPaymentMode] = useState<SubscriptionDetailResponse["paymentMode"]>("ONLINE");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!subscriptionId) {
        setError("Missing subscription id.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await apiJson<SubscriptionDetailResponse>(`platform/subscription/${subscriptionId}`);
        setSubscription(response);
        setEditStatus(response.status);
        setEditCollectionType(response.collectionType);
        setEditPaymentMode(response.paymentMode);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load subscription.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [subscriptionId]);

  useEffect(() => {
    const loadAddons = async () => {
      setAddonsLoading(true);
      try {
        const response = await apiJson<AddonListResponse>("platform/addon");
        setAddons(response.data ?? []);
      } catch {
        setAddons([]);
      } finally {
        setAddonsLoading(false);
      }
    };

    void loadAddons();
  }, []);

  useEffect(() => {
    const loadPlans = async () => {
      setPlansLoading(true);
      try {
        const response = await apiJson<PlanListResponse>("platform/plan");
        setPlans(response.data ?? []);
      } catch {
        setPlans([]);
      } finally {
        setPlansLoading(false);
      }
    };

    void loadPlans();
  }, []);

  const displayName = subscription?.tenant.profile?.displayName || subscription?.tenant.name || "Subscription";
  const totalAmount =
    Number(subscription?.plan.price || 0) +
    (subscription?.subscriptionAddons ?? []).reduce(
      (sum, addon) => sum + Number(addon.price || 0) * Number(addon.quantity || 1),
      0
    );

  const selectedAddon = addons.find((addon) => String(addon.id) === selectedAddonId);
  const selectedPlan = plans.find((plan) => String(plan.id) === selectedPlanId);

  const openAddAddonModal = () => {
    setAddonError("");
    setSelectedAddonId("");
    setAddonQuantity(1);
    setShowAddAddonModal(true);
  };

  const openChangePlanModal = () => {
    setPlanError("");
    setSelectedPlanId(String(subscription?.plan.id ?? ""));
    setShowChangePlanModal(true);
  };

  const closeChangePlanModal = () => {
    setShowChangePlanModal(false);
    setSelectedPlanId(String(subscription?.plan.id ?? ""));
    setPlanError("");
    setPlanSubmitting(false);
  };

  const openEditSubscriptionModal = () => {
    setEditError("");
    setEditStatus(subscription?.status ?? "ACTIVE");
    setEditCollectionType(subscription?.collectionType ?? "AUTO");
    setEditPaymentMode(subscription?.paymentMode ?? "ONLINE");
    setShowEditSubscriptionModal(true);
  };

  const closeEditSubscriptionModal = () => {
    setShowEditSubscriptionModal(false);
    setEditError("");
    setEditSubmitting(false);
  };

  const closeAddAddonModal = () => {
    setShowAddAddonModal(false);
    setSelectedAddonId("");
    setAddonQuantity(1);
    setAddonError("");
    setAddonSubmitting(false);
  };

  const submitAddon = async () => {
    if (!subscriptionId) return;
    if (!selectedAddonId) {
      setAddonError("Select an add-on.");
      return;
    }

    setAddonSubmitting(true);
    setAddonError("");

    try {
      await apiJson(`platform/subscription/${subscriptionId}/addons`, {
        method: "POST",
        body: JSON.stringify({
          addonId: Number(selectedAddonId),
          quantity: addonQuantity,
        }),
      });
      const response = await apiJson<SubscriptionDetailResponse>(`platform/subscription/${subscriptionId}`);
      setSubscription(response);
      closeAddAddonModal();
    } catch (err) {
      setAddonError(err instanceof Error ? err.message : "Failed to add add-on.");
    } finally {
      setAddonSubmitting(false);
    }
  };

  const removeAddon = async (addonId?: number | string) => {
    if (!subscriptionId || addonId == null) return;

    setRemovingAddonId(addonId);

    try {
      await apiJson(`platform/subscription/${subscriptionId}/addons/${addonId}`, {
        method: "DELETE",
      });
      const response = await apiJson<SubscriptionDetailResponse>(`platform/subscription/${subscriptionId}`);
      setSubscription(response);
    } catch (err) {
      setAddonError(err instanceof Error ? err.message : "Failed to remove add-on.");
    } finally {
      setRemovingAddonId(null);
    }
  };

  const submitPlan = async () => {
    if (!subscriptionId) return;
    if (!selectedPlanId) {
      setPlanError("Select a plan.");
      return;
    }

    setPlanSubmitting(true);
    setPlanError("");

    try {
      await apiJson(
        `platform/subscription/${subscriptionId}/plan?planId=${Number(selectedPlanId)}`,
        {
          method: "PUT",
        }
      );

      const response = await apiJson<SubscriptionDetailResponse>(
        `platform/subscription/${subscriptionId}`
      );

      setSubscription(response);
      closeChangePlanModal();
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : "Failed to change plan.");
    } finally {
      setPlanSubmitting(false);
    }
  };

  const submitSubscriptionEdit = async () => {
    if (!subscriptionId) return;

    setEditSubmitting(true);
    setEditError("");

    try {
      await apiJson(`platform/subscription/${subscriptionId}/status`, {
        method: "PUT",
        body: JSON.stringify({
          status: editStatus,
          collectionType: editCollectionType,
          paymentMode: editPaymentMode,
        }),
      });
      const response = await apiJson<SubscriptionDetailResponse>(`platform/subscription/${subscriptionId}`);
      setSubscription(response);
      closeEditSubscriptionModal();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update subscription.");
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="min-h-full" style={{ backgroundColor: "#F8F9FC" }}>
      <div className="bg-white border-b" style={{ borderColor: "rgba(219, 219, 229, 0.4)" }}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to="/master/billing" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ArrowLeft className="size-5" style={{ color: "#6B6C7E" }} />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 style={{ color: "#21222D" }}>Subscription Details</h1>
                  {subscription ? <StatusBadge status={subscription.status === "CANCELLED" ? "INACTIVE" : subscription.status === "PAST_DUE" ? "SUSPENDED" : subscription.status} size="md" /> : null}
                </div>
                <p className="mt-1 text-sm" style={{ color: "#6B6C7E" }}>{displayName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm font-mono" style={{ color: "#6B6C7E" }}>#{subscriptionId}</p>
              <button onClick={openEditSubscriptionModal} className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors" style={{ borderColor: "rgba(219, 219, 229, 0.4)", color: "#21222D" }}>
                <PencilLine className="size-4" />
                Edit Subscription
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="bg-white rounded-xl border p-8 flex items-center gap-2 text-sm" style={{ borderColor: "rgba(219, 219, 229, 0.4)", color: "#6B6C7E" }}>
            <Loader2 className="size-4 animate-spin" />
            Loading...
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border p-8 text-sm" style={{ borderColor: "rgba(219, 219, 229, 0.4)", color: "#B42318" }}>{error}</div>
        ) : subscription ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border p-5" style={{ borderColor: "rgba(219, 219, 229, 0.4)" }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(149, 140, 232, 0.1)" }}>
                    <CircleDollarSign className="size-5" style={{ color: "#958CE8" }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#6B6C7E" }}>Total Amount</p>
                    <p className="text-xl font-bold" style={{ color: "#21222D" }}>{subscription.plan.currency ? `${subscription.plan.currency} ` : ""}{Number(subscription.plan.price || 0)}</p>
                  </div>
                </div>
                <p className="text-xs" style={{ color: "#6B6C7E" }}>per {subscription.plan.billing_cycle?.toLowerCase() || "month"}</p>
              </div>

              <div className="bg-white rounded-xl border p-5" style={{ borderColor: "rgba(219, 219, 229, 0.4)" }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-10 rounded-lg flex items-center justify-center bg-green-100">
                    <CalendarDays className="size-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#6B6C7E" }}>Start Date</p>
                    <p className="text-lg font-semibold" style={{ color: "#21222D" }}>{formatDateTime(subscription.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border p-5" style={{ borderColor: "rgba(219, 219, 229, 0.4)" }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-10 rounded-lg flex items-center justify-center bg-blue-100">
                    <Clock3 className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#6B6C7E" }}>Next Billing</p>
                    <p className="text-lg font-semibold" style={{ color: "#21222D" }}>{formatDateTime(subscription.expiresAt)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border p-5" style={{ borderColor: "rgba(219, 219, 229, 0.4)" }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-10 rounded-lg flex items-center justify-center bg-purple-100">
                    <Package className="size-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#6B6C7E" }}>Add-ons</p>
                    <p className="text-xl font-bold" style={{ color: "#21222D" }}>{subscription.subscriptionAddons.length}</p>
                  </div>
                </div>
                <p className="text-xs" style={{ color: "#6B6C7E" }}>active services</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border p-5" style={{ borderColor: "rgba(219, 219, 229, 0.4)" }}>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg flex items-center justify-center bg-green-100">
                    <RefreshCw className="size-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#6B6C7E" }}>Collection Type</p>
                    <p className="text-lg font-semibold" style={{ color: "#21222D" }}>{subscription.collectionType}</p>
                  </div>
                </div>
                <p className="text-xs mt-3" style={{ color: "#6B6C7E" }}>{subscription.collectionType === "AUTO" ? "Automatic billing" : "Manual processing"}</p>
              </div>
              <div className="bg-white rounded-xl border p-5" style={{ borderColor: "rgba(219, 219, 229, 0.4)" }}>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg flex items-center justify-center bg-blue-100">
                    <Wallet className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#6B6C7E" }}>Payment Mode</p>
                    <p className="text-lg font-semibold" style={{ color: "#21222D" }}>{subscription.paymentMode}</p>
                  </div>
                </div>
                <p className="text-xs mt-3" style={{ color: "#6B6C7E" }}>{subscription.paymentMode === "ONLINE" ? "Digital payments" : "Manual payments"}</p>
              </div>
              <div className="bg-white rounded-xl border p-5" style={{ borderColor: "rgba(219, 219, 229, 0.4)" }}>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(236, 72, 153, 0.1)" }}>
                    <Target className="size-5" style={{ color: "#EC4899" }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#6B6C7E" }}>Billing Model</p>
                    <p className="text-lg font-semibold" style={{ color: "#21222D" }}>{subscription.billingModel.replace("_", " ")}</p>
                  </div>
                </div>
                <p className="text-xs mt-3" style={{ color: "#6B6C7E" }}>{subscription.billingModel === "SELF_SERVE" ? "Customer managed" : "Sales managed"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border" style={{ borderColor: "rgba(219, 219, 229, 0.4)" }}>
                <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(219, 219, 229, 0.4)" }}>
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(149, 140, 232, 0.1)" }}>
                      <Building2 className="size-5" style={{ color: "#958CE8" }} />
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: "#21222D" }}>Tenant Details</h3>
                      <p className="text-xs" style={{ color: "#6B6C7E" }}>Company information</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4 text-sm">
                  <div><p className="text-xs font-medium mb-1" style={{ color: "#6B6C7E" }}>Company Name</p><p style={{ color: "#21222D" }}>{subscription.tenant.profile?.displayName || subscription.tenant.name}</p></div>
                  <div><p className="text-xs font-medium mb-1" style={{ color: "#6B6C7E" }}>Company Code</p><p className="font-mono" style={{ color: "#21222D" }}>{subscription.tenant.code}</p></div>
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: "#6B6C7E" }}>Subdomain</p>
                    <a href={`https://${(subscription.tenant.profile?.displayName || subscription.tenant.name).toLowerCase().replace(/\s+/g, "")}.erp.com`} className="hover:underline" style={{ color: "#958CE8" }}>
                      {(subscription.tenant.profile?.displayName || subscription.tenant.name).toLowerCase().replace(/\s+/g, "")}.erp.com
                    </a>
                  </div>
                  <div><p className="text-xs font-medium mb-1" style={{ color: "#6B6C7E" }}>Email</p><p style={{ color: "#21222D" }}>{subscription.tenant.email || subscription.tenant.profile?.supportEmail || "N/A"}</p></div>
                  <div><p className="text-xs font-medium mb-1" style={{ color: "#6B6C7E" }}>Phone</p><p style={{ color: "#21222D" }}>{subscription.tenant.profile?.phone || "N/A"}</p></div>
                  <div><p className="text-xs font-medium mb-1" style={{ color: "#6B6C7E" }}>Created</p><p style={{ color: "#21222D" }}>{formatDateTime(subscription.createdAt)}</p></div>
                  <div className="pt-4 border-t" style={{ borderColor: "rgba(219, 219, 229, 0.4)" }}>
                    <Link to={`/master/tenants/${subscription.tenant.id}`} className="text-sm font-medium hover:underline" style={{ color: "#958CE8" }}>
                      View Tenant Details &rarr;
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border" style={{ borderColor: "rgba(219, 219, 229, 0.4)" }}>
                <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(219, 219, 229, 0.4)" }}>
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg flex items-center justify-center bg-green-100">
                      <CreditCard className="size-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: "#21222D" }}>Plan Details</h3>
                      <p className="text-xs" style={{ color: "#6B6C7E" }}>Current subscription plan</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4 text-sm">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: "#6B6C7E" }}>Plan Name</p>
                      <p className="text-xl font-bold" style={{ color: "#21222D" }}>{subscription.plan.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: "#21222D" }}>{subscription.plan.currency ? `${subscription.plan.currency} ` : ""}{subscription.plan.price ?? "N/A"}</p>
                      <p className="text-xs" style={{ color: "#6B6C7E" }}>/ {subscription.plan.billing_cycle}</p>
                    </div>
                  </div>
                  <div><p className="text-xs font-medium mb-1" style={{ color: "#6B6C7E" }}>Description</p><p style={{ color: "#21222D" }}>{subscription.plan.description || "N/A"}</p></div>
                  <div>
                    <p className="text-xs font-medium mb-2" style={{ color: "#6B6C7E" }}>Features</p>
                    <ul className="space-y-2">
                      {staticPlanFeatures.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm" style={{ color: "#21222D" }}>
                          <CheckCircle2 className="size-4 text-green-600 flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs font-medium mb-1" style={{ color: "#6B6C7E" }}>Billing Model</p><p style={{ color: "#21222D" }}>{subscription.billingModel.replace("_", " ")}</p></div>
                    <div><p className="text-xs font-medium mb-1" style={{ color: "#6B6C7E" }}>Collection Type</p><p style={{ color: "#21222D" }}>{subscription.collectionType}</p></div>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-2" style={{ color: "#6B6C7E" }}>Plan Limits</p>
                    <div className="space-y-2">
                      {staticPlanLimits.map((limit) => (
                        <div key={limit.key} className="flex justify-between text-sm">
                          <span style={{ color: "#6B6C7E" }}>{limit.key}</span>
                          <span className="font-medium" style={{ color: "#21222D" }}>{limit.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t" style={{ borderColor: "rgba(219, 219, 229, 0.4)" }}>
                    <button onClick={openChangePlanModal} className="text-sm font-medium hover:underline" style={{ color: "#958CE8" }}>Change Plan &rarr;</button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border" style={{ borderColor: "rgba(219, 219, 229, 0.4)" }}>
                <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(219, 219, 229, 0.4)" }}>
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg flex items-center justify-center bg-purple-100">
                      <Package className="size-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: "#21222D" }}>Add-ons</h3>
                      <p className="text-xs" style={{ color: "#6B6C7E" }}>Additional services</p>
                    </div>
                  </div>
                  <button onClick={openAddAddonModal} className="p-2 rounded-lg transition-colors" style={{ color: "#958CE8" }}>
                    <Plus className="size-5" />
                  </button>
                </div>
                <div className="p-6">
                  {subscription.subscriptionAddons.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="size-12 mx-auto mb-3" style={{ color: "#DBDBE5" }} />
                      <p className="text-sm mb-1" style={{ color: "#6B6C7E" }}>No add-ons</p>
                      <p className="text-xs mb-4" style={{ color: "#6B6C7E" }}>Enhance your subscription with add-ons</p>
                      <button onClick={openAddAddonModal} className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium" style={{ backgroundColor: "#958CE8" }}>
                        <Plus className="size-4" />
                        Add First Add-on
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {subscription.subscriptionAddons.map((addon, index) => (
                        <div key={String(addon.id ?? index)} className="p-4 rounded-lg border" style={{ borderColor: "rgba(219, 219, 229, 0.4)" }}>
                          <div className="flex items-start justify-between mb-2 gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-semibold" style={{ color: "#21222D" }}>{addon.addon?.name}</h4>
                                <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: "rgba(219, 219, 229, 0.3)", color: "#6B6C7E" }}>
                                  {addon.code || `ID-${addon.id ?? index + 1}`}
                                </span>
                              </div>
                              <p className="text-xs mb-2" style={{ color: "#6B6C7E" }}>{addon.addon?.description || "Subscription add-on"}</p>
                              <div className="flex items-center gap-3 text-xs mb-2" style={{ color: "#6B6C7E" }}>
                                <span>Quantity: <span className="font-semibold" style={{ color: "#21222D" }}>{addon.quantity ?? 1}</span></span>
                                <span>•</span>
                                <span>Added: {formatDateTime(addon.createdAt)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="size-3 text-green-600" />
                                <span className="text-xs" style={{ color: "#10B981" }}>Active</span>
                              </div>
                            </div>
                            <div className="text-right ml-3">
                              <p className="text-xs mb-1" style={{ color: "#6B6C7E" }}>
                                {subscription.plan.currency ? `${subscription.plan.currency} ` : ""}{Number(addon.addon?.price || 0)} x {addon.quantity ?? 1} = {subscription.plan.currency ? `${subscription.plan.currency} ` : ""}{(Number(addon.addon?.price || 0) * Number(addon.quantity || 1)).toFixed(2)}
                              </p>
                              <p className="text-lg font-bold mb-2" style={{ color: "#21222D" }}>
                                {/* price multiplied by year or month based on subscription billing cycle */}
                                {(subscription.plan.currency ? `${subscription.plan.currency} ` : "") +
                                  (subscription.plan.billing_cycle === "MONTHLY"
                                    ? Number(addon.addon?.price || 0) * Number(addon.quantity || 1)
                                    : Number(addon.addon?.price || 0) * Number(addon.quantity || 1) * 12
                                  ).toFixed(2)}
                              </p>
                              <p className="text-xs mb-3" style={{ color: "#6B6C7E" }}>/ {subscription.plan.billing_cycle}</p>
                              <button
                                onClick={() => void removeAddon(addon.id)}
                                disabled={removingAddonId === addon.id}
                                className="p-2 rounded-lg transition-colors border text-sm font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ borderColor: "rgba(239, 68, 68, 0.3)", color: "#EF4444" }}
                              >
                                <Trash2 className="size-3" />
                                {removingAddonId === addon.id ? "Removing..." : "Remove"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button onClick={openAddAddonModal} className="w-full py-3 border-2 border-dashed rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2" style={{ borderColor: "rgba(219, 219, 229, 0.6)", color: "#6B6C7E" }}>
                        <Plus className="size-4" />
                        Add Another Add-on
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border" style={{ borderColor: "rgba(219, 219, 229, 0.4)" }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(219, 219, 229, 0.4)" }}>
                <h3 className="font-semibold" style={{ color: "#21222D" }}>Billing Summary</h3>
                <p className="text-xs mt-1" style={{ color: "#6B6C7E" }}>Breakdown of subscription costs</p>
              </div>
              <div className="p-6">
                <div className="max-w-lg space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span style={{ color: "#6B6C7E" }}>Base Plan ({subscription.plan.title})</span>
                    <span className="font-medium" style={{ color: "#21222D" }}>
                      {(subscription.plan.currency ? `${subscription.plan.currency} ` : "") + Number(subscription.plan.price || 0).toFixed(2)}
                    </span>
                  </div>
                  {subscription.subscriptionAddons.map((addon) => {
                    const quantity = Number(addon.quantity || 1);
                    const price = Number(addon.addon?.price || 0);
                    let totalAmount = quantity * price;
                    // if billing cycle is yearly, multiply price by 12
                    if (subscription.plan.billing_cycle === "YEARLY") {
                      totalAmount *= 12;
                    }
                    return (
                      <div key={String(addon.id ?? addon.code ?? addon.addon?.name)} className="flex justify-between items-center text-sm">
                        <span style={{ color: "#6B6C7E" }}>{addon.addon?.name || `Add-on #${addon.id}`} (x {quantity} / {subscription.plan.billing_cycle === "MONTHLY" ? "month" : "year"})</span>
                        <span className="font-medium" style={{ color: "#21222D" }}>
                          {(subscription.plan.currency ? `${subscription.plan.currency} ` : "") + totalAmount.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}

                  <div className="pt-3 border-t" style={{ borderColor: "rgba(219, 219, 229, 0.4)" }}>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold" style={{ color: "#21222D" }}>Total</span>
                      <span className="text-2xl font-bold" style={{ color: "#958CE8" }}>
                        {(subscription.plan.currency ? `${subscription.plan.currency} ` : "")
                          // here we need to sum of all addon total and plan price
                          + (Number(subscription.plan.price || 0) + subscription.subscriptionAddons.reduce((sum, addon) => {
                            const quantity = Number(addon.quantity || 1);
                            const price = Number(addon.addon?.price || 0);
                            let totalAmount = quantity * price;
                            if (subscription.plan.billing_cycle === "YEARLY") {
                              totalAmount *= 12;
                            }
                            return sum + totalAmount;
                          }, 0)).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "#6B6C7E" }}>
                      Billed {subscription.plan.billing_cycle === "MONTHLY" ? "monthly" : "yearly"} • Next billing on {formatDateTime(subscription.expiresAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {showChangePlanModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(33, 34, 45, 0.6)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" style={{ boxShadow: "0 25px 70px rgba(0, 0, 0, 0.2)" }}>
            <div className="sticky top-0 bg-white px-6 py-5 border-b rounded-t-2xl flex items-center justify-between" style={{ borderColor: "rgba(219, 219, 229, 0.3)" }}>
              <div>
                <h2 className="text-xl font-semibold" style={{ color: "#21222D" }}>Change Subscription Plan</h2>
                <p className="text-sm mt-1" style={{ color: "#6B6C7E" }}>Select a new plan for this subscription</p>
              </div>
              <button onClick={closeChangePlanModal} className="p-2 rounded-lg transition-colors" style={{ color: "#6B6C7E" }}>
                <Trash2 className="size-5 opacity-0" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plansLoading ? (
                  <div className="text-sm text-gray-500">Loading plans...</div>
                ) : (
                  plans.map((plan) => (
                    <label key={plan.id} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={selectedPlanId === String(plan.id)}
                        onChange={() => setSelectedPlanId(String(plan.id))}
                        className="peer sr-only"
                      />
                      <div className="relative h-full p-6 rounded-2xl border-2 transition-all duration-200 peer-checked:border-[#958CE8] peer-checked:bg-[#F8F7FE] hover:border-[#C4BFED]" style={{ borderColor: "rgba(219, 219, 229, 0.6)" }}>
                        {subscription?.plan.id === plan.id && (
                          <div className="absolute -top-3 right-4">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "rgba(149, 140, 232, 0.1)", color: "#958CE8" }}>
                              Current Plan
                            </span>
                          </div>
                        )}
                        <div className="absolute top-5 right-5">
                          <div className={`size-6 rounded-full border-2 transition-all duration-200 peer-checked:border-[#958CE8] peer-checked:bg-[#958CE8] flex items-center justify-center ${selectedPlanId === String(plan.id) ? 'border-[#958CE8] bg-[#958CE8]' : ''}`}>
                            <div className="size-2 rounded-full bg-white opacity-0 peer-checked:opacity-100"></div>
                          </div>
                        </div>
                        <div className="mb-4">
                          <h3 className="text-xl font-bold mb-2" style={{ color: "#21222D" }}>{plan.title}</h3>
                          <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-3xl font-bold" style={{ color: "#21222D" }}>{plan.currency} {plan.price}</span>
                            <span className="text-sm" style={{ color: "#6B6C7E" }}>/ {plan.billing_cycle === "YEARLY" ? "year" : "month"}</span>
                          </div>
                          <p className="text-sm" style={{ color: "#6B6C7E" }}>{plan.description}</p>
                        </div>
                        <div className="mb-4">
                          <p className="text-xs font-semibold mb-3 uppercase" style={{ color: "#6B6C7E" }}>Features</p>
                          <ul className="space-y-2">
                            {staticPlanFeatures.map((feature, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm" style={{ color: "#21222D" }}>
                                <CheckCircle2 className="size-4 text-green-600 flex-shrink-0 mt-0.5" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="pt-4 border-t" style={{ borderColor: "rgba(219, 219, 229, 0.4)" }}>
                          <p className="text-xs font-semibold mb-2 uppercase" style={{ color: "#6B6C7E" }}>Limits</p>
                          <div className="space-y-1">
                            {plan.plan_limits.map((limit, index) => (
                              <div key={index} className="flex justify-between text-xs">
                                <span style={{ color: "#6B6C7E" }} className="capitalize">{limit.limitKey}</span>
                                <span className="font-medium" style={{ color: "#21222D" }}>{limit.limitValue}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>

              {selectedPlan ? (
                <div className="mt-6 p-5 rounded-xl border-2" style={{ borderColor: "rgba(149, 140, 232, 0.3)", backgroundColor: "rgba(149, 140, 232, 0.05)" }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2" style={{ color: "#21222D" }}>Plan Change Summary</h4>
                      <div className="flex items-center gap-3 text-sm mb-3">
                        <span style={{ color: "#6B6C7E" }}>
                          Current: <span className="font-semibold" style={{ color: "#21222D" }}>{subscription?.plan.title}</span> ({subscription?.plan.price}/mo)
                        </span>
                        <span>→</span>
                        <span style={{ color: "#6B6C7E" }}>
                          New: <span className="font-semibold" style={{ color: "#958CE8" }}>{selectedPlan.title}</span> ({selectedPlan.price}/{selectedPlan.billing_cycle === "YEARLY" ? "yr" : "mo"})
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: "#6B6C7E" }}>The plan will be changed immediately.</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {planError ? <div className="mt-4 text-sm" style={{ color: "#B42318" }}>{planError}</div> : null}
            </div>

            <div className="sticky bottom-0 px-6 py-5 border-t rounded-b-2xl flex items-center justify-between" style={{ backgroundColor: "#FAFBFC", borderColor: "rgba(219, 219, 229, 0.3)" }}>
              <p className="text-xs" style={{ color: "#6B6C7E" }}>
                {selectedPlanId === String(subscription?.plan.id) ? "Select a different plan to continue" : "The plan change will take effect immediately"}
              </p>
              <div className="flex items-center gap-3">
                <button onClick={closeChangePlanModal} className="px-5 py-2.5 font-medium text-sm transition-colors rounded-xl border" style={{ color: "#6B6C7E", borderColor: "rgba(219, 219, 229, 0.6)" }}>
                  Cancel
                </button>
                <button
                  onClick={() => void submitPlan()}
                  disabled={!selectedPlanId || planSubmitting || selectedPlanId === String(subscription?.plan.id)}
                  className="px-5 py-2.5 text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#958CE8" }}
                >
                  {planSubmitting ? "Changing..." : "Change Plan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditSubscriptionModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(33, 34, 45, 0.6)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-2xl max-w-2xl w-full" style={{ boxShadow: "0 25px 70px rgba(0, 0, 0, 0.2)" }}>
            <div className="sticky top-0 bg-white px-6 py-5 border-b rounded-t-2xl flex items-center justify-between" style={{ borderColor: "rgba(219, 219, 229, 0.3)" }}>
              <div>
                <h2 className="text-xl font-semibold" style={{ color: "#21222D" }}>Edit Subscription</h2>
                <p className="text-sm mt-1" style={{ color: "#6B6C7E" }}>Update subscription settings</p>
              </div>
              <button onClick={closeEditSubscriptionModal} className="p-2 rounded-lg transition-colors" style={{ color: "#6B6C7E" }}>
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#21222D" }}>Subscription ID</label>
                <input
                  type="text"
                  value={subscription?.id ?? ""}
                  disabled
                  className="w-full px-4 py-3 border rounded-xl text-sm font-mono"
                  style={{ borderColor: "rgba(219, 219, 229, 0.6)", backgroundColor: "#F8F9FC", color: "#6B6C7E" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#21222D" }}>Status *</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as SubscriptionDetailResponse["status"])}
                  className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ borderColor: "rgba(219, 219, 229, 0.6)", backgroundColor: "#FAFBFC", "--tw-ring-color": "#958CE8" } as React.CSSProperties}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PAST_DUE">Past Due</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#21222D" }}>Collection Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["AUTO", "MANUAL"] as const).map((value) => (
                    <label key={value} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="editCollectionType"
                        value={value}
                        checked={editCollectionType === value}
                        onChange={() => setEditCollectionType(value)}
                        className="peer sr-only"
                      />
                      <div className="p-4 rounded-xl border-2 transition-all duration-200 peer-checked:border-[#958CE8] peer-checked:bg-[#F8F7FE] hover:border-[#C4BFED]" style={{ borderColor: "rgba(219, 219, 229, 0.6)" }}>
                        <div className="flex items-center justify-between mb-2">
                          <RefreshCw className={`size-5 ${value === "AUTO" ? "text-green-600" : "text-orange-600"}`} />
                          <div className={`size-5 rounded-full border-2 transition-all duration-200 peer-checked:border-[#958CE8] peer-checked:bg-[#958CE8] flex items-center justify-center ${editCollectionType === value ? 'border-[#958CE8] bg-[#958CE8]' : ''}`}>
                            <div className="size-2 rounded-full bg-white opacity-0 peer-checked:opacity-100"></div>
                          </div>
                        </div>
                        <p className="font-semibold text-sm mb-1" style={{ color: "#21222D" }}>{value}</p>
                        <p className="text-xs" style={{ color: "#6B6C7E" }}>{value === "AUTO" ? "Automatic billing" : "Manual processing"}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#21222D" }}>Payment Mode *</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["ONLINE", "OFFLINE"] as const).map((value) => (
                    <label key={value} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="editPaymentMode"
                        value={value}
                        checked={editPaymentMode === value}
                        onChange={() => setEditPaymentMode(value)}
                        className="peer sr-only"
                      />
                      <div className="p-4 rounded-xl border-2 transition-all duration-200 peer-checked:border-[#958CE8] peer-checked:bg-[#F8F7FE] hover:border-[#C4BFED]" style={{ borderColor: "rgba(219, 219, 229, 0.6)" }}>
                        <div className="flex items-center justify-between mb-2">
                          <Wallet className={`size-5 ${value === "ONLINE" ? "text-blue-600" : "text-purple-600"}`} />
                          <div className={`size-5 rounded-full border-2 transition-all duration-200 peer-checked:border-[#958CE8] peer-checked:bg-[#958CE8] flex items-center justify-center ${editPaymentMode === value ? 'border-[#958CE8] bg-[#958CE8]' : ''}`}>
                            <div className="size-2 rounded-full bg-white opacity-0 peer-checked:opacity-100"></div>
                          </div>
                        </div>
                        <p className="font-semibold text-sm mb-1" style={{ color: "#21222D" }}>{value}</p>
                        <p className="text-xs" style={{ color: "#6B6C7E" }}>{value === "ONLINE" ? "Digital payments" : "Manual payments"}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="size-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: "#21222D" }}>Note</p>
                    <p className="text-xs" style={{ color: "#6B6C7E" }}>
                      Plan changes are handled separately.
                    </p>
                  </div>
                </div>
              </div>

              {editError ? <div className="text-sm" style={{ color: "#B42318" }}>{editError}</div> : null}
            </div>

            <div className="sticky bottom-0 px-6 py-5 border-t rounded-b-2xl flex items-center justify-end gap-3" style={{ backgroundColor: "#FAFBFC", borderColor: "rgba(219, 219, 229, 0.3)" }}>
              <button onClick={closeEditSubscriptionModal} className="px-5 py-2.5 font-medium text-sm transition-colors rounded-xl border" style={{ color: "#6B6C7E", borderColor: "rgba(219, 219, 229, 0.6)" }}>
                Cancel
              </button>
              <button
                onClick={() => void submitSubscriptionEdit()}
                disabled={editSubmitting}
                className="px-5 py-2.5 text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#958CE8" }}
              >
                {editSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddAddonModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(33, 34, 45, 0.6)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-2xl max-w-2xl w-full" style={{ boxShadow: "0 25px 70px rgba(0, 0, 0, 0.2)" }}>
            <div className="sticky top-0 bg-white px-6 py-5 border-b rounded-t-2xl flex items-center justify-between" style={{ borderColor: "rgba(219, 219, 229, 0.3)" }}>
              <div>
                <h2 className="text-xl font-semibold" style={{ color: "#21222D" }}>Add Add-on to Subscription</h2>
                <p className="text-sm mt-1" style={{ color: "#6B6C7E" }}>Choose an add-on and specify quantity</p>
              </div>
              <button onClick={closeAddAddonModal} className="p-2 rounded-lg transition-colors" style={{ color: "#6B6C7E" }}>
                <Trash2 className="size-5 opacity-0" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#21222D" }}>Select Add-on *</label>
                <select
                  value={selectedAddonId}
                  onChange={(e) => setSelectedAddonId(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ borderColor: "rgba(219, 219, 229, 0.6)", backgroundColor: "#FAFBFC", "--tw-ring-color": "#958CE8" } as React.CSSProperties}
                >
                  <option value="">Choose an add-on...</option>
                  {addonsLoading ? (
                    <option value="">Loading...</option>
                  ) : (
                    addons.map((addon) => (
                      <option key={addon.id} value={addon.id}>
                        {addon.name} ({addon.limitKey}) - {subscription?.plan.currency} {addon.price}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {selectedAddon ? (
                <div className="p-4 rounded-xl border" style={{ borderColor: "rgba(149, 140, 232, 0.3)", backgroundColor: "rgba(149, 140, 232, 0.05)" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold" style={{ color: "#21222D" }}>{selectedAddon.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: "rgba(219, 219, 229, 0.3)", color: "#6B6C7E" }}>
                          {selectedAddon.limitKey}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: "#6B6C7E" }}>{selectedAddon.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <span style={{ color: "#6B6C7E" }}>Price:</span>
                      <span className="font-semibold" style={{ color: "#21222D" }}>{selectedAddon.currency} {selectedAddon.price}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ color: "#6B6C7E" }}>Limit:</span>
                      <span className="font-semibold" style={{ color: "#21222D" }}>{selectedAddon.limitValue}</span>
                    </div>
                  </div>
                </div>
              ) : null}

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#21222D" }}>Quantity *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={addonQuantity}
                  onChange={(e) => setAddonQuantity(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  className="w-full px-4 py-3 border rounded-xl text-sm"
                  style={{ borderColor: "rgba(219, 219, 229, 0.6)", backgroundColor: "#FAFBFC" }}
                />
              </div>

              {addonError ? <div className="text-sm" style={{ color: "#B42318" }}>{addonError}</div> : null}
            </div>

            <div className="sticky bottom-0 px-6 py-5 border-t rounded-b-2xl flex items-center justify-between" style={{ backgroundColor: "#FAFBFC", borderColor: "rgba(219, 219, 229, 0.3)" }}>
              <p className="text-xs" style={{ color: "#6B6C7E" }}>
                {selectedAddon ? "The add-on will be activated immediately" : "Select an add-on to continue"}
              </p>
              <div className="flex items-center gap-3">
                <button onClick={closeAddAddonModal} className="px-5 py-2.5 font-medium text-sm transition-colors rounded-xl border" style={{ color: "#6B6C7E", borderColor: "rgba(219, 219, 229, 0.6)" }}>
                  Cancel
                </button>
                <button
                  onClick={() => void submitAddon()}
                  disabled={!selectedAddonId || addonSubmitting}
                  className="px-5 py-2.5 text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#958CE8" }}
                >
                  {addonSubmitting ? "Adding..." : "Add to Subscription"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
