import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Download, Filter, Loader2, Plus, RefreshCw, Search, X, CheckCircle2, XCircle } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { apiJson } from "../utils/api";
import { PLATFORM_DOMAIN } from "../utils";

type TenantProvisioningItem = {
  tenantId: string;
  tenantName: string;
  tenantStatus: "REGISTERED" | "PROVISIONING" | "PROVISIONED" | "FAILED" | "SUSPENDED";
  lastJobId: string | null;
  lastJobStatus: "SUCCESS" | "FAILED" | "PENDING" | "RUNNING" | null;
  lastError: string | null;
  lastUpdatedAt: string;
};

type BillingCycle = "MONTHLY" | "YEARLY";

type ApiPlan = {
  id: number;
  title: string;
  slug: string;
  description: string;
  currency: string;
  price: number;
  billing_cycle: BillingCycle;
  is_active: boolean;
  is_display: boolean;
  plan_limits?: {
    id?: number;
    limitKey: string;
    limitValue: number;
  }[];
};

type PlanListResponse = {
  data: ApiPlan[];
};

type TenantFormState = {
  planId: number | null;
  displayName: string;
  name: string;
  industryType: string;
  emailAddress: string;
  phoneNumber: string;
  address: string;
  displayPhoneNumber: string;
  phoneCountryCode: string;
  phoneNationalNumber: string;
};

const initialTenantFormState: TenantFormState = {
  planId: null,
  displayName: "",
  name: "",
  industryType: "",
  emailAddress: "",
  phoneNumber: "",
  address: "",
  displayPhoneNumber: "",
  phoneCountryCode: "",
  phoneNationalNumber: "",
};

const getWhatsappLimitValue = (plan?: ApiPlan) => {
  const limit = plan?.plan_limits?.find((item) => item.limitKey === "WHATSAPP");
  return limit?.limitValue ?? 0;
};

const formatPlanPrice = (value: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);

const formatLimitLabel = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizename = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export default function TenantList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TenantProvisioningItem["tenantStatus"] | "ALL">("ALL");
  const [tenants, setTenants] = useState<TenantProvisioningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState("");
  const [tenantForm, setTenantForm] = useState<TenantFormState>(initialTenantFormState);
  const [creatingTenant, setCreatingTenant] = useState(false);
  const [createError, setCreateError] = useState("");
  const [domainChecking, setDomainChecking] = useState(false);
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null);

  const visiblePlans = useMemo(
    () => plans.filter((plan) => plan.is_active && plan.is_display),
    [plans]
  );

  const selectedPlan = useMemo(
    () => visiblePlans.find((plan) => plan.id === tenantForm.planId),
    [visiblePlans, tenantForm.planId]
  );

  const showWhatsappFields = getWhatsappLimitValue(selectedPlan) >= 1;

  useEffect(() => {
    if (showWhatsappFields) {
      return;
    }

    setTenantForm((current) => ({
      ...current,
      displayPhoneNumber: "",
      phoneCountryCode: "",
      phoneNationalNumber: "",
    }));
  }, [showWhatsappFields]);

  const loadTenants = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiJson<TenantProvisioningItem[]>("platform/tenant/provisioning");
      setTenants(Array.isArray(response) ? response : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tenants.");
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    setPlansLoading(true);
    setPlansError("");

    try {
      const response = await apiJson<PlanListResponse>("platform/plan");
      setPlans(response.data ?? []);
    } catch (err) {
      setPlansError(err instanceof Error ? err.message : "Failed to load plans.");
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    void loadTenants();
    void loadPlans();
  }, []);

  useEffect(() => {
    if (!visiblePlans.length) {
      return;
    }

    setTenantForm((current) => {
      if (current.planId && visiblePlans.some((plan) => plan.id === current.planId)) {
        return current;
      }

      const yearlyPlan = visiblePlans.find((plan) => plan.billing_cycle === "YEARLY");
      return {
        ...current,
        planId: yearlyPlan?.id ?? visiblePlans[0].id,
      };
    });
  }, [visiblePlans]);

  const updateTenantForm = <K extends keyof TenantFormState>(field: K, value: TenantFormState[K]) => {
    setTenantForm((current) => ({ ...current, [field]: value }));
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateError("");
    setDomainAvailable(null);
    setTenantForm((current) => ({
      ...initialTenantFormState,
      planId:
        current.planId && visiblePlans.some((plan) => plan.id === current.planId)
          ? current.planId
          : visiblePlans.find((plan) => plan.billing_cycle === "YEARLY")?.id ?? visiblePlans[0]?.id ?? null,
    }));
  };

  const handleCreateTenant = async () => {
    if (!tenantForm.planId) {
      setCreateError("Please select a plan.");
      return;
    }

    if (
      !tenantForm.displayName.trim() ||
      !tenantForm.name.trim() ||
      !tenantForm.industryType ||
      !tenantForm.emailAddress.trim() ||
      !tenantForm.phoneNumber.trim() ||
      !tenantForm.address.trim()
    ) {
      setCreateError("Please fill in all required fields.");
      return;
    }

    if (domainAvailable === false) {
      setCreateError("The selected subdomain is not available. Please choose a different one.");
      return;
    }

    if (domainAvailable === null && tenantForm.name.trim()) {
      setCreateError("Please check domain availability before proceeding.");
      return;
    }

    if (
      showWhatsappFields &&
      (!tenantForm.displayPhoneNumber.trim() ||
        !tenantForm.phoneCountryCode.trim() ||
        !tenantForm.phoneNationalNumber.trim())
    ) {
      setCreateError("Please fill in all WhatsApp phone fields.");
      return;
    }

    setCreateError("");
    setCreatingTenant(true);

    try {
      const payload: Record<string, string> = {
        name: tenantForm.name,
        email: tenantForm.emailAddress,
        industryType: tenantForm.industryType,
        planId: tenantForm.planId.toString(),
        displayName: tenantForm.displayName,
        phone: tenantForm.phoneNumber,
        address: tenantForm.address,
      };

      if (showWhatsappFields) {
        payload.displayPhoneNumber = tenantForm.displayPhoneNumber.trim();
        payload.phoneCountryCode = tenantForm.phoneCountryCode.trim();
        payload.phoneNationalNumber = tenantForm.phoneNationalNumber.trim();
      }

      await apiJson("platform/tenant", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      closeCreateModal();
      void loadTenants();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Tenant creation failed.");
    } finally {
      setCreatingTenant(false);
    }
  };

  const checkDomainAvailability = async (domain: string) => {
    if (!domain.trim()) {
      setDomainAvailable(null);
      return;
    }

    setDomainChecking(true);
    setDomainAvailable(null);

    try {
  const response = await apiJson<{ available: boolean }>(
    `utility/check-domain-availability/${domain}`
  );

  setDomainAvailable(response.available); // ✅ FIXED
} catch (err) {
  setDomainAvailable(null);
} finally {
  setDomainChecking(false);
}
  };

  const filteredTenants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return tenants.filter((tenant) => {
      const matchesSearch =
        !query ||
        tenant.tenantName.toLowerCase().includes(query) ||
        tenant.tenantId.toLowerCase().includes(query) ||
        (tenant.lastJobId || "").toLowerCase().includes(query);

      const matchesStatus = statusFilter === "ALL" || tenant.tenantStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter, tenants]);

  const stats = useMemo(
    () => ({
      total: tenants.length,
      provisioned: tenants.filter((tenant) => tenant.tenantStatus === "PROVISIONED").length,
      provisioning: tenants.filter((tenant) => tenant.tenantStatus === "PROVISIONING").length,
      failed: tenants.filter((tenant) => tenant.tenantStatus === "FAILED").length,
    }),
    [tenants]
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 style={{ color: "#21222D" }}>Tenants</h1>
          <p className="mt-1 text-sm" style={{ color: "#6B6C7E" }}>Live tenant provisioning list</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "#958CE8" }}
          >
            <Plus className="size-4" />
            Create Tenant
          </button>
          <button
            type="button"
            onClick={() => void loadTenants()}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Download className="size-4" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { label: "Total", value: stats.total },
          { label: "Provisioned", value: stats.provisioned },
          { label: "Provisioning", value: stats.provisioning },
          { label: "Failed", value: stats.failed },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-gray-200 bg-white p-5" style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)" }}>
            <p className="text-sm" style={{ color: "#6B6C7E" }}>{item.label}</p>
            <p className="mt-2 text-2xl font-semibold" style={{ color: "#21222D" }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-5" style={{
        border: "1px solid rgba(219, 219, 229, 0.4)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
      }}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5" style={{ color: "#6B6C7E" }} />
              <input
                type="text"
                placeholder="Search by tenant name or id..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                style={{
                  borderColor: "rgba(219, 219, 229, 0.6)",
                  backgroundColor: "#F8F9FC",
                  "--tw-ring-color": "#958CE8"
                } as React.CSSProperties}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="size-4" style={{ color: "#6B6C7E" }} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TenantProvisioningItem["tenantStatus"] | "ALL")}
              className="px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                borderColor: "rgba(219, 219, 229, 0.6)",
                backgroundColor: "#F8F9FC",
                "--tw-ring-color": "#958CE8"
              } as React.CSSProperties}
            >
              <option value="ALL">All Status</option>
              <option value="REGISTERED">Registered</option>
              <option value="PROVISIONING">Provisioning</option>
              <option value="PROVISIONED">Provisioned</option>
              <option value="FAILED">Failed</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {showCreateModal ? (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(33, 34, 45, 0.6)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={{ boxShadow: "0 25px 70px rgba(0, 0, 0, 0.2)" }}>
            <div className="sticky top-0 bg-white px-8 py-6 rounded-t-3xl border-b flex items-start justify-between gap-4" style={{ borderColor: "rgba(219, 219, 229, 0.3)" }}>
              <div>
                <h2 className="text-2xl" style={{ color: "#21222D" }}>Create New Tenant</h2>
                <p className="text-sm mt-2" style={{ color: "#6B6C7E" }}>Choose your plan and set up your company tenant</p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-xl p-2 transition-colors"
                style={{ color: "#6B6C7E" }}
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div>
                <h3 className="text-base font-semibold mb-5" style={{ color: "#21222D" }}>Select Plan & Billing Cycle</h3>
                {plansLoading ? (
                  <div className="rounded-2xl border px-4 py-6 text-sm flex items-center justify-center gap-2" style={{ borderColor: "rgba(219, 219, 229, 0.6)", color: "#6B6C7E", backgroundColor: "#FAFBFC" }}>
                    <Loader2 className="size-4 animate-spin" />
                    Loading plans...
                  </div>
                ) : plansError ? (
                  <div className="rounded-2xl border px-4 py-4 text-sm" style={{ borderColor: "rgba(248, 113, 113, 0.3)", color: "#B91C1C", backgroundColor: "#FEF2F2" }}>
                    {plansError}
                  </div>
                ) : visiblePlans.length === 0 ? (
                  <div className="rounded-2xl border px-4 py-4 text-sm" style={{ borderColor: "rgba(219, 219, 229, 0.6)", color: "#6B6C7E", backgroundColor: "#FAFBFC" }}>
                    No active plans available.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {visiblePlans.map((plan) => {
                      const selected = tenantForm.planId === plan.id;
                      const isYearly = plan.billing_cycle === "YEARLY";
                      return (
                        <label key={plan.id} className="relative cursor-pointer group">
                          <input
                            type="radio"
                            name="plan"
                            value={plan.id}
                            checked={selected}
                            onChange={() => updateTenantForm("planId", plan.id)}
                            className="peer sr-only"
                          />
                          <div
                            className="relative p-6 rounded-2xl border-2 transition-all duration-300 hover:border-[#C4BFED]"
                            style={{
                              borderColor: selected ? "#958CE8" : "rgba(219, 219, 229, 0.6)",
                              backgroundColor: selected ? "#F8F7FE" : "white",
                            }}
                          >
                            <div className="absolute top-5 right-5">
                              <div
                                className="size-6 rounded-full border-2 flex items-center justify-center transition-all duration-300"
                                style={{
                                  borderColor: selected ? "#958CE8" : "rgba(219, 219, 229, 0.6)",
                                  backgroundColor: selected ? "#958CE8" : "white",
                                }}
                              >
                                <div className={`size-2 rounded-full bg-white transition-opacity duration-300 ${selected ? "opacity-100" : "opacity-0"}`}></div>
                              </div>
                            </div>

                            {isYearly ? (
                              <div className="absolute -top-3 left-6">
                                <div className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: "#10B981" }}>
                                  YEARLY
                                </div>
                              </div>
                            ) : null}

                            <div className="mb-3">
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-3" style={{ backgroundColor: "rgba(149, 140, 232, 0.1)", color: "#958CE8" }}>
                                {plan.billing_cycle}
                              </div>
                              <h4 className="text-xl font-semibold mb-1" style={{ color: "#21222D" }}>{plan.title}</h4>
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold" style={{ color: "#21222D" }}>
                                  {formatPlanPrice(plan.price, plan.currency || "USD")}
                                </span>
                                <span className="text-sm" style={{ color: "#6B6C7E" }}>
                                  /{isYearly ? "year" : "month"}
                                </span>
                              </div>
                              {plan.description ? (
                                <p className="text-sm mt-2" style={{ color: "#6B6C7E" }}>{plan.description}</p>
                              ) : null}
                            </div>
                            <ul className="space-y-2">
                              <li className="flex items-start gap-2 text-sm" style={{ color: "#6B6C7E" }}>
                                <svg className="size-5 mt-0.5 flex-shrink-0" style={{ color: "#10B981" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{isYearly ? "Billed annually" : "Billed monthly"}</span>
                              </li>
                              {(plan.plan_limits ?? []).map((limit) => (
                                <li key={limit.id ?? `${plan.id}-${limit.limitKey}`} className="flex items-start gap-2 text-sm" style={{ color: "#6B6C7E" }}>
                                  <svg className="size-5 mt-0.5 flex-shrink-0" style={{ color: "#10B981" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span>{formatLimitLabel(limit.limitKey)}: {limit.limitValue}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-base font-semibold mb-5" style={{ color: "#21222D" }}>Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{ color: "#21222D" }}>Company Name *</label>
                    <input
                      type="text"
                      value={tenantForm.displayName}
                      onChange={(e) => updateTenantForm("displayName", e.target.value)}
                      placeholder="Enter your company name"
                      className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{
                        borderColor: "rgba(219, 219, 229, 0.6)",
                        backgroundColor: "#FAFBFC",
                        "--tw-ring-color": "#958CE8",
                      } as React.CSSProperties}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#21222D" }}>subdomain *</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={tenantForm.name}
                        onChange={(e) => {
                          updateTenantForm("name", normalizename(e.target.value));
                          setDomainAvailable(null);
                        }}
                        onBlur={(e) => {
                          const domain = normalizename(e.target.value);
                          if (domain) {
                            void checkDomainAvailability(domain);
                          }
                          console.log("Checking domain availability for:", domainAvailable);
                        }}
                        placeholder="yourcompany"
                        className="w-full px-4 py-3 pr-28 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                        style={{
                          borderColor: domainAvailable === false ? "rgba(239, 68, 68, 0.6)" : domainAvailable === true ? "rgba(34, 197, 94, 0.6)" : "rgba(219, 219, 229, 0.6)",
                          backgroundColor: "#FAFBFC",
                          "--tw-ring-color": "#958CE8",
                        } as React.CSSProperties}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {domainChecking ? (
                          <RefreshCw className="size-4 animate-spin" style={{ color: "#6B6C7E" }} />
                        ) : domainAvailable === true ? (
                          <CheckCircle2 className="size-4" style={{ color: "#22C55E" }} />
                        ) : domainAvailable === false ? (
                          <XCircle className="size-4" style={{ color: "#EF4444" }} />
                        ) : null}
                        <span className="text-sm font-medium" style={{ color: "#6B6C7E" }}>
                          .{PLATFORM_DOMAIN}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <p className="text-xs" style={{ color: "#6B6C7E" }}>This will be your unique URL</p>
                      {domainAvailable === true && (
                        <span className="text-xs px-2 py-1 rounded-full" style={{ color: "#16A34A", backgroundColor: "rgba(34, 197, 94, 0.1)" }}>
                          Available
                        </span>
                      )}
                      {domainAvailable === false && (
                        <span className="text-xs px-2 py-1 rounded-full" style={{ color: "#DC2626", backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                          Already exists, try another
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#21222D" }}>Industry Type *</label>
                    <select
                      value={tenantForm.industryType}
                      onChange={(e) => updateTenantForm("industryType", e.target.value)}
                      className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all appearance-none bg-no-repeat bg-right"
                      style={{
                        borderColor: "rgba(219, 219, 229, 0.6)",
                        backgroundColor: "#FAFBFC",
                        "--tw-ring-color": "#958CE8",
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236B6C7E' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        backgroundPosition: "right 1rem center",
                      } as React.CSSProperties}
                    >
                      <option value="">Select industry</option>
                      <option value="SOFTWARE">SOFTWARE</option>
                      <option value="RETAIL">RETAIL</option>
                      <option value="SERVICES">SERVICES</option>
                      <option value="BRAND">BRAND</option>
                      <option value="MANUFACTURING">MANUFACTURING</option>
                      <option value="WHOLESALE">WHOLESALE</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold mb-5" style={{ color: "#21222D" }}>Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#21222D" }}>Email Address *</label>
                    <input
                      type="email"
                      value={tenantForm.emailAddress}
                      onChange={(e) => updateTenantForm("emailAddress", e.target.value)}
                      placeholder="admin@company.com"
                      className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{
                        borderColor: "rgba(219, 219, 229, 0.6)",
                        backgroundColor: "#FAFBFC",
                        "--tw-ring-color": "#958CE8",
                      } as React.CSSProperties}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#21222D" }}>Phone Number *</label>
                    <input
                      type="tel"
                      value={tenantForm.phoneNumber}
                      onChange={(e) => updateTenantForm("phoneNumber", e.target.value)}
                      placeholder="+1 (234) 567-8900"
                      className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{
                        borderColor: "rgba(219, 219, 229, 0.6)",
                        backgroundColor: "#FAFBFC",
                        "--tw-ring-color": "#958CE8",
                      } as React.CSSProperties}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{ color: "#21222D" }}>Address *</label>
                    <textarea
                      value={tenantForm.address}
                      onChange={(e) => updateTenantForm("address", e.target.value)}
                      placeholder="Enter your company address"
                      rows={3}
                      className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none"
                      style={{
                        borderColor: "rgba(219, 219, 229, 0.6)",
                        backgroundColor: "#FAFBFC",
                        "--tw-ring-color": "#958CE8",
                      } as React.CSSProperties}
                    />
                  </div>
                </div>
              </div>

              {showWhatsappFields ? (
                <div>
                  <h3 className="text-base font-semibold mb-5" style={{ color: "#21222D" }}>WhatsApp Account</h3>
                  <p className="text-sm mb-5" style={{ color: "#6B6C7E" }}>
                    This plan includes WhatsApp. Add the business phone number for the tenant.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2" style={{ color: "#21222D" }}>Display Phone Number *</label>
                      <input
                        type="text"
                        value={tenantForm.displayPhoneNumber}
                        onChange={(e) => updateTenantForm("displayPhoneNumber", e.target.value)}
                        placeholder="+923001234567"
                        className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                        style={{
                          borderColor: "rgba(219, 219, 229, 0.6)",
                          backgroundColor: "#FAFBFC",
                          "--tw-ring-color": "#958CE8",
                        } as React.CSSProperties}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: "#21222D" }}>Phone Country Code *</label>
                      <input
                        type="text"
                        value={tenantForm.phoneCountryCode}
                        onChange={(e) => updateTenantForm("phoneCountryCode", e.target.value)}
                        placeholder="+92"
                        className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                        style={{
                          borderColor: "rgba(219, 219, 229, 0.6)",
                          backgroundColor: "#FAFBFC",
                          "--tw-ring-color": "#958CE8",
                        } as React.CSSProperties}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: "#21222D" }}>Phone National Number *</label>
                      <input
                        type="text"
                        value={tenantForm.phoneNationalNumber}
                        onChange={(e) => updateTenantForm("phoneNationalNumber", e.target.value)}
                        placeholder="3001234567"
                        className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                        style={{
                          borderColor: "rgba(219, 219, 229, 0.6)",
                          backgroundColor: "#FAFBFC",
                          "--tw-ring-color": "#958CE8",
                        } as React.CSSProperties}
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="sticky bottom-0 px-8 py-6 border-t rounded-b-3xl flex items-center justify-between" style={{ backgroundColor: "#FAFBFC", borderColor: "rgba(219, 219, 229, 0.3)" }}>
              <p className="text-xs" style={{ color: "#6B6C7E" }}>
                By creating a tenant, you agree to our Terms of Service
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-6 py-3 font-medium text-sm transition-all rounded-xl border"
                  style={{ color: "#6B6C7E", borderColor: "rgba(219, 219, 229, 0.6)" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreateTenant()}
                  disabled={creatingTenant}
                  className="px-6 py-3 text-white rounded-xl font-medium text-sm transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ backgroundColor: "#958CE8" }}
                >
                  {creatingTenant ? "Creating..." : "Create & Provision Tenant"}
                </button>
              </div>
              {createError ? (
                <div className="mt-4 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "rgba(248, 113, 113, 0.3)", color: "#B91C1C", backgroundColor: "#FEF2F2" }}>
                  {createError}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="bg-white rounded-2xl overflow-hidden" style={{
        border: "1px solid rgba(219, 219, 229, 0.4)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
      }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: "#F8F9FC" }}>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#6B6C7E" }}>Tenant</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#6B6C7E" }}>Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#6B6C7E" }}>Last Job</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#6B6C7E" }}>Updated</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#6B6C7E" }}>Error</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#6B6C7E" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-6 py-8 text-sm text-gray-500" colSpan={6}>Loading tenants...</td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-sm text-gray-500" colSpan={6}>No tenants found.</td>
                </tr>
              ) : (
                filteredTenants.map((tenant, index) => (
                  <tr
                    key={tenant.tenantId}
                    className="transition-colors"
                    style={{ borderTop: index > 0 ? "1px solid rgba(219, 219, 229, 0.3)" : "none" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(172, 209, 253, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <Link to={`/master/tenants/${tenant.tenantId}`} className="text-sm font-medium hover:underline" style={{ color: "#958CE8" }}>
                          {tenant.tenantName}
                        </Link>
                        <p className="text-xs mt-0.5" style={{ color: "#6B6C7E" }}>{tenant.tenantId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={tenant.tenantStatus} size="sm" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={tenant.lastJobStatus === "RUNNING" ? "PENDING" : (tenant.lastJobStatus || "PENDING")} size="sm" />
                        <span className="text-xs text-gray-500">{tenant.lastJobId || "No job"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: "#6B6C7E" }}>
                      {new Date(tenant.lastUpdatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#6B6C7E" }}>
                      {tenant.lastError || "None"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link to={`/master/tenants/${tenant.tenantId}`} className="font-medium hover:underline" style={{ color: "#958CE8" }}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
