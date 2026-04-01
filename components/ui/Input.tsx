import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils/cn";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  wrapperClassName?: string;
};

/**
 * Champ de saisie générique avec label, hint, erreur et zones d'icônes.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      className,
      wrapperClassName,
      type = "text",
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className={cn("space-y-2", wrapperClassName)}>
        {label ? (
          <label htmlFor={inputId} className="block text-sm font-medium text-[#0A0A0A]">
            {label}
          </label>
        ) : null}

        <div className="relative">
          {leftIcon ? (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              {leftIcon}
            </span>
          ) : null}

          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              "flex h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#0A0A0A] shadow-sm transition-colors duration-200",
              "placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-4",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error
                ? "border-[#DC3545] focus-visible:border-[#DC3545] focus-visible:ring-[#DC3545]/15"
                : "border-slate-200 focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/15",
              className
            )}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            {...props}
          />

          {rightIcon ? (
            <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
              {rightIcon}
            </span>
          ) : null}
        </div>

        {hint ? (
          <p id={hintId} className="text-xs text-slate-500">
            {hint}
          </p>
        ) : null}

        {error ? (
          <p id={errorId} className="text-xs font-medium text-[#DC3545]">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

