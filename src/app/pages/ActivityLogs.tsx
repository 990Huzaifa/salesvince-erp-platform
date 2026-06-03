import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Info,
  Loader2,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { apiJson } from "../utils/api";

type ActivityLogActor = {
  id: string;
  email: string;
  fullName: string;
};

type ActivityLogTenant = {
  id: string;
  name?: string;
  code?: string;
};

type ActivityLogItem = {
  id: string;
  actorType: string;
  actorId: string;
  actor: ActivityLogActor | null;
  tenantId: string | null;
  tenant: ActivityLogTenant | null;
  action: string;
  description: string;
  metadata: Record<string, unknown> | null;
  jobId: string | null;
  createdAt: string;
  updatedAt: string;
};

type ActivityLogsResponse = {
  data: ActivityLogItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type ActivityLogDetail = ActivityLogItem;

const pageSize = 10;

const formatDateTime = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatActor = (actor: ActivityLogActor | null) => {
  if (!actor) return "Unknown actor";
  return `${actor.fullName} (${actor.email})`;
};

const formatMetadata = (metadata: Record<string, unknown> | null) => {
  if (!metadata || Object.keys(metadata).length === 0) {
    return "No metadata";
  }

  return JSON.stringify(metadata, null, 2);
};

const getSeverityFromAction = (action: string) => {
  if (/FAILED|ERROR/i.test(action)) return "ERROR";
  if (/CREATE|ENABLE|ACTIVATE|SHOW|LIST/i.test(action)) return "SUCCESS";
  if (/UPDATE|SYNC|SET/i.test(action)) return "INFO";
  if (/SUSPEND|DISABLE|DELETE|REMOVE/i.test(action)) return "WARNING";
  return "INFO";
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case "SUCCESS":
      return <CheckCircle2 className="size-5 text-green-600" />;
    case "ERROR":
      return <XCircle className="size-5 text-red-600" />;
    case "WARNING":
      return <AlertCircle className="size-5 text-yellow-600" />;
    default:
      return <Info className="size-5 text-blue-600" />;
  }
};

const getSeverityBg = (severity: string) => {
  switch (severity) {
    case "SUCCESS":
      return "bg-green-100";
    case "ERROR":
      return "bg-red-100";
    case "WARNING":
      return "bg-yellow-100";
    default:
      return "bg-blue-100";
  }
};

export default function ActivityLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [actorTypeFilter, setActorTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [meta, setMeta] = useState<ActivityLogsResponse["meta"]>({
    total: 0,
    page: 1,
    limit: pageSize,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<ActivityLogDetail | null>(null);

  const loadLogs = async (nextPage = page) => {
    setLoading(true);
    setError("");

    try {
      const response = await apiJson<ActivityLogsResponse>(`platform/activity-logs?page=${nextPage}&limit=${pageSize}`);
      setLogs(response.data ?? []);
      setMeta(response.meta ?? { total: 0, page: nextPage, limit: pageSize, totalPages: 0 });
      setPage(response.meta?.page ?? nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs(1);
  }, []);

  useEffect(() => {
    if (page === meta.page) return;
    void loadLogs(page);
  }, [page]);

  const actions = useMemo(
    () => Array.from(new Set(logs.map((log) => log.action))).sort(),
    [logs]
  );

  const actorTypes = useMemo(
    () => Array.from(new Set(logs.map((log) => log.actorType))).sort(),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesSearch =
        !query ||
        log.action.toLowerCase().includes(query) ||
        log.description.toLowerCase().includes(query) ||
        formatActor(log.actor).toLowerCase().includes(query) ||
        (log.tenant?.name?.toLowerCase().includes(query) ?? false) ||
        (log.tenant?.code?.toLowerCase().includes(query) ?? false) ||
        JSON.stringify(log.metadata ?? {}).toLowerCase().includes(query);

      const matchesAction = actionFilter === "ALL" || log.action === actionFilter;
      const matchesActorType = actorTypeFilter === "ALL" || log.actorType === actorTypeFilter;

      return matchesSearch && matchesAction && matchesActorType;
    });
  }, [actionFilter, actorTypeFilter, logs, searchQuery]);

  const openLogDetail = async (logId: string) => {
    setDetailLoadingId(logId);

    try {
      const detail = await apiJson<ActivityLogDetail>(`platform/activity-logs/${logId}`);
      setSelectedLog(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity log details.");
    } finally {
      setDetailLoadingId(null);
    }
  };

  const totalPages = meta.totalPages || 1;
  const currentPage = meta.page || page;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
          <p className="mt-1 text-sm text-gray-500">Platform-wide activity and audit trail</p>
        </div>
        <button
          onClick={() => void loadLogs(page)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Download className="size-4" />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-[300px] flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search actions, actor, description, or metadata..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="size-4 text-gray-400" />
            <select
              value={actorTypeFilter}
              onChange={(e) => setActorTypeFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Actor Types</option>
              {actorTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Actions</option>
            {actions.map((action) => (
              <option key={action} value={action}>
                {action.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Total Logs</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{meta.total}</p>
          <p className="mt-1 text-xs text-gray-500">From /platform/activity-logs</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Current Page</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{currentPage}</p>
          <p className="mt-1 text-xs text-gray-500">Page size {meta.limit || pageSize}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Total Pages</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{totalPages}</p>
          <p className="mt-1 text-xs text-gray-500">Server reported</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Visible Entries</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{filteredLogs.length}</p>
          <p className="mt-1 text-xs text-gray-500">After client-side filtering</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium text-gray-900">{filteredLogs.length}</span> log entries on this page
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={loading || currentPage <= 1}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="size-4" />
            Prev
          </button>
          <span className="text-sm text-gray-500">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={loading || currentPage >= totalPages}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-gray-500">
            <Loader2 className="size-4 animate-spin" />
            Loading activity logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-gray-500">
            No activity logs match your filters.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log) => {
              const severity = getSeverityFromAction(log.action);

              return (
                <button
                  key={log.id}
                  type="button"
                  onClick={() => void openLogDetail(log.id)}
                  className="w-full p-6 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="flex gap-4">
                    <div className={`flex size-10 flex-shrink-0 items-center justify-center rounded-full ${getSeverityBg(severity)}`}>
                      {getSeverityIcon(severity)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{log.action.replace(/_/g, " ")}</p>
                          <p className="mt-0.5 text-sm text-gray-600">{log.description}</p>
                        </div>
                        <span className="whitespace-nowrap text-xs text-gray-500">{formatDateTime(log.createdAt)}</span>
                      </div>

                      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span>Actor: {formatActor(log.actor)}</span>
                        <span>•</span>
                        <span>Actor Type: {log.actorType.replace(/_/g, " ")}</span>
                        {log.tenant ? (
                          <>
                            <span>•</span>
                            <span>Tenant: {log.tenant.name || log.tenant.code || log.tenantId || "N/A"}</span>
                          </>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={severity as "INFO" | "SUCCESS" | "WARNING" | "ERROR"} size="sm" />
                        {log.jobId ? (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                            Job: {log.jobId}
                          </span>
                        ) : null}
                        {log.metadata ? (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                            Metadata present
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center">
                      {detailLoadingId === log.id ? <Loader2 className="size-4 animate-spin text-gray-400" /> : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedLog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedLog.action.replace(/_/g, " ")}</h2>
                <p className="mt-1 text-sm text-gray-500">{selectedLog.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Actor</p>
                  <p className="mt-2 text-sm font-medium text-gray-900">{formatActor(selectedLog.actor)}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Actor Type</p>
                  <p className="mt-2 text-sm font-medium text-gray-900">{selectedLog.actorType.replace(/_/g, " ")}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Timestamp</p>
                  <p className="mt-2 text-sm font-medium text-gray-900">{formatDateTime(selectedLog.createdAt)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Tenant</p>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {selectedLog.tenant?.name || selectedLog.tenant?.code || selectedLog.tenantId || "N/A"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Job ID</p>
                  <p className="mt-2 text-sm font-medium text-gray-900">{selectedLog.jobId || "N/A"}</p>
                </div>
              </div>


            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                onClick={() => setSelectedLog(null)}
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
