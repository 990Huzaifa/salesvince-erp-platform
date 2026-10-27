import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Edit2,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { apiJson } from "../utils/api";

type DocumentTemplateUploadKind = "preview" | "file";

type DocumentTemplateUploadResponse = {
  kind: DocumentTemplateUploadKind;
  key: string;
  url: string;
  mimeType: string | null;
  originalFileName: string | null;
  size: number;
};

async function uploadDocumentTemplateAsset(
  kind: DocumentTemplateUploadKind,
  file: File,
): Promise<DocumentTemplateUploadResponse> {
  const body = new FormData();
  body.append("file", file);

  return apiJson<DocumentTemplateUploadResponse>(
    `platform/document-templates/upload?kind=${encodeURIComponent(kind)}`,
    {
      method: "POST",
      body,
    },
  );
}

type PackStatus = "ACTIVE" | "INACTIVE";
type SourceType = "INLINE" | "FILE";
type Engine = "HTML" | "HANDLEBARS";

type DocumentType =
  | "SALE_INVOICE"
  | "PURCHASE_INVOICE"
  | "SALE_ORDER"
  | "PURCHASE_ORDER"
  | "WAREHOUSE_SLIP"
  | "GRN"
  | "PAYSLIP"
  | "PARTY_LEDGER"
  | "GENERAL_LEDGER"
  | "ACCOUNTS_LIST"
  | "VOUCHER"
  | "REPORT";

type TemplateVariable = {
  key: string;
  label: string;
};

type DocumentTemplateItem = {
  id: string;
  documentType: DocumentType;
  name: string | null;
  sourceType: SourceType;
  engine: Engine;
  content: string | null;
  fileUrl: string | null;
  fileMimeType: string | null;
  pageSettings: Record<string, unknown> | null;
  variables: TemplateVariable[] | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type DocumentTemplatePack = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  previewImageUrl: string | null;
  isDefault: boolean;
  status: PackStatus;
  sortOrder: number;
  metadata: Record<string, unknown> | null;
  items?: DocumentTemplateItem[];
  createdAt?: string;
  updatedAt?: string;
};

type PackListResponse = {
  data: DocumentTemplatePack[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
};

type PackFormState = {
  id: string | null;
  code: string;
  name: string;
  description: string;
  previewImageUrl: string;
  isDefault: boolean;
  status: PackStatus;
  sortOrder: string;
};

type ItemFormState = {
  documentType: DocumentType;
  name: string;
  sourceType: SourceType;
  engine: Engine;
  content: string;
  fileUrl: string;
  fileMimeType: string;
  isActive: boolean;
};

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "SALE_INVOICE", label: "Sale Invoice" },
  { value: "PURCHASE_INVOICE", label: "Purchase Invoice" },
  { value: "SALE_ORDER", label: "Sale Order" },
  { value: "PURCHASE_ORDER", label: "Purchase Order" },
  { value: "WAREHOUSE_SLIP", label: "Warehouse Slip" },
  { value: "GRN", label: "GRN" },
  { value: "PAYSLIP", label: "Payslip" },
  { value: "PARTY_LEDGER", label: "Party Ledger" },
  { value: "GENERAL_LEDGER", label: "General Ledger" },
  { value: "ACCOUNTS_LIST", label: "Accounts List" },
  { value: "VOUCHER", label: "Voucher" },
  { value: "REPORT", label: "Report" },
];

const emptyPackForm: PackFormState = {
  id: null,
  code: "",
  name: "",
  description: "",
  previewImageUrl: "",
  isDefault: false,
  status: "ACTIVE",
  sortOrder: "0",
};

const emptyItemForm = (documentType: DocumentType = "SALE_INVOICE"): ItemFormState => ({
  documentType,
  name: "",
  sourceType: "INLINE",
  engine: "HTML",
  content: "",
  fileUrl: "",
  fileMimeType: "",
  isActive: true,
});

const slugifyCode = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");

const formatDate = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const documentTypeLabel = (type: DocumentType) =>
  DOCUMENT_TYPES.find((item) => item.value === type)?.label ?? type;

export default function DocumentTemplates() {
  const [packs, setPacks] = useState<DocumentTemplatePack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | PackStatus>("ALL");

  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [selectedPack, setSelectedPack] = useState<DocumentTemplatePack | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showPackModal, setShowPackModal] = useState(false);
  const [packForm, setPackForm] = useState<PackFormState>(emptyPackForm);
  const [packSaving, setPackSaving] = useState(false);

  const [showItemModal, setShowItemModal] = useState(false);
  const [itemForm, setItemForm] = useState<ItemFormState>(emptyItemForm());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemSaving, setItemSaving] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const loadPacks = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ page: "1", limit: "100" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const response = await apiJson<PackListResponse>(`platform/document-templates?${params.toString()}`);
      setPacks(response.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load document templates.");
    } finally {
      setLoading(false);
    }
  };

  const loadPackDetail = async (packId: string) => {
    setDetailLoading(true);
    setError("");

    try {
      const response = await apiJson<DocumentTemplatePack | { data: DocumentTemplatePack }>(
        `platform/document-templates/${packId}`,
      );
      const pack =
        response && typeof response === "object" && "data" in response && response.data
          ? response.data
          : (response as DocumentTemplatePack);
      setSelectedPack(pack);
      setSelectedPackId(pack.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load template pack.");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    void loadPacks();
  }, [statusFilter]);

  const filteredPacks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return packs;
    return packs.filter(
      (pack) =>
        pack.name.toLowerCase().includes(q) ||
        pack.code.toLowerCase().includes(q) ||
        (pack.description || "").toLowerCase().includes(q),
    );
  }, [packs, searchQuery]);

  const openCreatePack = () => {
    setPackForm(emptyPackForm);
    setShowPackModal(true);
  };

  const openEditPack = (pack: DocumentTemplatePack) => {
    setPackForm({
      id: pack.id,
      code: pack.code,
      name: pack.name,
      description: pack.description || "",
      previewImageUrl: pack.previewImageUrl || "",
      isDefault: pack.isDefault,
      status: pack.status,
      sortOrder: String(pack.sortOrder ?? 0),
    });
    setShowPackModal(true);
  };

  const closePackModal = () => {
    setShowPackModal(false);
    setPackForm(emptyPackForm);
  };

  const savePack = async () => {
    if (!packForm.code.trim() || !packForm.name.trim()) return;

    setPackSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        code: packForm.code.trim(),
        name: packForm.name.trim(),
        description: packForm.description.trim() || undefined,
        previewImageUrl: packForm.previewImageUrl.trim() || undefined,
        isDefault: packForm.isDefault,
        status: packForm.status,
        sortOrder: Number(packForm.sortOrder) || 0,
      };

      const endpoint = packForm.id
        ? `platform/document-templates/${packForm.id}`
        : "platform/document-templates";

      const response = await apiJson<DocumentTemplatePack | { data: DocumentTemplatePack }>(endpoint, {
        method: packForm.id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      const saved =
        response && typeof response === "object" && "data" in response && response.data
          ? response.data
          : (response as DocumentTemplatePack);

      setSuccess(packForm.id ? "Pack updated." : "Pack created.");
      closePackModal();
      await loadPacks();

      if (saved?.id) {
        await loadPackDetail(saved.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save pack.");
    } finally {
      setPackSaving(false);
    }
  };

  const setPackStatus = async (pack: DocumentTemplatePack, status: PackStatus) => {
    setActionBusyId(pack.id);
    setError("");
    setSuccess("");

    try {
      await apiJson(`platform/document-templates/${pack.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      setSuccess(`Pack marked ${status.toLowerCase()}.`);
      await loadPacks();
      if (selectedPackId === pack.id) await loadPackDetail(pack.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setActionBusyId(null);
    }
  };

  const setDefaultPack = async (pack: DocumentTemplatePack) => {
    setActionBusyId(pack.id);
    setError("");
    setSuccess("");

    try {
      await apiJson(`platform/document-templates/${pack.id}/set-default`, { method: "POST" });
      setSuccess("Default pack updated.");
      await loadPacks();
      if (selectedPackId === pack.id) await loadPackDetail(pack.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set default pack.");
    } finally {
      setActionBusyId(null);
    }
  };

  const deletePack = async (pack: DocumentTemplatePack) => {
    if (!window.confirm(`Delete pack "${pack.name}"?`)) return;

    setActionBusyId(pack.id);
    setError("");
    setSuccess("");

    try {
      await apiJson(`platform/document-templates/${pack.id}`, { method: "DELETE" });
      setSuccess("Pack deleted.");
      if (selectedPackId === pack.id) {
        setSelectedPackId(null);
        setSelectedPack(null);
      }
      await loadPacks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete pack.");
    } finally {
      setActionBusyId(null);
    }
  };

  const openCreateItem = () => {
    const used = new Set((selectedPack?.items ?? []).map((item) => item.documentType));
    const nextType = DOCUMENT_TYPES.find((type) => !used.has(type.value))?.value ?? "SALE_INVOICE";
    setEditingItemId(null);
    setItemForm(emptyItemForm(nextType));
    setShowItemModal(true);
  };

  const openEditItem = (item: DocumentTemplateItem) => {
    setEditingItemId(item.id);
    setItemForm({
      documentType: item.documentType,
      name: item.name || "",
      sourceType: item.sourceType || "INLINE",
      engine: item.engine || "HTML",
      content: item.content || "",
      fileUrl: item.fileUrl || "",
      fileMimeType: item.fileMimeType || "",
      isActive: item.isActive,
    });
    setShowItemModal(true);
  };

  const closeItemModal = () => {
    setShowItemModal(false);
    setEditingItemId(null);
    setItemForm(emptyItemForm());
  };

  const saveItem = async () => {
    if (!selectedPackId) return;
    if (itemForm.sourceType === "INLINE" && !itemForm.content.trim()) {
      setError("INLINE items require content.");
      return;
    }
    if (itemForm.sourceType === "FILE" && !itemForm.fileUrl.trim()) {
      setError("FILE items require a file URL.");
      return;
    }

    setItemSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload: Record<string, unknown> = {
        documentType: itemForm.documentType,
        name: itemForm.name.trim() || undefined,
        sourceType: itemForm.sourceType,
        engine: itemForm.engine,
        isActive: itemForm.isActive,
      };

      if (itemForm.sourceType === "INLINE") {
        payload.content = itemForm.content;
        payload.fileUrl = null;
        payload.fileMimeType = null;
      } else {
        payload.fileUrl = itemForm.fileUrl.trim();
        payload.fileMimeType = itemForm.fileMimeType.trim() || undefined;
        payload.content = null;
      }

      // Upsert by documentType so re-saving an existing type replaces cleanly.
      await apiJson(`platform/document-templates/${selectedPackId}/items/upsert`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setSuccess(editingItemId ? "Sub-template updated." : "Sub-template saved.");
      closeItemModal();
      await loadPackDetail(selectedPackId);
      await loadPacks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save sub-template.");
    } finally {
      setItemSaving(false);
    }
  };

  const toggleItemActive = async (item: DocumentTemplateItem) => {
    if (!selectedPackId) return;

    setActionBusyId(item.id);
    setError("");
    setSuccess("");

    try {
      await apiJson(`platform/document-templates/${selectedPackId}/items/${item.id}/active`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      setSuccess(`Sub-template ${item.isActive ? "disabled" : "enabled"}.`);
      await loadPackDetail(selectedPackId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update sub-template.");
    } finally {
      setActionBusyId(null);
    }
  };

  const deleteItem = async (item: DocumentTemplateItem) => {
    if (!selectedPackId) return;
    if (!window.confirm(`Delete ${documentTypeLabel(item.documentType)} sub-template?`)) return;

    setActionBusyId(item.id);
    setError("");
    setSuccess("");

    try {
      await apiJson(`platform/document-templates/${selectedPackId}/items/${item.id}`, {
        method: "DELETE",
      });
      setSuccess("Sub-template deleted.");
      await loadPackDetail(selectedPackId);
      await loadPacks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete sub-template.");
    } finally {
      setActionBusyId(null);
    }
  };

  if (selectedPackId) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => {
                setSelectedPackId(null);
                setSelectedPack(null);
                void loadPacks();
              }}
              className="mb-3 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <ArrowLeft className="size-4" />
              Back to packs
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedPack?.name || "Template Pack"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage sub-templates for each document type
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => selectedPackId && void loadPackDetail(selectedPackId)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="size-4" />
              Refresh
            </button>
            {selectedPack ? (
              <button
                type="button"
                onClick={() => openEditPack(selectedPack)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit2 className="size-4" />
                Edit Pack
              </button>
            ) : null}
            <button
              type="button"
              onClick={openCreateItem}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="size-4" />
              Add Sub-template
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="size-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-start gap-2">
            <CheckCircle2 className="size-4 mt-0.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        ) : null}

        {detailLoading || !selectedPack ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="size-4 animate-spin" />
            Loading pack...
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm text-gray-600">{selectedPack.code}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        selectedPack.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {selectedPack.status}
                    </span>
                    {selectedPack.isDefault ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        <Star className="size-3" />
                        Default
                      </span>
                    ) : null}
                  </div>
                  {selectedPack.description ? (
                    <p className="text-sm text-gray-600 max-w-2xl">{selectedPack.description}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!selectedPack.isDefault ? (
                    <button
                      type="button"
                      disabled={actionBusyId === selectedPack.id}
                      onClick={() => void setDefaultPack(selectedPack)}
                      className="rounded-lg border border-amber-200 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                    >
                      Set Default
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={actionBusyId === selectedPack.id}
                    onClick={() =>
                      void setPackStatus(
                        selectedPack,
                        selectedPack.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                      )
                    }
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    Mark {selectedPack.status === "ACTIVE" ? "Inactive" : "Active"}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Sub-templates</h2>
                <p className="text-sm text-gray-500 mt-1">
                  One item per document type. Saving uses upsert by type.
                </p>
              </div>

              {(selectedPack.items ?? []).length === 0 ? (
                <div className="p-8 text-sm text-gray-500">No sub-templates yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-gray-500">
                      <tr>
                        <th className="px-6 py-3 font-medium">Document Type</th>
                        <th className="px-6 py-3 font-medium">Name</th>
                        <th className="px-6 py-3 font-medium">Source</th>
                        <th className="px-6 py-3 font-medium">Engine</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(selectedPack.items ?? []).map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {documentTypeLabel(item.documentType)}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{item.name || "—"}</td>
                          <td className="px-6 py-4 text-gray-600">{item.sourceType}</td>
                          <td className="px-6 py-4 text-gray-600">{item.engine}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                item.isActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {item.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditItem(item)}
                                className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-white"
                                title="Edit"
                              >
                                <Edit2 className="size-4" />
                              </button>
                              <button
                                type="button"
                                disabled={actionBusyId === item.id}
                                onClick={() => void toggleItemActive(item)}
                                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-white disabled:opacity-60"
                              >
                                {item.isActive ? "Disable" : "Enable"}
                              </button>
                              <button
                                type="button"
                                disabled={actionBusyId === item.id}
                                onClick={() => void deleteItem(item)}
                                className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-60"
                                title="Delete"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {showPackModal ? (
          <PackModal
            form={packForm}
            saving={packSaving}
            onClose={closePackModal}
            onChange={setPackForm}
            onSave={() => void savePack()}
          />
        ) : null}

        {showItemModal ? (
          <ItemModal
            form={itemForm}
            saving={itemSaving}
            isEdit={Boolean(editingItemId)}
            usedTypes={(selectedPack?.items ?? [])
              .filter((item) => item.id !== editingItemId)
              .map((item) => item.documentType)}
            onClose={closeItemModal}
            onChange={setItemForm}
            onSave={() => void saveItem()}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Templates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Shared template packs for invoices, ledgers, and reports
          </p>
        </div>
        <button
          type="button"
          onClick={openCreatePack}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="size-4" />
          Create Pack
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search packs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | PackStatus)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button
            type="button"
            onClick={() => void loadPacks()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="size-4" />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="size-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-start gap-2">
          <CheckCircle2 className="size-4 mt-0.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="size-4 animate-spin" />
          Loading packs...
        </div>
      ) : filteredPacks.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-sm text-gray-500">
          No document template packs found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredPacks.map((pack) => (
            <div
              key={pack.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white hover:shadow-lg transition-shadow"
            >
              <div className="h-36 bg-gray-50 flex items-center justify-center overflow-hidden">
                {pack.previewImageUrl ? (
                  <img
                    src={pack.previewImageUrl}
                    alt={pack.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FileText className="size-10 text-gray-300" />
                )}
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{pack.name}</h3>
                    <p className="mt-1 font-mono text-xs text-gray-500">{pack.code}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        pack.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {pack.status}
                    </span>
                    {pack.isDefault ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        <Star className="size-3" />
                        Default
                      </span>
                    ) : null}
                  </div>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2">
                  {pack.description || "No description"}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{pack.items?.length ?? 0} sub-templates</span>
                  <span>Updated {formatDate(pack.updatedAt)}</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void loadPackDetail(pack.id)}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    Manage
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditPack(pack)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  {!pack.isDefault ? (
                    <button
                      type="button"
                      disabled={actionBusyId === pack.id}
                      onClick={() => void setDefaultPack(pack)}
                      className="rounded-lg border border-amber-200 px-3 py-2 text-xs text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                    >
                      Set Default
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={actionBusyId === pack.id}
                    onClick={() =>
                      void setPackStatus(pack, pack.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")
                    }
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    {pack.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    disabled={actionBusyId === pack.id}
                    onClick={() => void deletePack(pack)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPackModal ? (
        <PackModal
          form={packForm}
          saving={packSaving}
          onClose={closePackModal}
          onChange={setPackForm}
          onSave={() => void savePack()}
        />
      ) : null}
    </div>
  );
}

function S3UploadField({
  label,
  kind,
  accept,
  value,
  helper,
  preview = false,
  onUploaded,
  onClear,
}: {
  label: string;
  kind: DocumentTemplateUploadKind;
  accept: string;
  value: string;
  helper: string;
  preview?: boolean;
  onUploaded: (url: string, mimeType?: string | null) => void;
  onClear: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const uploaded = await uploadDocumentTemplateAsset(kind, file);
      onUploaded(uploaded.url, uploaded.mimeType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {uploading ? "Uploading..." : "Upload to S3"}
            <input
              type="file"
              accept={accept}
              className="hidden"
              disabled={uploading}
              onChange={(e) => void handleFileChange(e)}
            />
          </label>
          {value ? (
            <button
              type="button"
              onClick={onClear}
              disabled={uploading}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-white disabled:opacity-60"
            >
              Clear
            </button>
          ) : null}
        </div>
        <p className="text-xs text-gray-500">{helper}</p>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
        {value ? (
          <div className="space-y-2">
            {preview ? (
              <img src={value} alt="Preview" className="h-28 w-auto rounded-lg border border-gray-200 object-cover" />
            ) : null}
            <input
              type="text"
              value={value}
              readOnly
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PackModal({
  form,
  saving,
  onClose,
  onChange,
  onSave,
}: {
  form: PackFormState;
  saving: boolean;
  onClose: () => void;
  onChange: (next: PackFormState) => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="font-semibold text-gray-900">{form.id ? "Edit Pack" : "Create Pack"}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                onChange({
                  ...form,
                  name,
                  code: form.id ? form.code : slugifyCode(name),
                });
              }}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Classic Green"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Code</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => onChange({ ...form, code: slugifyCode(e.target.value) })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="classic-green"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => onChange({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <S3UploadField
            label="Preview Image"
            kind="preview"
            accept="image/jpeg,image/png,image/webp,image/gif"
            value={form.previewImageUrl}
            helper="Upload image to S3. URL is filled automatically."
            preview
            onUploaded={(url) => onChange({ ...form, previewImageUrl: url })}
            onClear={() => onChange({ ...form, previewImageUrl: "" })}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Status</label>
              <select
                value={form.status}
                onChange={(e) => onChange({ ...form, status: e.target.value as PackStatus })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => onChange({ ...form, sortOrder: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => onChange({ ...form, isDefault: e.target.checked })}
              className="size-4 rounded"
            />
            Set as default pack
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !form.code.trim() || !form.name.trim()}
            onClick={onSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : form.id ? "Save Changes" : "Create Pack"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ItemModal({
  form,
  saving,
  isEdit,
  usedTypes,
  onClose,
  onChange,
  onSave,
}: {
  form: ItemFormState;
  saving: boolean;
  isEdit: boolean;
  usedTypes: DocumentType[];
  onClose: () => void;
  onChange: (next: ItemFormState) => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="font-semibold text-gray-900">
            {isEdit ? "Edit Sub-template" : "Add Sub-template"}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Document Type</label>
              <select
                value={form.documentType}
                disabled={isEdit}
                onChange={(e) =>
                  onChange({ ...form, documentType: e.target.value as DocumentType })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option
                    key={type.value}
                    value={type.value}
                    disabled={!isEdit && usedTypes.includes(type.value)}
                  >
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => onChange({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Sale Invoice — Classic"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Source Type</label>
              <select
                value={form.sourceType}
                onChange={(e) => onChange({ ...form, sourceType: e.target.value as SourceType })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="INLINE">INLINE</option>
                <option value="FILE">FILE</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Engine</label>
              <select
                value={form.engine}
                onChange={(e) => onChange({ ...form, engine: e.target.value as Engine })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="HTML">HTML</option>
                <option value="HANDLEBARS">HANDLEBARS</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => onChange({ ...form, isActive: e.target.checked })}
                  className="size-4 rounded"
                />
                Active
              </label>
            </div>
          </div>

          {form.sourceType === "INLINE" ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Content</label>
              <textarea
                value={form.content}
                onChange={(e) => onChange({ ...form, content: e.target.value })}
                rows={14}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="HTML or template body"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <S3UploadField
                label="Template File"
                kind="file"
                accept=".html,.htm,.hbs,.handlebars,.txt,.css,.json,text/html,text/plain,application/json"
                value={form.fileUrl}
                helper="Upload template file to S3. URL and MIME type are filled automatically."
                onUploaded={(url, mimeType) =>
                  onChange({
                    ...form,
                    fileUrl: url,
                    fileMimeType: mimeType || form.fileMimeType,
                  })
                }
                onClear={() => onChange({ ...form, fileUrl: "", fileMimeType: "" })}
              />
              {form.fileMimeType ? (
                <p className="text-xs text-gray-500">MIME: {form.fileMimeType}</p>
              ) : null}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-gray-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Sub-template"}
          </button>
        </div>
      </div>
    </div>
  );
}
