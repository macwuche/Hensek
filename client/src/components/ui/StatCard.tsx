import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  trend?: { value: string; positive?: boolean };
  className?: string;
  children?: React.ReactNode;
}

export default function StatCard({ label, value, hint, icon, trend, className, children }: StatCardProps) {
  return (
    <div className={cn("hensek-card flex flex-col gap-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-hensek-dark mt-1.5 truncate">{value}</p>
          {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-hensek-yellow/15 text-hensek-dark flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className={cn("text-xs font-medium", trend.positive ? "text-green-600" : "text-red-500")}>
          {trend.value}
        </div>
      )}
      {children}
    </div>
  );
}
