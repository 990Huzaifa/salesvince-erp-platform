type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    isPositive: boolean;
  };
};

export function StatCard({ title, value, subtitle, icon: Icon, trend }: StatCardProps) {
  return (
    <div
      className="bg-white rounded-2xl p-6 transition-all hover:translate-y-[-2px]"
      style={{
        border: '1px solid rgba(219, 219, 229, 0.4)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(149, 140, 232, 0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: '#6B6C7E' }}>{title}</p>
          <p className="mt-2 text-3xl font-semibold" style={{ color: '#21222D' }}>{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm" style={{ color: '#6B6C7E' }}>{subtitle}</p>
          )}
          {trend && (
            <div className="mt-3 flex items-center gap-1">
              <span
                className="text-sm font-medium px-2 py-0.5 rounded-full"
                style={trend.isPositive ? {
                  color: '#10B981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)'
                } : {
                  color: '#EF4444',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)'
                }}
              >
                {trend.isPositive ? "↑" : "↓"} {trend.value}
              </span>
              <span className="text-sm" style={{ color: '#6B6C7E' }}>vs last month</span>
            </div>
          )}
        </div>
        <div
          className="size-12 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(149, 140, 232, 0.1)',
            color: '#958CE8'
          }}
        >
          <Icon className="size-6" />
        </div>
      </div>
    </div>
  );
}
