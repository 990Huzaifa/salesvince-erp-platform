import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, Edit2, Eye, EyeOff, Loader2, Megaphone, Plus, RefreshCw, Search, Target, X } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { apiJson } from "../utils/api";
import { getAuthSession } from "../utils/auth";

type DisplayMode = "BANNER" | "MODAL";
type AnnouncementType = "INFO" | "WARNING" | "ERROR" | "SUCCESS";
type TargetScope = "GLOBAL" | "TENANT" | "PLAN";
type AnnouncementStatus = "DRAFT" | "SCHEDULED" | "ACTIVE" | "EXPIRED";

type ApiPlan = {
  id: number;
  title: string;
  slug: string;
  currency: string;
  monthly_price: number;
  yearly_price: number;
  is_active: boolean;
  is_display: boolean;
};

type AnnouncementPlanLink = {
  id?: string;
  plan_id: number;
  plan?: ApiPlan;
};

type AnnouncementTenantLink = {
  id?: string;
  tenant_id: string;
};

type ApiAnnouncement = {
  id: string;
  title: string;
  message: string;
  priority: number;
  isActive: boolean;
  displayMode: DisplayMode;
  type: AnnouncementType;
  targetScope: TargetScope;
  isDismissable: boolean;
  startsAt: string;
  endsAt: string;
  createdBy?: { id: string; fullName: string } | null;
  announcement_plans: AnnouncementPlanLink[];
  announcement_tenants: AnnouncementTenantLink[];
  createdAt: string;
  updatedAt: string;
};

type AnnouncementListResponse = {
  data: ApiAnnouncement[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type PlanListResponse = {
  data: ApiPlan[];
  meta: {
    page: number;
    limit: number;
  };
};

type AnnouncementFormState = {
  title: string;
  message: string;
  priority: number;
  is_active: boolean;
  displayMode: DisplayMode;
  type: AnnouncementType;
  isDismissable: boolean;
  startsAt: string;
  endsAt: string;
  targetScope: TargetScope;
  tenantIds: string;
  planIds: number[];
};

const initialFormState: AnnouncementFormState = {
  title: "",
  message: "",
  priority: 1,
  is_active: true,
  displayMode: "BANNER",
  type: "INFO",
  isDismissable: true,
  startsAt: "",
  endsAt: "",
  targetScope: "GLOBAL",
  tenantIds: "",
  planIds: [],
};

const localDateTimeValue = (iso: string | null | undefined) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const toIsoString = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

const normalizeTenantIds = (value: string) =>
  value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const priorityMeta = (priority: number) => {
  if (priority >= 4) return { label: "Urgent", className: "text-red-600 bg-red-100" };
  if (priority === 3) return { label: "High", className: "text-orange-600 bg-orange-100" };
  if (priority === 2) return { label: "Medium", className: "text-amber-600 bg-amber-100" };
  return { label: "Low", className: "text-blue-600 bg-blue-100" };
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const getAnnouncementStatus = (announcement: Pick<ApiAnnouncement, "isActive" | "startsAt" | "endsAt">): AnnouncementStatus => {
  const now = Date.now();
  const startsAt = Date.parse(announcement.startsAt);
  const endsAt = Date.parse(announcement.endsAt);

  if (Number.isFinite(endsAt) && endsAt < now) {
    return "EXPIRED";
  }

  if (!announcement.isActive) {
    return "DRAFT";
  }

  if (Number.isFinite(startsAt) && startsAt > now) {
    return "SCHEDULED";
  }

  return "ACTIVE";
};

const mapAnnouncementToForm = (announcement: ApiAnnouncement): AnnouncementFormState => ({
  title: announcement.title,
  message: announcement.message,
  priority: announcement.priority,
  is_active: announcement.isActive,
  displayMode: announcement.displayMode,
  type: announcement.type,
  isDismissable: announcement.isDismissable,
  startsAt: localDateTimeValue(announcement.startsAt),
  endsAt: localDateTimeValue(announcement.endsAt),
  targetScope: announcement.targetScope,
  tenantIds: announcement.announcement_tenants.map((item) => item.tenant_id).join(", "),
  planIds: announcement.announcement_plans.map((item) => item.plan_id),
});

const buildAnnouncementRecord = (
  base: Partial<ApiAnnouncement> | null,
  form: AnnouncementFormState,
  fallbackId: string,
  plans: ApiPlan[],
  existing?: ApiAnnouncement
): ApiAnnouncement => {
  const currentUser = getAuthSession()?.user;
  const targetScope = (base?.targetScope as TargetScope) || form.targetScope;
  const tenantIds = targetScope === "TENANT" ? normalizeTenantIds(form.tenantIds) : [];
  const planIds = targetScope === "PLAN" ? form.planIds : [];

  const announcement_plans =
    base?.announcement_plans?.length
      ? base.announcement_plans
      : planIds.map((plan_id) => ({
          plan_id,
          plan: plans.find((plan) => plan.id === plan_id),
        }));

  const announcement_tenants =
    base?.announcement_tenants?.length
      ? base.announcement_tenants
      : tenantIds.map((tenant_id) => ({ tenant_id }));

  return {
    id: base?.id ?? fallbackId,
    title: base?.title ?? form.title.trim(),
    message: base?.message ?? form.message.trim(),
    priority: typeof base?.priority === "number" ? base.priority : form.priority,
    isActive: typeof base?.isActive === "boolean" ? base.isActive : form.is_active,
    displayMode: (base?.displayMode as DisplayMode) ?? form.displayMode,
    type: (base?.type as AnnouncementType) ?? form.type,
    targetScope,
    isDismissable: typeof base?.isDismissable === "boolean" ? base.isDismissable : form.isDismissable,
    startsAt: base?.startsAt ?? toIsoString(form.startsAt),
    endsAt: base?.endsAt ?? toIsoString(form.endsAt),
    createdBy:
      base?.createdBy ??
      existing?.createdBy ??
      (currentUser
        ? {
            id: currentUser.id,
            fullName: currentUser.fullName,
          }
        : null),
    announcement_plans,
    announcement_tenants,
    createdAt: base?.createdAt ?? existing?.createdAt ?? new Date().toISOString(),
    updatedAt: base?.updatedAt ?? new Date().toISOString(),
  };
};

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<ApiAnnouncement[]>([]);
  const [announcementMeta, setAnnouncementMeta] = useState<AnnouncementListResponse["meta"]>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [form, setForm] = useState<AnnouncementFormState>(initialFormState);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const detailRequestRef = useRef(0);

  const planLookup = useMemo(() => new Map(plans.map((plan) => [plan.id, plan])), [plans]);

  const loadAnnouncements = async (page = currentPage) => {
    setLoading(true);
    setPageError("");

    try {
      const response = await apiJson<AnnouncementListResponse>(`platform/announcement?page=${page}&limit=${announcementMeta.limit}`);
      setAnnouncements(response.data ?? []);
      setAnnouncementMeta(response.meta ?? { total: 0, page: 1, limit: 10, totalPages: 1 });
      setCurrentPage(response.meta?.page ?? page);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to load announcements.");
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
    } catch (error) {
      setPlansError(error instanceof Error ? error.message : "Failed to load plans.");
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    void loadAnnouncements(1);
    void loadPlans();
  }, []);

  const closeModal = () => {
    detailRequestRef.current += 1;
    setShowModal(false);
    setModalMode("create");
    setEditingAnnouncementId(null);
    setModalLoading(false);
    setForm(initialFormState);
    setFormError("");
  };

  const openCreateModal = () => {
    detailRequestRef.current += 1;
    setModalMode("create");
    setEditingAnnouncementId(null);
    setForm(initialFormState);
    setFormError("");
    setModalLoading(false);
    setShowModal(true);
  };

  const openEditModal = (announcementId: string) => {
    const requestId = ++detailRequestRef.current;
    setModalMode("edit");
    setEditingAnnouncementId(announcementId);
    setForm(initialFormState);
    setFormError("");
    setModalLoading(true);
    setShowModal(true);

    void apiJson<ApiAnnouncement>(`platform/announcement/${announcementId}`)
      .then((announcement) => {
        if (detailRequestRef.current !== requestId) {
          return;
        }
        setForm(mapAnnouncementToForm(announcement));
      })
      .catch((error) => {
        if (detailRequestRef.current !== requestId) {
          return;
        }
        setFormError(error instanceof Error ? error.message : "Failed to load announcement details.");
      })
      .finally(() => {
        if (detailRequestRef.current === requestId) {
          setModalLoading(false);
        }
      });
  };

  const updateField = <K extends keyof AnnouncementFormState>(field: K, value: AnnouncementFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const togglePlanSelection = (planId: number) => {
    setForm((current) => ({
      ...current,
      planIds: current.planIds.includes(planId)
        ? current.planIds.filter((item) => item !== planId)
        : [...current.planIds, planId],
    }));
  };

  const buildPayload = () => {
    if (!form.title.trim()) throw new Error("Title is required.");
    if (!form.message.trim()) throw new Error("Message is required.");
    if (!form.startsAt || !form.endsAt) throw new Error("Start and end times are required.");

    const startsAt = toIsoString(form.startsAt);
    const endsAt = toIsoString(form.endsAt);

    if (!startsAt || !endsAt) throw new Error("Enter valid start and end times.");
    if (Date.parse(endsAt) < Date.parse(startsAt)) throw new Error("End time must be after start time.");

    const tenantIds = form.targetScope === "TENANT" ? normalizeTenantIds(form.tenantIds) : [];
    const planIds = form.targetScope === "PLAN" ? form.planIds : [];

    if (form.targetScope === "TENANT" && tenantIds.length === 0) {
      throw new Error("Add at least one tenant ID.");
    }

    if (form.targetScope === "PLAN" && planIds.length === 0) {
      throw new Error("Select at least one plan.");
    }

    return {
      title: form.title.trim(),
      message: form.message.trim(),
      priority: Number(form.priority),
      is_active: form.is_active,
      displayMode: form.displayMode,
      type: form.type,
      isDismissable: form.isDismissable,
      startsAt,
      endsAt,
      targetScope: form.targetScope,
      ...(form.targetScope === "TENANT"
        ? { announcement_tenants: tenantIds.map((tenant_id) => ({ tenant_id })) }
        : {}),
      ...(form.targetScope === "PLAN"
        ? { announcement_plans: planIds.map((plan_id) => ({ plan_id })) }
        : {}),
    };
  };

  const saveAnnouncement = async () => {
    setFormError("");
    setSubmitting(true);

    try {
      const payload = buildPayload();
      const isEdit = modalMode === "edit" && Boolean(editingAnnouncementId);
      const endpoint = isEdit
        ? `platform/announcement/${editingAnnouncementId}`
        : "platform/announcement";

      const response = await apiJson<Partial<ApiAnnouncement> | null>(endpoint, {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      const savedAnnouncement = buildAnnouncementRecord(
        response && typeof response === "object" ? response : null,
        form,
        editingAnnouncementId || String(Date.now()),
        plans,
        announcements.find((item) => item.id === editingAnnouncementId)
      );

      setAnnouncements((current) =>
        isEdit
          ? current.map((item) => (item.id === savedAnnouncement.id ? savedAnnouncement : item))
          : [savedAnnouncement, ...current]
      );

      const nextPage = modalMode === "create" ? 1 : currentPage;
      setCurrentPage(nextPage);
      void loadAnnouncements(nextPage);
      closeModal();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to save announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAnnouncementStatus = async (announcement: ApiAnnouncement) => {
    setStatusUpdatingId(announcement.id);

    try {
      await apiJson(`platform/announcement/${announcement.id}/status?is_active=${!announcement.isActive}`, {
        method: "PUT",
      });

      setAnnouncements((current) =>
        current.map((item) =>
          item.id === announcement.id
            ? { ...item, isActive: !item.isActive }
            : item
        )
      );
      void loadAnnouncements(currentPage);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to update announcement status.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const filteredAnnouncements = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return announcements;

    return announcements.filter((announcement) => {
      const targetLabel =
        announcement.targetScope === "PLAN"
          ? announcement.announcement_plans
              .map((item) => item.plan?.title || planLookup.get(item.plan_id)?.title || String(item.plan_id))
              .join(" ")
          : announcement.targetScope === "TENANT"
            ? announcement.announcement_tenants.map((item) => item.tenant_id).join(" ")
            : "global";

      return [
        announcement.title,
        announcement.message,
        announcement.createdBy?.fullName ?? "",
        announcement.type,
        announcement.targetScope,
        targetLabel,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [announcements, searchQuery, planLookup]);

  const stats = useMemo(
    () => ({
      total: announcementMeta.total || announcements.length,
      active: announcements.filter((item) => getAnnouncementStatus(item) === "ACTIVE").length,
      planTargeted: announcements.filter((item) => item.targetScope === "PLAN").length,
      tenantTargeted: announcements.filter((item) => item.targetScope === "TENANT").length,
    }),
    [announcements, announcementMeta.total]
  );

  const totalPages = announcementMeta.totalPages || 1;
  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="mt-1 text-sm text-gray-500">Manage live platform announcements</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadAnnouncements()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="size-4" />
            Create Announcement
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { label: "Total", value: stats.total, note: `Page ${announcementMeta.page} of ${announcementMeta.totalPages}` },
          { label: "Active", value: stats.active, note: "Currently live" },
          { label: "Plan", value: stats.planTargeted, note: "Plan scoped" },
          { label: "Tenant", value: stats.tenantTargeted, note: "Tenant scoped" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{item.value}</p>
            <p className="mt-1 text-xs text-gray-500">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
        <p className="text-sm text-gray-600">
          Page {currentPage} of {totalPages} · {announcementMeta.total} total
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (currentPage > 1) {
                const next = currentPage - 1;
                setCurrentPage(next);
                void loadAnnouncements(next);
              }
            }}
            disabled={currentPage <= 1 || loading}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>

          {visiblePages.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => {
                setCurrentPage(page);
                void loadAnnouncements(page);
              }}
              disabled={loading}
              className={`min-w-10 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                page === currentPage
                  ? "bg-blue-600 text-white"
                  : "border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              if (currentPage < totalPages) {
                const next = currentPage + 1;
                setCurrentPage(next);
                void loadAnnouncements(next);
              }
            }}
            disabled={currentPage >= totalPages || loading}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {pageError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{pageError}</div>
      ) : null}

      <div className="space-y-4">
        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            Loading announcements...
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            No announcements found.
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => {
            const status = getAnnouncementStatus(announcement);
            const priority = priorityMeta(announcement.priority);
            const targetLabel =
              announcement.targetScope === "PLAN"
                ? announcement.announcement_plans
                    .map((item) => item.plan?.title || planLookup.get(item.plan_id)?.title || `Plan ${item.plan_id}`)
                    .join(", ") || "Plans"
                : announcement.targetScope === "TENANT"
                  ? announcement.announcement_tenants.length > 0
                    ? `${announcement.announcement_tenants.length} tenant(s)`
                    : "Tenant scope"
                  : "Global";

            return (
              <div key={announcement.id} className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex flex-1 items-start gap-4">
                    <div className={`flex size-12 items-center justify-center rounded-lg ${status === "ACTIVE" ? "bg-green-100" : status === "SCHEDULED" ? "bg-blue-100" : status === "EXPIRED" ? "bg-gray-100" : "bg-gray-100"}`}>
                      <Megaphone className={`size-6 ${status === "ACTIVE" ? "text-green-600" : status === "SCHEDULED" ? "text-blue-600" : status === "EXPIRED" ? "text-gray-500" : "text-gray-500"}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-gray-900">{announcement.title}</h3>
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${priority.className}`}>{priority.label}</span>
                        <StatusBadge status={status} size="sm" />
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{announcement.message}</p>

                      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Target className="size-4" />
                          <span>{targetLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-4" />
                          <span>Starts: {formatDateTime(announcement.startsAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-4" />
                          <span>Ends: {formatDateTime(announcement.endsAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Eye className="size-4" />
                          <span>{announcement.type}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <EyeOff className="size-4" />
                          <span>{announcement.isDismissable ? "Dismissable" : "Locked"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start">
                    <button
                      type="button"
                      onClick={() => openEditModal(announcement.id)}
                      className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                      aria-label="Edit announcement"
                    >
                      <Edit2 className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleAnnouncementStatus(announcement)}
                      disabled={statusUpdatingId === announcement.id}
                      className={`rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
                        announcement.isActive
                          ? "text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                          : "text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                      }`}
                      aria-label={announcement.isActive ? "Deactivate announcement" : "Activate announcement"}
                    >
                      {statusUpdatingId === announcement.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : announcement.isActive ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4 text-sm text-gray-500">
                  <span>Created by {announcement.createdBy?.fullName || "System"} on {formatDateTime(announcement.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {modalMode === "edit" ? "Update Announcement" : "Create Announcement"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {modalMode === "edit" ? "Edit and publish the announcement" : "Create a new platform announcement"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {formError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              ) : null}

              {modalLoading ? (
                <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 py-16 text-sm text-gray-500">
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Loading details...
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Title *</label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => updateField("title", e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Priority *</label>
                      <select
                        value={form.priority}
                        onChange={(e) => updateField("priority", Number(e.target.value))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value={1}>1 - Low</option>
                        <option value={2}>2 - Medium</option>
                        <option value={3}>3 - High</option>
                        <option value={4}>4 - Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Message *</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => updateField("message", e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Type *</label>
                      <select
                        value={form.type}
                        onChange={(e) => updateField("type", e.target.value as AnnouncementType)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="INFO">INFO</option>
                        <option value="SUCCESS">SUCCESS</option>
                        <option value="WARNING">WARNING</option>
                        <option value="ERROR">ERROR</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Display Mode *</label>
                      <select
                        value={form.displayMode}
                        onChange={(e) => updateField("displayMode", e.target.value as DisplayMode)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="BANNER">BANNER</option>
                        <option value="MODAL">MODAL</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Target Scope *</label>
                      <select
                        value={form.targetScope}
                        onChange={(e) => updateField("targetScope", e.target.value as TargetScope)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="GLOBAL">GLOBAL</option>
                        <option value="TENANT">TENANT</option>
                        <option value="PLAN">PLAN</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Starts At *</label>
                      <input
                        type="datetime-local"
                        value={form.startsAt}
                        onChange={(e) => updateField("startsAt", e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Ends At *</label>
                      <input
                        type="datetime-local"
                        value={form.endsAt}
                        onChange={(e) => updateField("endsAt", e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  {form.targetScope === "TENANT" ? (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Tenant IDs *</label>
                      <textarea
                        value={form.tenantIds}
                        onChange={(e) => updateField("tenantIds", e.target.value)}
                        rows={4}
                        placeholder="One tenant ID per line or separated by commas"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  ) : null}

                  {form.targetScope === "PLAN" ? (
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Plan Targets</h3>
                          <p className="text-xs text-gray-500">Select one or more plans for this announcement</p>
                        </div>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                          {form.planIds.length} selected
                        </span>
                      </div>

                      {plansLoading ? (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                          Loading plans...
                        </div>
                      ) : plansError ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {plansError}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {plans.map((plan) => (
                            <label
                              key={plan.id}
                              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                                form.planIds.includes(plan.id) ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={form.planIds.includes(plan.id)}
                                onChange={() => togglePlanSelection(plan.id)}
                                className="mt-1 size-4 rounded"
                              />
                              <span className="min-w-0">
                                <span className="block text-sm font-medium text-gray-900">{plan.title}</span>
                                <span className="block text-xs text-gray-500">
                                  {plan.slug} · {plan.currency} {plan.monthly_price}/mo
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => updateField("is_active", e.target.checked)}
                      />
                      Active
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.isDismissable}
                        onChange={(e) => updateField("isDismissable", e.target.checked)}
                      />
                      Dismissable
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.displayMode === "BANNER"}
                        onChange={(e) => updateField("displayMode", e.target.checked ? "BANNER" : "MODAL")}
                      />
                      Banner mode
                    </label>
                  </div>
                </>
              )}
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveAnnouncement()}
                disabled={submitting || modalLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                {modalMode === "edit" ? "Update Announcement" : "Create Announcement"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
