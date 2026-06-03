import { useEffect, useMemo, useState } from "react";
import { Package, Plus, Search, Edit2, Loader2 } from "lucide-react";
import { apiJson } from "../utils/api";

type ApiModule = {
  id: string;
  key: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type ModuleListResponse = {
  data: ApiModule[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
};

type ModuleFormState = {
  id: string | null;
  name: string;
  key: string;
  description: string;
  isActive: boolean;
};

const emptyForm: ModuleFormState = {
  id: null,
  name: "",
  key: "",
  description: "",
  isActive: true,
};

const formatDate = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const buildModuleKey = (name: string) =>
  name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");

export default function ModuleManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [modules, setModules] = useState<ApiModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ModuleFormState>(emptyForm);

  const loadModules = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiJson<ModuleListResponse>("platform/module");
      setModules(response.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load modules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadModules();
  }, []);

  const filteredModules = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return modules.filter((module) => {
      return (
        module.name.toLowerCase().includes(q) ||
        module.key.toLowerCase().includes(q) ||
        module.description.toLowerCase().includes(q)
      );
    });
  }, [modules, searchQuery]);

  const openCreate = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (module: ApiModule) => {
    setForm({
      id: module.id,
      name: module.name,
      key: module.key,
      description: module.description,
      isActive: module.isActive,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(emptyForm);
  };

  const saveModule = async () => {
    if (!form.name.trim() || !form.key.trim() || !form.description.trim()) return;

    setSaving(true);

    try {
      const endpoint = form.id ? `platform/module/${form.id}` : "platform/module";
      await apiJson(endpoint, {
        method: form.id ? "PUT" : "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          key: form.key.trim(),
          description: form.description.trim(),
          isActive: form.isActive,
        }),
      });
      await loadModules();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save module.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (module: ApiModule) => {
    try {
      await apiJson(`platform/module/${module.id}/status?is_active=${!module.isActive}`, {
        method: "PUT",
      });
      await loadModules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update module status.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modules</h1>
          <p className="mt-1 text-sm text-gray-500">Manage platform modules and features</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          <Plus className="size-4" />
          Add Module
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="size-4 animate-spin" />
          Loading...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium text-gray-900">{filteredModules.length}</span> modules
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module) => (
              <div key={module.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="size-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="size-6 text-blue-600" />
                    </div>
                    <button
                      onClick={() => void toggleStatus(module)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        module.isActive ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"
                      }`}
                    >
                      {module.isActive ? "ACTIVE" : "INACTIVE"}
                    </button>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900">{module.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 mb-4">{module.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Key</span>
                      <span className="font-mono font-medium text-gray-900">{module.key}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Created</span>
                      <span className="font-medium text-gray-900">{formatDate(module.createdAt)}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(module)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 px-6 py-5">
              <h2 className="text-xl font-semibold text-gray-900">{form.id ? "Edit Module" : "Add Module"}</h2>
              <p className="mt-1 text-sm text-gray-500">Update module details.</p>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((current) => ({ ...current, name, key: buildModuleKey(name) }));
                  }}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">Key</label>
                <input
                  value={form.key}
                  disabled
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((current) => ({ ...current, isActive: e.target.checked }))}
                />
                Active
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-5">
              <button
                onClick={closeModal}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => void saveModule()}
                disabled={saving}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
