import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { apiJson } from "../utils/api";
import { StatusBadge } from "../components/StatusBadge";
import {
  ArrowLeft,
  Building2,
  Database,
  Package,
  Settings,
  Activity,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Power,
  PlayCircle,
} from "lucide-react";

type ProvisioningLog = {
  level: "INFO" | "WARNING" | "ERROR";
  message: string;
  createdAt: string;
};

type ProvisioningJob = {
  jobId: string;
  status: "SUCCESS" | "FAILED" | "PENDING" | "RUNNING";
  startedAt: string;
  finishedAt: string | null;
  errorMessage: string | null;
  logs: ProvisioningLog[];
};

type ProvisioningDetailResponse = {
  tenant: {
    id: string;
    name: string;
    status: "PROVISIONING" | "PROVISIONED" | "FAILED" | "SUSPENDED" | "REGISTERED";
  };
  jobs: ProvisioningJob[];
};

type TenantSettingsResponse = {
  id: string;
  timezone: string;
  currency: string;
  baseUom: "PCS" | "LTR" | "KGS" | string;
  baseLocale: "en" | "ar" | string;
  createdAt: string;
  updatedAt: string;
};

type TenantThemeResponse = {
  id: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  darkMode: boolean;
  createdAt: string;
  updatedAt: string;
};

type TenantGeoPolicyResponse = {
  id: string;
  scope_type: "GLOBAL" | "COUNTRY" | "STATE";
  country_id: number | null;
  state_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type TenantModuleResponse = {
  id: string;
  module: {
    id: string;
    key: string;
    name: string;
    description: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

type TenantViewResponse = {
  id: string;
  code: string;
  name: string;
  email: string;
  industryType: string;
  isActive: boolean;
  status: "PROVISIONED" | "SUSPENDED" | "REGISTERED" | "FAILED" | string;
  createdAt: string;
  updatedAt: string;
  profile: {
    displayName?: string | null;
    logoUrl?: string | null;
    phone?: string | null;
    address?: string | null;
    supportEmail?: string | null;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  modules: Array<{
    id?: string | number;
    name?: string;
    enabled?: boolean;
    enabledAt?: string | null;
  }>;
};

type GeoPolicyFormState = {
  scope_type: "GLOBAL" | "COUNTRY" | "STATE";
  country_id: string;
  state_id: string;
  is_active: boolean;
};

type CountryOption = {
  id: number;
  name: string;
  iso_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type StateOption = {
  id: number;
  country_id: number;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Tab = "overview" | "modules" | "database" | "provisioning" | "settings" | "activity";

const formatDateTime = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const mockTenant = {
  id: "1",
  name: "Acme Corporation",
  code: "ACME",
  subdomain: "acme.snd.com",
  status: "PROVISIONED" as const,
  dbStatus: "CONNECTED" as const,
  createdAt: "2026-01-15 10:30:00",
  lastActivity: "2 mins ago",
  modules: [
    { id: "1", name: "Sales Management", enabled: true, enabledAt: "2026-01-15" },
    { id: "2", name: "Inventory Management", enabled: true, enabledAt: "2026-01-15" },
    { id: "3", name: "Order Processing", enabled: true, enabledAt: "2026-01-16" },
    { id: "4", name: "Route Planning", enabled: false, enabledAt: null },
    { id: "5", name: "Analytics & Reporting", enabled: true, enabledAt: "2026-01-20" },
    { id: "6", name: "Customer Management", enabled: true, enabledAt: "2026-01-15" },
    { id: "7", name: "Payment Gateway", enabled: false, enabledAt: null },
    { id: "8", name: "Warehouse Management", enabled: true, enabledAt: "2026-02-01" },
  ],
  database: {
    host: "tenant-db-cluster.aws.com",
    name: "snd_acme",
    user: "acme_user",
    pool: { active: 8, idle: 12, max: 20 },
    lastHealthCheck: "2 mins ago",
    status: "HEALTHY",
  },
  provisioning: [
    { step: "Database Creation", status: "COMPLETED" as const, timestamp: "2026-01-15 10:30:15", duration: "2.3s" },
    { step: "User Creation", status: "COMPLETED" as const, timestamp: "2026-01-15 10:30:18", duration: "1.1s" },
    { step: "Schema Migration", status: "COMPLETED" as const, timestamp: "2026-01-15 10:30:22", duration: "8.7s" },
    { step: "Seed Data", status: "COMPLETED" as const, timestamp: "2026-01-15 10:30:31", duration: "3.2s" },
    { step: "Connection Pool", status: "COMPLETED" as const, timestamp: "2026-01-15 10:30:35", duration: "1.5s" },
  ],
  settings: {
    timezone: "America/New_York",
    currency: "USD",
    baseUOM: "Pieces",
    locale: "en-US",
  },
  contact: {
    email: "admin@acme.com",
    phone: "+1 234 567 8900",
  },
  stats: {
    users: 45,
    activeUsers: 32,
    storage: "2.3 GB",
    apiCalls: "14.2K",
  },
};

export default function TenantDetail() {
  const { tenantId } = useParams();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [tenant, setTenant] = useState<TenantViewResponse | null>(null);
  const [tenantLoading, setTenantLoading] = useState(false);
  const [tenantError, setTenantError] = useState("");
  const [tenantStatus, setTenantStatus] = useState<"PROVISIONED" | "SUSPENDED">(mockTenant.status);
  const [provisioningData, setProvisioningData] = useState<ProvisioningDetailResponse | null>(null);
  const [provisioningLoading, setProvisioningLoading] = useState(false);
  const [provisioningError, setProvisioningError] = useState("");
  const [actionLoading, setActionLoading] = useState<"suspend" | "resume" | null>(null);
  const [actionError, setActionError] = useState("");
  const [settings, setSettings] = useState<TenantSettingsResponse | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [theme, setTheme] = useState<TenantThemeResponse | null>(null);
  const [themeLoading, setThemeLoading] = useState(false);
  const [themeError, setThemeError] = useState("");
  const [themeSaving, setThemeSaving] = useState(false);
  const [geoPolicy, setGeoPolicy] = useState<GeoPolicyFormState | null>(null);
  const [geoPolicyLoading, setGeoPolicyLoading] = useState(false);
  const [geoPolicyError, setGeoPolicyError] = useState("");
  const [geoPolicySaving, setGeoPolicySaving] = useState(false);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [countriesError, setCountriesError] = useState("");
  const [states, setStates] = useState<StateOption[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [statesError, setStatesError] = useState("");
  const [tenantModules, setTenantModules] = useState<TenantModuleResponse[]>([]);
  const [tenantModulesLoading, setTenantModulesLoading] = useState(false);
  const [tenantModulesError, setTenantModulesError] = useState("");
  const [tenantModuleUpdating, setTenantModuleUpdating] = useState<string | null>(null);
  const [tenantModuleActionError, setTenantModuleActionError] = useState("");

  const loadTenantModules = async (currentTenantId: string) => {
    if (!currentTenantId) return;

    setTenantModulesLoading(true);
    setTenantModulesError("");

    try {
      const response = await apiJson<TenantModuleResponse[]>(`platform/tenant/${currentTenantId}/modules`);
      setTenantModules(response);
    } catch (error) {
      setTenantModulesError(error instanceof Error ? error.message : "Failed to load tenant modules.");
    } finally {
      setTenantModulesLoading(false);
    }
  };

  useEffect(() => {
    const loadTenant = async (currentTenantId: string) => {
      if (!currentTenantId) return;

      setTenantLoading(true);
      setTenantError("");

      try {
        const response = await apiJson<TenantViewResponse>(`platform/tenant/${currentTenantId}`);
        setTenant(response);
        setTenantStatus(response.status === "SUSPENDED" ? "SUSPENDED" : "PROVISIONED");
      } catch (error) {
        setTenantError(error instanceof Error ? error.message : "Failed to load tenant.");
      } finally {
        setTenantLoading(false);
      }
    };

    void loadTenant(tenantId || "");
  }, [tenantId]);

  const loadProvisioning = async (currentTenantId: string) => {
    if (!currentTenantId) return;

    setProvisioningLoading(true);
    setProvisioningError("");

    try {
      const response = await apiJson<ProvisioningDetailResponse>(`platform/tenant/provisioning/${currentTenantId}`);
      setProvisioningData(response);
    } catch (error) {
      setProvisioningError(error instanceof Error ? error.message : "Failed to load provisioning details.");
    } finally {
      setProvisioningLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "provisioning" && tenantId) {
      void loadProvisioning(tenantId);
    }
  }, [activeTab, tenantId]);

  useEffect(() => {
    const loadSettings = async (currentTenantId: string) => {
      if (!currentTenantId) return;

      setSettingsLoading(true);
      setSettingsError("");

      try {
        const response = await apiJson<TenantSettingsResponse>(`platform/tenant/${currentTenantId}/settings`);
        setSettings(response);
      } catch (error) {
        setSettingsError(error instanceof Error ? error.message : "Failed to load tenant settings.");
      } finally {
        setSettingsLoading(false);
      }
    };

    if (activeTab === "settings" && tenantId) {
      void loadSettings(tenantId);
    }
  }, [activeTab, tenantId]);

  useEffect(() => {
    const loadTheme = async (currentTenantId: string) => {
      if (!currentTenantId) return;

      setThemeLoading(true);
      setThemeError("");

      try {
        const response = await apiJson<TenantThemeResponse>(`platform/tenant/${currentTenantId}/themes`);
        setTheme(response);
      } catch (error) {
        setThemeError(error instanceof Error ? error.message : "Failed to load tenant theme.");
      } finally {
        setThemeLoading(false);
      }
    };

    if (activeTab === "settings" && tenantId) {
      void loadTheme(tenantId);
    }
  }, [activeTab, tenantId]);

  useEffect(() => {
    const loadGeoPolicy = async (currentTenantId: string) => {
      if (!currentTenantId) return;

      setGeoPolicyLoading(true);
      setGeoPolicyError("");

      try {
        const response = await apiJson<TenantGeoPolicyResponse>(`platform/tenant/${currentTenantId}/geo-policy`);
        setGeoPolicy({
          scope_type: response.scope_type,
          country_id: response.country_id ? String(response.country_id) : "",
          state_id: response.state_id ? String(response.state_id) : "",
          is_active: response.is_active,
        });
      } catch (error) {
        setGeoPolicyError(error instanceof Error ? error.message : "Failed to load geo policy.");
      } finally {
        setGeoPolicyLoading(false);
      }
    };

    if (activeTab === "settings" && tenantId) {
      void loadGeoPolicy(tenantId);
    }
  }, [activeTab, tenantId]);

  useEffect(() => {
    const loadCountries = async () => {
      setCountriesLoading(true);
      setCountriesError("");

      try {
        const response = await apiJson<CountryOption[]>("utility/countries");
        setCountries(response);
      } catch (error) {
        setCountriesError(error instanceof Error ? error.message : "Failed to load countries.");
      } finally {
        setCountriesLoading(false);
      }
    };

    if (activeTab === "settings") {
      void loadCountries();
    }
  }, [activeTab]);

  useEffect(() => {
    const loadStates = async (countryId: string) => {
      if (!countryId) {
        setStates([]);
        setStatesError("");
        return;
      }

      setStatesLoading(true);
      setStatesError("");

      try {
        const response = await apiJson<StateOption[]>(`utility/states/${countryId}`);
        setStates(response);
      } catch (error) {
        setStatesError(error instanceof Error ? error.message : "Failed to load states.");
      } finally {
        setStatesLoading(false);
      }
    };

    if (activeTab === "settings" && geoPolicy && geoPolicy.scope_type !== "GLOBAL") {
      void loadStates(geoPolicy.country_id);
    } else {
      setStates([]);
      setStatesError("");
    }
  }, [activeTab, geoPolicy?.scope_type, geoPolicy?.country_id]);

  useEffect(() => {
    if (activeTab === "modules" && tenantId) {
      void loadTenantModules(tenantId);
    }
  }, [activeTab, tenantId]);

  const updateTenantModuleStatus = async (moduleId: string, isActive: boolean) => {
    if (!tenantId) return;

    setTenantModuleUpdating(moduleId);
    setTenantModuleActionError("");

    try {
      await apiJson(`platform/tenant/${tenantId}/modules/${moduleId}/status?isActive=${isActive}`, {
        method: "PUT",
      });

      await loadTenantModules(tenantId);
    } catch (error) {
      setTenantModuleActionError(error instanceof Error ? error.message : "Failed to update module status.");
    } finally {
      setTenantModuleUpdating(null);
    }
  };

  const updateTenantStatus = async (nextAction: "suspend" | "resume") => {
    if (!tenantId) return;

    setActionLoading(nextAction);
    setActionError("");

    try {
      await apiJson(`platform/tenant/${tenantId}/${nextAction}`, {
        method: "POST",
      });

      setTenantStatus(nextAction === "suspend" ? "SUSPENDED" : "PROVISIONED");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : `Failed to ${nextAction} tenant.`);
    } finally {
      setActionLoading(null);
    }
  };

  const saveSettings = async () => {
    if (!tenantId || !settings) return;

    setSettingsSaving(true);
    setSettingsError("");

    try {
      const response = await apiJson<TenantSettingsResponse>(`platform/tenant/${tenantId}/settings`, {
        method: "PUT",
        body: JSON.stringify({
          currency: settings.currency,
          baseUom: settings.baseUom,
          baseLocale: settings.baseLocale,
        }),
      });

      setSettings(response);
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : "Failed to save tenant settings.");
    } finally {
      setSettingsSaving(false);
    }
  };

  const saveTheme = async () => {
    if (!tenantId || !theme) return;

    setThemeSaving(true);
    setThemeError("");

    try {
      const response = await apiJson<TenantThemeResponse>(`platform/tenant/${tenantId}/themes`, {
        method: "PUT",
        body: JSON.stringify({
          primaryColor: theme.primaryColor,
          secondaryColor: theme.secondaryColor,
          accentColor: theme.accentColor,
          darkMode: theme.darkMode,
        }),
      });

      setTheme(response);
    } catch (error) {
      setThemeError(error instanceof Error ? error.message : "Failed to save tenant theme.");
    } finally {
      setThemeSaving(false);
    }
  };

  const saveGeoPolicy = async () => {
    if (!tenantId || !geoPolicy) return;

    setGeoPolicySaving(true);
    setGeoPolicyError("");

    try {
      const response = await apiJson<{ message: string; geoPolicy: TenantGeoPolicyResponse }>(`platform/tenant/${tenantId}/geo-policy`, {
        method: "PUT",
        body: JSON.stringify({
          scope_type: geoPolicy.scope_type,
          country_id: geoPolicy.scope_type === "GLOBAL" ? null : geoPolicy.country_id ? Number(geoPolicy.country_id) : null,
          state_id: geoPolicy.scope_type === "STATE" ? (geoPolicy.state_id ? Number(geoPolicy.state_id) : null) : null,
        }),
      });

      const data = response.geoPolicy;
      setGeoPolicy({
        scope_type: data.scope_type,
        country_id: data.scope_type === "GLOBAL" ? "" : (data.country_id ? String(data.country_id) : ""),
        state_id: data.scope_type === "STATE" ? (data.state_id ? String(data.state_id) : "") : "",
        is_active: data.is_active,
      });
    } catch (error) {
      setGeoPolicyError(error instanceof Error ? error.message : "Failed to save geo policy.");
    } finally {
      setGeoPolicySaving(false);
    }
  };

  const tabs = [
    { id: "overview" as Tab, label: "Overview", icon: Building2 },
    { id: "modules" as Tab, label: "Modules", icon: Package },
    { id: "database" as Tab, label: "Database", icon: Database },
    { id: "provisioning" as Tab, label: "Provisioning", icon: Activity },
    { id: "settings" as Tab, label: "Settings", icon: Settings },
    { id: "activity" as Tab, label: "Activity Logs", icon: Clock },
  ];

  return (
    <div className="min-h-full" style={{ backgroundColor: '#F8F9FC' }}>
      {/* Header */}
      <div className="bg-white" style={{ borderBottom: '1px solid rgba(219, 219, 229, 0.4)' }}>
        <div className="px-8 py-6">
          <Link to="/master/tenants" className="inline-flex items-center gap-2 text-sm hover:underline mb-4" style={{ color: '#958CE8' }}>
            <ArrowLeft className="size-4" />
            Back to Tenants
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 style={{ color: '#21222D' }}>{tenant?.name || mockTenant.name}</h1>
                <StatusBadge status={tenantStatus} />
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm" style={{ color: '#6B6C7E' }}>
                <span>Code: <span className="font-mono font-medium" style={{ color: '#21222D' }}>{tenant?.code || mockTenant.code}</span></span>
                <span>•</span>
                <span>{tenant?.profile?.displayName || tenant?.name || mockTenant.subdomain}</span>
                <span>•</span>
                <span>Created: {formatDateTime(tenant?.createdAt || mockTenant.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ color: '#6B6C7E' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F8F9FC';
                  e.currentTarget.style.color = '#21222D';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#6B6C7E';
                }}
              >
                <RefreshCw className="size-4" />
                Refresh
              </button>
              <button
                type="button"
                disabled={actionLoading !== null}
                onClick={() => void updateTenantStatus(tenantStatus === "SUSPENDED" ? "resume" : "suspend")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-70"
                style={tenantStatus === "SUSPENDED" ? { color: '#10B981' } : { color: '#EF4444' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = tenantStatus === "SUSPENDED" ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Power className="size-4" />
                {actionLoading === (tenantStatus === "SUSPENDED" ? "resume" : "suspend")
                  ? "Updating..."
                  : tenantStatus === "SUSPENDED"
                    ? "Resume"
                    : "Suspend"}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-8">
          <div className="flex gap-8" style={{ borderBottom: '1px solid rgba(219, 219, 229, 0.4)' }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-1 py-4 text-sm font-medium border-b-2 transition-all"
                  style={isActive ? {
                    borderColor: '#958CE8',
                    color: '#958CE8'
                  } : {
                    borderColor: 'transparent',
                    color: '#6B6C7E'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#21222D';
                      e.currentTarget.style.borderColor = 'rgba(219, 219, 229, 0.6)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#6B6C7E';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
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

      {/* Tab Content */}
      <div className="p-8">
        {tenantLoading ? (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
            Loading tenant...
          </div>
        ) : tenantError ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {tenantError}
          </div>
        ) : null}
        {actionError ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        ) : null}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5" style={{
                border: '1px solid rgba(219, 219, 229, 0.4)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}>
                <p className="text-sm" style={{ color: '#6B6C7E' }}>Total Users</p>
                <p className="mt-2 text-2xl font-semibold" style={{ color: '#21222D' }}>{mockTenant.stats.users}</p>
                <p className="mt-1 text-xs" style={{ color: '#6B6C7E' }}>{mockTenant.stats.activeUsers} active now</p>
              </div>
              <div className="bg-white rounded-2xl p-5" style={{
                border: '1px solid rgba(219, 219, 229, 0.4)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}>
                <p className="text-sm" style={{ color: '#6B6C7E' }}>Enabled Modules</p>
                <p className="mt-2 text-2xl font-semibold" style={{ color: '#21222D' }}>
                  {tenantModules.length > 0 ? tenantModules.filter(m => m.enabled).length : mockTenant.modules.filter(m => m.enabled).length}
                </p>
                <p className="mt-1 text-xs" style={{ color: '#6B6C7E' }}>
                  of {tenantModules.length > 0 ? tenantModules.length : mockTenant.modules.length} available
                </p>
              </div>
              <div className="bg-white rounded-2xl p-5" style={{
                border: '1px solid rgba(219, 219, 229, 0.4)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}>
                <p className="text-sm" style={{ color: '#6B6C7E' }}>Storage Used</p>
                <p className="mt-2 text-2xl font-semibold" style={{ color: '#21222D' }}>{mockTenant.stats.storage}</p>
                <p className="mt-1 text-xs" style={{ color: '#6B6C7E' }}>last 30 days</p>
              </div>
              <div className="bg-white rounded-2xl p-5" style={{
                border: '1px solid rgba(219, 219, 229, 0.4)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}>
                <p className="text-sm" style={{ color: '#6B6C7E' }}>API Calls</p>
                <p className="mt-2 text-2xl font-semibold" style={{ color: '#21222D' }}>{mockTenant.stats.apiCalls}</p>
                <p className="mt-1 text-xs" style={{ color: '#6B6C7E' }}>last 24 hours</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Database Status */}
              <div className="bg-white rounded-2xl p-6" style={{
                border: '1px solid rgba(219, 219, 229, 0.4)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 style={{ color: '#21222D' }}>Database Status</h2>
                  <span className="text-xs font-medium px-2 py-1 rounded-full" style={{
                    color: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)'
                  }}>CONNECTED</span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#6B6C7E' }}>Database Name</span>
                    <span className="font-mono" style={{ color: '#21222D' }}>{mockTenant.database.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#6B6C7E' }}>Host</span>
                    <span className="font-mono" style={{ color: '#21222D' }}>{mockTenant.database.host}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#6B6C7E' }}>Active Connections</span>
                    <span style={{ color: '#21222D' }}>{mockTenant.database.pool.active} / {mockTenant.database.pool.max}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#6B6C7E' }}>Last Health Check</span>
                    <span style={{ color: '#21222D' }}>{mockTenant.database.lastHealthCheck}</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-2xl p-6" style={{
                border: '1px solid rgba(219, 219, 229, 0.4)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}>
                <h2 className="mb-4" style={{ color: '#21222D' }}>Contact Information</h2>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm" style={{ color: '#6B6C7E' }}>Email</label>
                    <p className="mt-1 text-sm font-medium" style={{ color: '#21222D' }}>{mockTenant.contact.email}</p>
                  </div>
                  <div>
                    <label className="text-sm" style={{ color: '#6B6C7E' }}>Phone</label>
                    <p className="mt-1 text-sm font-medium" style={{ color: '#21222D' }}>{mockTenant.contact.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm" style={{ color: '#6B6C7E' }}>Timezone</label>
                    <p className="mt-1 text-sm font-medium" style={{ color: '#21222D' }}>{mockTenant.settings.timezone}</p>
                  </div>
                  <div>
                    <label className="text-sm" style={{ color: '#6B6C7E' }}>Currency</label>
                    <p className="mt-1 text-sm font-medium" style={{ color: '#21222D' }}>{mockTenant.settings.currency}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "modules" && (
          <div className="bg-white rounded-2xl" style={{
            border: '1px solid rgba(219, 219, 229, 0.4)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
              <h2 style={{ color: '#21222D' }}>Module Configuration</h2>
              <p className="text-sm mt-1" style={{ color: '#6B6C7E' }}>Enable or disable modules for this tenant</p>
            </div>

            <div className="p-6">
              {tenantModuleActionError ? (
                <div className="rounded-2xl border px-4 py-4 text-sm mb-4" style={{ borderColor: "rgba(248, 113, 113, 0.3)", color: "#B91C1C", backgroundColor: "#FEF2F2" }}>
                  {tenantModuleActionError}
                </div>
              ) : null}

              {tenantModulesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="size-6 animate-spin" style={{ color: '#6B6C7E' }} />
                  <span className="ml-2 text-sm" style={{ color: '#6B6C7E' }}>Loading modules...</span>
                </div>
              ) : tenantModulesError ? (
                <div className="rounded-2xl border px-4 py-4 text-sm" style={{ borderColor: "rgba(248, 113, 113, 0.3)", color: "#B91C1C", backgroundColor: "#FEF2F2" }}>
                  {tenantModulesError}
                </div>
              ) : tenantModules.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="size-12 mx-auto mb-4" style={{ color: '#6B6C7E' }} />
                  <p className="text-sm" style={{ color: '#6B6C7E' }}>No modules available for this tenant.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tenantModules.map((tenantModule) => (
                    <div
                      key={tenantModule.id}
                      className="flex items-center justify-between p-4 rounded-xl transition-colors"
                      style={{ border: '1px solid rgba(219, 219, 229, 0.4)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(172, 209, 253, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <Package className="size-5" style={{ color: '#6B6C7E' }} />
                        <div>
                          <p className="font-medium" style={{ color: '#21222D' }}>{tenantModule.module.name}</p>
                          <p className="text-sm mt-0.5" style={{ color: '#6B6C7E' }}>{tenantModule.module.description}</p>
                          {tenantModule.enabled && (
                            <p className="text-xs mt-0.5" style={{ color: '#6B6C7E' }}>Enabled on {formatDateTime(tenantModule.createdAt)}</p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={tenantModuleUpdating === tenantModule.id}
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60"
                        style={tenantModule.enabled ? {
                          color: '#EF4444',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)'
                        } : {
                          color: '#958CE8',
                          backgroundColor: 'rgba(149, 140, 232, 0.1)'
                        }}
                        onClick={() => void updateTenantModuleStatus(tenantModule.module.id, !tenantModule.enabled)}
                        onMouseEnter={(e) => {
                          if (tenantModule.enabled) {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                          } else {
                            e.currentTarget.style.backgroundColor = 'rgba(149, 140, 232, 0.15)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (tenantModule.enabled) {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                          } else {
                            e.currentTarget.style.backgroundColor = 'rgba(149, 140, 232, 0.1)';
                          }
                        }}
                      >
                        {tenantModuleUpdating === tenantModule.id ? "Updating..." : tenantModule.enabled ? "Disable" : "Enable"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "database" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-semibold text-gray-900">Database Configuration</h2>
                  <p className="text-sm text-gray-500 mt-1">Read-only view of database settings</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-green-500"></span>
                  <span className="text-sm font-medium text-green-600">{mockTenant.database.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">Database Host</label>
                  <p className="mt-2 text-sm font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                    {mockTenant.database.host}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Database Name</label>
                  <p className="mt-2 text-sm font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                    {mockTenant.database.name}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Database User</label>
                  <p className="mt-2 text-sm font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                    {mockTenant.database.user}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Password</label>
                  <p className="mt-2 text-sm font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                    ••••••••••••••••
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Connection Pool Status</h2>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700 font-medium">Active</p>
                  <p className="mt-2 text-3xl font-semibold text-green-900">{mockTenant.database.pool.active}</p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium">Idle</p>
                  <p className="mt-2 text-3xl font-semibold text-blue-900">{mockTenant.database.pool.idle}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700 font-medium">Maximum</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">{mockTenant.database.pool.max}</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Health Check</span>
                <span className="text-sm font-medium text-gray-900">{mockTenant.database.lastHealthCheck}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "provisioning" && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Provisioning Timeline</h2>
                <p className="text-sm text-gray-500 mt-1">Step-by-step provisioning process</p>
              </div>
              <button
                type="button"
                onClick={() => void (tenantId ? loadProvisioning(tenantId) : Promise.resolve())}
                className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
              >
                <PlayCircle className="size-4" />
                Refresh
              </button>
            </div>

            <div className="p-6">
              {provisioningLoading ? (
                <div className="py-12 text-center text-sm text-gray-500">Loading provisioning details...</div>
              ) : provisioningError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {provisioningError}
                </div>
              ) : provisioningData ? (
                <div className="space-y-6">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-gray-500">Tenant</p>
                        <h3 className="mt-1 text-lg font-semibold text-gray-900">{provisioningData.tenant.name}</h3>
                      </div>
                      <StatusBadge status={provisioningData.tenant.status} size="sm" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {provisioningData.jobs.map((job) => {
                      const badgeStatus = job.status === "SUCCESS" ? "COMPLETED" : job.status === "FAILED" ? "FAILED" : "PENDING";

                      return (
                        <div key={job.jobId} className="rounded-xl border border-gray-200 p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-gray-900">Job {job.jobId}</p>
                              <p className="mt-1 text-sm text-gray-500">
                                Started {new Date(job.startedAt).toLocaleString()}
                                {job.finishedAt ? ` · Finished ${new Date(job.finishedAt).toLocaleString()}` : ""}
                              </p>
                            </div>
                            <div className="text-right">
                              <StatusBadge status={badgeStatus} size="sm" />
                              {job.errorMessage ? <p className="mt-1 text-xs text-red-600">{job.errorMessage}</p> : null}
                            </div>
                          </div>

                          <div className="mt-4 rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-200 px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">Logs</p>
                            </div>
                            <div className="divide-y divide-gray-200">
                              {job.logs.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500">No logs.</div>
                              ) : (
                                job.logs.map((log, index) => (
                                  <div key={`${job.jobId}-${index}`} className="px-4 py-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <span
                                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                                          log.level === "ERROR"
                                            ? "bg-red-100 text-red-700"
                                            : log.level === "WARNING"
                                              ? "bg-amber-100 text-amber-700"
                                              : "bg-blue-100 text-blue-700"
                                        }`}
                                      >
                                        {log.level}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(log.createdAt).toLocaleString()}
                                      </span>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-700">{log.message}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-gray-500">No provisioning details available.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Tenant Settings</h2>

              {settingsError ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {settingsError}
                </div>
              ) : null}

              {settingsLoading ? (
                <div className="py-8 text-sm text-gray-500">Loading tenant settings...</div>
              ) : settings ? (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Timezone</label>
                    <input
                      type="text"
                      value={settings.timezone}
                      disabled
                      className="w-full max-w-md cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Read-only from the tenant settings API.</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Currency</label>
                    <select
                      value={settings.currency}
                      onChange={(e) => setSettings((current) => (current ? { ...current, currency: e.target.value } : current))}
                      className="w-full max-w-md rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="USD">USD</option>
                      <option value="PKR">PKR</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Base UOM</label>
                    <select
                      value={settings.baseUom}
                      onChange={(e) => setSettings((current) => (current ? { ...current, baseUom: e.target.value } : current))}
                      className="w-full max-w-md rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="PCS">PCS</option>
                      <option value="LTR">LTR</option>
                      <option value="KGS">KGS</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Choose the base unit used by this tenant.</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Base Locale</label>
                    <select
                      value={settings.baseLocale}
                      onChange={(e) => setSettings((current) => (current ? { ...current, baseLocale: e.target.value } : current))}
                      className="w-full max-w-md rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="en">en</option>
                      <option value="ar">ar</option>
                    </select>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => void saveSettings()}
                  disabled={settingsSaving || settingsLoading || !settings}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {settingsSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Theme Settings</h2>

              {themeError ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {themeError}
                </div>
              ) : null}

              {themeLoading ? (
                <div className="py-8 text-sm text-gray-500">Loading tenant theme...</div>
              ) : theme ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Primary Color</label>
                      <input
                        type="color"
                        value={theme.primaryColor}
                        onChange={(e) => setTheme((current) => (current ? { ...current, primaryColor: e.target.value } : current))}
                        className="h-11 w-full max-w-xs rounded-lg border border-gray-200 bg-white p-1"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Secondary Color</label>
                      <input
                        type="color"
                        value={theme.secondaryColor}
                        onChange={(e) => setTheme((current) => (current ? { ...current, secondaryColor: e.target.value } : current))}
                        className="h-11 w-full max-w-xs rounded-lg border border-gray-200 bg-white p-1"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Accent Color</label>
                      <input
                        type="color"
                        value={theme.accentColor}
                        onChange={(e) => setTheme((current) => (current ? { ...current, accentColor: e.target.value } : current))}
                        className="h-11 w-full max-w-xs rounded-lg border border-gray-200 bg-white p-1"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={theme.darkMode}
                      onChange={(e) => setTheme((current) => (current ? { ...current, darkMode: e.target.checked } : current))}
                      className="size-4 rounded"
                    />
                    Dark Mode
                  </label>
                </div>
              ) : null}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => void saveTheme()}
                  disabled={themeSaving || themeLoading || !theme}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {themeSaving ? "Saving..." : "Save Theme"}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Geo Policy</h2>

              {geoPolicyError ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {geoPolicyError}
                </div>
              ) : null}

              {geoPolicyLoading ? (
                <div className="py-8 text-sm text-gray-500">Loading geo policy...</div>
              ) : geoPolicy ? (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Scope Type</label>
                    <select
                      value={geoPolicy.scope_type}
                      onChange={(e) =>
                        setGeoPolicy((current) =>
                          current
                            ? {
                                ...current,
                                scope_type: e.target.value as GeoPolicyFormState["scope_type"],
                                country_id: e.target.value === "GLOBAL" ? "" : current.country_id,
                                state_id: e.target.value === "GLOBAL" ? "" : current.state_id,
                              }
                            : current,
                        )
                      }
                      className="w-full max-w-md rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="GLOBAL">GLOBAL</option>
                      <option value="COUNTRY">COUNTRY</option>
                      <option value="STATE">STATE</option>
                    </select>
                  </div>

                  {geoPolicy.scope_type === "COUNTRY" ? (
                    <div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Country</label>
                        <select
                          value={geoPolicy.country_id}
                          onChange={(e) =>
                            setGeoPolicy((current) =>
                              current
                                ? {
                                    ...current,
                                    country_id: e.target.value,
                                    state_id: "",
                                  }
                                : current,
                            )
                          }
                          className="w-full max-w-md rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={countriesLoading}
                        >
                          <option value="">{countriesLoading ? "Loading countries..." : "Select country"}</option>
                          {countries.map((country) => (
                            <option key={country.id} value={country.id}>
                              {country.name} ({country.iso_code})
                            </option>
                          ))}
                        </select>
                        {countriesError ? <p className="mt-2 text-xs text-red-600">{countriesError}</p> : null}
                      </div>
                    </div>
                  ) : null}

                  {geoPolicy.scope_type === "STATE" ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Country</label>
                        <select
                          value={geoPolicy.country_id}
                          onChange={(e) =>
                            setGeoPolicy((current) =>
                              current
                                ? {
                                    ...current,
                                    country_id: e.target.value,
                                    state_id: "",
                                  }
                                : current,
                            )
                          }
                          className="w-full max-w-md rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={countriesLoading}
                        >
                          <option value="">{countriesLoading ? "Loading countries..." : "Select country"}</option>
                          {countries.map((country) => (
                            <option key={country.id} value={country.id}>
                              {country.name} ({country.iso_code})
                            </option>
                          ))}
                        </select>
                        {countriesError ? <p className="mt-2 text-xs text-red-600">{countriesError}</p> : null}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">State</label>
                        <select
                          value={geoPolicy.state_id}
                          onChange={(e) => {
                            const selectedState = states.find((state) => String(state.id) === e.target.value);
                            setGeoPolicy((current) =>
                              current
                                ? {
                                    ...current,
                                    country_id: selectedState ? String(selectedState.country_id) : current.country_id,
                                    state_id: e.target.value,
                                  }
                                : current,
                            );
                          }}
                          className="w-full max-w-md rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={statesLoading || !geoPolicy.country_id}
                        >
                          <option value="">
                            {statesLoading ? "Loading states..." : geoPolicy.country_id ? "Select state" : "Select country first"}
                          </option>
                          {states.map((state) => (
                            <option key={state.id} value={state.id}>
                              {state.name} ({state.code})
                            </option>
                          ))}
                        </select>
                        {statesError ? <p className="mt-2 text-xs text-red-600">{statesError}</p> : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => void saveGeoPolicy()}
                  disabled={geoPolicySaving || geoPolicyLoading || !geoPolicy}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {geoPolicySaving ? "Saving..." : "Save Geo Policy"}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-red-200 p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Danger Zone</h3>
                  <p className="text-sm text-gray-600 mt-1">Irreversible actions that affect this tenant</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-red-200 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Delete Tenant</p>
                  <p className="text-sm text-gray-600 mt-1">Permanently delete this tenant and all associated data</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm">
                  <Trash2 className="size-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Activity Logs</h2>
              <p className="text-sm text-gray-500 mt-1">Recent events and actions for this tenant</p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                  <div className="size-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Activity className="size-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Module Enabled</p>
                    <p className="text-sm text-gray-600 mt-1">Warehouse Management module was enabled</p>
                    <p className="text-xs text-gray-500 mt-2">2 hours ago • by admin@snd.com</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                  <div className="size-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="size-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Database Migration</p>
                    <p className="text-sm text-gray-600 mt-1">Schema updated to version 2.4.1</p>
                    <p className="text-xs text-gray-500 mt-2">1 day ago • by system</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                  <div className="size-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Settings className="size-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Settings Updated</p>
                    <p className="text-sm text-gray-600 mt-1">Timezone changed from UTC to America/New_York</p>
                    <p className="text-xs text-gray-500 mt-2">3 days ago • by admin@snd.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
