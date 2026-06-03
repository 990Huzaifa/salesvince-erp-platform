import { useState } from "react";
import { Flag, Plus, Search, Users, TrendingUp, Info } from "lucide-react";

type FeatureFlag = {
  id: string;
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetTenants: number;
  totalTenants: number;
  createdAt: string;
  environment: "PRODUCTION" | "STAGING" | "ALL";
};

const mockFlags: FeatureFlag[] = [
  {
    id: "1",
    name: "Advanced Analytics Dashboard",
    key: "feature_advanced_analytics",
    description: "Enable the new advanced analytics dashboard with real-time insights",
    enabled: true,
    rolloutPercentage: 100,
    targetTenants: 157,
    totalTenants: 847,
    createdAt: "2026-03-15",
    environment: "PRODUCTION",
  },
  {
    id: "2",
    name: "AI-Powered Recommendations",
    key: "feature_ai_recommendations",
    description: "Enable AI-powered product recommendations based on purchase history",
    enabled: true,
    rolloutPercentage: 25,
    targetTenants: 212,
    totalTenants: 847,
    createdAt: "2026-04-01",
    environment: "PRODUCTION",
  },
  {
    id: "3",
    name: "Mobile App Sync",
    key: "feature_mobile_sync",
    description: "Enable real-time synchronization with mobile applications",
    enabled: false,
    rolloutPercentage: 0,
    targetTenants: 0,
    totalTenants: 847,
    createdAt: "2026-04-05",
    environment: "STAGING",
  },
  {
    id: "4",
    name: "Enhanced Security Mode",
    key: "feature_enhanced_security",
    description: "Additional security features including 2FA and IP whitelisting",
    enabled: true,
    rolloutPercentage: 100,
    targetTenants: 847,
    totalTenants: 847,
    createdAt: "2026-02-10",
    environment: "ALL",
  },
  {
    id: "5",
    name: "Webhook Integration",
    key: "feature_webhooks",
    description: "Allow tenants to configure custom webhooks for real-time event notifications",
    enabled: true,
    rolloutPercentage: 50,
    targetTenants: 424,
    totalTenants: 847,
    createdAt: "2026-03-20",
    environment: "PRODUCTION",
  },
  {
    id: "6",
    name: "Dark Mode UI",
    key: "feature_dark_mode",
    description: "Enable dark mode theme for the user interface",
    enabled: true,
    rolloutPercentage: 75,
    targetTenants: 635,
    totalTenants: 847,
    createdAt: "2026-03-01",
    environment: "ALL",
  },
];

export default function FeatureFlags() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredFlags = mockFlags.filter((flag) =>
    flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flag.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flag.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
          <p className="mt-1 text-sm text-gray-500">Control feature rollouts and gradual deployments</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          <Plus className="size-4" />
          Create Flag
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Flags</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{mockFlags.length}</p>
          <p className="mt-1 text-xs text-gray-500">Active features</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Enabled</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {mockFlags.filter(f => f.enabled).length}
          </p>
          <p className="mt-1 text-xs text-green-600">Currently active</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">In Rollout</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {mockFlags.filter(f => f.enabled && f.rolloutPercentage < 100).length}
          </p>
          <p className="mt-1 text-xs text-blue-600">Gradual deployment</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Staging Only</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {mockFlags.filter(f => f.environment === "STAGING").length}
          </p>
          <p className="mt-1 text-xs text-gray-500">Testing phase</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search feature flags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Feature Flags List */}
      <div className="space-y-4">
        {filteredFlags.map((flag) => (
          <div key={flag.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className={`size-12 rounded-lg flex items-center justify-center ${
                  flag.enabled ? "bg-green-100" : "bg-gray-100"
                }`}>
                  <Flag className={`size-6 ${flag.enabled ? "text-green-600" : "text-gray-400"}`} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{flag.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      flag.environment === "PRODUCTION" ? "bg-green-100 text-green-700" :
                      flag.environment === "STAGING" ? "bg-yellow-100 text-yellow-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {flag.environment}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{flag.description}</p>

                  <div className="flex items-center gap-2 mb-3">
                    <code className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-mono">
                      {flag.key}
                    </code>
                  </div>

                  {flag.enabled && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Rollout Progress</span>
                        <span className="font-medium text-gray-900">{flag.rolloutPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${flag.rolloutPercentage}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                        <div className="flex items-center gap-1.5">
                          <Users className="size-4" />
                          <span>{flag.targetTenants} / {flag.totalTenants} tenants</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="size-4" />
                          <span>{Math.round((flag.targetTenants / flag.totalTenants) * 100)}% coverage</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="ml-4 flex flex-col items-end gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={flag.enabled} readOnly />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>

                {flag.enabled && flag.rolloutPercentage < 100 && (
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Adjust Rollout
                  </button>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 mt-4 flex items-center justify-between text-sm text-gray-500">
              <span>Created on {flag.createdAt}</span>
              <button className="text-blue-600 hover:text-blue-700 font-medium">Configure</button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Feature Flag Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create Feature Flag</h2>
              <p className="text-sm text-gray-500 mt-1">Configure a new feature flag for gradual rollout</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Feature Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., Advanced Analytics Dashboard"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Feature Key *</label>
                    <input
                      type="text"
                      placeholder="e.g., feature_advanced_analytics"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-1">Unique identifier for this feature (snake_case)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      placeholder="Describe what this feature does..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Configuration */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>STAGING</option>
                      <option>PRODUCTION</option>
                      <option>ALL</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Rollout Percentage: <span className="font-semibold">0%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue="0"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Start with a small percentage and gradually increase</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="enabled" className="rounded" />
                    <label htmlFor="enabled" className="text-sm text-gray-700">Enable this feature immediately</label>
                  </div>
                </div>
              </div>

              {/* Info Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Info className="size-5 text-blue-600 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Gradual Rollout Best Practices</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                      <li>Start with 5-10% of tenants</li>
                      <li>Monitor metrics and error rates</li>
                      <li>Increase gradually in 25% increments</li>
                      <li>Have a rollback plan ready</li>
                    </ul>
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
                Create Feature Flag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
