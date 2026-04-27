import { clsx } from "clsx";

export function FormSection({ title, description, children, className }) {
  return (
    <div className={clsx("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-0.5">
        <h2 className="text-xs font-medium text-ink">{title}</h2>
        {description && (
          <p className="text-2xs text-ink-4 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

export function FormRow({ children, cols = 2 }) {
  return (
    <div
      className={clsx(
        "grid gap-3",
        cols === 2 && "grid-cols-1 sm:grid-cols-2",
        cols === 3 && "grid-cols-1 sm:grid-cols-3"
      )}
    >
      {children}
    </div>
  );
}

export function FormDivider() {
  return <div className="border-t border-surface-2 my-2" />;
}