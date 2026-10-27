import { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  Receipt,
  Package,
  Users,
  Plus,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingUp,
  Loader2,
  Edit2,
  X
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { Link } from "react-router";
import { apiJson } from "../utils/api";

type Tab = "overview" | "invoices" | "subscriptions" | "plans" | "addons" | "customers";

type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "FAILED" | "OVERDUE" | "PENDING";

type AddonType = "recurring" | "one-time" | "usage-based";

type LimitKey = "storage" | "api_calls" | "users" | "custom";
type PlanLimitKey = "USER" | "STORAGE" | "BUSINESS" | "EMPLOYEES" | "SQL_AGENT_DAILY" | "SQL_AGENT_MONTHLY" | "WHATSAPP" | "DAILY_BACKUP";
type AddonLimitKey = "USER" | "STORAGE" | "BUSINESS" | "EMPLOYEES" | "SQL_AGENT_DAILY" | "SQL_AGENT_MONTHLY" | "WHATSAPP" | "DAILY_BACKUP";
type BillingCycle = "MONTHLY" | "YEARLY"

type ApiPlanLimit = {
  id?: number;
  limitKey: string;
  limitValue: number;
};

type ApiPlan = {
  id: number;
  title: string;
  stripe_price_id: string | null;
  payfast_price_id: string | null;
  plan_limits: ApiPlanLimit[];
  slug: string;
  description: string;
  currency: string;
  price: number;
  billing_cycle: BillingCycle;
  is_active: boolean;
  is_display: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type ApiAddon = {
  id: number;
  name: string;
  stripe_price_id: string | null;
  payfast_price_id: string | null;
  slug: string;
  description: string;
  price: number;
  limitKey: AddonLimitKey | null;
  limitValue: number | null;
  currency: string;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type PlanListResponse = {
  data: ApiPlan[];
  meta: {
    page: number;
    limit: number;
  };
};

type AddonListResponse = {
  data: ApiAddon[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
};

type ApiInvoiceListItem = {
  id: number;
  tenant: {
    id: string;
    code: string;
    name: string;
    profile?: {
      displayName?: string;
    } | null;
  };
  subscription: {
    id: number;
    billingModel: string;
    paymentMode: string;
    collectionType: string;
    status: string;
  };
  status: string;
  issueDate: string;
  dueDate: string;
  subTotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
};

type ApiInvoiceListResponse = {
  data: ApiInvoiceListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
};

type ApiSubscriptionListItem = {
  id: number;
  billingModel: string;
  paymentMode: string;
  collectionType: string;
  status: string;
  expiresAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  tenant: {
    id: string;
    code: string;
    name: string;
    profile?: {
      displayName?: string;
    } | null;
  };
  plan: {
    id: number;
    title: string;
  };
  subscriptionAddons?: Array<{
    id?: number | string;
  }>;
};

type SubscriptionListResponse = {
  data: ApiSubscriptionListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
};

type PlanFormLimit = {
  limitKey: PlanLimitKey | "";
  limitValue: string;
};

type PlanFormState = {
  title: string;
  slug: string;
  stripe_price_id: string;
  payfast_price_id: string;
  description: string;
  currency: string;
  price: string;
  billing_cycle: BillingCycle;
  is_active: boolean;
  is_display: boolean;
  plan_limits: PlanFormLimit[];
};

type AddonFormState = {
  name: string;
  slug: string;
  stripe_price_id: string;
  payfast_price_id: string;
  description: string;
  currency: string;
  price: string;
  is_active: boolean;
  limitKey: AddonLimitKey | "";
  limitValue: string;
};

const initialPlanLimitRow: PlanFormLimit = { limitKey: "", limitValue: "" };
const PLAN_LIMIT_KEY_OPTIONS: PlanLimitKey[] = ["USER", "STORAGE", "BUSINESS", "EMPLOYEES", "SQL_AGENT_DAILY", "SQL_AGENT_MONTHLY", "WHATSAPP", "DAILY_BACKUP"];

const initialPlanFormState: PlanFormState = {
  title: "",
  slug: "",
  stripe_price_id: "",
  payfast_price_id: "",
  description: "",
  currency: "PKR",
  price: "0",
  billing_cycle: "MONTHLY",
  is_active: true,
  is_display: true,
  plan_limits: [initialPlanLimitRow],
};

const initialAddonFormState: AddonFormState = {
  name: "",
  slug: "",
  stripe_price_id: "",
  payfast_price_id: "",
  description: "",
  currency: "PKR",
  price: "0",
  is_active: true,
  limitKey: "",
  limitValue: "1",
};

const normalizePlanSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const normalizeAddonSlug = normalizePlanSlug;

const normalizePlanLimitKey = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_+/g, "_");

const isPlanLimitKey = (value: string): value is PlanLimitKey =>
  PLAN_LIMIT_KEY_OPTIONS.includes(value as PlanLimitKey);

const ADDON_LIMIT_KEY_OPTIONS: AddonLimitKey[] = ["USER", "STORAGE", "BUSINESS", "EMPLOYEES", "SQL_AGENT_DAILY", "SQL_AGENT_MONTHLY", "WHATSAPP", "DAILY_BACKUP"];

const isAddonLimitKey = (value: string): value is AddonLimitKey =>
  ADDON_LIMIT_KEY_OPTIONS.includes(value as AddonLimitKey);

const formatDateTime = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatPlanPrice = (value: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);

const formatAddonPrice = (value: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);

const formatBillingCycle = (value: BillingCycle) =>
  value === "YEARLY" ? "Yearly" : "Monthly";

const mapPlanDetailToForm = (plan: ApiPlan): PlanFormState => ({
  title: plan.title,
  slug: plan.slug,
  stripe_price_id: plan.stripe_price_id ?? "",
  payfast_price_id: plan.payfast_price_id ?? "",
  description: plan.description ?? "",
  currency: plan.currency || "PKR",
  price: String(plan.price ?? 0),
  billing_cycle: plan.billing_cycle,
  is_active: plan.is_active,
  is_display: plan.is_display,
  plan_limits:
    plan.plan_limits.length > 0
      ? plan.plan_limits.map((limit) => ({
        limitKey: isPlanLimitKey(limit.limitKey) ? limit.limitKey : "",
        limitValue: String(limit.limitValue),
      }))
      : [initialPlanLimitRow],
});

export default function Billing() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showCreateAddonModal, setShowCreateAddonModal] = useState(false);
  const [addonMode, setAddonMode] = useState<"create" | "edit">("create");
  const [editingAddonId, setEditingAddonId] = useState<number | null>(null);
  const [addons, setAddons] = useState<ApiAddon[]>([]);
  const [addonsLoading, setAddonsLoading] = useState(true);
  const [addonsError, setAddonsError] = useState("");
  const [addonForm, setAddonForm] = useState<AddonFormState>(initialAddonFormState);
  const [addonLoading, setAddonLoading] = useState(false);
  const [addonSubmitting, setAddonSubmitting] = useState(false);
  const [addonFormError, setAddonFormError] = useState("");
  const [statusUpdatingAddonId, setStatusUpdatingAddonId] = useState<number | null>(null);
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState("");
  const [plansMeta, setPlansMeta] = useState<PlanListResponse["meta"]>({ page: 1, limit: 10 });
  const [invoices, setInvoices] = useState<ApiInvoiceListItem[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [invoicesError, setInvoicesError] = useState("");
  const [subscriptions, setSubscriptions] = useState<ApiSubscriptionListItem[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [subscriptionsError, setSubscriptionsError] = useState("");
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [planMode, setPlanMode] = useState<"create" | "edit">("create");
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormState>(initialPlanFormState);
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [planFormError, setPlanFormError] = useState("");
  const [statusUpdatingPlanId, setStatusUpdatingPlanId] = useState<number | null>(null);

  const loadPlans = async () => {
    setPlansLoading(true);
    setPlansError("");

    try {
      const response = await apiJson<PlanListResponse>("platform/plan");
      setPlans(response.data ?? []);
      setPlansMeta(response.meta ?? { page: 1, limit: 10 });
    } catch (error) {
      setPlansError(error instanceof Error ? error.message : "Failed to load plans.");
    } finally {
      setPlansLoading(false);
    }
  };

  const loadAddons = async () => {
    setAddonsLoading(true);
    setAddonsError("");

    try {
      const response = await apiJson<AddonListResponse>("platform/addon");
      setAddons(response.data ?? []);
    } catch (error) {
      setAddonsError(error instanceof Error ? error.message : "Failed to load add-ons.");
    } finally {
      setAddonsLoading(false);
    }
  };

  const loadInvoices = async () => {
    setInvoicesLoading(true);
    setInvoicesError("");

    try {
      const response = await apiJson<ApiInvoiceListResponse>("platform/invoice");
      setInvoices(response.data ?? []);
    } catch (error) {
      setInvoicesError(error instanceof Error ? error.message : "Failed to load invoices.");
    } finally {
      setInvoicesLoading(false);
    }
  };

  const loadSubscriptions = async () => {
    setSubscriptionsLoading(true);
    setSubscriptionsError("");

    try {
      const response = await apiJson<SubscriptionListResponse>("platform/subscription");
      setSubscriptions(response.data ?? []);
    } catch (error) {
      setSubscriptionsError(error instanceof Error ? error.message : "Failed to load subscriptions.");
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  useEffect(() => {
    void loadPlans();
    void loadAddons();
    void loadInvoices();
    void loadSubscriptions();
  }, []);

  const openCreatePlanModal = () => {
    setPlanMode("create");
    setEditingPlanId(null);
    setPlanForm(initialPlanFormState);
    setPlanFormError("");
    setShowCreatePlanModal(true);
  };

  const closePlanModal = () => {
    setShowCreatePlanModal(false);
    setPlanMode("create");
    setEditingPlanId(null);
    setPlanForm(initialPlanFormState);
    setPlanFormError("");
  };

  const openCreateAddonModal = () => {
    setAddonMode("create");
    setEditingAddonId(null);
    setAddonForm(initialAddonFormState);
    setAddonFormError("");
    setShowCreateAddonModal(true);
  };

  const closeAddonModal = () => {
    setShowCreateAddonModal(false);
    setAddonMode("create");
    setEditingAddonId(null);
    setAddonForm(initialAddonFormState);
    setAddonFormError("");
  };

  const openEditAddonModal = async (addonId: number) => {
    setAddonMode("edit");
    setEditingAddonId(addonId);
    setAddonForm(initialAddonFormState);
    setAddonFormError("");
    setAddonLoading(true);
    setShowCreateAddonModal(true);

    try {
      const addon = await apiJson<ApiAddon>(`platform/addon/${addonId}`);
      setAddonForm({
        name: addon.name,
        slug: addon.slug,
        stripe_price_id: addon.stripe_price_id ?? "",
        payfast_price_id: addon.payfast_price_id ?? "",
        description: addon.description ?? "",
        currency: addon.currency || "PKR",
        price: String(addon.price ?? 0),
        is_active: addon.is_active,
        limitKey: addon.limitKey ?? "",
        limitValue: String(addon.limitValue ?? 1),
      });
    } catch (error) {
      setAddonFormError(error instanceof Error ? error.message : "Failed to load add-on details.");
    } finally {
      setAddonLoading(false);
    }
  };

  const addPlanLimitRow = () => {
    if (planForm.plan_limits.length >= PLAN_LIMIT_KEY_OPTIONS.length) {
      return;
    }

    setPlanForm((current) => ({
      ...current,
      plan_limits: [...current.plan_limits, { ...initialPlanLimitRow }],
    }));
  };

  const buildAddonPayload = (isEdit: boolean) => {
    if (!isEdit && !addonForm.name.trim()) throw new Error("Add-on name is required.");
    if (!isEdit && !addonForm.slug.trim()) throw new Error("Add-on slug is required.");
    if (!addonForm.description.trim()) throw new Error("Description is required.");
    if (!addonForm.limitKey) throw new Error("Select a limit key.");

    const limitValue = Number(addonForm.limitValue);
    if (!Number.isFinite(limitValue) || limitValue <= 0) throw new Error("Limit value must be greater than zero.");

    return {
      name: addonForm.name.trim(),
      slug: normalizeAddonSlug(addonForm.slug || addonForm.name),
      stripe_price_id: addonForm.stripe_price_id.trim(),
      payfast_price_id: addonForm.payfast_price_id.trim(),
      description: addonForm.description.trim(),
      currency: addonForm.currency.trim().toUpperCase() || "PKR",
      price: Number(addonForm.price || 0),
      is_active: addonForm.is_active,
      limitKey: addonForm.limitKey,
      limitValue,
    };
  };

  const submitAddon = async () => {
    setAddonFormError("");
    setAddonSubmitting(true);

    try {
      const isEdit = addonMode === "edit" && editingAddonId != null;
      const payload = buildAddonPayload(isEdit);
      const endpoint = isEdit ? `platform/addon/${editingAddonId}` : "platform/addon";

      await apiJson(endpoint, {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(isEdit
          ? {
            description: payload.description,
            currency: payload.currency,
            price: payload.price,
            is_active: payload.is_active,
            limitKey: payload.limitKey,
            limitValue: payload.limitValue,
          }
          : payload),
      });

      await loadAddons();
      closeAddonModal();
    } catch (error) {
      setAddonFormError(error instanceof Error ? error.message : "Failed to save add-on.");
    } finally {
      setAddonSubmitting(false);
    }
  };

  const toggleAddonStatus = async (addon: ApiAddon) => {
    setStatusUpdatingAddonId(addon.id);

    try {
      await apiJson(`platform/addon/${addon.id}/status?is_active=${!addon.is_active}`, {
        method: "PUT",
      });

      setAddons((current) =>
        current.map((item) =>
          item.id === addon.id
            ? { ...item, is_active: !item.is_active }
            : item
        )
      );
      void loadAddons();
    } catch (error) {
      setAddonsError(error instanceof Error ? error.message : "Failed to update add-on status.");
    } finally {
      setStatusUpdatingAddonId(null);
    }
  };

  const removePlanLimitRow = (index: number) => {
    setPlanForm((current) => ({
      ...current,
      plan_limits: current.plan_limits.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const updatePlanLimitRow = (index: number, field: keyof PlanFormLimit, value: string) => {
    setPlanForm((current) => ({
      ...current,
      plan_limits: current.plan_limits.map((row, currentIndex) => {
        if (currentIndex !== index) return row;
        return {
          ...row,
          [field]: field === "limitKey" && value ? (isPlanLimitKey(value) ? value : row.limitKey) : value,
        };
      }),
    }));
  };

  const openEditPlanModal = async (planId: number) => {
    setPlanFormError("");
    setPlanMode("edit");
    setEditingPlanId(planId);
    setPlanSubmitting(false);
    setShowCreatePlanModal(true);

    try {
      const plan = await apiJson<ApiPlan>(`platform/plan/${planId}`);
      setPlanForm(mapPlanDetailToForm(plan));
    } catch (error) {
      setPlanFormError(error instanceof Error ? error.message : "Failed to load plan details.");
    }
  };

  const submitPlan = async () => {
    setPlanSubmitting(true);
    setPlanFormError("");

    try {
      const cleanedLimits = planForm.plan_limits
        .map((limit) => ({
          limitKey: normalizePlanLimitKey(limit.limitKey),
          limitValue: Number(limit.limitValue),
        }))
        .filter((limit) => isPlanLimitKey(limit.limitKey) && Number.isFinite(limit.limitValue));

      if (planMode === "create") {
        if (!planForm.title.trim()) throw new Error("Plan title is required.");
        if (!planForm.slug.trim()) throw new Error("Plan slug is required.");
      }

      if (cleanedLimits.length === 0) {
        throw new Error("Add at least one valid plan limit.");
      }

      const endpoint =
        planMode === "edit" && editingPlanId != null
          ? `platform/plan/${editingPlanId}`
          : "platform/plan";

      const payload =
        planMode === "edit"
          ? {
            price: Number(planForm.price || 0),
            billing_cycle: planForm.billing_cycle,
            is_active: planForm.is_active,
            is_display: planForm.is_display,
            plan_limits: cleanedLimits,
          }
          : {
            title: planForm.title.trim(),
            slug: normalizePlanSlug(planForm.slug || planForm.title),
            stripe_price_id: planForm.stripe_price_id.trim(),
            payfast_price_id: planForm.payfast_price_id.trim(),
            description: planForm.description.trim(),
            currency: planForm.currency.trim().toUpperCase() || "PKR",
            price: Number(planForm.price || 0),
            billing_cycle: planForm.billing_cycle,
            is_active: planForm.is_active,
            is_display: planForm.is_display,
            plan_limits: cleanedLimits,
          };

      await apiJson(endpoint, {
        method: planMode === "edit" ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      await loadPlans();
      closePlanModal();
    } catch (error) {
      setPlanFormError(error instanceof Error ? error.message : "Failed to save plan.");
    } finally {
      setPlanSubmitting(false);
    }
  };

  const togglePlanStatus = async (plan: ApiPlan) => {
    const nextIsActive = !plan.is_active;
    setStatusUpdatingPlanId(plan.id);

    try {
      await apiJson(`platform/plan/${plan.id}/status?is_active=${nextIsActive}`, {
        method: "PUT",
      });

      setPlans((current) =>
        current.map((item) =>
          item.id === plan.id
            ? {
              ...item,
              is_active: nextIsActive,
            }
            : item
        )
      );
    } catch (error) {
      setPlansError(error instanceof Error ? error.message : "Failed to update plan status.");
    } finally {
      setStatusUpdatingPlanId(null);
    }
  };


  const planStats = useMemo(() => {
    return {
      total: plans.length,
      active: plans.filter((plan) => plan.is_active).length,
      displayed: plans.filter((plan) => plan.is_display).length,
      limits: plans.reduce((sum, plan) => sum + (plan.plan_limits?.length ?? 0), 0),
    };
  }, [plans]);

  const tabs = [
    { id: "overview" as Tab, label: "Overview", icon: TrendingUp },
    { id: "invoices" as Tab, label: "Invoices", icon: Receipt },
    { id: "subscriptions" as Tab, label: "Subscriptions", icon: CreditCard },
    { id: "plans" as Tab, label: "Plans", icon: Package },
    { id: "addons" as Tab, label: "Add-ons", icon: Plus },
    { id: "customers" as Tab, label: "Customers", icon: Users },
  ];

  return (
    <div className="min-h-full" style={{ backgroundColor: '#F8F9FC' }}>
      {/* Header */}
      <div className="bg-white border-b" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{ color: '#21222D' }}>Billing & Revenue</h1>
              <p className="mt-1 text-sm" style={{ color: '#6B6C7E' }}>Manage subscriptions, invoices, and billing operations</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors text-sm font-medium" style={{
                borderColor: 'rgba(219, 219, 229, 0.4)',
                color: '#21222D'
              }}>
                <Download className="size-4" />
                Export
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium" style={{
                backgroundColor: '#958CE8'
              }}>
                <Plus className="size-4" />
                Create Invoice
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex gap-6 border-b" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors"
                  style={{
                    borderBottomColor: isActive ? '#958CE8' : 'transparent',
                    color: isActive ? '#958CE8' : '#6B6C7E'
                  }}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Revenue Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border p-6" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: '#6B6C7E' }}>MRR</p>
                  <DollarSign className="size-5 text-green-600" />
                </div>
                <p className="mt-2 text-3xl" style={{ color: '#21222D' }}>$94,567</p>
                <p className="mt-1 text-sm text-green-600">↑ 12% vs last month</p>
              </div>

              <div className="bg-white rounded-xl border p-6" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: '#6B6C7E' }}>ARR</p>
                  <TrendingUp className="size-5" style={{ color: '#958CE8' }} />
                </div>
                <p className="mt-2 text-3xl" style={{ color: '#21222D' }}>$1.13M</p>
                <p className="mt-1 text-sm" style={{ color: '#6B6C7E' }}>Annual run rate</p>
              </div>

              <div className="bg-white rounded-xl border p-6" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: '#6B6C7E' }}>ARPU</p>
                  <Users className="size-5 text-purple-600" />
                </div>
                <p className="mt-2 text-3xl" style={{ color: '#21222D' }}>$112</p>
                <p className="mt-1 text-sm" style={{ color: '#6B6C7E' }}>Per customer</p>
              </div>

              <div className="bg-white rounded-xl border p-6" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: '#6B6C7E' }}>Churn Rate</p>
                  <AlertTriangle className="size-5 text-red-600" />
                </div>
                <p className="mt-2 text-3xl" style={{ color: '#21222D' }}>2.3%</p>
                <p className="mt-1 text-sm text-red-600">↑ 0.5% vs last month</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border p-6" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                <h3 className="font-semibold mb-4" style={{ color: '#21222D' }}>Invoice Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#6B6C7E' }}>Paid</span>
                    <span className="text-sm font-semibold text-green-600">658</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#6B6C7E' }}>Pending</span>
                    <span className="text-sm font-semibold text-yellow-600">124</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#6B6C7E' }}>Overdue</span>
                    <span className="text-sm font-semibold text-red-600">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#6B6C7E' }}>Failed</span>
                    <span className="text-sm font-semibold" style={{ color: '#21222D' }}>3</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border p-6" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                <h3 className="font-semibold mb-4" style={{ color: '#21222D' }}>Subscriptions</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#6B6C7E' }}>Active</span>
                    <span className="text-sm font-semibold text-green-600">835</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#6B6C7E' }}>Trial</span>
                    <span className="text-sm font-semibold" style={{ color: '#958CE8' }}>34</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#6B6C7E' }}>Suspended</span>
                    <span className="text-sm font-semibold text-yellow-600">8</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#6B6C7E' }}>Cancelled</span>
                    <span className="text-sm font-semibold" style={{ color: '#21222D' }}>15</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border p-6" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                <h3 className="font-semibold mb-4" style={{ color: '#21222D' }}>Plan Distribution</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#6B6C7E' }}>Basic</span>
                    <span className="text-sm font-semibold" style={{ color: '#21222D' }}>234 (28%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#6B6C7E' }}>Pro</span>
                    <span className="text-sm font-semibold" style={{ color: '#21222D' }}>456 (54%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#6B6C7E' }}>Enterprise</span>
                    <span className="text-sm font-semibold" style={{ color: '#21222D' }}>157 (18%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                <div>
                  <h3 className="font-semibold" style={{ color: '#21222D' }}>Recent Billing Activity</h3>
                  <p className="text-sm mt-1" style={{ color: '#6B6C7E' }}>Latest transactions and events</p>
                </div>
                <button className="text-sm font-medium" style={{ color: '#958CE8' }}>View All</button>
              </div>
              <div className="divide-y" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                {invoices.slice(0, 5).map((invoice) => (
                  <div key={invoice.id} className="px-6 py-4 flex items-center justify-between" style={{
                    transition: 'background-color 0.2s'
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(172, 209, 253, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}>
                    <div className="flex items-center gap-4">
                      <div className={`size-10 rounded-lg flex items-center justify-center ${invoice.status === "PAID" ? "bg-green-100" :
                          invoice.status === "FAILED" || invoice.status === "OVERDUE" ? "bg-red-100" :
                            "bg-yellow-100"
                        }`}>
                        <Receipt className={`size-5 ${invoice.status === "PAID" ? "text-green-600" :
                            invoice.status === "ISSUE" ? "text-blue-600" :
                              "text-yellow-600"
                          }`} />
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: '#21222D' }}>{invoice.id}</p>
                        <p className="text-sm" style={{ color: '#6B6C7E' }}>{invoice.tenant.profile?.displayName || invoice.tenant.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold" style={{ color: '#21222D' }}>{invoice.totalAmount.toFixed(2)}</p>
                      <StatusBadge status={invoice.status as any} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "invoices" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl border p-4" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
              <div className="flex items-center gap-4">
                <select className="px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                  <option>All Status</option>
                  <option>Paid</option>
                  <option>Pending</option>
                  <option>Overdue</option>
                  <option>Failed</option>
                </select>
                <select className="px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                  <option>All Customers</option>
                </select>
                <select className="px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>This year</option>
                </select>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
              {invoicesLoading ? (
                <div className="p-10 flex items-center justify-center text-sm" style={{ color: "#6B6C7E" }}>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Loading invoices...
                </div>
              ) : invoicesError ? (
                <div className="p-10 text-sm" style={{ color: "#B42318" }}>{invoicesError}</div>
              ) : (
                <table className="w-full">
                  <thead className="border-b" style={{ backgroundColor: '#F8F9FC', borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: '#6B6C7E' }}>Invoice ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: '#6B6C7E' }}>Tenant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: '#6B6C7E' }}>Subscription</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: '#6B6C7E' }}>Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: '#6B6C7E' }}>Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: '#6B6C7E' }}>Issued</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: '#6B6C7E' }}>Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: '#6B6C7E' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} style={{ transition: 'background-color 0.2s' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(172, 209, 253, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/master/billing/invoices/${invoice.id}`}
                            className="font-mono text-sm font-medium hover:underline"
                            style={{ color: '#958CE8' }}
                          >
                            #{invoice.id}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#21222D' }}>
                          {invoice.tenant.profile?.displayName || invoice.tenant.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#21222D' }}>
                          Subscription #{invoice.subscription.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold" style={{ color: '#21222D' }}>
                          {invoice.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={invoice.status as any} size="sm" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#6B6C7E' }}>{formatDateTime(invoice.issueDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#6B6C7E' }}>{formatDateTime(invoice.dueDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link to={`/master/billing/invoices/${invoice.id}`} className="font-medium mr-3 hover:underline" style={{ color: '#958CE8' }}>
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === "subscriptions" && (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
            {subscriptionsLoading ? (
              <div className="p-10 flex items-center justify-center text-sm" style={{ color: '#6B6C7E' }}>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Loading subscriptions...
              </div>
            ) : subscriptionsError ? (
              <div className="p-10 text-sm" style={{ color: '#B42318' }}>{subscriptionsError}</div>
            ) : (
              <table className="w-full">
                <thead className="border-b" style={{ backgroundColor: '#F8F9FC', borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: '#6B6C7E' }}>Subscription ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: '#6B6C7E' }}>Billing Model</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: '#6B6C7E' }}>Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: '#6B6C7E' }}>Addons</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: '#6B6C7E' }}>Expires At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: '#6B6C7E' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(172, 209, 253, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: '#21222D' }}>
                        {sub.tenant.profile?.displayName || sub.tenant.name || `#${sub.id}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#21222D' }}>{sub.plan.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={sub.status === "CANCELLED" ? "INACTIVE" : (sub.status as any)} size="sm" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#6B6C7E' }}>{sub.subscriptionAddons?.length ?? 0} addons</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#6B6C7E' }}>{formatDateTime(sub.expiresAt ?? undefined)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          to={`/master/billing/subscriptions/${sub.id}`}
                          className="font-medium hover:underline"
                          style={{ color: '#958CE8' }}
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "plans" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold" style={{ color: '#21222D' }}>Subscription Plans</h3>
                <p className="text-sm mt-1" style={{ color: '#6B6C7E' }}>Manage pricing tiers and plan configurations</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void loadPlans()}
                  className="flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors text-sm font-medium"
                  style={{
                    borderColor: 'rgba(219, 219, 229, 0.4)',
                    color: '#21222D'
                  }}
                >
                  <RefreshCw className="size-4" />
                  Refresh
                </button>
                <button
                  onClick={openCreatePlanModal}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium"
                  style={{ backgroundColor: '#958CE8' }}
                >
                  <Plus className="size-4" />
                  Create Plan
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-600">Total Plans</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{planStats.total}</p>
                <p className="mt-1 text-xs text-gray-500">Loaded from /platform/plan</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-600">Active</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{planStats.active}</p>
                <p className="mt-1 text-xs text-green-600">Available for purchase</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-600">Visible</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{planStats.displayed}</p>
                <p className="mt-1 text-xs text-blue-600">Shown on pricing pages</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-600">Plan Limits</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{planStats.limits}</p>
                <p className="mt-1 text-xs text-gray-500">Across all plans</p>
              </div>
            </div>

            {plansError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {plansError}
              </div>
            ) : null}

            <div className="rounded-xl border bg-white px-4 py-3 flex items-center justify-between" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
              <p className="text-sm" style={{ color: '#6B6C7E' }}>
                Plans synced from <span className="font-medium" style={{ color: '#21222D' }}>/platform/plan</span>
              </p>
              <p className="text-sm" style={{ color: '#6B6C7E' }}>
                Page {plansMeta.page} • Limit {plansMeta.limit}
              </p>
            </div>

            {plansLoading ? (
              <div className="rounded-xl border border-dashed bg-white p-10 text-center text-sm text-gray-500" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                Loading plans...
              </div>
            ) : plans.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-white p-10 text-center text-sm text-gray-500" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                No plans found.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="rounded-xl border bg-white p-6 transition-shadow hover:shadow-lg"
                    style={{
                      borderColor: plan.is_active ? '#958CE8' : 'rgba(219, 219, 229, 0.4)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl" style={{ color: '#21222D' }}>{plan.title}</h3>
                          <StatusBadge status={plan.is_active ? "ACTIVE" : "INACTIVE"} size="sm" />
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${plan.is_display ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                            {plan.is_display ? "Visible" : "Hidden"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-mono" style={{ color: '#6B6C7E' }}>{plan.slug}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium" style={{ color: '#6B6C7E' }}>Updated</p>
                        <p className="text-sm" style={{ color: '#21222D' }}>{formatDateTime(plan.updatedAt)}</p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm" style={{ color: '#6B6C7E' }}>{plan.description}</p>

                    <div className="mt-5 rounded-xl border border-gray-200 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Price</p>
                      <p className="mt-2 text-2xl font-semibold text-gray-900">
                        {formatPlanPrice(plan.price, plan.currency)}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">{formatBillingCycle(plan.billing_cycle)}</p>
                    </div>

                    <div className="mt-5">
                      <p className="text-sm font-medium mb-3" style={{ color: '#21222D' }}>Plan Limits</p>
                      <div className="flex flex-wrap gap-2">
                        {plan.plan_limits.length > 0 ? (
                          plan.plan_limits.map((limit) => (
                            <span
                              key={`${plan.id}-${limit.id ?? limit.limitKey}`}
                              className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                            >
                              {limit.limitKey}: {limit.limitValue}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                            No limits
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t pt-4" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                      <p className="text-sm" style={{ color: '#6B6C7E' }}>
                        Created {formatDateTime(plan.createdAt)}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void openEditPlanModal(plan.id)}
                          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                          style={{ borderColor: 'rgba(219, 219, 229, 0.4)', color: '#21222D' }}
                        >
                          <Edit2 className="size-4" />
                          Edit Plan
                        </button>
                        <button
                          type="button"
                          onClick={() => void togglePlanStatus(plan)}
                          disabled={statusUpdatingPlanId === plan.id}
                          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                          style={{ backgroundColor: plan.is_active ? '#D97706' : '#10B981' }}
                        >
                          {statusUpdatingPlanId === plan.id ? <Loader2 className="size-4 animate-spin" /> : null}
                          {plan.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "addons" && (
          <div className="bg-white rounded-xl border" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
              <div>
                <h3 className="font-semibold" style={{ color: '#21222D' }}>Add-on Services</h3>
                <p className="text-sm mt-1" style={{ color: '#6B6C7E' }}>Additional features and services</p>
              </div>
              <button
                onClick={openCreateAddonModal}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium"
                style={{ backgroundColor: '#958CE8' }}
              >
                <Plus className="size-4" />
                Create Add-on
              </button>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
              {addonsLoading ? (
                <div className="px-6 py-12 text-center text-sm" style={{ color: '#6B6C7E' }}>Loading add-ons...</div>
              ) : addonsError ? (
                <div className="px-6 py-4">
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {addonsError}
                  </div>
                </div>
              ) : addons.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm" style={{ color: '#6B6C7E' }}>No add-ons found.</div>
              ) : (
                addons.map((addon) => (
                  <div
                    key={addon.id}
                    className="px-6 py-4"
                    style={{ transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(172, 209, 253, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h4 className="font-semibold" style={{ color: '#21222D' }}>{addon.name}</h4>
                          <span className="text-xs px-2 py-1 rounded font-mono" style={{
                            backgroundColor: 'rgba(219, 219, 229, 0.3)',
                            color: '#6B6C7E'
                          }}>{addon.slug}</span>
                          <StatusBadge status={addon.is_active ? "ACTIVE" : "INACTIVE"} size="sm" />
                        </div>
                        <p className="text-sm mb-2" style={{ color: '#6B6C7E' }}>{addon.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: '#6B6C7E' }}>
                          <span>Limit: <span className="font-medium" style={{ color: '#21222D' }}>{addon.limitKey || "N/A"}</span> +{addon.limitValue ?? 0}</span>
                          <span>Updated {formatDateTime(addon.updatedAt)}</span>
                        </div>
                      </div>

                      <div className="text-right ml-4">
                        <p className="text-lg mb-1" style={{ color: '#21222D' }}>
                          {formatAddonPrice(addon.price, addon.currency)}
                        </p>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => void openEditAddonModal(addon.id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            <Edit2 className="size-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void toggleAddonStatus(addon)}
                            disabled={statusUpdatingAddonId === addon.id}
                            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                            style={{ backgroundColor: addon.is_active ? '#D97706' : '#10B981' }}
                          >
                            {statusUpdatingAddonId === addon.id ? <Loader2 className="size-4 animate-spin" /> : null}
                            {addon.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "customers" && (
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
            <p className="text-center py-12" style={{ color: '#6B6C7E' }}>
              Customer management will be moved to a dedicated Customers page
            </p>
          </div>
        )}
      </div>

      {/* Create Add-on Modal */}
      {showCreateAddonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
              <h2 className="text-xl font-semibold" style={{ color: '#21222D' }}>
                {addonMode === "edit" ? "Update Add-on" : "Create Add-on"}
              </h2>
              <p className="text-sm mt-1" style={{ color: '#6B6C7E' }}>
                {addonMode === "edit" ? "Adjust pricing and status" : "Define a new add-on service"}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {addonFormError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {addonFormError}
                </div>
              ) : null}

              {addonLoading ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-12 text-center text-sm" style={{ color: '#6B6C7E' }}>
                  Loading add-on details...
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-sm font-medium mb-4" style={{ color: '#21222D' }}>Basic Information</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: '#21222D' }}>Add-on Name *</label>
                          <input
                            type="text"
                            value={addonForm.name}
                            onChange={(e) =>
                              setAddonForm((current) => ({
                                ...current,
                                name: e.target.value,
                                slug: addonMode === "create" ? normalizeAddonSlug(e.target.value) : current.slug,
                              }))
                            }
                            disabled={addonMode === "edit"}
                            placeholder="e.g., Extra Storage"
                            className="w-full px-3 py-2 border rounded-lg text-sm disabled:cursor-not-allowed disabled:bg-gray-50"
                            style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: '#21222D' }}>Add-on Slug *</label>
                          <input
                            type="text"
                            value={addonForm.slug}
                            onChange={(e) => setAddonForm((current) => ({ ...current, slug: normalizeAddonSlug(e.target.value) }))}
                            disabled
                            className="w-full px-3 py-2 border rounded-lg text-sm font-mono disabled:cursor-not-allowed disabled:bg-gray-50"
                            style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#21222D' }}>Description *</label>
                        <textarea
                          value={addonForm.description}
                          onChange={(e) => setAddonForm((current) => ({ ...current, description: e.target.value }))}
                          placeholder="Describe the add-on service..."
                          rows={2}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-4" style={{ color: '#21222D' }}>Pricing</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#21222D' }}>Price *</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={addonForm.price}
                          onChange={(e) => setAddonForm((current) => ({ ...current, price: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#21222D' }}>Currency *</label>
                        <select
                          value={addonForm.currency}
                          onChange={(e) => setAddonForm((current) => ({ ...current, currency: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}
                        >
                          <option value="PKR">PKR</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {addonMode === "create" ? (
                    <div>
                      <h3 className="text-sm font-medium mb-4" style={{ color: '#21222D' }}>Payment Integrations</h3>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: '#21222D' }}>Stripe Price ID</label>
                          <input
                            type="text"
                            value={addonForm.stripe_price_id}
                            onChange={(e) => setAddonForm((current) => ({ ...current, stripe_price_id: e.target.value }))}
                            placeholder="price_xxxxxxxxxxxxx"
                            className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                            style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: '#21222D' }}>PayFast Price ID</label>
                          <input
                            type="text"
                            value={addonForm.payfast_price_id}
                            onChange={(e) => setAddonForm((current) => ({ ...current, payfast_price_id: e.target.value }))}
                            placeholder="payfast_price_xxxxxxxxxxxxx"
                            className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                            style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <h3 className="text-sm font-medium mb-4" style={{ color: '#21222D' }}>Limit Configuration</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#21222D' }}>Limit Key *</label>
                        <select
                          value={addonForm.limitKey}
                          onChange={(e) => setAddonForm((current) => ({ ...current, limitKey: isAddonLimitKey(e.target.value) ? e.target.value : "" }))}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}
                        >
                          <option value="">Select key</option>
                          {ADDON_LIMIT_KEY_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#21222D' }}>Limit Value *</label>
                        <input
                          type="number"
                          min="1"
                          value={addonForm.limitValue}
                          onChange={(e) => setAddonForm((current) => ({ ...current, limitValue: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-4" style={{ color: '#21222D' }}>Status</h3>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={addonForm.is_active}
                        onChange={(e) => setAddonForm((current) => ({ ...current, is_active: e.target.checked }))}
                        className="size-4 rounded"
                        style={{ accentColor: '#958CE8' }}
                      />
                      <span className="text-sm cursor-pointer" style={{ color: '#21222D' }}>
                        Active (available for purchase)
                      </span>
                    </label>
                  </div>
                </>
              )}
            </div>

            <div className="sticky bottom-0 px-6 py-4 border-t flex items-center justify-end gap-3" style={{
              backgroundColor: '#F8F9FC',
              borderColor: 'rgba(219, 219, 229, 0.4)'
            }}>
              <button
                onClick={closeAddonModal}
                className="px-4 py-2 font-medium text-sm"
                style={{ color: '#21222D' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitAddon()}
                disabled={addonSubmitting || addonLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors font-medium text-sm disabled:cursor-not-allowed disabled:opacity-70"
                style={{
                  backgroundColor: '#958CE8'
                }}
              >
                {addonSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                {addonMode === "edit" ? "Update Add-on" : "Create Add-on"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Plan Modal */}
      {showCreatePlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {planMode === "edit" ? "Update Plan" : "Create Plan"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {planMode === "edit" ? "Adjust pricing, visibility, and plan limits" : "Define a new subscription plan"}
                </p>
              </div>
              <button
                type="button"
                onClick={closePlanModal}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {planFormError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {planFormError}
                </div>
              ) : null}

              {planMode === "edit" ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  Update mode keeps the current plan identity fixed and focuses on pricing, visibility, and limits.
                </div>
              ) : null}

              <div>
                <h3 className="mb-4 text-sm font-medium text-gray-900">Basic Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Plan Title *</label>
                      <input
                        type="text"
                        value={planForm.title}
                        onChange={(e) =>
                          setPlanForm((current) => ({
                            ...current,
                            title: e.target.value,
                            slug: normalizePlanSlug(e.target.value),
                          }))
                        }
                        disabled={planMode === "edit"}
                        placeholder="e.g., Professional"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Plan Slug *</label>
                      <input
                        type="text"
                        value={planForm.slug}
                        onChange={(e) => setPlanForm((current) => ({ ...current, slug: normalizePlanSlug(e.target.value) }))}
                        disabled
                        placeholder="e.g., pro"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono disabled:cursor-not-allowed disabled:bg-gray-50"
                      />
                      <p className="mt-1 text-xs text-gray-500">URL-friendly identifier</p>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={planForm.description}
                      onChange={(e) => setPlanForm((current) => ({ ...current, description: e.target.value }))}
                      disabled={planMode === "edit"}
                      placeholder="Describe the plan features and benefits..."
                      rows={3}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-3" style={{ color: '#21222D' }}>Billing Cycle *</label>
                  <div className="inline-flex p-1 rounded-xl" style={{ backgroundColor: '#F8F9FC' }}>
                    <button
                      type="button"
                      onClick={() =>
                        setPlanForm((current) => ({ ...current, billing_cycle: "MONTHLY" }))
                      }
                      className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                      style={{
                        backgroundColor: planForm.billing_cycle === "MONTHLY" ? '#958CE8' : 'transparent',
                        color: planForm.billing_cycle === "MONTHLY" ? 'white' : '#6B6C7E',
                        boxShadow: planForm.billing_cycle === "MONTHLY" ? '0 2px 8px rgba(149, 140, 232, 0.25)' : 'none'
                      }}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPlanForm((current) => ({ ...current, billing_cycle: "YEARLY" }))
                      }
                      className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative"
                      style={{
                        backgroundColor: planForm.billing_cycle === "YEARLY" ? '#958CE8' : 'transparent',
                        color: planForm.billing_cycle === "YEARLY" ? 'white' : '#6B6C7E',
                        boxShadow: planForm.billing_cycle === "YEARLY" ? '0 2px 8px rgba(149, 140, 232, 0.25)' : 'none'
                      }}
                    >
                      Yearly
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold" style={{
                        backgroundColor: planForm.billing_cycle === "YEARLY" ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                        color: '#10B981'
                      }}>
                        Save 20%
                      </span>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Price *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={planForm.price}
                      onChange={(e) => setPlanForm((current) => ({ ...current, price: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Currency *</label>
                    <select
                      value={planForm.currency}
                      onChange={(e) => setPlanForm((current) => ({ ...current, currency: e.target.value }))}
                      disabled={planMode === "edit"}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-50"
                    >
                      <option value="PKR">PKR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="INR">INR</option>
                      <option value="AUD">AUD</option>
                    </select>
                  </div>
                </div>


              </div>

              <div>
                <h3 className="mb-4 text-sm font-medium text-gray-900">Payment Integrations</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Stripe Price ID</label>
                    <input
                      type="text"
                      value={planForm.stripe_price_id}
                      onChange={(e) => setPlanForm((current) => ({ ...current, stripe_price_id: e.target.value }))}
                      disabled={planMode === "edit"}
                      placeholder="price_xxxxxxxxxxxxx"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono disabled:cursor-not-allowed disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">PayFast Price ID</label>
                    <input
                      type="text"
                      value={planForm.payfast_price_id}
                      onChange={(e) => setPlanForm((current) => ({ ...current, payfast_price_id: e.target.value }))}
                      disabled={planMode === "edit"}
                      placeholder="payfast_price_xxxxxxxxxxxxx"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono disabled:cursor-not-allowed disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Plan Limits</h3>
                    <p className="text-xs text-gray-500">Add one or more usage limits for the plan</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {planForm.plan_limits.length} rows
                  </span>
                </div>

                <div className="space-y-3">
                  {planForm.plan_limits.map((row, index) => {
                    const selectedKeys = planForm.plan_limits
                      .map((item, itemIndex) => (itemIndex === index ? "" : item.limitKey))
                      .filter(Boolean) as PlanLimitKey[];

                    return (
                      <div key={index} className="rounded-xl border border-gray-200 p-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Limit Key</label>
                            <select
                              value={row.limitKey}
                              onChange={(e) => updatePlanLimitRow(index, "limitKey", e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            >
                              <option value="">Select key</option>
                              {PLAN_LIMIT_KEY_OPTIONS.map((option) => (
                                <option
                                  key={option}
                                  value={option}
                                  disabled={selectedKeys.includes(option) && row.limitKey !== option}
                                >
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Limit Value</label>
                            <input
                              type="number"
                              min="0"
                              value={row.limitValue}
                              onChange={(e) => updatePlanLimitRow(index, "limitValue", e.target.value)}
                              placeholder="100"
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            />
                          </div>
                        </div>

                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removePlanLimitRow(index)}
                            disabled={planForm.plan_limits.length === 1}
                            className="text-sm font-medium text-red-600 transition-colors hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={addPlanLimitRow}
                    disabled={planForm.plan_limits.length >= PLAN_LIMIT_KEY_OPTIONS.length}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#958CE8] hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
                  >
                    <Plus className="size-4" />
                    Add Another Limit
                  </button>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-medium text-gray-900">Display Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={planForm.is_active}
                      onChange={(e) => setPlanForm((current) => ({ ...current, is_active: e.target.checked }))}
                      className="size-4 rounded"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={planForm.is_display}
                      onChange={(e) => setPlanForm((current) => ({ ...current, is_display: e.target.checked }))}
                      className="size-4 rounded"
                    />
                    <span className="text-sm text-gray-700">Display on pricing page</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                onClick={closePlanModal}
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => void submitPlan()}
                disabled={planSubmitting}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                style={{ backgroundColor: '#958CE8' }}
              >
                {planSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                {planMode === "edit" ? "Update Plan" : "Create Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
