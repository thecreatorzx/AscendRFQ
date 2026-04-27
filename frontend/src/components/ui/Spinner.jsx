import { clsx } from "clsx";

export function Spinner({ size = "sm", className }) {
  const s = { xs: "w-3 h-3", sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" }[size];
  return (
    <span
      className={clsx(
        s,
        "border-2 border-surface-3 border-t-ink/40 rounded-full animate-spin inline-block",
        className
      )}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-50">
      <Spinner size="md" />
    </div>
  );
}