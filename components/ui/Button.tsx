import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils/cn";

import { Spinner } from "./Spinner";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "outline";

type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#1B4332] text-white shadow-sm hover:bg-[#163829] focus-visible:ring-[#1B4332]/30",
  secondary:
    "bg-[#D4AF37] text-[#0A0A0A] shadow-sm hover:bg-[#c4a233] focus-visible:ring-[#D4AF37]/30",
  danger:
    "bg-[#DC3545] text-white shadow-sm hover:bg-[#c52f3e] focus-visible:ring-[#DC3545]/30",
  ghost:
    "bg-transparent text-[#1B4332] hover:bg-[#1B4332]/5 focus-visible:ring-[#1B4332]/20",
  outline:
    "border border-[#1B4332]/20 bg-transparent text-[#1B4332] hover:bg-[#1B4332]/5 focus-visible:ring-[#1B4332]/20",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 rounded-lg px-3 text-sm",
  md: "h-11 rounded-xl px-4 text-sm",
  lg: "h-12 rounded-xl px-5 text-base",
};

/**
 * Bouton principal réutilisable avec variantes, tailles et état de chargement.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      icon,
      fullWidth = false,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
          sizeClasses[size],
          variantClasses[variant],
          fullWidth && "w-full",
          className
        )}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading ? <Spinner size="sm" className="border-current/20 border-t-current" /> : icon}
        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";

