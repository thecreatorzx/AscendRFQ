import { clsx } from "clsx";

export function EmptyState({ icon, title, description, action, className }) {
  return (
    <div className={clsx("flex flex-col items-center text-center py-16 px-4", className)}>
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center text-ink-4 mb-3">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-ink mb-1">{title}</p>
      {description && (
        <p className="text-xs text-ink-4 max-w-60 leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}