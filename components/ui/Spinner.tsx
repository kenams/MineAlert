import { cn } from "@/lib/utils/cn";

type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
} as const;

/**
 * Affiche un spinner léger et réutilisable pour les états de chargement.
 */
export function Spinner({
  size = "md",
  className,
}: SpinnerProps): JSX.Element {
  return (
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-solid border-[#1B4332]/20 border-t-[#1B4332]",
        sizeClasses[size],
        className
      )}
      aria-hidden="true"
    />
  );
}

