import { Eye, Terminal, Database, RefreshCw, FileText, AlertTriangle, Zap } from "lucide-react";
import { useState } from "react";

export default function SupportTools() {
  const [selectedTenant, setSelectedTenant] = useState("");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support Tools</h1>
        <p className="mt-1 text-sm text-gray-500">Advanced debugging and support utilities</p>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="size-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-yellow-900">Use with Caution</p>
          <p className="text-sm text-yellow-700 mt-1">
            These tools provide direct access to tenant data and systems. All actions are logged and monitored.
          </p>
        </div>
      </div>

      {/* Tenant Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Select Tenant</h2>
        <div className="max-w-md">
          <select
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose a tenant...</option>
            <option value="1">Acme Corporation (ACME)</option>
            <option value="2">TechStart Ltd (TECH)</option>
            <option value="3">Global Supplies (GLBL)</option>
            <option value="4">Metro Distribution (MTRO)</option>
            <option value="5">Swift Logistics (SWFT)</option>
          </select>
          <p className="text-xs text-gray-500 mt-2">Select a tenant to access support tools</p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Impersonate Tenant */}
        <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden">
          <div className="p-6">
            <div className="size-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Eye className="size-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Impersonate Tenant</h3>
            <p className="text-sm text-gray-600 mb-4">
              View the platform from the tenant's perspective in read-only mode
            </p>
            <button
              disabled={!selectedTenant}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Start Impersonation
            </button>
          </div>
        </div>

        {/* Database Console */}
        <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden">
          <div className="p-6">
            <div className="size-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Database className="size-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Console</h3>
            <p className="text-sm text-gray-600 mb-4">
              Execute read-only queries on tenant database in safe mode
            </p>
            <button
              disabled={!selectedTenant}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Open Console
            </button>
          </div>
        </div>

        {/* Terminal Access */}
        <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden">
          <div className="p-6">
            <div className="size-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Terminal className="size-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Debug Terminal</h3>
            <p className="text-sm text-gray-600 mb-4">
              Access debug logs and system information for troubleshooting
            </p>
            <button
              disabled={!selectedTenant}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Open Terminal
            </button>
          </div>
        </div>

        {/* Re-provision Tenant */}
        <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden">
          <div className="p-6">
            <div className="size-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <RefreshCw className="size-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Re-provision</h3>
            <p className="text-sm text-gray-600 mb-4">
              Retry provisioning for tenants with failed setup
            </p>
            <button
              disabled={!selectedTenant}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Retry Provisioning
            </button>
          </div>
        </div>

        {/* Export Data */}
        <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden">
          <div className="p-6">
            <div className="size-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="size-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Data</h3>
            <p className="text-sm text-gray-600 mb-4">
              Generate data exports for backup or migration purposes
            </p>
            <button
              disabled={!selectedTenant}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Generate Export
            </button>
          </div>
        </div>

        {/* Clear Cache */}
        <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden">
          <div className="p-6">
            <div className="size-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="size-6 text-pink-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Clear Cache</h3>
            <p className="text-sm text-gray-600 mb-4">
              Clear tenant cache to resolve data sync issues
            </p>
            <button
              disabled={!selectedTenant}
              className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Clear Cache
            </button>
          </div>
        </div>
      </div>

      {/* Recent Actions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Recent Support Actions</h2>
          <p className="text-sm text-gray-500 mt-1">Audit trail of support tool usage</p>
        </div>

        <div className="divide-y divide-gray-200">
          {[
            { action: "Database Console", tenant: "Acme Corp", user: "admin@snd.com", time: "2 hours ago", status: "success" },
            { action: "Impersonate Tenant", tenant: "TechStart", user: "jane@snd.com", time: "5 hours ago", status: "success" },
            { action: "Re-provision", tenant: "Metro Dist", user: "admin@snd.com", time: "1 day ago", status: "failed" },
            { action: "Export Data", tenant: "Global Supplies", user: "admin@snd.com", time: "2 days ago", status: "success" },
          ].map((item, index) => (
            <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{item.action}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Tenant: {item.tenant} • User: {item.user}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === "success"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
