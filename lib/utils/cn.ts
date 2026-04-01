import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fusionne proprement les classes Tailwind et conditionnelles.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

