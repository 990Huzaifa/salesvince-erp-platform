import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Edit2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Tags,
  Users,
  X,
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { apiJson } from "../utils/api";

type ApiPermission = {
  id: number;
  code: string;
  name: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type ApiRoleSummary = {
  id: string;
  code: string;
  name: string;
  permissions: ApiPermission[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type ApiRoleDetail = ApiRoleSummary & {
  isActive: boolean;
  createdAt: string;
};

type RoleResponse = {
  result: ApiRoleSummary[];
};

type PermissionResponse = {
  result: ApiPermission[];
};

type RoleFormState = {
  code: string;
  name: string;
  isActive: boolean;
  permissionCodes: string[];
};

type PermissionRow = {
  name: string;
  code: string;
};

type PermissionCategory = "Tenant" | "Billing" | "Module" | "User" | "Announcement" | "Plan" | "Other";

const roleFormInitialState: RoleFormState = {
  code: "",
  name: "",
  isActive: true,
  permissionCodes: [],
};

const permissionRowInitialState: PermissionRow[] = [{ name: "", code: "" }];

const formatDateTime = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const getPermissionCategory = (code: string): PermissionCategory => {
  if (code.startsWith("TENANT")) return "Tenant";
  if (code.startsWith("BILLING")) return "Billing";
  if (code.startsWith("MODULE")) return "Module";
  if (code.startsWith("USER") || code.startsWith("ROLE")) return "User";
  if (code.startsWith("ANNOUNCEMENT")) return "Announcement";
  if (code.startsWith("PLAN")) return "Plan";
  return "Other";
};

const normalizePermissionCode = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_+/g, "_");

export default function RoleManagement() {
  const [roles, setRoles] = useState<ApiRoleSummary[]>([]);
  const [permissions, setPermissions] = useState<ApiPermission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [permissionSearchQuery, setPermissionSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedRole, setSelectedRole] = useState<ApiRoleDetail | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleMode, setRoleMode] = useState<"create" | "edit">("create");
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleForm, setRoleForm] = useState<RoleFormState>(roleFormInitialState);
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [roleFormError, setRoleFormError] = useState("");

  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionRows, setPermissionRows] = useState<PermissionRow[]>(permissionRowInitialState);
  const [permissionSubmitting, setPermissionSubmitting] = useState(false);
  const [permissionFormError, setPermissionFormError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        apiJson<RoleResponse>("platform/roles"),
        apiJson<PermissionResponse>("platform/permissions"),
      ]);

      setRoles(rolesResponse.result ?? []);
      setPermissions(permissionsResponse.result ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load roles and permissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const groupedPermissions = useMemo(() => {
    return permissions.reduce((acc, permission) => {
      const category = getPermissionCategory(permission.code);
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    }, {} as Record<PermissionCategory, ApiPermission[]>);
  }, [permissions]);

  const filteredRoles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return roles;

    return roles.filter((role) => {
      const rolePermissions = role.permissions ?? [];
      return (
        role.name.toLowerCase().includes(query) ||
        role.code.toLowerCase().includes(query) ||
        rolePermissions.some((permission) =>
          permission.name.toLowerCase().includes(query) || permission.code.toLowerCase().includes(query)
        )
      );
    });
  }, [roles, searchQuery]);

  const filteredPermissions = useMemo(() => {
    const query = permissionSearchQuery.trim().toLowerCase();
    if (!query) return permissions;

    return permissions.filter((permission) =>
      permission.name.toLowerCase().includes(query) || permission.code.toLowerCase().includes(query)
    );
  }, [permissions, permissionSearchQuery]);

  const permissionSummary = useMemo(() => {
    return permissions.reduce(
      (acc, permission) => {
        const category = getPermissionCategory(permission.code);
        acc.total += 1;
        acc.byCategory[category] = (acc.byCategory[category] || 0) + 1;
        return acc;
      },
      { total: 0, byCategory: {} as Record<PermissionCategory, number> }
    );
  }, [permissions]);

  const roleStats = useMemo(() => {
    return {
      total: roles.length,
      active: roles.filter((role) => role.isActive !== false).length,
      withPermissions: roles.filter((role) => (role.permissions?.length ?? 0) > 0).length,
      totalPermissionsAssigned: roles.reduce((sum, role) => sum + (role.permissions?.length ?? 0), 0),
    };
  }, [roles]);

  const resetRoleForm = () => {
    setRoleForm(roleFormInitialState);
    setEditingRoleId(null);
    setRoleMode("create");
    setRoleFormError("");
  };

  const openCreateRoleModal = () => {
    resetRoleForm();
    setShowRoleModal(true);
  };

  const openEditRoleModal = async (roleId: string) => {
    setDetailLoadingId(roleId);
    setError("");

    try {
      const detail = await apiJson<ApiRoleDetail>(`platform/roles/${roleId}`);
      setRoleMode("edit");
      setEditingRoleId(roleId);
      setRoleForm({
        code: detail.code,
        name: detail.name,
        isActive: detail.isActive !== false,
        permissionCodes: (detail.permissions ?? []).map((permission) => permission.code),
      });
      setRoleFormError("");
      setShowRoleModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load role details.");
    } finally {
      setDetailLoadingId(null);
    }
  };

  const openViewRoleModal = async (roleId: string) => {
    setDetailLoadingId(roleId);
    setError("");

    try {
      const detail = await apiJson<ApiRoleDetail>(`platform/roles/${roleId}`);
      setSelectedRole(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load role details.");
    } finally {
      setDetailLoadingId(null);
    }
  };

  const updateRolePermission = (permissionCode: string, checked: boolean) => {
    setRoleForm((current) => {
      const nextCodes = checked
        ? Array.from(new Set([...current.permissionCodes, permissionCode]))
        : current.permissionCodes.filter((code) => code !== permissionCode);

      return {
        ...current,
        permissionCodes: nextCodes,
      };
    });
  };

  const handleRoleSubmit = async () => {
    setRoleFormError("");
    setRoleSubmitting(true);

    try {
      if (!roleForm.code.trim()) {
        throw new Error("Role code is required.");
      }
      if (!roleForm.name.trim()) {
        throw new Error("Role name is required.");
      }

      const payload = {
        code: normalizePermissionCode(roleForm.code),
        name: roleForm.name.trim(),
        is_active: roleForm.isActive,
        permissions: roleForm.permissionCodes,
      };

      const endpoint =
        roleMode === "edit" && editingRoleId
          ? `platform/roles/update/${editingRoleId}`
          : "platform/roles/create";

      await apiJson(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      await loadData();
      setShowRoleModal(false);
      resetRoleForm();
    } catch (err) {
      setRoleFormError(err instanceof Error ? err.message : "Failed to save role.");
    } finally {
      setRoleSubmitting(false);
    }
  };

  const addPermissionRow = () => {
    setPermissionRows((current) => [...current, { name: "", code: "" }]);
  };

  const removePermissionRow = (index: number) => {
    setPermissionRows((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const updatePermissionRow = (index: number, field: keyof PermissionRow, value: string) => {
    setPermissionRows((current) =>
      current.map((row, currentIndex) => {
        if (currentIndex !== index) return row;
        return {
          ...row,
          [field]: field === "code" ? normalizePermissionCode(value) : value,
        };
      })
    );
  };

  const resetPermissionForm = () => {
    setPermissionRows(permissionRowInitialState);
    setPermissionFormError("");
  };

  const openPermissionModal = () => {
    resetPermissionForm();
    setShowPermissionModal(true);
  };

  const handlePermissionSubmit = async () => {
    setPermissionFormError("");
    setPermissionSubmitting(true);

    try {
      const payload = permissionRows
        .map((row) => ({
          name: row.name.trim(),
          code: normalizePermissionCode(row.code),
        }))
        .filter((row) => row.name && row.code);

      if (payload.length === 0) {
        throw new Error("Add at least one permission row.");
      }

      await apiJson("platform/permissions/create", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      await loadData();
      setShowPermissionModal(false);
      resetPermissionForm();
    } catch (err) {
      setPermissionFormError(err instanceof Error ? err.message : "Failed to save permissions.");
    } finally {
      setPermissionSubmitting(false);
    }
  };

  const closeRoleModal = () => {
    setShowRoleModal(false);
    resetRoleForm();
  };

  const closePermissionModal = () => {
    setShowPermissionModal(false);
    resetPermissionForm();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage roles and permissions from the platform API</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadData()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <RefreshCw className="size-4" />
            Refresh
          </button>
          <button
            onClick={openPermissionModal}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Tags className="size-4" />
            Create Permission
          </button>
          <button
            onClick={openCreateRoleModal}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="size-4" />
            Create Role
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Total Roles</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{roleStats.total}</p>
          <p className="mt-1 text-xs text-gray-500">Loaded from /platform/roles</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Active Roles</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{roleStats.active}</p>
          <p className="mt-1 text-xs text-gray-500">From role detail responses</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Permissions</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{permissionSummary.total}</p>
          <p className="mt-1 text-xs text-gray-500">Loaded from /platform/permissions</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Assigned Permissions</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{roleStats.totalPermissionsAssigned}</p>
          <p className="mt-1 text-xs text-gray-500">Across all roles</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search roles by name, code, or permission..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Roles</h2>
              <p className="text-sm text-gray-500">List and manage platform roles</p>
            </div>
            {loading ? <Loader2 className="size-5 animate-spin text-gray-500" /> : null}
          </div>

          {loading ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
              Loading roles and permissions...
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
              No roles match your search.
            </div>
          ) : (
            filteredRoles.map((role) => (
              <div key={role.id} className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Shield className="size-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{role.name}</h3>
                      <p className="text-sm text-gray-500">{role.code}</p>
                    </div>
                  </div>
                  {typeof role.isActive === "boolean" ? (
                    <StatusBadge status={role.isActive ? "ACTIVE" : "INACTIVE"} size="sm" />
                  ) : (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                      {role.permissions.length} permissions
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {role.permissions.slice(0, 4).map((permission) => (
                    <span
                      key={`${role.id}-${permission.code}`}
                      className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                    >
                      {permission.code}
                    </span>
                  ))}
                  {role.permissions.length > 4 ? (
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                      +{role.permissions.length - 4} more
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 text-sm">
                  <span className="text-gray-500">Updated {formatDateTime(role.updatedAt)}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void openViewRoleModal(role.id)}
                      disabled={detailLoadingId === role.id}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {detailLoadingId === role.id ? <Loader2 className="size-4 animate-spin" /> : <Shield className="size-4" />}
                      View
                    </button>
                    <button
                      onClick={() => void openEditRoleModal(role.id)}
                      disabled={detailLoadingId === role.id}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {detailLoadingId === role.id ? <Loader2 className="size-4 animate-spin" /> : <Edit2 className="size-4" />}
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Permissions</h2>
              <p className="text-sm text-gray-500">Synced from /platform/permissions</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search permissions..."
                value={permissionSearchQuery}
                onChange={(e) => setPermissionSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
            const visiblePermissions = categoryPermissions.filter((permission) =>
              filteredPermissions.some((item) => item.id === permission.id)
            );

            if (visiblePermissions.length === 0) {
              return null;
            }

            return (
              <div key={category} className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{category}</h3>
                    <p className="text-sm text-gray-500">{visiblePermissions.length} permissions</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {permissionSummary.byCategory[category as PermissionCategory] || 0}
                  </span>
                </div>

                <div className="space-y-3">
                  {visiblePermissions.map((permission) => (
                    <div key={permission.id} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                          <p className="text-xs text-gray-500">{permission.code}</p>
                        </div>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                          #{permission.id}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showRoleModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {roleMode === "edit" ? "Update Role" : "Create Role"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {roleMode === "edit" ? "Adjust the role and its permissions" : "Define a new platform role"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeRoleModal}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {roleFormError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {roleFormError}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Role Code *</label>
                  <input
                    type="text"
                    value={roleForm.code}
                    onChange={(e) => setRoleForm((current) => ({ ...current, code: normalizePermissionCode(e.target.value) }))}
                    placeholder="e.g. FINANCE"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Role Name *</label>
                  <input
                    type="text"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm((current) => ({ ...current, name: e.target.value }))}
                    placeholder="e.g. Finance"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3">
                <input
                  type="checkbox"
                  checked={roleForm.isActive}
                  onChange={(e) => setRoleForm((current) => ({ ...current, isActive: e.target.checked }))}
                  className="size-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Permissions</h3>
                    <p className="text-xs text-gray-500">Select permissions for this role</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {roleForm.permissionCodes.length} selected
                  </span>
                </div>

                <div className="space-y-4">
                  {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                    <div key={category} className="rounded-lg border border-gray-200 p-4">
                      <h4 className="mb-3 text-sm font-medium text-gray-900">{category}</h4>
                      <div className="space-y-2">
                        {categoryPermissions.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={roleForm.permissionCodes.includes(permission.code)}
                              onChange={(e) => updateRolePermission(permission.code, e.target.checked)}
                              className="mt-1 size-4 rounded border-gray-300"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                              <p className="text-xs text-gray-500">{permission.code}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                onClick={closeRoleModal}
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleRoleSubmit()}
                disabled={roleSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {roleSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                {roleMode === "edit" ? "Update Role" : "Create Role"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showPermissionModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Create Permission(s)</h2>
                <p className="text-sm text-gray-500 mt-1">Add one or more permissions</p>
              </div>
              <button
                type="button"
                onClick={closePermissionModal}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {permissionFormError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {permissionFormError}
                </div>
              ) : null}

              {permissionRows.map((row, index) => (
                <div key={index} className="rounded-xl border border-gray-200 p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Permission Name *</label>
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => updatePermissionRow(index, "name", e.target.value)}
                        placeholder="e.g. Announcement Update"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Permission Code *</label>
                      <input
                        type="text"
                        value={row.code}
                        onChange={(e) => updatePermissionRow(index, "code", e.target.value)}
                        placeholder="e.g. ANNOUNCEMENT_UPDATE"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removePermissionRow(index)}
                      disabled={permissionRows.length === 1}
                      className="text-sm font-medium text-red-600 transition-colors hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addPermissionRow}
                className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Plus className="size-4" />
                Add another row
              </button>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                onClick={closePermissionModal}
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={() => void handlePermissionSubmit()}
                disabled={permissionSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {permissionSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Create Permission(s)
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedRole ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedRole.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedRole.code}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-2">
                    <StatusBadge status={selectedRole.isActive ? "ACTIVE" : "INACTIVE"} size="sm" />
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="mt-2 text-sm font-medium text-gray-900">{formatDateTime(selectedRole.createdAt)}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Updated</p>
                  <p className="mt-2 text-sm font-medium text-gray-900">{formatDateTime(selectedRole.updatedAt)}</p>
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Permissions</h3>
                    <p className="text-xs text-gray-500">Permissions included in this role</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {selectedRole.permissions.length} total
                  </span>
                </div>

                <div className="space-y-4">
                  {Object.entries(
                    selectedRole.permissions.reduce((acc, permission) => {
                      const category = getPermissionCategory(permission.code);
                      if (!acc[category]) {
                        acc[category] = [];
                      }
                      acc[category].push(permission);
                      return acc;
                    }, {} as Record<PermissionCategory, ApiPermission[]>)
                  ).map(([category, categoryPermissions]) => (
                    <div key={category} className="rounded-xl border border-gray-200 p-4">
                      <h4 className="mb-3 text-sm font-medium text-gray-900">{category}</h4>
                      <div className="space-y-2">
                        {categoryPermissions.map((permission) => (
                          <div key={permission.id} className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                            <Check className="mt-0.5 size-4 flex-shrink-0 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                              <p className="text-xs text-gray-500">{permission.code}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                onClick={() => setSelectedRole(null)}
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
