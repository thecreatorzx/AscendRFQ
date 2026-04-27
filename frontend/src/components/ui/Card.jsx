import { clsx } from "clsx";
import { motion } from "framer-motion";

export function Card({ children, className, hover = false, onClick, ...props }) {
  const Comp = hover || onClick ? motion.div : "div";
  return (
    <Comp
      onClick={onClick}
      whileHover={hover || onClick ? { y: -1 } : undefined}
      transition={{ duration: 0.15 }}
      className={clsx(
        "bg-white border border-surface-3 rounded-lg",
        (hover || onClick) && "cursor-pointer hover:border-ink/20 hover:shadow-sm transition-shadow",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

export function CardSection({ children, className, border = true }) {
  return (
    <div
      className={clsx(
        "px-4 py-3",
        border && "border-t border-surface-2",
        className
      )}
    >
      {children}
    </div>
  );
}