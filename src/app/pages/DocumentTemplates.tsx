import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Edit2,
  Eye,
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

const PREVIEW_ITEMS = [
  {
    product_name: "Aurelia Arc Desk Lamp",
    productName: "Aurelia Arc Desk Lamp",
    name: "Aurelia Arc Desk Lamp",
    product_id: "SKU-2026-041",
    flavour: "Warm white",
    skuCode: "SKU-2026-041",
    measurement_unit: "Each",
    uom: "Each",
    quantity: 2,
    qty: 2,
    unit_price: "14,500",
    purchaseUnitPrice: "14,500",
    saleUnitPrice: "14,500",
    discountPercentage: "0",
    taxPercentage: "0",
    rate: "14,500",
    discounted_unit_price: "14,500",
    discount_amount: "0",
    discountType: "Flat",
    discountValue: "0",
    taxAmount: "0",
    subtotalAmount: "29,000",
    total: "29,000",
    amount: "29,000",
    totalAmount: "29,000",
    specification: "Brushed brass · warm white",
    batchNumber: "B-2410",
    barcode: "8964002400412",
  },
  {
    product_name: "Tide Glass Pendant",
    productName: "Tide Glass Pendant",
    name: "Tide Glass Pendant",
    product_id: "SKU-2026-052",
    flavour: "Matte black",
    skuCode: "SKU-2026-052",
    measurement_unit: "Each",
    uom: "Each",
    quantity: 1,
    qty: 1,
    unit_price: "19,500",
    purchaseUnitPrice: "19,500",
    saleUnitPrice: "19,500",
    discountPercentage: "0",
    taxPercentage: "0",
    rate: "19,500",
    discounted_unit_price: "19,500",
    discount_amount: "0",
    discountType: "Flat",
    discountValue: "0",
    taxAmount: "0",
    subtotalAmount: "19,500",
    total: "19,500",
    amount: "19,500",
    totalAmount: "19,500",
    specification: "Opal glass · matte black",
    batchNumber: "B-2411",
    barcode: "8964002400528",
  },
];

const PREVIEW_LEDGER_ENTRIES = [
  {
    date: "03 Oct 2026",
    reference: "SI-2026-014",
    journalNumber: "JV-2026-014",
    type: "Sale Invoice",
    voucher_no: "JV-2026-014",
    narration: "Invoice · Studio lighting",
    description: "Invoice · Studio lighting",
    memo: "Studio lighting",
    debit: "29,000",
    credit: "—",
    runningBalance: "54,000",
    balance: "54,000",
  },
  {
    date: "12 Oct 2026",
    reference: "RV-2026-009",
    journalNumber: "JV-2026-021",
    type: "Bank Receipt",
    voucher_no: "JV-2026-021",
    narration: "Bank receipt",
    description: "Bank receipt",
    memo: "Bank receipt",
    debit: "—",
    credit: "18,000",
    runningBalance: "36,000",
    balance: "36,000",
  },
];

const PREVIEW_ACCOUNTS = [
  { label: "1-1201 Local Customers", accountType: "ASSET", accountTypeClass: "asset", accountTypeLabel: "Asset", parentName: "Current Assets", currency: "PKR", balance: "25,000", accountKind: "DETAIL", accountKindLabel: "Detail", isPostable: true },
  { label: "1-1202 Overseas Customers", accountType: "ASSET", accountTypeClass: "asset", accountTypeLabel: "Asset", parentName: "Current Assets", currency: "PKR", balance: "12,000", accountKind: "DETAIL", accountKindLabel: "Detail", isPostable: true },
  { label: "2-2101 Trade Payables", accountType: "LIABILITY", accountTypeClass: "liability", accountTypeLabel: "Liability", parentName: "Current Liabilities", currency: "PKR", balance: "38,500", accountKind: "DETAIL", accountKindLabel: "Detail", isPostable: true },
];

const PREVIEW_PARTY_ROWS = [
  { serial: 1, code: "NST-014", name: "North Star Traders", openingBalance: "25,000", periodDebit: "48,500", periodCredit: "12,000", closingBalance: "61,500" },
];

const PREVIEW_REPORT_ROWS = [
  { label: "Revenue", value: "1.28M", detail: "Above plan" },
  { label: "Cost", value: "846K", detail: "Within target" },
  { label: "Movement", value: "+18.4%", detail: "Compared with prior period" },
  { label: "Receivables", value: "61,000", detail: "Within planned range" },
  { label: "Warehouse", value: "Improved", detail: "Throughput increased" },
];

const PREVIEW_BUSINESS_LOGO = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="28" fill="#0f766e"/><path d="M64 20 108 104H91L64 53 37 104H20z" fill="#fff"/><circle cx="64" cy="91" r="8" fill="#f59e0b"/></svg>',
)}`;
const TEMPLATE_LOGO_MARKER = "\u0000DOCUMENT_TEMPLATE_COMPANY_LOGO\u0000";

const TEMPLATE_PREVIEW_DATA: Record<string, unknown> = {
  companyInfo: {
    name: "Test",
    address: "",
    mobile: "",
    logo: PREVIEW_BUSINESS_LOGO,
    initials: "EP",
    preparedBy: "Admin",
  },
  invoiceNo: "INV-2026-018",
  invoice: {
    invoice_no: "INV-2026-018",
    invoice_date: "30 Oct 2026",
    vendor_name: "North Star Traders",
    vendor_code: "NST-014",
    vendor_address: "Lahore, Pakistan",
    vendor_city: "Lahore",
    order_no: "SO-2026-018",
    total_discount: "1,250",
    total_tax: "2,500",
    delivery_cost: "750",
    total: "48,500",
    current_balance: "61,000",
    previous_balance: "12,500",
    this_bill: "48,500",
    items: PREVIEW_ITEMS,
  },
  orderNumber: "SO-2026-018",
  order: {
    vendor_name: "North Star Traders",
    vendor_code: "NST-014",
    vendor_address: "Lahore, Pakistan",
    vendor_city: "Lahore",
    invoice_date: "30 Oct 2026",
    total: "48,500",
    total_tax: "2,500",
    total_discount: "1,250",
    delivery_cost: "750",
    order_no: "SO-2026-018",
    this_bill: "48,500",
    previous_balance: "12,500",
    current_balance: "61,000",
    items: PREVIEW_ITEMS,
  },
  saleOrder: { items: PREVIEW_ITEMS },
  purchaseOrder: {
    orderNumber: "PO-2026-018",
    orderDate: "30 Oct 2026",
    status: "APPROVED",
    vendor: { name: "North Star Traders", code: "NST-014", address: "Lahore, Pakistan" },
    warehouse: { name: "Central Warehouse" },
    buyer: { name: "A. Khan" },
    expectedDate: "05 Nov 2026",
    deliveryCost: "750",
    taxPercentage: "5%",
    discountPercentage: "2%",
    remarks: "Monthly lighting restock",
    termsOfPayment: "Net 30 days",
    orderTotal: "48,500",
    taxAmount: "2,500",
    discountAmount: "1,250",
    totalAmount: "49,250",
    overallQuantity: "3",
    items: PREVIEW_ITEMS,
  },
  purchaseInvoice: { items: PREVIEW_ITEMS },
  purchaseOrderNumber: "PO-2026-018",
  orderDate: "30 Oct 2026",
  supplier: { name: "North Star Traders", address: "Lahore, Pakistan" },
  deliveryLocation: { name: "Central Warehouse", address: "Industrial Area" },
  expectedDate: "05 Nov 2026",
  buyer: { name: "A. Khan" },
  total: "48,500",
  slip: {
    partyLabel: "Vendor",
    documentTypeLabel: "Purchase Invoice",
    documentNumber: "PI-00007",
    documentDate: "09/29/2026",
    warehouseLabel: "-",
    partyName: "Asad Electric",
    partyCode: "VEN-00002",
    notes: "",
    totalQuantity: 200,
    items: [
      {
        productName: "033001 Simtek charger 12 vdc 20 AMP Digital",
        flavour: "—",
        skuCode: "033001",
        uom: "pcs",
        quantity: 200,
      },
    ],
  },
  warehouseSlip: { items: PREVIEW_ITEMS },
  grnNumber: "GRN-2026-018",
  receivedDate: "30 Oct 2026",
  warehouse: { name: "Central Warehouse" },
  receivedBy: { name: "A. Khan" },
  notes: "Packaging intact; quantities verified.",
  inspectionStatus: "Accepted",
  variance: "0 units",
  grn: {
    grnNumber: "GRN-2026-018",
    grnDate: "30 Oct 2026",
    status: "APPROVED",
    vendorName: "North Star Traders",
    purchaseOrderNumber: "PO-2026-018",
    warehouseName: "Central Warehouse",
    deliveryCost: "750",
    totalDiscountAmount: "1,250",
    totalTaxAmount: "2,500",
    totalAmount: "48,500",
    items: PREVIEW_ITEMS.map((item) => ({
      ...item,
      itemName: item.product_name,
      expected: item.quantity,
      received: item.quantity,
      accepted: item.quantity,
      rejected: 0,
    })),
  },
  payPeriod: "October 2026",
  payslipNumber: "PS-2026-018",
  paymentDate: "31 Oct 2026",
  employee: {
    name: "Sara Ahmed",
    code: "EMP-024",
    department: "Operations",
    designation: "Accountant",
  },
  netPay: "185,000",
  currency: "PKR",
  earnings: { basic: "160,000", allowances: "35,000", overtime: "8,000" },
  grossPay: "203,000",
  deductions: { tax: "12,000", benefits: "4,000", other: "2,000" },
  totalDeductions: "18,000",
  paySlip: {
    paySlipNumber: "PS-2026-018",
    payPeriod: "October 2026",
    paymentDate: "31 Oct 2026",
    createdAt: "30 Oct 2026, 11:45 AM",
    status: "APPROVED",
    currency: "PKR",
    basicSalary: "160,000",
    grossSalary: "203,000",
    totalDeductions: "18,000",
    netSalary: "185,000",
    employee: { fullName: "Sara Ahmed", employeeCode: "EMP-024" },
    lines: [
      { salaryComponent: { name: "Basic Salary", code: "BASIC" }, componentType: "EARNING", typeLabel: "Earning", typeClass: "earning", calculationType: "Fixed", value: "160,000", calculatedAmount: "160,000" },
      { salaryComponent: { name: "Allowances", code: "ALLOW" }, componentType: "EARNING", typeLabel: "Earning", typeClass: "earning", calculationType: "Fixed", value: "35,000", calculatedAmount: "35,000" },
      { salaryComponent: { name: "Overtime", code: "OT" }, componentType: "EARNING", typeLabel: "Earning", typeClass: "earning", calculationType: "Hourly", value: "8,000", calculatedAmount: "8,000" },
      { salaryComponent: { name: "Income Tax", code: "TAX" }, componentType: "DEDUCTION", typeLabel: "Deduction", typeClass: "deduction", calculationType: "Fixed", value: "12,000", calculatedAmount: "12,000" },
      { salaryComponent: { name: "Benefits", code: "BEN" }, componentType: "DEDUCTION", typeLabel: "Deduction", typeClass: "deduction", calculationType: "Fixed", value: "6,000", calculatedAmount: "6,000" },
    ],
  },
  closingBalance: "61,000",
  party: { name: "North Star Traders", code: "NST-014" },
  entries: PREVIEW_LEDGER_ENTRIES,
  transactions: PREVIEW_LEDGER_ENTRIES,
  ledgerEntries: PREVIEW_LEDGER_ENTRIES,
  partyRows: PREVIEW_PARTY_ROWS,
  partyReport: {
    data: PREVIEW_PARTY_ROWS,
    totals: { openingBalance: "25,000", periodDebit: "48,500", periodCredit: "12,000", closingBalance: "61,500" },
    meta: { total: "1" },
  },
  dateFrom: "01 Oct 2026",
  dateTo: "30 Oct 2026",
  openingBalance: "25,000",
  date: "30 Oct 2026",
  reference: "JV-2026-018",
  description: "Monthly supply settlement",
  debit: "12,000",
  credit: "48,500",
  runningBalance: "61,000",
  totalDebit: "82,000",
  totalCredit: "118,000",
  period: "October 2026",
  ledgerCode: "GL-4100",
  account: { name: "Main Bank Account", code: "1-1-2", category: "Asset", parentName: "Current Assets", status: "Active" },
  journalNumber: "JV-2026-018",
  memo: "Monthly supply settlement",
  balance: "61,000",
  netMovement: "36,000",
  accountCount: "128",
  rootAccountCount: "2",
  visibleRowCount: "3",
  assetCount: "42",
  liabilityCount: "31",
  equityCount: "18",
  asOfDate: "30 Oct 2026",
  child: { code: "1-1201", name: "Local Customers", category: "Receivable", status: "Active" },
  accounts: PREVIEW_ACCOUNTS,
  accountRows: PREVIEW_ACCOUNTS,
  items: PREVIEW_ITEMS,
  rows: PREVIEW_LEDGER_ENTRIES,
  pageNumber: "01",
  voucherDocumentLabel: "Purchase Voucher",
  voucherPartyLabel: "Vendor",
  voucherStatus: "Approved",
  voucherType: "Payment",
  voucherNumber: "PV-2026-018",
  voucherDate: "30 Oct 2026",
  chequeNumber: "CHQ-008421",
  amount: "48,500",
  paymentMethod: "Bank Transfer",
  reportTitle: "Monthly performance",
  generatedAt: "30 Oct 2026",
  metrics: { revenue: "1.28M", cost: "846K", movement: "+18.4%" },
  reportRows: PREVIEW_REPORT_ROWS,
  periodStart: "01 Oct",
  periodEnd: "30 Oct",
  summary: "Revenue grew steadily across the month, supported by stronger repeat orders.",
  observationOne: "Receivables remain within the planned range.",
  observationTwo: "Warehouse throughput improved week over week.",
};

const fillTemplatePreviewContent = (content: string) => {
  const readPath = (path: string, scope: Record<string, unknown>) =>
    path.split(".").reduce<unknown>((current, key) => {
      if (!current || typeof current !== "object") return undefined;
      return (current as Record<string, unknown>)[key];
    }, scope);
  const escapeHtml = (value: unknown) =>
    String(value).replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return entities[character];
    });
  const interpolate = (
    markup: string,
    scope: Record<string, unknown>,
    itemIndex: number | null = null,
  ) => markup.replace(
    /\{\{\s*(@index|[a-zA-Z0-9_.]+)\s*\}\}/g,
    (_match, path: string) => {
      if (path === "@index") return itemIndex == null ? "" : String(itemIndex);
      const value = readPath(path, scope);
      return value == null ? "Sample" : escapeHtml(value);
    },
  );

  const companyInfo = TEMPLATE_PREVIEW_DATA.companyInfo as Record<string, unknown>;
  const logoSource = String(companyInfo.logo || "").trim();
  const logoMarkup = /^(?:https?:\/\/|data:image\/[a-z0-9.+-]+(?:;[^,]*)?,|\/(?!\/))/i.test(logoSource)
    ? `<img src="${escapeHtml(logoSource)}" alt="${escapeHtml(companyInfo.name || "Business logo")}" style="display:block;width:auto;height:auto;max-width:128px;max-height:72px;object-fit:contain;margin:0 auto;" />`
    : "";
  const hasExplicitLogoBinding = /\{\{\s*(?:companyInfo\.)?(?:logo|businessLogo|business_logo|logoUrl)\s*\}\}/i.test(content);
  const initials = String(companyInfo.initials || "").trim()
    || String(companyInfo.name || "").trim()
      .split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
  const brandMarkup = logoMarkup && !hasExplicitLogoBinding
    ? logoMarkup
    : escapeHtml(initials);
  const templateContent = content.replace(/\{\{\s*companyInfo\.initials\s*\}\}/gi, TEMPLATE_LOGO_MARKER);
  const contentWithConditionals = templateContent.replace(
    /\{\{#if\s+([a-zA-Z0-9_.]+)\s*\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_match, path: string, markup: string) => readPath(path, TEMPLATE_PREVIEW_DATA)
      ? markup
      : "",
  );
  const eachBlocks: Array<{ path: string; rowMarkup: string }> = [];
  const withEachMarkers = contentWithConditionals.replace(
    /\{\{#each\s+([a-zA-Z0-9_.]+)\s*\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_match, path: string, rowMarkup: string) => {
      const index = eachBlocks.push({ path, rowMarkup }) - 1;
      return `\u0000DOCUMENT_TEMPLATE_EACH_${index}\u0000`;
    },
  );

  const interpolatedMarkup = interpolate(withEachMarkers, TEMPLATE_PREVIEW_DATA);
  const expandedMarkup = interpolatedMarkup.replace(
    /\u0000DOCUMENT_TEMPLATE_EACH_(\d+)\u0000/g,
    (_marker, blockIndex: string) => {
      const block = eachBlocks[Number(blockIndex)];
      const rows = block ? readPath(block.path, TEMPLATE_PREVIEW_DATA) : null;
      if (!block || !Array.isArray(rows)) return "";
      return rows.map((row: unknown, index: number) => {
        const rowData = row && typeof row === "object"
          ? row as Record<string, unknown>
          : { value: row };
        return interpolate(
          block.rowMarkup,
          { ...TEMPLATE_PREVIEW_DATA, ...rowData, item: row, this: row, lineNumber: index + 1 },
          index,
        );
      }).join("");
    },
  );
  return expandedMarkup.replaceAll(TEMPLATE_LOGO_MARKER, brandMarkup);
};

const getTemplatePreviewDocument = (
  content: string,
  matchClassicFallback = false,
  stripCurrencyCode = true,
) => {
  const interpolated = fillTemplatePreviewContent(content);
  const filled = matchClassicFallback && stripCurrencyCode
    ? interpolated.replace(/\bPKR\s+(?=\d)/g, "")
    : interpolated;
  if (/<html[\s>]/i.test(filled)) return filled;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;padding:16px;background:#fff;font-family:Arial,sans-serif}</style></head><body>${filled}</body></html>`;
};

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
  const [previewItem, setPreviewItem] = useState<DocumentTemplateItem | null>(null);
  const [previewPack, setPreviewPack] = useState<DocumentTemplatePack | null>(null);
  const [previewPackLoadingId, setPreviewPackLoadingId] = useState<string | null>(null);
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

  const openPackPreview = async (pack: DocumentTemplatePack) => {
    setPreviewPackLoadingId(pack.id);
    setError("");

    try {
      const response = await apiJson<DocumentTemplatePack | { data: DocumentTemplatePack }>(
        `platform/document-templates/${pack.id}`,
      );
      const detailedPack =
        response && typeof response === "object" && "data" in response && response.data
          ? response.data
          : (response as DocumentTemplatePack);
      setPreviewPack(detailedPack);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load template preview.");
    } finally {
      setPreviewPackLoadingId(null);
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
                                onClick={() => setPreviewItem(item)}
                                className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-white"
                                title="View preview"
                                aria-label={`Preview ${documentTypeLabel(item.documentType)}`}
                              >
                                <Eye className="size-4" />
                              </button>
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

        {previewItem ? (
          <ItemPreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
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
                    disabled={previewPackLoadingId !== null}
                    onClick={() => void openPackPreview(pack)}
                    aria-label={`Preview ${pack.name}`}
                    title="Preview templates"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                  >
                    {previewPackLoadingId === pack.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                    {previewPackLoadingId === pack.id ? "Loading..." : "Preview"}
                  </button>
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
      {previewPack ? (
        <PackPreviewModal pack={previewPack} onClose={() => setPreviewPack(null)} />
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

function ItemPreviewModal({
  item,
  onClose,
}: {
  item: DocumentTemplateItem;
  onClose: () => void;
}) {
  const isFile = item.sourceType === "FILE";
  const hasPreview = isFile ? Boolean(item.fileUrl) : Boolean(item.content);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-preview-title"
        className="flex max-h-[92vh] w-full max-w-[1280px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <div>
            <h2 id="template-preview-title" className="font-semibold text-gray-900">
              {item.name || documentTypeLabel(item.documentType)}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {documentTypeLabel(item.documentType)} · Preview with sample data
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close preview"
          >
            <X className="size-5" />
          </button>
        </header>
        <TemplatePreviewFrame item={item} />
      </section>
    </div>
  );
}

function PackPreviewModal({
  pack,
  onClose,
}: {
  pack: DocumentTemplatePack;
  onClose: () => void;
}) {
  const items = pack.items ?? [];
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id ?? "");
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? items[0] ?? null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="pack-preview-title"
        className="flex max-h-[92vh] w-full max-w-[1280px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id="pack-preview-title" className="font-semibold text-gray-900">
              {pack.name} Preview
            </h2>
            <p className="mt-1 text-xs text-gray-500">Choose a sub-template to preview</p>
          </div>
          {items.length > 0 ? (
            <select
              value={selectedItem?.id ?? ""}
              onChange={(event) => setSelectedItemId(event.target.value)}
              aria-label="Choose sub-template"
              className="max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name || documentTypeLabel(item.documentType)}
                </option>
              ))}
            </select>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close preview"
          >
            <X className="size-5" />
          </button>
        </header>
        {selectedItem ? (
          <TemplatePreviewFrame item={selectedItem} />
        ) : (
          <div className="grid min-h-[60vh] place-items-center px-6 text-sm text-gray-500">
            No sub-templates are available in this pack.
          </div>
        )}
      </section>
    </div>
  );
}

function TemplatePreviewFrame({ item }: { item: DocumentTemplateItem }) {
  const isFile = item.sourceType === "FILE";
  const hasPreview = isFile ? Boolean(item.fileUrl) : Boolean(item.content);
  const matchClassicFallback = /^Classic\b/i.test(item.name ?? "");
  const stripCurrencyCode = item.documentType !== "ACCOUNTS_LIST";
  const isLandscape = !isFile && /@page\s*\{[^}]*size\s*:\s*A4\s+landscape/i.test(item.content ?? "");

  if (!hasPreview) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-6 text-sm text-gray-500">
        No preview content is available.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 justify-center overflow-auto bg-gray-100 p-4 sm:p-6">
      <iframe
        title={`${documentTypeLabel(item.documentType)} template preview`}
        src={isFile ? item.fileUrl ?? undefined : undefined}
        srcDoc={!isFile
          ? getTemplatePreviewDocument(item.content ?? "", matchClassicFallback, stripCurrencyCode)
          : undefined}
        sandbox=""
        referrerPolicy="no-referrer"
        className={`${isLandscape ? "h-[794px] w-[1123px]" : "h-[1123px] w-[794px]"} flex-none rounded-lg border border-gray-200 bg-white shadow-xl`}
      />
    </div>
  );
}
