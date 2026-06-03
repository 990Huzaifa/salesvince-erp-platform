import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Shield,
  UserPlus,
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

type ApiUserSummary = {
  id: string;
  email: string;
  fullName: string;
  updatedAt?: string;
};

type ApiUserDetail = ApiUserSummary & {
  passwordHash?: string;
  isActive?: boolean;
  role?: {
    id: string;
    code: string;
    name: string;
    isActive?: boolean;
    permissions: ApiPermission[];
  };
  createdAt?: string;
  updatedAt?: string;
};

type UsersResponse = {
  result: ApiUserSummary[];
};

type RolesResponse = {
  result: ApiRoleSummary[];
};

type PlatformUserRow = {
  id: string;
  email: string;
  fullName: string;
  updatedAt?: string;
  createdAt?: string;
  isActive?: boolean;
  roleId?: string;
  roleCode?: string;
  roleName?: string;
  roleIsActive?: boolean;
  permissions: ApiPermission[];
};

type CreateUserFormState = {
  fullName: string;
  email: string;
  passwordHash: string;
  roleId: string;
};

const initialCreateUserForm: CreateUserFormState = {
  fullName: "",
  email: "",
  passwordHash: "",
  roleId: "",
};

const formatDateTime = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("") || "U";

const mapUserDetailToRow = (detail: ApiUserDetail): PlatformUserRow => ({
  id: detail.id,
  email: detail.email,
  fullName: detail.fullName,
  updatedAt: detail.updatedAt,
  createdAt: detail.createdAt,
  isActive: detail.isActive,
  roleId: detail.role?.id,
  roleCode: detail.role?.code,
  roleName: detail.role?.name,
  roleIsActive: detail.role?.isActive,
  permissions: detail.role?.permissions ?? [],
});

const mapUserSummaryToRow = (summary: ApiUserSummary): PlatformUserRow => ({
  id: summary.id,
  email: summary.email,
  fullName: summary.fullName,
  updatedAt: summary.updatedAt,
  permissions: [],
});

export default function PlatformUsers() {
  const [users, setUsers] = useState<PlatformUserRow[]>([]);
  const [roles, setRoles] = useState<ApiRoleSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserFormState>(initialCreateUserForm);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  const [selectedUser, setSelectedUser] = useState<PlatformUserRow | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        apiJson<UsersResponse>("platform/users"),
        apiJson<RolesResponse>("platform/roles"),
      ]);

      setRoles(rolesResponse.result ?? []);

      const resolvedUsers = await Promise.all(
        (usersResponse.result ?? []).map(async (user) => {
          try {
            const detail = await apiJson<ApiUserDetail>(`platform/users/${user.id}`);
            return mapUserDetailToRow(detail);
          } catch {
            return mapUserSummaryToRow(user);
          }
        })
      );

      setUsers(resolvedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load platform users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.roleCode ?? "").toLowerCase().includes(query) ||
        (user.roleName ?? "").toLowerCase().includes(query) ||
        user.permissions.some(
          (permission) =>
            permission.name.toLowerCase().includes(query) || permission.code.toLowerCase().includes(query)
        );

      const matchesRole =
        roleFilter === "ALL" ||
        user.roleId === roleFilter ||
        user.roleCode === roleFilter ||
        user.roleName === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [roleFilter, searchQuery, users]);

  const userStats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((user) => user.isActive === true).length,
      roles: roles.length,
      permissionAssignments: users.reduce((sum, user) => sum + (user.permissions?.length ?? 0), 0),
    };
  }, [roles.length, users]);

  const resetCreateForm = () => {
    setCreateForm(initialCreateUserForm);
    setCreateError("");
  };

  const openCreateModal = () => {
    setCreateForm({
      ...initialCreateUserForm,
      roleId: roles[0]?.id ?? "",
    });
    setCreateError("");
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetCreateForm();
  };

  const handleCreateSubmit = async () => {
    setCreateError("");
    setCreateSubmitting(true);

    try {
      if (!createForm.fullName.trim()) {
        throw new Error("Full name is required.");
      }
      if (!createForm.email.trim()) {
        throw new Error("Email is required.");
      }
      if (!createForm.passwordHash.trim()) {
        throw new Error("Password is required.");
      }
      if (!createForm.roleId) {
        throw new Error("Please select a role.");
      }

      await apiJson("platform/users/create", {
        method: "POST",
        body: JSON.stringify({
          fullname: createForm.fullName.trim(),
          email: createForm.email.trim(),
          passwordHash: createForm.passwordHash,
          role: createForm.roleId,
        }),
      });

      await loadData();
      closeCreateModal();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openUserDetails = (userId: string) => {
    const user = users.find((item) => item.id === userId);
    if (user) {
      setSelectedUser(user);
    }
  };

  const closeUserDetails = () => {
    setSelectedUser(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Users</h1>
          <p className="mt-1 text-sm text-gray-500">Manage platform users from the backend API</p>
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
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <UserPlus className="size-4" />
            Add User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{userStats.total}</p>
          <p className="mt-1 text-xs text-gray-500">Loaded from /platform/users</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Active Users</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{userStats.active}</p>
          <p className="mt-1 text-xs text-gray-500">Derived from user detail responses</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Available Roles</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{userStats.roles}</p>
          <p className="mt-1 text-xs text-gray-500">Used in the create-user form</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Permission Assignments</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{userStats.permissionAssignments}</p>
          <p className="mt-1 text-xs text-gray-500">Across loaded users</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, email, role, or permission..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 lg:w-64"
          >
            <option value="ALL">All Roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name} ({role.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Users</h2>
              <p className="text-sm text-gray-500">Synced with /platform/users and /platform/users/:id</p>
            </div>
            {loading ? <Loader2 className="size-5 animate-spin text-gray-500" /> : null}
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Updated At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Permissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                        Loading platform users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                        No users match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const status = user.isActive === true ? "ACTIVE" : user.isActive === false ? "INACTIVE" : "PENDING";

                      return (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex size-10 items-center justify-center rounded-full bg-blue-100">
                                <span className="text-sm font-medium text-blue-700">{getInitials(user.fullName)}</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{user.fullName}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Shield className="size-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{user.roleName ?? "No role loaded"}</p>
                                <p className="text-xs text-gray-500">{user.roleCode ?? user.roleId ?? "N/A"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={status} size="sm" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(user.updatedAt)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {user.permissions.slice(0, 2).map((permission) => (
                                <span
                                  key={`${user.id}-${permission.code}`}
                                  className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                                >
                                  {permission.code}
                                </span>
                              ))}
                              {user.permissions.length > 2 ? (
                                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                                  +{user.permissions.length - 2}
                                </span>
                              ) : null}
                              {user.permissions.length === 0 ? (
                                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">No permissions</span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => openUserDetails(user.id)}
                              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            >
                              <Eye className="size-4" />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Available Roles</h2>
              <p className="text-sm text-gray-500">Used by the create-user form</p>
            </div>
          </div>

          {roles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
              No roles loaded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {roles.map((role) => (
                <div key={role.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{role.name}</p>
                      <p className="text-sm text-gray-500">{role.code}</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                      {role.permissions?.length ?? 0} permissions
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(role.permissions ?? []).slice(0, 3).map((permission) => (
                      <span key={`${role.id}-${permission.code}`} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        {permission.code}
                      </span>
                    ))}
                    {(role.permissions ?? []).length > 3 ? (
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        +{(role.permissions ?? []).length - 3}
                      </span>
                    ) : null}
                    {(role.permissions ?? []).length === 0 ? (
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">No permissions</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Create User</h2>
                <p className="mt-1 text-sm text-gray-500">Create a platform user</p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {createError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {createError}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm((current) => ({ ...current, fullName: e.target.value }))}
                    placeholder="e.g. Tester"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((current) => ({ ...current, email: e.target.value }))}
                    placeholder="tester@gmail.com"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Password *</label>
                  <input
                    type="password"
                    value={createForm.passwordHash}
                    onChange={(e) => setCreateForm((current) => ({ ...current, passwordHash: e.target.value }))}
                    placeholder="demo9090"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Role *</label>
                  <select
                    value={createForm.roleId}
                    onChange={(e) => setCreateForm((current) => ({ ...current, roleId: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} ({role.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                onClick={closeCreateModal}
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleCreateSubmit()}
                disabled={createSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {createSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Create User
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedUser.fullName}</h2>
                <p className="mt-1 text-sm text-gray-500">{selectedUser.email}</p>
              </div>
              <button
                type="button"
                onClick={closeUserDetails}
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
                    <StatusBadge
                      status={selectedUser.isActive === true ? "ACTIVE" : selectedUser.isActive === false ? "INACTIVE" : "PENDING"}
                      size="sm"
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="mt-2 text-sm font-medium text-gray-900">{formatDateTime(selectedUser.createdAt)}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Updated</p>
                  <p className="mt-2 text-sm font-medium text-gray-900">{formatDateTime(selectedUser.updatedAt)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Role</p>
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-900">{selectedUser.roleName ?? "No role loaded"}</p>
                    <p className="text-xs text-gray-500">{selectedUser.roleCode ?? selectedUser.roleId ?? "N/A"}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Permissions</p>
                  <p className="mt-2 text-sm font-medium text-gray-900">{selectedUser.permissions.length} assigned</p>
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Role Permissions</h3>
                    <p className="text-xs text-gray-500">Loaded from /platform/users/:id</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {selectedUser.permissions.length} total
                  </span>
                </div>

                {selectedUser.permissions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                    No permissions available for this user.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {selectedUser.permissions.map((permission) => (
                      <div key={permission.id} className="rounded-xl border border-gray-200 p-4">
                        <div className="flex items-start gap-3">
                          <Check className="mt-0.5 size-4 flex-shrink-0 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                            <p className="text-xs text-gray-500">{permission.code}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                onClick={closeUserDetails}
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
