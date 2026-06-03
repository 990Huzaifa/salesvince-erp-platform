type StatusBadgeProps = {
  status:
    | "REGISTERED" | "PROVISIONING" | "PROVISIONED" | "FAILED" | "SUSPENDED"
    | "ACTIVE" | "INACTIVE" | "PENDING" | "COMPLETED" | "ERROR"
    | "DRAFT" | "ISSUED" | "PAID" | "OVERDUE" | "TRIAL" | "SCHEDULED" | "EXPIRED"
    | "SUCCESS" | "WARNING" | "INFO" | "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "BETA";
  size?: "sm" | "md";
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const styles = {
    REGISTERED: "bg-blue-50 text-blue-600 border-blue-100",
    PROVISIONING: "bg-amber-50 text-amber-600 border-amber-100",
    PROVISIONED: "bg-emerald-50 text-emerald-600 border-emerald-100",
    FAILED: "bg-red-50 text-red-600 border-red-100",
    SUSPENDED: "bg-red-50 text-red-600 border-red-100",
    ACTIVE: "bg-emerald-50 text-emerald-600 border-emerald-100",
    INACTIVE: "bg-gray-50 text-gray-600 border-gray-100",
    PENDING: "bg-amber-50 text-amber-600 border-amber-100",
    COMPLETED: "bg-emerald-50 text-emerald-600 border-emerald-100",
    ERROR: "bg-red-50 text-red-600 border-red-100",
    DRAFT: "bg-gray-50 text-gray-600 border-gray-100",
    ISSUED: "bg-blue-50 text-blue-600 border-blue-100",
    PAID: "bg-emerald-50 text-emerald-600 border-emerald-100",
    OVERDUE: "bg-red-50 text-red-600 border-red-100",
    TRIAL: "bg-blue-50 text-blue-600 border-blue-100",
    SCHEDULED: "bg-blue-50 text-blue-600 border-blue-100",
    EXPIRED: "bg-gray-50 text-gray-600 border-gray-100",
    SUCCESS: "bg-emerald-50 text-emerald-600 border-emerald-100",
    WARNING: "bg-amber-50 text-amber-600 border-amber-100",
    INFO: "bg-blue-50 text-blue-600 border-blue-100",
    LOW: "bg-blue-50 text-blue-600 border-blue-100",
    MEDIUM: "bg-amber-50 text-amber-600 border-amber-100",
    HIGH: "bg-orange-50 text-orange-600 border-orange-100",
    URGENT: "bg-red-50 text-red-600 border-red-100",
    BETA: "bg-purple-50 text-purple-600 border-purple-100",
  };

  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-xs",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${styles[status]} ${sizeStyles[size]}`}>
      <span className="size-1.5 rounded-full bg-current opacity-80"></span>
      {status}
    </span>
  );
}
