import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type BadgeVariant = "positive" | "negative" | "neutral" | "gold" | "category";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  compact?: boolean;
  value?: number | string;
  showSign?: boolean;
  icon?: ReactNode;
};

const variantClasses: Record<BadgeVariant, string> = {
  positive: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  negative: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  neutral: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  gold: "bg-[#fff7db] text-[#9b7b12] ring-1 ring-[#D4AF37]/35",
  category: "bg-[#1B4332]/8 text-[#1B4332] ring-1 ring-[#1B4332]/15",
};

function formatBadgeValue(value: number | string | undefined, showSign: boolean): string {
  if (value === undefined) {
    return "";
  }

  if (typeof value === "number") {
    if (showSign && value > 0) {
      return `+${value}`;
    }

    return `${value}`;
  }

  return value;
}

/**
 * Badge visuel réutilisable pour les statuts, sentiments, catégories et variations.
 */
export function Badge({
  className,
  variant = "neutral",
  compact = false,
  value,
  showSign = false,
  icon,
  children,
  ...props
}: BadgeProps): JSX.Element {
  const content = formatBadgeValue(value, showSign) || children;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {icon}
      <span>{content}</span>
    </span>
  );
}

