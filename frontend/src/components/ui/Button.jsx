import { clsx } from "clsx";
import { motion } from "framer-motion";

const variants = {
  primary:  "bg-ink text-white hover:bg-ink/90",
  ghost:    "bg-transparent text-ink hover:bg-surface-2 border border-surface-3",
  danger:   "bg-close text-white hover:bg-close/90",
  success:  "bg-bid text-white hover:bg-bid/90",
  outline:  "bg-transparent border border-ink/20 text-ink hover:border-ink/40",
};

const sizes = {
  xs: "px-2.5 py-1 text-xs rounded",
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-4 py-2 text-sm rounded-md",
  lg: "px-5 py-2.5 text-sm rounded-lg",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  loading = false,
  icon,
  iconRight,
  disabled,
  ...props
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-150 cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="w-3.5 h-3.5 shrink-0">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && (
        <span className="w-3.5 h-3.5 shrink-0">{iconRight}</span>
      )}
    </motion.button>
  );
}