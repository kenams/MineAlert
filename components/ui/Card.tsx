import {
  forwardRef,
  type HTMLAttributes,
  type PropsWithChildren,
} from "react";

import { cn } from "@/lib/utils/cn";

type CardVariant = "default" | "bordered" | "elevated" | "gold";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
};

type CardSectionProps = HTMLAttributes<HTMLDivElement>;

const cardVariants: Record<CardVariant, string> = {
  default: "border border-slate-200 bg-white",
  bordered: "border border-[#1B4332]/15 bg-white",
  elevated: "border border-slate-200 bg-white shadow-[0_12px_32px_-16px_rgba(10,10,10,0.25)]",
  gold: "border border-[#D4AF37]/40 bg-gradient-to-br from-[#fff8e1] to-white",
};

/**
 * Conteneur de carte générique pour structurer les blocs visuels de l'application.
 */
const CardRoot = forwardRef<HTMLDivElement, PropsWithChildren<CardProps>>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl p-5 text-[#0A0A0A]",
          cardVariants[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardRoot.displayName = "Card";

/**
 * En-tête de carte pour les titres, actions et métadonnées.
 */
const CardHeader = forwardRef<HTMLDivElement, PropsWithChildren<CardSectionProps>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mb-4 flex items-start justify-between gap-3", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = "Card.Header";

/**
 * Corps principal de carte pour le contenu métier.
 */
const CardBody = forwardRef<HTMLDivElement, PropsWithChildren<CardSectionProps>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        {children}
      </div>
    );
  }
);

CardBody.displayName = "Card.Body";

/**
 * Pied de carte pour les actions secondaires ou les récapitulatifs.
 */
const CardFooter = forwardRef<HTMLDivElement, PropsWithChildren<CardSectionProps>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = "Card.Footer";

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});

