import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-terracotta-500 text-white hover:bg-terracotta-600 active:bg-terracotta-700",
  secondary: "bg-paper-200 text-ink-800 hover:bg-paper-300 border border-paper-300",
  ghost: "bg-transparent text-ink-700 hover:bg-paper-200",
  danger: "bg-rose-500 text-white hover:bg-rose-700",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 rounded-lg gap-1.5",
  md: "text-base px-4 py-2.5 rounded-xl gap-2",
  lg: "text-lg px-6 py-3.5 rounded-xl2 gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={clsx(
          "inline-flex items-center justify-center font-medium transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" size={16} aria-hidden="true" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
