"use client";

import { useState, type HTMLAttributes, type ReactNode } from "react";
import { Info, OctagonAlert, TriangleAlert, X, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type AlertVariant = "success" | "error" | "warning" | "info";

export type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
  title?: string;
  icon?: ReactNode;
  dismissible?: boolean;
  onClose?: () => void;
};

const variantClasses: Record<AlertVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-[#1B4332]/15 bg-[#1B4332]/5 text-[#0A0A0A]",
};

const variantIcons: Record<AlertVariant, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5" />,
  error: <OctagonAlert className="h-5 w-5" />,
  warning: <TriangleAlert className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
};

/**
 * Message système réutilisable pour confirmations, erreurs et informations.
 */
export function Alert({
  className,
  variant = "info",
  title,
  icon,
  dismissible = false,
  onClose,
  children,
  ...props
}: AlertProps): JSX.Element | null {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return null;
  }

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <div className="mt-0.5 shrink-0">{icon ?? variantIcons[variant]}</div>

      <div className="min-w-0 flex-1 space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className="leading-6">{children}</div>
      </div>

      {dismissible ? (
        <button
          type="button"
          onClick={handleClose}
          className="rounded-full p-1 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/10"
          aria-label="Fermer l'alerte"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

