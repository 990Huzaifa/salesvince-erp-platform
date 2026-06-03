import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { Building2, Database, Package, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { Link } from "react-router";

const stats = [
  {
    title: "Total Tenants",
    value: "847",
    subtitle: "12 provisioning",
    icon: Building2,
    trend: { value: "12%", isPositive: true },
  },
  {
    title: "Active Databases",
    value: "835",
    subtitle: "99% uptime",
    icon: Database,
    trend: { value: "2%", isPositive: true },
  },
  {
    title: "Active Modules",
    value: "24",
    subtitle: "across all tenants",
    icon: Package,
  },
  {
    title: "Failed Provisions",
    value: "3",
    subtitle: "requires attention",
    icon: AlertTriangle,
  },
];

const recentTenants = [
  { id: "1", tenantId: "b81c6917-50db-4d22-8f38-3c02c3dfb54f", name: "Acme Corp", code: "ACME", status: "PROVISIONED" as const, createdAt: "2026-04-06 09:30", modules: 8 },
  { id: "2", tenantId: "f5ff52a1-f890-465b-8cf0-b9a5939b35d1", name: "TechStart Ltd", code: "TECH", status: "PROVISIONING" as const, createdAt: "2026-04-06 08:15", modules: 0 },
  { id: "3", tenantId: "f32a6eb7-380f-4a2c-92c6-8df69fdb950b", name: "Global Supplies", code: "GLBL", status: "PROVISIONED" as const, createdAt: "2026-04-05 14:20", modules: 12 },
  { id: "4", tenantId: "f9d0d5e1-8e6d-4008-8ee8-5fa86123e9a2", name: "Metro Distribution", code: "MTRO", status: "FAILED" as const, createdAt: "2026-04-05 11:45", modules: 0 },
  { id: "5", tenantId: "c2e0c0c0-0000-4000-8000-000000000005", name: "Swift Logistics", code: "SWFT", status: "PROVISIONED" as const, createdAt: "2026-04-04 16:00", modules: 10 },
];

const recentActivity = [
  { id: "1", type: "Tenant Created", tenant: "Acme Corp", user: "admin@salevince.com", time: "2 mins ago" },
  { id: "2", type: "Module Enabled", tenant: "TechStart Ltd", user: "admin@salevince.com", time: "15 mins ago" },
  { id: "3", type: "Provisioning Failed", tenant: "Metro Distribution", user: "system", time: "1 hour ago" },
  { id: "4", type: "Database Migration", tenant: "Global Supplies", user: "system", time: "3 hours ago" },
  { id: "5", type: "Tenant Suspended", tenant: "Old Company", user: "admin@salevince.com", time: "5 hours ago" },
];

export default function Dashboard() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 style={{ color: '#21222D' }}>Dashboard</h1>
        <p className="mt-1 text-sm" style={{ color: '#6B6C7E' }}>Welcome to Salevince Platform Control Plane</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tenants */}
        <div className="lg:col-span-2 bg-white rounded-2xl overflow-hidden" style={{
          border: '1px solid rgba(219, 219, 229, 0.4)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}>
          <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
            <div>
              <h2 style={{ color: '#21222D' }}>Recent Tenants</h2>
              <p className="text-sm" style={{ color: '#6B6C7E' }}>Latest tenant registrations</p>
            </div>
            <Link to="/tenants" className="text-sm font-medium hover:underline" style={{ color: '#958CE8' }}>
              View all
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: '#F8F9FC' }}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6B6C7E' }}>Tenant</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6B6C7E' }}>Code</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6B6C7E' }}>Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6B6C7E' }}>Modules</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6B6C7E' }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentTenants.map((tenant, index) => (
                  <tr
                    key={tenant.id}
                    className="transition-colors"
                    style={{ borderTop: index > 0 ? '1px solid rgba(219, 219, 229, 0.3)' : 'none' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(172, 209, 253, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/master/tenants/${tenant.tenantId}`} className="text-sm font-medium hover:underline" style={{ color: '#958CE8' }}>
                        {tenant.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#21222D' }}>{tenant.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={tenant.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#21222D' }}>{tenant.modules}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#6B6C7E' }}>{tenant.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{
          border: '1px solid rgba(219, 219, 229, 0.4)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}>
          <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(219, 219, 229, 0.4)' }}>
            <h2 style={{ color: '#21222D' }}>Recent Activity</h2>
            <p className="text-sm" style={{ color: '#6B6C7E' }}>Platform events</p>
          </div>

          <div className="p-6 space-y-5 max-h-96 overflow-y-auto">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div className="mt-1 size-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#958CE8' }}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: '#21222D' }}>{activity.type}</p>
                  <p className="text-sm" style={{ color: '#6B6C7E' }}>{activity.tenant}</p>
                  <p className="text-xs mt-1" style={{ color: '#6B6C7E' }}>{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-2xl p-6" style={{
        border: '1px solid rgba(219, 219, 229, 0.4)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 style={{ color: '#21222D' }}>System Health</h2>
            <p className="text-sm" style={{ color: '#6B6C7E' }}>All systems operational</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ backgroundColor: '#10B981' }}></span>
            <span className="text-sm font-medium" style={{ color: '#10B981' }}>Healthy</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl" style={{ backgroundColor: '#F8F9FC' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: '#6B6C7E' }}>Master DB</span>
              <span className="text-xs font-medium px-2 py-1 rounded-full" style={{
                color: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)'
              }}>ONLINE</span>
            </div>
            <p className="mt-3 text-2xl font-semibold" style={{ color: '#21222D' }}>99.9%</p>
            <p className="text-xs" style={{ color: '#6B6C7E' }}>Uptime</p>
          </div>

          <div className="p-5 rounded-xl" style={{ backgroundColor: '#F8F9FC' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: '#6B6C7E' }}>API Gateway</span>
              <span className="text-xs font-medium px-2 py-1 rounded-full" style={{
                color: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)'
              }}>ONLINE</span>
            </div>
            <p className="mt-3 text-2xl font-semibold" style={{ color: '#21222D' }}>342ms</p>
            <p className="text-xs" style={{ color: '#6B6C7E' }}>Avg Response Time</p>
          </div>

          <div className="p-5 rounded-xl" style={{ backgroundColor: '#F8F9FC' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: '#6B6C7E' }}>Provisioning Service</span>
              <span className="text-xs font-medium px-2 py-1 rounded-full" style={{
                color: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)'
              }}>ONLINE</span>
            </div>
            <p className="mt-3 text-2xl font-semibold" style={{ color: '#21222D' }}>12</p>
            <p className="text-xs" style={{ color: '#6B6C7E' }}>Active Jobs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
