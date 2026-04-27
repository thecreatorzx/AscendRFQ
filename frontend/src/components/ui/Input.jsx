import { clsx } from "clsx";
import { forwardRef } from "react";

export const Input = forwardRef(function Input(
  { label, error, hint, prefix, suffix, className, containerClass, ...props },
  ref
) {
  return (
    <div className={clsx("flex flex-col gap-1", containerClass)}>
      {label && (
        <label className="text-xs text-ink-3 font-medium tracking-wide">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-2.5 text-ink-4 text-xs pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          className={clsx(
            "w-full bg-surface-1 border border-surface-3 rounded-md",
            "text-sm text-ink placeholder:text-ink-4",
            "px-2.5 py-1.5 h-8",
            "focus:outline-none focus:border-ink/30 focus:bg-white",
            "transition-colors duration-150",
            error && "border-close/50 focus:border-close/70",
            prefix && "pl-7",
            suffix && "pr-7",
            className
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-2.5 text-ink-4 text-xs pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="text-2xs text-close">{error}</p>}
      {hint && !error && <p className="text-2xs text-ink-4">{hint}</p>}
    </div>
  );
});

export function Select({ label, error, className, containerClass, children, ...props }) {
  return (
    <div className={clsx("flex flex-col gap-1", containerClass)}>
      {label && (
        <label className="text-xs text-ink-3 font-medium tracking-wide">
          {label}
        </label>
      )}
      <select
        className={clsx(
          "w-full bg-surface-1 border border-surface-3 rounded-md",
          "text-sm text-ink h-8 px-2.5",
          "focus:outline-none focus:border-ink/30 focus:bg-white",
          "transition-colors duration-150",
          error && "border-close/50",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-2xs text-close">{error}</p>}
    </div>
  );
}