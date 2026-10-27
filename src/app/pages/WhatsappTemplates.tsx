import { useEffect, useRef, useState } from "react";
import { apiJson } from "../utils/api";
import {
  Plus,
  RefreshCw,
  Download,
  Search,
  MessageSquare,
  Eye,
  Edit,
  Copy,
  Trash2,
  X,
  AlertCircle,
  FileText,
  Image,
  Video,
  File,
  Smartphone,
  Save,
  GripVertical,
  Type,
  Hash,
  Calendar as CalendarIcon,
  DollarSign,
  User,
  Building,
  Link2,
  Phone,
  FileDown,
  Info
} from "lucide-react";
import React from "react";

type HeaderType = "NONE" | "TEXT" | "IMAGE" | "DOCUMENT" | "VIDEO";
type Category = "UTILITY" | "MARKETING" | "AUTHENTICATION";
type Status = "ACTIVE" | "INACTIVE";
type ModuleType = "PURCHASE_ORDER" | "SALE_ORDER" | "PURCHASE_RETURN" | "SALE_RETURN" | "SALE_INVOICE" | "PURCHASE_INVOICE" | "VOUCHER" | "SALARY_SLIP" | "PAYMENT_RECEIPT";

type Variable = {
  index: number;
  key: string;
  label: string;
  dataSource?: string;
  example?: string;
  required?: boolean;
};

type Button = {
  id: string;
  type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
  text: string;
  url?: string;
  phoneNumber?: string;
};

type Template = {
  id: string;
  code: string;
  metaTemplateName: string;
  moduleType: ModuleType;
  eventType: string;
  category: Category;
  languageCode: string;
  headerType: HeaderType;
  headerText: string;
  bodyText: string;
  footerText: string;
  buttons: Button[];
  variables: Variable[];
  sampleValues: Record<string, string>;
  attachPdf: boolean;
  status: Status;
  metaSyncStatus: string;
  createdAt: string;
  updatedAt: string;
};

type ApiTemplate = {
  id: string;
  code: string;
  metaTemplateName: string;
  moduleType: ModuleType;
  eventType: string;
  category: Category;
  languageCode: string;
  headerType: HeaderType;
  headerText: string | null;
  bodyText: string;
  footerText: string | null;
  buttons: Omit<Button, "id">[] | null;
  variables: Pick<Variable, "index" | "key">[];
  sampleValues: Record<string, string> | null;
  attachPdf: boolean;
  status: Status;
  createdAt: string;
  updatedAt: string;
};

type TemplateListResponse = {
  data: ApiTemplate[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
};

type CreateTemplatePayload = {
  code: string;
  metaTemplateName: string;
  moduleType: ModuleType;
  bodyText: string;
  eventType: string;
  category?: Category;
  languageCode?: string;
  headerType?: HeaderType;
  headerText?: string;
  footerText?: string;
  buttons?: Omit<Button, "id">[];
  variables?: Pick<Variable, "index" | "key">[];
  sampleValues?: Record<string, string>;
  attachPdf?: boolean;
  status?: Status;
};

type UpdateTemplatePayload = {
  bodyText: string;
  code?: string;
  metaTemplateName?: string;
  moduleType?: ModuleType;
  eventType?: string;
  category?: Category;
  languageCode?: string;
  headerType?: HeaderType;
  headerText?: string;
  footerText?: string;
  buttons?: Omit<Button, "id">[];
  variables?: Pick<Variable, "index" | "key">[];
  sampleValues?: Record<string, string>;
  attachPdf?: boolean;
  status?: Status;
};

function mapApiTemplateToTemplate(api: ApiTemplate): Template {
  const variables: Variable[] = (api.variables ?? []).map((variable) => ({
    index: variable.index,
    key: variable.key,
    label: variable.key,
    example: api.sampleValues?.[variable.key] ?? "",
    required: true,
  }));

  const sampleValues: Record<string, string> = {};
  if (api.sampleValues) {
    variables.forEach((variable) => {
      const value = api.sampleValues?.[variable.key];
      if (value) {
        sampleValues[variable.index.toString()] = value;
      }
    });
  }

  const buttons: Button[] = (api.buttons ?? []).map((button, index) => ({
    id: `${api.id}-btn-${index}`,
    ...button,
  }));

  return {
    id: api.id,
    code: api.code,
    metaTemplateName: api.metaTemplateName,
    moduleType: api.moduleType,
    eventType: api.eventType,
    category: api.category,
    languageCode: api.languageCode,
    headerType: api.headerType,
    headerText: api.headerText ?? "",
    bodyText: api.bodyText,
    footerText: api.footerText ?? "",
    buttons,
    variables,
    sampleValues,
    attachPdf: api.attachPdf,
    status: api.status,
    metaSyncStatus: "Not Submitted",
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
  };
}

function unwrapApiTemplate(response: ApiTemplate | { data: ApiTemplate }): ApiTemplate {
  if (response && typeof response === "object" && "data" in response && response.data) {
    return response.data;
  }

  return response as ApiTemplate;
}

const draggableBlocks = [
  { id: "text", label: "Text Block", icon: Type, color: "#6B6C7E" },
  { id: "variable", label: "Variable", icon: Hash, color: "#958CE8" },
  { id: "amount", label: "Amount", icon: DollarSign, color: "#10B981" },
  { id: "date", label: "Date", icon: CalendarIcon, color: "#3B82F6" },
  { id: "customer", label: "Customer Name", icon: User, color: "#F59E0B" },
  { id: "business", label: "Business Name", icon: Building, color: "#EC4899" },
];

export default function WhatsAppTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleTypeFilter, setModuleTypeFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [showViewDrawer, setShowViewDrawer] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const viewRequestRef = useRef(0);

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    setTemplatesError("");

    try {
      const response = await apiJson<TemplateListResponse>("platform/whatsapp-template");
      setTemplates((response.data ?? []).map(mapApiTemplateToTemplate));
    } catch (err) {
      setTemplatesError(err instanceof Error ? err.message : "Failed to load WhatsApp templates.");
    } finally {
      setTemplatesLoading(false);
    }
  };

  useEffect(() => {
    void loadTemplates();
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    metaTemplateName: "",
    moduleType: "SALE_INVOICE" as ModuleType,
    eventType: "CREATED",
    category: "UTILITY" as Category,
    languageCode: "en",
    headerType: "NONE" as HeaderType,
    headerText: "",
    bodyText: "",
    footerText: "",
    attachPdf: false,
    status: "ACTIVE" as Status,
  });

  const [variables, setVariables] = useState<Variable[]>([]);
  const [buttons, setButtons] = useState<Button[]>([]);
  const [sampleValues, setSampleValues] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.metaTemplateName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = moduleTypeFilter === "ALL" || template.moduleType === moduleTypeFilter;
    const matchesCategory = categoryFilter === "ALL" || template.category === categoryFilter;
    const matchesStatus = statusFilter === "ALL" || template.status === statusFilter;

    return matchesSearch && matchesModule && matchesCategory && matchesStatus;
  });

  const stats = {
    total: templates.length,
    active: templates.filter(t => t.status === "ACTIVE").length,
    inactive: templates.filter(t => t.status === "INACTIVE").length,
    approved: templates.filter(t => t.metaSyncStatus === "Approved").length,
    pending: templates.filter(t => t.metaSyncStatus === "Pending").length,
    rejected: templates.filter(t => t.metaSyncStatus === "Rejected").length
  };

  const handleCreateTemplate = () => {
    setFormData({
      code: "",
      metaTemplateName: "",
      moduleType: "SALE_INVOICE",
      eventType: "CREATED",
      category: "UTILITY",
      languageCode: "en",
      headerType: "NONE",
      headerText: "",
      bodyText: "",
      footerText: "",
      attachPdf: false,
      status: "ACTIVE"
    });
    setVariables([]);
    setButtons([]);
    setSampleValues({});
    setFormError("");
    setSelectedTemplate(null);
    setEditMode(false);
    setShowCreateDrawer(true);
  };

  const closeCreateDrawer = () => {
    setShowCreateDrawer(false);
    setFormError("");
  };

  const buildSampleValuesByKey = () => {
    const sampleValuesByKey: Record<string, string> = {};

    variables.forEach((variable) => {
      const value = sampleValues[variable.index.toString()] ?? sampleValues[variable.key];
      if (variable.key.trim() && value?.trim()) {
        sampleValuesByKey[variable.key.trim()] = value.trim();
      }
    });

    return sampleValuesByKey;
  };

  const buildApiButtons = () =>
    buttons
      .filter((button) => button.text.trim())
      .map(({ id: _id, ...button }) => button);

  const buildApiVariables = () =>
    variables
      .filter((variable) => variable.key.trim())
      .map(({ index, key }) => ({ index, key: key.trim() }));

  const buildCreatePayload = (): CreateTemplatePayload => {
    const sampleValuesByKey = buildSampleValuesByKey();
    const apiButtons = buildApiButtons();
    const apiVariables = buildApiVariables();

    const payload: CreateTemplatePayload = {
      code: formData.code.trim(),
      metaTemplateName: formData.metaTemplateName.trim(),
      moduleType: formData.moduleType,
      bodyText: formData.bodyText.trim(),
      eventType: formData.eventType.trim(),
      category: formData.category,
      languageCode: formData.languageCode,
      headerType: formData.headerType,
      attachPdf: formData.attachPdf,
      status: formData.status,
    };

    if (formData.headerType === "TEXT" && formData.headerText.trim()) {
      payload.headerText = formData.headerText.trim();
    }

    if (formData.footerText.trim()) {
      payload.footerText = formData.footerText.trim();
    }

    if (apiButtons.length) {
      payload.buttons = apiButtons;
    }

    if (apiVariables.length) {
      payload.variables = apiVariables;
    }

    if (Object.keys(sampleValuesByKey).length) {
      payload.sampleValues = sampleValuesByKey;
    }

    return payload;
  };

  const buildUpdatePayload = (original: Template): UpdateTemplatePayload => {
    const payload: UpdateTemplatePayload = {
      bodyText: formData.bodyText.trim(),
    };

    const trimmedCode = formData.code.trim();
    const trimmedMetaTemplateName = formData.metaTemplateName.trim();
    const trimmedEventType = formData.eventType.trim();
    const trimmedHeaderText = formData.headerText.trim();
    const trimmedFooterText = formData.footerText.trim();

    if (trimmedCode !== original.code) {
      payload.code = trimmedCode;
    }

    if (trimmedMetaTemplateName !== original.metaTemplateName) {
      payload.metaTemplateName = trimmedMetaTemplateName;
    }

    if (formData.moduleType !== original.moduleType) {
      payload.moduleType = formData.moduleType;
    }

    if (trimmedEventType !== original.eventType) {
      payload.eventType = trimmedEventType;
    }

    if (formData.category !== original.category) {
      payload.category = formData.category;
    }

    if (formData.languageCode !== original.languageCode) {
      payload.languageCode = formData.languageCode;
    }

    if (formData.headerType !== original.headerType) {
      payload.headerType = formData.headerType;
    }

    if (trimmedHeaderText !== original.headerText) {
      payload.headerText = trimmedHeaderText;
    }

    if (trimmedFooterText !== original.footerText) {
      payload.footerText = trimmedFooterText;
    }

    if (formData.attachPdf !== original.attachPdf) {
      payload.attachPdf = formData.attachPdf;
    }

    if (formData.status !== original.status) {
      payload.status = formData.status;
    }

    const apiButtons = buildApiButtons();
    const originalButtons = original.buttons.map(({ id: _id, ...button }) => button);
    if (JSON.stringify(apiButtons) !== JSON.stringify(originalButtons)) {
      payload.buttons = apiButtons;
    }

    const apiVariables = buildApiVariables();
    const originalVariables = original.variables.map(({ index, key }) => ({ index, key }));
    if (JSON.stringify(apiVariables) !== JSON.stringify(originalVariables)) {
      payload.variables = apiVariables;
    }

    const sampleValuesByKey = buildSampleValuesByKey();
    const originalSampleValues: Record<string, string> = {};
    original.variables.forEach((variable) => {
      const value = original.sampleValues[variable.index.toString()] ?? original.sampleValues[variable.key];
      if (variable.key && value) {
        originalSampleValues[variable.key] = value;
      }
    });

    if (JSON.stringify(sampleValuesByKey) !== JSON.stringify(originalSampleValues)) {
      payload.sampleValues = sampleValuesByKey;
    }

    return payload;
  };

  const handleSubmitTemplate = async () => {
    if (editMode) {
      if (!selectedTemplate) {
        setFormError("No template selected for update.");
        return;
      }

      if (!formData.bodyText.trim()) {
        setFormError("Body text is required.");
        return;
      }

      setFormError("");
      setSubmitting(true);

      try {
        await apiJson(`platform/whatsapp-template/${selectedTemplate.id}`, {
          method: "PUT",
          body: JSON.stringify(buildUpdatePayload(selectedTemplate)),
        });

        closeCreateDrawer();
        void loadTemplates();
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Failed to update template.");
      } finally {
        setSubmitting(false);
      }

      return;
    }

    if (
      !formData.code.trim() ||
      !formData.metaTemplateName.trim() ||
      !formData.moduleType ||
      !formData.bodyText.trim()
    ) {
      setFormError("Code, Meta template name, module type, and body text are required.");
      return;
    }

    setFormError("");
    setSubmitting(true);

    try {
      await apiJson("platform/whatsapp-template", {
        method: "POST",
        body: JSON.stringify(buildCreatePayload()),
      });

      closeCreateDrawer();
      void loadTemplates();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create template.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTemplate = (template: Template) => {
    setFormData({
      code: template.code,
      metaTemplateName: template.metaTemplateName,
      moduleType: template.moduleType,
      eventType: template.eventType,
      category: template.category,
      languageCode: template.languageCode,
      headerType: template.headerType,
      headerText: template.headerText,
      bodyText: template.bodyText,
      footerText: template.footerText,
      attachPdf: template.attachPdf,
      status: template.status
    });
    setVariables(template.variables);
    setButtons(template.buttons);
    setSampleValues(template.sampleValues);
    setFormError("");
    setSelectedTemplate(template);
    setEditMode(true);
    setShowCreateDrawer(true);
  };

  const handleViewTemplate = (template: Template) => {
    const requestId = ++viewRequestRef.current;
    setSelectedTemplate(template);
    setShowViewDrawer(true);

    void apiJson<ApiTemplate | { data: ApiTemplate }>(`platform/whatsapp-template/${template.id}`)
      .then((response) => {
        if (viewRequestRef.current !== requestId) return;
        setSelectedTemplate(mapApiTemplateToTemplate(unwrapApiTemplate(response)));
      })
      .catch((err) => {
        if (viewRequestRef.current !== requestId) return;
        console.error(err instanceof Error ? err.message : "Failed to load template details.");
      });
  };

  const closeViewDrawer = () => {
    viewRequestRef.current += 1;
    setShowViewDrawer(false);
  };

  const handleStatusToggle = (template: Template) => {
    setSelectedTemplate(template);
    setShowStatusModal(true);
  };

  const confirmStatusToggle = async () => {
    if (!selectedTemplate) return;

    const newStatus: Status = selectedTemplate.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    setStatusUpdating(true);
    try {
      await apiJson(`platform/whatsapp-template/${selectedTemplate.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });

      setTemplates((current) =>
        current.map((template) =>
          template.id === selectedTemplate.id ? { ...template, status: newStatus } : template
        )
      );
      setShowStatusModal(false);
      setSelectedTemplate(null);
    } catch (err) {
      console.error(err instanceof Error ? err.message : "Failed to update template status.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const addVariable = () => {
    const newIndex = variables.length + 1;
    setVariables([...variables, {
      index: newIndex,
      key: "",
      label: "",
      dataSource: "",
      example: "",
      required: true
    }]);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter(v => v.index !== index));
  };

  const updateVariable = (index: number, field: keyof Variable, value: any) => {
    setVariables(variables.map(v =>
      v.index === index ? { ...v, [field]: value } : v
    ));
  };

  const addButton = () => {
    setButtons([...buttons, {
      id: Date.now().toString(),
      type: "QUICK_REPLY",
      text: ""
    }]);
  };

  const removeButton = (id: string) => {
    setButtons(buttons.filter(b => b.id !== id));
  };

  const updateButton = (id: string, field: keyof Button, value: any) => {
    setButtons(buttons.map(b =>
      b.id === id ? { ...b, [field]: value } : b
    ));
  };

  const insertVariableIntoBody = (varIndex: number) => {
    setFormData({ ...formData, bodyText: formData.bodyText + `{{${varIndex}}}` });
  };

  const getPreviewText = () => {
    let text = formData.bodyText;
    variables.forEach((v) => {
      if (sampleValues[v.index.toString()]) {
        text = text.replace(new RegExp(`\\{\\{${v.index}\\}\\}`, 'g'), sampleValues[v.index.toString()]);
      }
    });
    return text;
  };

  return (
    <div className="min-h-full" style={{ backgroundColor: '#F8F9FC' }}>
      {/* Header */}
      <div className="bg-white border-b" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{ color: '#21222D' }}>WhatsApp Templates</h1>
              <p className="mt-1 text-sm" style={{ color: '#6B6C7E' }}>
                Create and manage global Meta WhatsApp templates for invoices, orders, vouchers, salary slips, and payment receipts
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void loadTemplates()}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors text-sm font-medium"
                style={{ borderColor: 'rgba(219, 219, 229, 0.4)', color: '#21222D' }}
              >
                <RefreshCw className="size-4" />
                Refresh
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors text-sm font-medium"
                style={{ borderColor: 'rgba(219, 219, 229, 0.4)', color: '#21222D' }}
              >
                <Download className="size-4" />
                Export
              </button>
              <button
                onClick={() => setShowSyncModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                style={{ backgroundColor: '#25D366', color: 'white' }}
              >
                <MessageSquare className="size-4" />
                Sync with Meta
              </button>
              <button
                onClick={handleCreateTemplate}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium"
                style={{ backgroundColor: '#958CE8' }}
              >
                <Plus className="size-4" />
                Create Template
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#6B6C7E' }}>Total Templates</p>
            <p className="text-2xl font-bold" style={{ color: '#21222D' }}>{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#6B6C7E' }}>Active Templates</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#6B6C7E' }}>Inactive Templates</p>
            <p className="text-2xl font-bold text-orange-600">{stats.inactive}</p>
          </div>
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#6B6C7E' }}>Meta Synced</p>
            <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#6B6C7E' }}>Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#6B6C7E' }}>Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5" style={{ color: '#6B6C7E' }} />
                <input
                  type="text"
                  placeholder="Search by code or Meta template name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: 'rgba(219, 219, 229, 0.6)', '--tw-ring-color': '#958CE8' } as React.CSSProperties}
                />
              </div>
            </div>

            <select
              value={moduleTypeFilter}
              onChange={(e) => setModuleTypeFilter(e.target.value)}
              className="px-4 py-2.5 border rounded-xl text-sm focus:outline-none"
              style={{ borderColor: 'rgba(219, 219, 229, 0.6)' }}
            >
              <option value="ALL">All Module Types</option>
              <option value="SALE_INVOICE">Sale Invoice</option>
              <option value="PURCHASE_INVOICE">Purchase Invoice</option>
              <option value="SALE_ORDER">Sale Order</option>
              <option value="PURCHASE_ORDER">Purchase Order</option>
              <option value="VOUCHER">Voucher</option>
              <option value="SALARY_SLIP">Salary Slip</option>
              <option value="PAYMENT_RECEIPT">Payment Receipt</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 border rounded-xl text-sm focus:outline-none"
              style={{ borderColor: 'rgba(219, 219, 229, 0.6)' }}
            >
              <option value="ALL">All Categories</option>
              <option value="UTILITY">Utility</option>
              <option value="MARKETING">Marketing</option>
              <option value="AUTHENTICATION">Authentication</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border rounded-xl text-sm focus:outline-none"
              style={{ borderColor: 'rgba(219, 219, 229, 0.6)' }}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {templatesError ? (
          <div className="rounded-xl border px-4 py-4 text-sm mb-4" style={{ borderColor: "rgba(248, 113, 113, 0.3)", color: "#B91C1C", backgroundColor: "#FEF2F2" }}>
            {templatesError}
          </div>
        ) : null}

        {/* Templates Table */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
          {templatesLoading ? (
            <div className="flex items-center justify-center py-12 text-sm" style={{ color: '#6B6C7E' }}>
              Loading templates...
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: '#F8F9FC' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: '#6B6C7E' }}>Template Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: '#6B6C7E' }}>Meta Template Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: '#6B6C7E' }}>Module Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: '#6B6C7E' }}>Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: '#6B6C7E' }}>Language</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: '#6B6C7E' }}>Header Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: '#6B6C7E' }}>Attach PDF</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: '#6B6C7E' }}>Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: '#6B6C7E' }}>Meta Sync</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: '#6B6C7E' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                {filteredTemplates.map((template) => (
                  <tr
                    key={template.id}
                    className="transition-colors"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(172, 209, 253, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium font-mono" style={{ color: '#21222D' }}>{template.code}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-mono" style={{ color: '#6B6C7E' }}>{template.metaTemplateName}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs px-2 py-1 rounded-full" style={{
                        backgroundColor: 'rgba(149, 140, 232, 0.1)',
                        color: '#958CE8'
                      }}>
                        {template.moduleType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs px-2 py-1 rounded-full" style={{
                        backgroundColor: template.category === "UTILITY" ? 'rgba(59, 130, 246, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                        color: template.category === "UTILITY" ? '#3B82F6' : '#F97316'
                      }}>
                        {template.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#21222D' }}>{template.languageCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {template.headerType === "TEXT" && <FileText className="size-4" style={{ color: '#6B6C7E' }} />}
                        {template.headerType === "IMAGE" && <Image className="size-4" style={{ color: '#6B6C7E' }} />}
                        {template.headerType === "DOCUMENT" && <File className="size-4" style={{ color: '#6B6C7E' }} />}
                        {template.headerType === "VIDEO" && <Video className="size-4" style={{ color: '#6B6C7E' }} />}
                        <span className="text-sm" style={{ color: '#21222D' }}>{template.headerType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {template.attachPdf ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Yes</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={template.status === "ACTIVE"}
                          onChange={() => handleStatusToggle(template)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        template.metaSyncStatus === "Approved" ? "bg-green-100 text-green-700" :
                        template.metaSyncStatus === "Pending" ? "bg-yellow-100 text-yellow-700" :
                        template.metaSyncStatus === "Rejected" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {template.metaSyncStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewTemplate(template)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: '#6B6C7E' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#F8F9FC';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: '#6B6C7E' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#F8F9FC';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Edit className="size-4" />
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
      </div>

      {/* Status Toggle Modal */}
      {showStatusModal && selectedTemplate && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(33, 34, 45, 0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl max-w-md w-full" style={{ boxShadow: '0 25px 70px rgba(0, 0, 0, 0.2)' }}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-12 rounded-full flex items-center justify-center" style={{
                  backgroundColor: selectedTemplate.status === "ACTIVE" ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'
                }}>
                  <AlertCircle className="size-6" style={{
                    color: selectedTemplate.status === "ACTIVE" ? '#EF4444' : '#10B981'
                  }} />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: '#21222D' }}>
                    {selectedTemplate.status === "ACTIVE" ? "Deactivate" : "Activate"} Template
                  </h3>
                  <p className="text-sm" style={{ color: '#6B6C7E' }}>
                    {selectedTemplate.code}
                  </p>
                </div>
              </div>
              <p className="text-sm mb-6" style={{ color: '#6B6C7E' }}>
                {selectedTemplate.status === "ACTIVE"
                  ? "Are you sure you want to deactivate this template? Tenants will not be able to use it for sending messages."
                  : "Are you sure you want to activate this template? It will be available for sending messages."}
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-5 py-2.5 font-medium text-sm transition-colors rounded-xl border"
                  style={{
                    color: '#6B6C7E',
                    borderColor: 'rgba(219, 219, 229, 0.6)'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => void confirmStatusToggle()}
                  disabled={statusUpdating}
                  className="px-5 py-2.5 text-white rounded-xl font-medium text-sm disabled:opacity-60"
                  style={{
                    backgroundColor: selectedTemplate.status === "ACTIVE" ? '#EF4444' : '#10B981'
                  }}
                >
                  {selectedTemplate.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync with Meta Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(33, 34, 45, 0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl max-w-2xl w-full" style={{ boxShadow: '0 25px 70px rgba(0, 0, 0, 0.2)' }}>
            <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(219, 219, 229, 0.3)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold" style={{ color: '#21222D' }}>Sync Templates with Meta</h2>
                  <p className="text-sm mt-1" style={{ color: '#6B6C7E' }}>Submit templates to Meta WhatsApp Cloud API for approval</p>
                </div>
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: '#6B6C7E' }}
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(37, 211, 102, 0.1)' }}>
                <div className="flex items-start gap-3">
                  <Info className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: '#21222D' }}>Meta Approval Required</p>
                    <p className="text-xs" style={{ color: '#6B6C7E' }}>
                      Meta approval may take time. Rejected templates will show rejection reason. You can sync all templates or select specific ones.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#21222D' }}>Select Templates to Sync</label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {templates.map((template) => (
                    <label key={template.id} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                      <input type="checkbox" className="size-4 rounded" style={{ accentColor: '#25D366' }} />
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: '#21222D' }}>{template.code}</p>
                        <p className="text-xs" style={{ color: '#6B6C7E' }}>{template.metaTemplateName}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        template.metaSyncStatus === "Approved" ? "bg-green-100 text-green-700" :
                        template.metaSyncStatus === "Pending" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {template.metaSyncStatus}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-5 border-t flex items-center justify-end gap-3" style={{
              backgroundColor: '#FAFBFC',
              borderColor: 'rgba(219, 219, 229, 0.3)'
            }}>
              <button
                onClick={() => setShowSyncModal(false)}
                className="px-5 py-2.5 font-medium text-sm transition-colors rounded-xl border"
                style={{
                  color: '#6B6C7E',
                  borderColor: 'rgba(219, 219, 229, 0.6)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSyncModal(false)}
                className="px-5 py-2.5 text-white rounded-xl font-medium text-sm"
                style={{ backgroundColor: '#25D366' }}
              >
                Start Sync
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Drawer */}
      {showCreateDrawer && (
        <div className="fixed inset-0 z-50" style={{ backgroundColor: 'rgba(33, 34, 45, 0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="absolute right-0 top-0 h-full bg-white shadow-2xl overflow-hidden flex flex-col" style={{ width: '95%', maxWidth: '1400px' }}>
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b flex-shrink-0" style={{ borderColor: 'rgba(219, 219, 229, 0.3)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold" style={{ color: '#21222D' }}>
                    {editMode ? "Edit Template" : "Create WhatsApp Template"}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: '#6B6C7E' }}>
                    Design your message template with drag-and-drop builder
                  </p>
                </div>
                <button
                  onClick={closeCreateDrawer}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: '#6B6C7E' }}
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-12 gap-6 p-6">
                {/* Left Column - Form Fields */}
                <div className="col-span-5 space-y-6">
                  {/* Basic Information */}
                  <div className="bg-white border rounded-xl p-5" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                    <h3 className="font-semibold mb-4" style={{ color: '#21222D' }}>Basic Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: '#21222D' }}>Template Code *</label>
                        <input
                          type="text"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          placeholder="e.g., invoice_created"
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          style={{ borderColor: 'rgba(219, 219, 229, 0.6)' }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: '#21222D' }}>Meta Template Name *</label>
                        <input
                          type="text"
                          value={formData.metaTemplateName}
                          onChange={(e) => setFormData({ ...formData, metaTemplateName: e.target.value })}
                          placeholder="e.g., salesvince_invoice_created"
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          style={{ borderColor: 'rgba(219, 219, 229, 0.6)' }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1.5" style={{ color: '#21222D' }}>Module Type *</label>
                          <select
                            value={formData.moduleType}
                            onChange={(e) => setFormData({ ...formData, moduleType: e.target.value as ModuleType })}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            style={{ borderColor: 'rgba(219, 219, 229, 0.6)' }}
                          >
                            <option value="SALE_INVOICE">Sale Invoice</option>
                            <option value="PURCHASE_INVOICE">Purchase Invoice</option>
                            <option value="SALE_ORDER">Sale Order</option>
                            <option value="PURCHASE_ORDER">Purchase Order</option>
                            <option value="VOUCHER">Voucher</option>
                            <option value="SALARY_SLIP">Salary Slip</option>
                            <option value="PAYMENT_RECEIPT">Payment Receipt</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5" style={{ color: '#21222D' }}>Event Type *</label>
                          <input
                            type="text"
                            value={formData.eventType}
                            onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                            placeholder="e.g., CREATED"
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            style={{ borderColor: 'rgba(219, 219, 229, 0.6)' }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1.5" style={{ color: '#21222D' }}>Category *</label>
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            style={{ borderColor: 'rgba(219, 219, 229, 0.6)' }}
                          >
                            <option value="UTILITY">Utility</option>
                            <option value="MARKETING">Marketing</option>
                            <option value="AUTHENTICATION">Authentication</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5" style={{ color: '#21222D' }}>Language</label>
                          <select
                            value={formData.languageCode}
                            onChange={(e) => setFormData({ ...formData, languageCode: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            style={{ borderColor: 'rgba(219, 219, 229, 0.6)' }}
                          >
                            <option value="en">English</option>
                            <option value="hi">Hindi</option>
                            <option value="mr">Marathi</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Header Configuration */}
                  <div className="bg-white border rounded-xl p-5" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                    <h3 className="font-semibold mb-4" style={{ color: '#21222D' }}>Header Configuration</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: '#21222D' }}>Header Type</label>
                        <select
                          value={formData.headerType}
                          onChange={(e) => setFormData({ ...formData, headerType: e.target.value as HeaderType })}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          style={{ borderColor: 'rgba(219, 219, 229, 0.6)' }}
                        >
                          <option value="NONE">None</option>
                          <option value="TEXT">Text</option>
                          <option value="IMAGE">Image</option>
                          <option value="DOCUMENT">Document</option>
                          <option value="VIDEO">Video</option>
                        </select>
                      </div>
                      {formData.headerType === "TEXT" && (
                        <div>
                          <label className="block text-sm font-medium mb-1.5" style={{ color: '#21222D' }}>Header Text</label>
                          <input
                            type="text"
                            value={formData.headerText}
                            onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                            placeholder="Enter header text"
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            style={{ borderColor: 'rgba(219, 219, 229, 0.6)' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Template Body Builder */}
                  <div className="bg-white border rounded-xl p-5" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                    <h3 className="font-semibold mb-4" style={{ color: '#21222D' }}>Template Body Builder</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#21222D' }}>Draggable Blocks</label>
                        <div className="grid grid-cols-2 gap-2">
                          {draggableBlocks.map((block) => (
                            <div
                              key={block.id}
                              className="flex items-center gap-2 px-3 py-2.5 border rounded-lg cursor-move transition-all hover:shadow-md"
                              style={{ borderColor: 'rgba(219, 219, 229, 0.4)', backgroundColor: '#FAFBFC' }}
                              draggable
                            >
                              <GripVertical className="size-4" style={{ color: '#6B6C7E' }} />
                              <block.icon className="size-4" style={{ color: block.color }} />
                              <span className="text-xs font-medium" style={{ color: '#21222D' }}>{block.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-sm font-medium" style={{ color: '#21222D' }}>Body Text *</label>
                          <span className="text-xs" style={{ color: '#6B6C7E' }}>{formData.bodyText.length} / 1024</span>
                        </div>
                        <textarea
                          value={formData.bodyText}
                          onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
                          placeholder="Type your message or drag blocks here. Use {{1}}, {{2}} for variables"
                          rows={8}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          style={{ borderColor: 'rgba(219, 219, 229, 0.6)' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-white border rounded-xl p-5" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                    <h3 className="font-semibold mb-4" style={{ color: '#21222D' }}>Footer</h3>
                    <input
                      type="text"
                      value={formData.footerText}
                      onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                      placeholder="e.g., Powered by Salesvince ERP"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      style={{ borderColor: 'rgba(219, 219, 229, 0.6)' }}
                    />
                  </div>

                  {/* Buttons Builder */}
                  <div className="bg-white border rounded-xl p-5" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold" style={{ color: '#21222D' }}>Buttons</h3>
                      <button
                        onClick={addButton}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors"
                        style={{ backgroundColor: '#F8F9FC', color: '#958CE8' }}
                      >
                        <Plus className="size-3" />
                        Add Button
                      </button>
                    </div>
                    <div className="space-y-3">
                      {buttons.map((button, index) => (
                        <div key={button.id} className="p-3 border rounded-lg" style={{ borderColor: 'rgba(219, 219, 229, 0.4)', backgroundColor: '#FAFBFC' }}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium" style={{ color: '#6B6C7E' }}>Button {index + 1}</span>
                            <button
                              onClick={() => removeButton(button.id)}
                              className="p-1 rounded transition-colors"
                              style={{ color: '#EF4444' }}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            <select
                              value={button.type}
                              onChange={(e) => updateButton(button.id, "type", e.target.value)}
                              className="w-full px-2 py-1.5 border rounded text-xs"
                              style={{ borderColor: 'rgba(219, 219, 229, 0.6)' }}
                            >
                              <option value="QUICK_REPLY">Quick Reply</option>
                              <option value="URL">URL</option>
                              <option value="PHONE_NUMBER">Phone Number</option>
                            </select>
                            <input
                              type="text"
                              value={button.text}
                              onChange={(e) => updateButton(button.id, "text", e.target.value)}
                              placeholder="Button text"
                              className="w-full px-2 py-1.5 border rounded text-xs"
                              style={{ borderColor: 'rgba(219, 219, 229, 0.6)' }}
                            />
                            {button.type === "URL" && (
                              <input
                                type="text"
                                value={button.url || ""}
                                onChange={(e) => updateButton(button.id, "url", e.target.value)}
                                placeholder="https://example.com"
                                className="w-full px-2 py-1.5 border rounded text-xs"
                                style={{ borderColor: 'rgba(219, 219, 229, 0.6)' }}
                              />
                            )}
                            {button.type === "PHONE_NUMBER" && (
                              <input
                                type="text"
                                value={button.phoneNumber || ""}
                                onChange={(e) => updateButton(button.id, "phoneNumber", e.target.value)}
                                placeholder="+1234567890"
                                className="w-full px-2 py-1.5 border rounded text-xs"
                                style={{ borderColor: 'rgba(219, 219, 229, 0.6)' }}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Variables Builder */}
                  <div className="bg-white border rounded-xl p-5" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold" style={{ color: '#21222D' }}>Variables</h3>
                      <button
                        onClick={addVariable}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors"
                        style={{ backgroundColor: '#F8F9FC', color: '#958CE8' }}
                      >
                        <Plus className="size-3" />
                        Add Variable
                      </button>
                    </div>
                    <div className="space-y-3">
                      {variables.map((variable) => (
                        <div key={variable.index} className="p-3 border rounded-lg" style={{ borderColor: 'rgba(219, 219, 229, 0.4)', backgroundColor: '#FAFBFC' }}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: '#958CE8', color: 'white' }}>
                              {`{{${variable.index}}}`}
                            </span>
                            <button
                              onClick={() => removeVariable(variable.index)}
                              className="p-1 rounded transition-colors"
                              style={{ color: '#EF4444' }}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={variable.key}
                              onChange={(e) => updateVariable(variable.index, "key", e.target.value)}
                              placeholder="Variable key"
                              className="w-full px-2 py-1.5 border rounded text-xs"
                              style={{ borderColor: 'rgba(219, 219, 229, 0.6)' }}
                            />
                            <input
                              type="text"
                              value={variable.label}
                              onChange={(e) => updateVariable(variable.index, "label", e.target.value)}
                              placeholder="Variable label"
                              className="w-full px-2 py-1.5 border rounded text-xs"
                              style={{ borderColor: 'rgba(219, 219, 229, 0.6)' }}
                            />
                            <input
                              type="text"
                              value={variable.example || ""}
                              onChange={(e) => updateVariable(variable.index, "example", e.target.value)}
                              placeholder="Example value"
                              className="w-full px-2 py-1.5 border rounded text-xs"
                              style={{ borderColor: 'rgba(219, 219, 229, 0.6)' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sample Values */}
                  <div className="bg-white border rounded-xl p-5" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                    <h3 className="font-semibold mb-4" style={{ color: '#21222D' }}>Sample Values</h3>
                    <div className="space-y-2">
                      {variables.map((variable) => (
                        <div key={variable.index} className="grid grid-cols-2 gap-2 items-center">
                          <label className="text-xs font-medium" style={{ color: '#6B6C7E' }}>
                            {`{{${variable.index}}}`} - {variable.label || variable.key}
                          </label>
                          <input
                            type="text"
                            value={sampleValues[variable.index.toString()] || ""}
                            onChange={(e) => setSampleValues({ ...sampleValues, [variable.index.toString()]: e.target.value })}
                            placeholder="Sample value"
                            className="px-2 py-1.5 border rounded text-xs"
                            style={{ borderColor: 'rgba(219, 219, 229, 0.6)' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Attachment Settings */}
                  <div className="bg-white border rounded-xl p-5" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                    <h3 className="font-semibold mb-4" style={{ color: '#21222D' }}>Attachment Settings</h3>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.attachPdf}
                        onChange={(e) => setFormData({ ...formData, attachPdf: e.target.checked })}
                        className="size-4 rounded"
                        style={{ accentColor: '#958CE8' }}
                      />
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#21222D' }}>Attach PDF Document</p>
                        <p className="text-xs" style={{ color: '#6B6C7E' }}>Include PDF attachment with the message</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Right Column - Live WhatsApp Preview */}
                <div className="col-span-7">
                  <div className="sticky top-6">
                    <div className="bg-white border rounded-xl p-5" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                      <div className="flex items-center gap-2 mb-4">
                        <Smartphone className="size-5" style={{ color: '#25D366' }} />
                        <h3 className="font-semibold" style={{ color: '#21222D' }}>Live Preview</h3>
                      </div>

                      {/* WhatsApp Chat Container */}
                      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#E5DDD5' }}>
                        <div className="p-4 space-y-2">
                          {/* WhatsApp Message Bubble */}
                          <div className="flex justify-start">
                            <div className="max-w-md">
                              <div className="rounded-lg shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
                                {/* Header */}
                                {formData.headerType === "TEXT" && formData.headerText && (
                                  <div className="px-4 pt-3 pb-2">
                                    <p className="font-semibold text-sm" style={{ color: '#21222D' }}>{formData.headerText}</p>
                                  </div>
                                )}
                                {formData.headerType === "IMAGE" && (
                                  <div className="aspect-video bg-gray-200 flex items-center justify-center">
                                    <Image className="size-12" style={{ color: '#6B6C7E' }} />
                                  </div>
                                )}
                                {formData.headerType === "DOCUMENT" && (
                                  <div className="px-4 pt-3 pb-2 flex items-center gap-2 bg-gray-50 border-b" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                                    <File className="size-5" style={{ color: '#6B6C7E' }} />
                                    <span className="text-xs" style={{ color: '#6B6C7E' }}>Document.pdf</span>
                                  </div>
                                )}
                                {formData.headerType === "VIDEO" && (
                                  <div className="aspect-video bg-gray-900 flex items-center justify-center">
                                    <Video className="size-12 text-white" />
                                  </div>
                                )}

                                {/* Body */}
                                <div className="px-4 py-3">
                                  <p className="text-sm whitespace-pre-wrap" style={{ color: '#21222D' }}>
                                    {getPreviewText() || "Your message will appear here..."}
                                  </p>
                                </div>

                                {/* PDF Attachment */}
                                {formData.attachPdf && (
                                  <div className="px-4 pb-2">
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#F8F9FC' }}>
                                      <FileDown className="size-4" style={{ color: '#958CE8' }} />
                                      <span className="text-xs font-medium" style={{ color: '#21222D' }}>Attached_Document.pdf</span>
                                    </div>
                                  </div>
                                )}

                                {/* Footer */}
                                {formData.footerText && (
                                  <div className="px-4 pb-2">
                                    <p className="text-xs" style={{ color: '#6B6C7E' }}>{formData.footerText}</p>
                                  </div>
                                )}

                                {/* Buttons */}
                                {buttons.length > 0 && (
                                  <div className="border-t" style={{ borderColor: 'rgba(219, 219, 229, 0.2)' }}>
                                    {buttons.map((button, index) => (
                                      <div
                                        key={button.id}
                                        className={`px-4 py-2.5 text-center ${index < buttons.length - 1 ? 'border-b' : ''}`}
                                        style={{ borderColor: 'rgba(219, 219, 229, 0.2)' }}
                                      >
                                        <div className="flex items-center justify-center gap-2">
                                          {button.type === "URL" && <Link2 className="size-3.5" style={{ color: '#25D366' }} />}
                                          {button.type === "PHONE_NUMBER" && <Phone className="size-3.5" style={{ color: '#25D366' }} />}
                                          <span className="text-sm font-medium" style={{ color: '#25D366' }}>
                                            {button.text || "Button Text"}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Timestamp */}
                                <div className="px-4 pb-2 text-right">
                                  <span className="text-xs" style={{ color: '#6B6C7E' }}>12:00 PM</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Preview Info */}
                      <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(149, 140, 232, 0.1)' }}>
                        <p className="text-xs" style={{ color: '#6B6C7E' }}>
                          This is how your template will appear on WhatsApp. Variables will be replaced with actual values when sent.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-5 border-t flex-shrink-0 flex flex-col items-end gap-3" style={{
              backgroundColor: '#FAFBFC',
              borderColor: 'rgba(219, 219, 229, 0.3)'
            }}>
              {formError ? (
                <p className="w-full text-sm" style={{ color: '#EF4444' }}>{formError}</p>
              ) : null}
              <div className="flex items-center gap-3">
              <button
                onClick={closeCreateDrawer}
                className="px-5 py-2.5 font-medium text-sm transition-colors rounded-xl border"
                style={{
                  color: '#6B6C7E',
                  borderColor: 'rgba(219, 219, 229, 0.6)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSubmitTemplate()}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-medium text-sm disabled:opacity-60"
                style={{ backgroundColor: '#958CE8' }}
              >
                <Save className="size-4" />
                {editMode
                  ? submitting
                    ? "Updating..."
                    : "Update Template"
                  : submitting
                    ? "Creating..."
                    : "Create Template"}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Drawer */}
      {showViewDrawer && selectedTemplate && (
        <div className="fixed inset-0 z-50" style={{ backgroundColor: 'rgba(33, 34, 45, 0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="absolute right-0 top-0 h-full bg-white shadow-2xl overflow-hidden flex flex-col" style={{ width: '90%', maxWidth: '1200px' }}>
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b flex-shrink-0" style={{ borderColor: 'rgba(219, 219, 229, 0.3)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold" style={{ color: '#21222D' }}>Template Details</h2>
                  <p className="text-sm mt-1 font-mono" style={{ color: '#6B6C7E' }}>{selectedTemplate.code}</p>
                </div>
                <button
                  onClick={closeViewDrawer}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: '#6B6C7E' }}
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-12 gap-6 p-6">
                {/* Left Column - Template Details */}
                <div className="col-span-7 space-y-6">
                  {/* Template Overview */}
                  <div className="bg-white border rounded-xl p-5" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                    <h3 className="font-semibold mb-4" style={{ color: '#21222D' }}>Template Overview</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#6B6C7E' }}>Template Code</p>
                        <p className="text-sm font-mono" style={{ color: '#21222D' }}>{selectedTemplate.code}</p>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#6B6C7E' }}>Meta Template Name</p>
                        <p className="text-sm font-mono" style={{ color: '#21222D' }}>{selectedTemplate.metaTemplateName}</p>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#6B6C7E' }}>Module Type</p>
                        <span className="text-xs px-2 py-1 rounded-full inline-block" style={{
                          backgroundColor: 'rgba(149, 140, 232, 0.1)',
                          color: '#958CE8'
                        }}>
                          {selectedTemplate.moduleType.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#6B6C7E' }}>Event Type</p>
                        <p className="text-sm" style={{ color: '#21222D' }}>{selectedTemplate.eventType}</p>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#6B6C7E' }}>Category</p>
                        <span className="text-xs px-2 py-1 rounded-full inline-block" style={{
                          backgroundColor: selectedTemplate.category === "UTILITY" ? 'rgba(59, 130, 246, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                          color: selectedTemplate.category === "UTILITY" ? '#3B82F6' : '#F97316'
                        }}>
                          {selectedTemplate.category}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#6B6C7E' }}>Language</p>
                        <p className="text-sm" style={{ color: '#21222D' }}>{selectedTemplate.languageCode}</p>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#6B6C7E' }}>Header Type</p>
                        <p className="text-sm" style={{ color: '#21222D' }}>{selectedTemplate.headerType}</p>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#6B6C7E' }}>Attach PDF</p>
                        <span className={`text-xs px-2 py-1 rounded-full inline-block ${
                          selectedTemplate.attachPdf ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {selectedTemplate.attachPdf ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className="bg-white border rounded-xl p-5" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                    <h3 className="font-semibold mb-4" style={{ color: '#21222D' }}>Content Preview</h3>
                    <div className="space-y-4">
                      {selectedTemplate.headerType === "TEXT" && selectedTemplate.headerText && (
                        <div>
                          <p className="text-xs mb-1.5 font-medium" style={{ color: '#6B6C7E' }}>Header Text</p>
                          <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#F8F9FC' }}>
                            <p className="text-sm" style={{ color: '#21222D' }}>{selectedTemplate.headerText}</p>
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-xs mb-1.5 font-medium" style={{ color: '#6B6C7E' }}>Body Text</p>
                        <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#F8F9FC' }}>
                          <p className="text-sm whitespace-pre-wrap" style={{ color: '#21222D' }}>{selectedTemplate.bodyText}</p>
                        </div>
                      </div>
                      {selectedTemplate.footerText && (
                        <div>
                          <p className="text-xs mb-1.5 font-medium" style={{ color: '#6B6C7E' }}>Footer Text</p>
                          <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#F8F9FC' }}>
                            <p className="text-sm" style={{ color: '#6B6C7E' }}>{selectedTemplate.footerText}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Variables */}
                  {selectedTemplate.variables.length > 0 && (
                    <div className="bg-white border rounded-xl p-5" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                      <h3 className="font-semibold mb-4" style={{ color: '#21222D' }}>Variables</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="border-b" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: '#6B6C7E' }}>Index</th>
                              <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: '#6B6C7E' }}>Key</th>
                              <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: '#6B6C7E' }}>Label</th>
                              <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: '#6B6C7E' }}>Example</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                            {selectedTemplate.variables.map((variable) => (
                              <tr key={variable.index}>
                                <td className="px-3 py-2">
                                  <span className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: '#958CE8', color: 'white' }}>
                                    {`{{${variable.index}}}`}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-sm font-mono" style={{ color: '#21222D' }}>{variable.key}</td>
                                <td className="px-3 py-2 text-sm" style={{ color: '#21222D' }}>{variable.label}</td>
                                <td className="px-3 py-2 text-sm" style={{ color: '#6B6C7E' }}>{variable.example}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
                  {selectedTemplate.buttons.length > 0 && (
                    <div className="bg-white border rounded-xl p-5" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                      <h3 className="font-semibold mb-4" style={{ color: '#21222D' }}>Buttons</h3>
                      <div className="space-y-2">
                        {selectedTemplate.buttons.map((button, index) => (
                          <div key={button.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#F8F9FC' }}>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: '#958CE8', color: 'white' }}>
                                {index + 1}
                              </span>
                              <div>
                                <p className="text-sm font-medium" style={{ color: '#21222D' }}>{button.text}</p>
                                <p className="text-xs" style={{ color: '#6B6C7E' }}>{button.type}</p>
                              </div>
                            </div>
                            {button.url && (
                              <p className="text-xs font-mono" style={{ color: '#6B6C7E' }}>{button.url}</p>
                            )}
                            {button.phoneNumber && (
                              <p className="text-xs font-mono" style={{ color: '#6B6C7E' }}>{button.phoneNumber}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* System Information */}
                  <div className="bg-white border rounded-xl p-5" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                    <h3 className="font-semibold mb-4" style={{ color: '#21222D' }}>System Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#6B6C7E' }}>Status</p>
                        <span className={`text-xs px-2 py-1 rounded-full inline-block ${
                          selectedTemplate.status === "ACTIVE" ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {selectedTemplate.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#6B6C7E' }}>Meta Sync Status</p>
                        <span className={`text-xs px-2 py-1 rounded-full inline-block ${
                          selectedTemplate.metaSyncStatus === "Approved" ? "bg-green-100 text-green-700" :
                          selectedTemplate.metaSyncStatus === "Pending" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {selectedTemplate.metaSyncStatus}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#6B6C7E' }}>Created At</p>
                        <p className="text-sm" style={{ color: '#21222D' }}>{selectedTemplate.createdAt}</p>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#6B6C7E' }}>Updated At</p>
                        <p className="text-sm" style={{ color: '#21222D' }}>{selectedTemplate.updatedAt}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Live WhatsApp Preview */}
                <div className="col-span-5">
                  <div className="sticky top-6">
                    <div className="bg-white border rounded-xl p-5" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                      <div className="flex items-center gap-2 mb-4">
                        <Smartphone className="size-5" style={{ color: '#25D366' }} />
                        <h3 className="font-semibold" style={{ color: '#21222D' }}>WhatsApp Preview</h3>
                      </div>

                      {/* WhatsApp Chat Container */}
                      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#E5DDD5' }}>
                        <div className="p-4 space-y-2">
                          {/* WhatsApp Message Bubble */}
                          <div className="flex justify-start">
                            <div className="max-w-sm">
                              <div className="rounded-lg shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
                                {/* Header */}
                                {selectedTemplate.headerType === "TEXT" && selectedTemplate.headerText && (
                                  <div className="px-4 pt-3 pb-2">
                                    <p className="font-semibold text-sm" style={{ color: '#21222D' }}>{selectedTemplate.headerText}</p>
                                  </div>
                                )}
                                {selectedTemplate.headerType === "IMAGE" && (
                                  <div className="aspect-video bg-gray-200 flex items-center justify-center">
                                    <Image className="size-12" style={{ color: '#6B6C7E' }} />
                                  </div>
                                )}
                                {selectedTemplate.headerType === "DOCUMENT" && (
                                  <div className="px-4 pt-3 pb-2 flex items-center gap-2 bg-gray-50 border-b" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
                                    <File className="size-5" style={{ color: '#6B6C7E' }} />
                                    <span className="text-xs" style={{ color: '#6B6C7E' }}>Document.pdf</span>
                                  </div>
                                )}
                                {selectedTemplate.headerType === "VIDEO" && (
                                  <div className="aspect-video bg-gray-900 flex items-center justify-center">
                                    <Video className="size-12 text-white" />
                                  </div>
                                )}

                                {/* Body */}
                                <div className="px-4 py-3">
                                  <p className="text-sm whitespace-pre-wrap" style={{ color: '#21222D' }}>
                                    {selectedTemplate.bodyText.replace(/\{\{(\d+)\}\}/g, (match, num) => {
                                      return selectedTemplate.sampleValues[num] || match;
                                    })}
                                  </p>
                                </div>

                                {/* PDF Attachment */}
                                {selectedTemplate.attachPdf && (
                                  <div className="px-4 pb-2">
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#F8F9FC' }}>
                                      <FileDown className="size-4" style={{ color: '#958CE8' }} />
                                      <span className="text-xs font-medium" style={{ color: '#21222D' }}>Attached_Document.pdf</span>
                                    </div>
                                  </div>
                                )}

                                {/* Footer */}
                                {selectedTemplate.footerText && (
                                  <div className="px-4 pb-2">
                                    <p className="text-xs" style={{ color: '#6B6C7E' }}>{selectedTemplate.footerText}</p>
                                  </div>
                                )}

                                {/* Buttons */}
                                {selectedTemplate.buttons.length > 0 && (
                                  <div className="border-t" style={{ borderColor: 'rgba(219, 219, 229, 0.2)' }}>
                                    {selectedTemplate.buttons.map((button, index) => (
                                      <div
                                        key={button.id}
                                        className={`px-4 py-2.5 text-center ${index < selectedTemplate.buttons.length - 1 ? 'border-b' : ''}`}
                                        style={{ borderColor: 'rgba(219, 219, 229, 0.2)' }}
                                      >
                                        <div className="flex items-center justify-center gap-2">
                                          {button.type === "URL" && <Link2 className="size-3.5" style={{ color: '#25D366' }} />}
                                          {button.type === "PHONE_NUMBER" && <Phone className="size-3.5" style={{ color: '#25D366' }} />}
                                          <span className="text-sm font-medium" style={{ color: '#25D366' }}>
                                            {button.text}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Timestamp */}
                                <div className="px-4 pb-2 text-right">
                                  <span className="text-xs" style={{ color: '#6B6C7E' }}>12:00 PM</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sample Values Info */}
                      <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(149, 140, 232, 0.1)' }}>
                        <p className="text-xs font-medium mb-2" style={{ color: '#21222D' }}>Sample Values Used:</p>
                        <div className="space-y-1">
                          {Object.entries(selectedTemplate.sampleValues).map(([key, value]) => (
                            <p key={key} className="text-xs" style={{ color: '#6B6C7E' }}>
                              {`{{${key}}}`} = {value}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-5 border-t flex-shrink-0 flex items-center justify-between" style={{
              backgroundColor: '#FAFBFC',
              borderColor: 'rgba(219, 219, 229, 0.3)'
            }}>
              <button
                onClick={() => {
                  closeViewDrawer();
                  handleEditTemplate(selectedTemplate);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm border"
                style={{
                  color: '#958CE8',
                  borderColor: '#958CE8'
                }}
              >
                <Edit className="size-4" />
                Edit Template
              </button>
              <button
                onClick={closeViewDrawer}
                className="px-5 py-2.5 font-medium text-sm transition-colors rounded-xl border"
                style={{
                  color: '#6B6C7E',
                  borderColor: 'rgba(219, 219, 229, 0.6)'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
