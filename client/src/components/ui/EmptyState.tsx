interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      {icon && <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-hensek-cream flex items-center justify-center text-hensek-dark/60">{icon}</div>}
      <h3 className="text-sm font-semibold text-hensek-dark">{title}</h3>
      {description && <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
