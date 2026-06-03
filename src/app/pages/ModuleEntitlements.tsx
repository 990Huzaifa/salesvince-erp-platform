import { useState } from "react";
import { Shield, Package, Plus, CheckCircle2, XCircle, Users } from "lucide-react";

type Plan = "Basic" | "Pro" | "Enterprise";

type ModuleEntitlement = {
  moduleId: string;
  moduleName: string;
  moduleCode: string;
  basic: boolean;
  pro: boolean;
  enterprise: boolean;
  basicTenants: number;
  proTenants: number;
  enterpriseTenants: number;
};

const mockEntitlements: ModuleEntitlement[] = [
  {
    moduleId: "1",
    moduleName: "Sales Management",
    moduleCode: "SALES",
    basic: true,
    pro: true,
    enterprise: true,
    basicTenants: 234,
    proTenants: 456,
    enterpriseTenants: 157,
  },
  {
    moduleId: "2",
    moduleName: "Inventory Management",
    moduleCode: "INVENTORY",
    basic: true,
    pro: true,
    enterprise: true,
    basicTenants: 234,
    proTenants: 456,
    enterpriseTenants: 157,
  },
  {
    moduleId: "3",
    moduleName: "Order Processing",
    moduleCode: "ORDERS",
    basic: true,
    pro: true,
    enterprise: true,
    basicTenants: 234,
    proTenants: 456,
    enterpriseTenants: 157,
  },
  {
    moduleId: "4",
    moduleName: "Route Planning",
    moduleCode: "ROUTES",
    basic: false,
    pro: true,
    enterprise: true,
    basicTenants: 0,
    proTenants: 298,
    enterpriseTenants: 157,
  },
  {
    moduleId: "5",
    moduleName: "Advanced Analytics",
    moduleCode: "ANALYTICS",
    basic: false,
    pro: true,
    enterprise: true,
    basicTenants: 0,
    proTenants: 312,
    enterpriseTenants: 157,
  },
  {
    moduleId: "6",
    moduleName: "Customer Management",
    moduleCode: "CUSTOMERS",
    basic: true,
    pro: true,
    enterprise: true,
    basicTenants: 234,
    proTenants: 456,
    enterpriseTenants: 157,
  },
  {
    moduleId: "7",
    moduleName: "Payment Gateway",
    moduleCode: "PAYMENTS",
    basic: false,
    pro: true,
    enterprise: true,
    basicTenants: 0,
    proTenants: 389,
    enterpriseTenants: 157,
  },
  {
    moduleId: "8",
    moduleName: "Warehouse Management",
    moduleCode: "WMS",
    basic: false,
    pro: false,
    enterprise: true,
    basicTenants: 0,
    proTenants: 0,
    enterpriseTenants: 157,
  },
  {
    moduleId: "9",
    moduleName: "API Access",
    moduleCode: "API",
    basic: false,
    pro: true,
    enterprise: true,
    basicTenants: 0,
    proTenants: 423,
    enterpriseTenants: 157,
  },
  {
    moduleId: "10",
    moduleName: "Custom Integrations",
    moduleCode: "INTEGRATIONS",
    basic: false,
    pro: false,
    enterprise: true,
    basicTenants: 0,
    proTenants: 0,
    enterpriseTenants: 157,
  },
];

export default function ModuleEntitlements() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState<ModuleEntitlement | null>(null);

  const handleEdit = (module: ModuleEntitlement) => {
    setSelectedModule(module);
    setShowEditModal(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Module Entitlements</h1>
          <p className="mt-1 text-sm text-gray-500">Configure module access by subscription plan</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
          <Shield className="size-4" />
          <span className="text-sm font-medium">Plan-Based Access Control</span>
        </div>
      </div>

      {/* Plan Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Basic Plan</h3>
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
              234 tenants
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Included Modules</p>
            <p className="text-3xl font-bold text-gray-900">
              {mockEntitlements.filter(m => m.basic).length}
            </p>
            <p className="text-xs text-gray-500">of {mockEntitlements.length} available</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-blue-500 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Pro Plan</h3>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
              456 tenants
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Included Modules</p>
            <p className="text-3xl font-bold text-gray-900">
              {mockEntitlements.filter(m => m.pro).length}
            </p>
            <p className="text-xs text-gray-500">of {mockEntitlements.length} available</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Enterprise Plan</h3>
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
              157 tenants
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Included Modules</p>
            <p className="text-3xl font-bold text-gray-900">
              {mockEntitlements.filter(m => m.enterprise).length}
            </p>
            <p className="text-xs text-gray-500">All modules included</p>
          </div>
        </div>
      </div>

      {/* Entitlements Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Module
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Basic Plan
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pro Plan
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enterprise Plan
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockEntitlements.map((entitlement) => (
                <tr key={entitlement.moduleId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="size-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{entitlement.moduleName}</p>
                        <p className="text-sm text-gray-500 font-mono">{entitlement.moduleCode}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-2">
                      {entitlement.basic ? (
                        <>
                          <CheckCircle2 className="size-6 text-green-600" />
                          <span className="text-xs text-gray-500">{entitlement.basicTenants} using</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="size-6 text-gray-300" />
                          <span className="text-xs text-gray-400">Not included</span>
                        </>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-2">
                      {entitlement.pro ? (
                        <>
                          <CheckCircle2 className="size-6 text-green-600" />
                          <span className="text-xs text-gray-500">{entitlement.proTenants} using</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="size-6 text-gray-300" />
                          <span className="text-xs text-gray-400">Not included</span>
                        </>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-2">
                      {entitlement.enterprise ? (
                        <>
                          <CheckCircle2 className="size-6 text-green-600" />
                          <span className="text-xs text-gray-500">{entitlement.enterpriseTenants} using</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="size-6 text-gray-300" />
                          <span className="text-xs text-gray-400">Not included</span>
                        </>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEdit(entitlement)}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Configure
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedModule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Configure Module Entitlements</h2>
              <p className="text-sm text-gray-500 mt-1">{selectedModule.moduleName}</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Basic Plan</p>
                    <p className="text-sm text-gray-500">234 tenants currently on this plan</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={selectedModule.basic} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-blue-200 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Pro Plan</p>
                    <p className="text-sm text-gray-500">456 tenants currently on this plan</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={selectedModule.pro} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Enterprise Plan</p>
                    <p className="text-sm text-gray-500">157 tenants currently on this plan</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={selectedModule.enterprise} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> Disabling a module for a plan will immediately affect all tenants on that plan.
                  Existing tenant-level overrides will be preserved.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium text-sm"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
