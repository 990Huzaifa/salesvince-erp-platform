import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Download, Mail, Printer, Check, Clock, AlertCircle, Edit2, DollarSign, Loader2 } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { apiJson } from "../utils/api";

type InvoiceItem = {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
};

type InvoiceDetailResponse = {
  message: string;
  invoice: {
    id: number;
    tenant: {
      id: string;
      code: string;
      name: string;
      email: string;
      industryType?: string;
      isActive?: boolean;
      status?: string;
      createdAt?: string;
      updatedAt?: string;
      profile: {
        displayName?: string | null;
        logoUrl?: string | null;
        phone?: string | null;
        address?: string | null;
        supportEmail?: string | null;
        createdAt?: string;
        updatedAt?: string;
      } | null;
    };
    status: string;
    issueDate: string;
    dueDate: string;
    subTotalAmount: number;
    taxAmount: number;
    totalAmount: number;
    createdAt: string;
    updatedAt: string;
    invoiceItems: InvoiceItem[];
  };
};

const staticPayments: { id: string; amount: number; method: string; referenceNo: string; receivedAt: string }[] = [];
const staticNotes = "Awaiting payment from customer.";

const formatDate = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

export default function InvoiceDetail() {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState<InvoiceDetailResponse["invoice"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!invoiceId) {
        setError("Missing invoice id.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await apiJson<InvoiceDetailResponse>(`platform/invoice/${invoiceId}`);
        setInvoice(response.invoice);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load invoice.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [invoiceId]);

  const totalPaid = staticPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = invoice ? invoice.totalAmount - totalPaid : 0;
  const isManualCollection = true;
  const products = invoice?.invoiceItems ?? [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <Check className="size-5 text-green-600" />;
      case "PENDING":
      case "ISSUE":
      case "DRAFT":
      case "ISSUED":
        return <Clock className="size-5 text-blue-600" />;
      case "OVERDUE":
      case "FAILED":
        return <AlertCircle className="size-5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-full bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <Link
            to="/master/billing"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            <ArrowLeft className="size-4" />
            Back to Billing
          </Link>
          <div className="flex items-center gap-2">
            {isManualCollection && invoice && invoice.status !== "PAID" && (
              <>
                <button
                  onClick={() => setShowRecordPaymentModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <DollarSign className="size-4" />
                  Record Payment
                </button>
                <button
                  onClick={() => setShowUpdateStatusModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <Edit2 className="size-4" />
                  Update Status
                </button>
              </>
            )}
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              <Mail className="size-4" />
              Send Email
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              <Printer className="size-4" />
              Print
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              <Download className="size-4" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="size-4 animate-spin" />
            Loading...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : invoice ? (
          <>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
                      <StatusBadge status={invoice.status as never} size="md" />
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">MANUAL</span>
                    </div>
                    <p className="text-sm text-gray-600">Invoice #{invoice.id}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-2">
                      {getStatusIcon(invoice.status)}
                      <span className="text-lg font-semibold text-gray-900">${invoice.totalAmount.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-600">Due Date: {formatDate(invoice.dueDate)}</p>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 border-b border-gray-200">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">From</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="font-medium text-gray-900">SND Platform</p>
                      <p>platform@snd.com</p>
                      <p>456 Platform Ave</p>
                      <p>San Francisco, CA 94102</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Bill To</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="font-medium text-gray-900">{invoice.tenant.profile?.displayName || invoice.tenant.name}</p>
                      <p>{invoice.tenant.email}</p>
                      <p>{invoice.tenant.profile?.address || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-200">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Issue Date</p>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(invoice.issueDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Due Date</p>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(invoice.dueDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Paid Date</p>
                    <p className="text-sm font-semibold text-green-600">N/A</p>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Invoice Items</h3>

                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Qty</th>
                      <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Unit Price</th>
                      <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b border-gray-100">
                        <td className="py-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">Static invoice item</p>
                          </div>
                        </td>
                        <td className="py-4 text-right text-sm text-gray-900">{product.quantity}</td>
                        <td className="py-4 text-right text-sm text-gray-900">${product.unitPrice.toFixed(2)}</td>
                        <td className="py-4 text-right text-sm font-semibold text-gray-900">${product.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-end">
                    <div className="w-80 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium text-gray-900">${invoice.subTotalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tax</span>
                        <span className="font-medium text-gray-900">${invoice.taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <span className="text-base font-semibold text-gray-900">Total</span>
                        <span className="text-xl font-bold text-gray-900">${invoice.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
                <p className="text-sm text-gray-600">{staticNotes}</p>
              </div>
            </div>

            <div className="max-w-5xl mx-auto mt-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Payment History</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Total Paid: ${totalPaid.toFixed(2)} | Remaining: ${remainingAmount.toFixed(2)}
                  </p>
                </div>
                <div className="p-6">
                  {staticPayments.length === 0 ? (
                    <p className="text-sm text-gray-500">No payments recorded.</p>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {staticPayments.map((payment) => (
                        <div key={payment.id} className="px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="size-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Check className="size-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">${payment.amount.toFixed(2)}</p>
                              <p className="text-xs text-gray-500">
                                {payment.method} • Ref: {payment.referenceNo}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">{payment.receivedAt}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="max-w-5xl mx-auto mt-6">
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="size-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="size-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900">Need to make changes?</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Contact the customer or create a credit note to adjust this invoice.
                    </p>
                  </div>
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    Create Credit Note
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {showUpdateStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Update Invoice Status</h2>
              <p className="text-sm text-gray-500 mt-1">Change the current status of this invoice</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                <div className="mb-3">
                  <StatusBadge status={(invoice?.status || "ISSUE") as never} size="md" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Status *</label>
                <div className="space-y-2">
                  {["DRAFT", "ISSUED", "PAID", "OVERDUE", "FAILED"].map((status) => (
                    <label key={status} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="status" value={status} className="size-4 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{status}</p>
                        <p className="text-xs text-gray-500">Static status option</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  placeholder="Add any notes about this status change..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowUpdateStatusModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium text-sm"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {showRecordPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Record Payment</h2>
              <p className="text-sm text-gray-500 mt-1">Add a payment record for this invoice</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Invoice Amount</span>
                  <span className="text-sm font-semibold text-gray-900">${invoice?.totalAmount.toFixed(2)}</span>
                </div>
                {totalPaid > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Already Paid</span>
                      <span className="text-sm font-semibold text-green-600">${totalPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-300">
                      <span className="text-sm font-medium text-gray-900">Remaining</span>
                      <span className="text-sm font-bold text-gray-900">${remainingAmount.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    max={remainingAmount}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Maximum: ${remainingAmount.toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select method</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="CHECK">Check</option>
                  <option value="STRIPE">Stripe</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                <input
                  type="text"
                  placeholder="e.g., TXN-123456, Check #789"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Received Date *</label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  placeholder="Add any notes about this payment..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  id="autoMarkPaid"
                  defaultChecked
                  className="size-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="autoMarkPaid" className="text-sm text-blue-900 cursor-pointer">
                  Automatically mark invoice as PAID if fully paid
                </label>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRecordPaymentModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium text-sm"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
