import { useState } from "react";
import { Building2, Plus, Search, Mail, Phone, MapPin, Edit2, Link as LinkIcon } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { Link } from "react-router";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  linkedTenants: number;
  totalRevenue: string;
  status: "ACTIVE" | "SUSPENDED" | "TRIAL";
  createdAt: string;
};

const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "Acme Corporation",
    email: "billing@acme.com",
    phone: "+1 234 567 8900",
    address: "123 Business St, New York, NY 10001",
    taxId: "US-123456789",
    linkedTenants: 3,
    totalRevenue: "$14,567",
    status: "ACTIVE",
    createdAt: "2025-01-15",
  },
  {
    id: "2",
    name: "TechStart Limited",
    email: "finance@techstart.com",
    phone: "+1 345 678 9012",
    address: "456 Tech Ave, San Francisco, CA 94102",
    taxId: "US-987654321",
    linkedTenants: 1,
    totalRevenue: "$2,450",
    status: "TRIAL",
    createdAt: "2026-03-20",
  },
  {
    id: "3",
    name: "Global Supplies Inc",
    email: "accounts@globalsupplies.com",
    phone: "+1 456 789 0123",
    address: "789 Commerce Dr, Chicago, IL 60601",
    taxId: "US-456789123",
    linkedTenants: 5,
    totalRevenue: "$45,890",
    status: "ACTIVE",
    createdAt: "2024-11-05",
  },
  {
    id: "4",
    name: "Metro Distribution",
    email: "billing@metro.com",
    phone: "+1 567 890 1234",
    address: "321 Logistics Way, Atlanta, GA 30301",
    taxId: "US-789123456",
    linkedTenants: 2,
    totalRevenue: "$8,920",
    status: "SUSPENDED",
    createdAt: "2025-06-10",
  },
];

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredCustomers = mockCustomers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">Manage billing entities and customer accounts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          <Plus className="size-4" />
          Add Customer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Customers</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">847</p>
          <p className="mt-1 text-xs text-gray-500">Billing entities</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">823</p>
          <p className="mt-1 text-xs text-green-600">97% active rate</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Trial</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">18</p>
          <p className="mt-1 text-xs text-yellow-600">6 expiring soon</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Suspended</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">6</p>
          <p className="mt-1 text-xs text-red-600">Payment issues</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Customers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="size-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="size-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">ID: {customer.id}</p>
                </div>
              </div>
              <StatusBadge status={customer.status} size="sm" />
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="size-4 text-gray-400" />
                {customer.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="size-4 text-gray-400" />
                {customer.phone}
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="size-4 text-gray-400 mt-0.5 flex-shrink-0" />
                {customer.address}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Tenants</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{customer.linkedTenants}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Revenue</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{customer.totalRevenue}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tax ID</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{customer.taxId}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 mt-4 flex items-center gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                <Edit2 className="size-4" />
                Edit
              </button>
              <Link
                to={`/customers/${customer.id}`}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <LinkIcon className="size-4" />
                Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create New Customer</h2>
              <p className="text-sm text-gray-500 mt-1">Add a new billing entity to the platform</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Company Details */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Company Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., Acme Corporation"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                    <input
                      type="text"
                      placeholder="e.g., US-123456789"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Billing Email *</label>
                    <input
                      type="email"
                      placeholder="billing@company.com"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+1 234 567 8900"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address</label>
                    <textarea
                      placeholder="Enter full billing address"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Payment Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>Credit Card</option>
                      <option>Bank Transfer</option>
                      <option>Wire Transfer</option>
                      <option>Invoice</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>Monthly</option>
                      <option>Quarterly</option>
                      <option>Yearly</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium text-sm"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                Create Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
