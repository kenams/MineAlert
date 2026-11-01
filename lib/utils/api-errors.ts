export type ApiErrorCode =
  | "unauthorized"
  | "alert_limit_reached"
  | "watchlist_limit_reached"
  | "mineral_not_found"
  | "invalid_keyword"
  | "invalid_payload"
  | "alert_create_failed"
  | "alert_delete_failed"
  | "watchlist_add_failed"
  | "watchlist_remove_failed";

/**
 * Erreur métier avec code stable, que l'interface traduit selon la locale (le message reste en français pour les logs).
 */
export class AppError extends Error {
  readonly code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}

const KNOWN_CODES: readonly string[] = [
  "unauthorized",
  "alert_limit_reached",
  "watchlist_limit_reached",
  "mineral_not_found",
  "invalid_keyword",
  "invalid_payload",
  "alert_create_failed",
  "alert_delete_failed",
  "watchlist_add_failed",
  "watchlist_remove_failed",
];

export function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === "string" && KNOWN_CODES.includes(value);
}

type ErrorTranslator = (key: `apiError.${ApiErrorCode}`) => string;

/**
 * Lit le code stable d'une réponse d'erreur de l'API et le traduit. Retourne null si aucun message utile n'est disponible.
 */
export async function readApiErrorMessage(
  response: Response,
  translate: ErrorTranslator
): Promise<string | null> {
  if (response.status === 401) {
    return translate("apiError.unauthorized");
  }

  try {
    const payload = (await response.json()) as { code?: unknown };
    return isApiErrorCode(payload.code) ? translate(`apiError.${payload.code}`) : null;
  } catch {
    return null;
  }
}
