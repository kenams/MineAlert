/**
 * Échappe une valeur pour l'insérer dans du HTML (texte ou attribut).
 */
export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Retourne l'URL normalisée si elle est en http(s), sinon null. Bloque javascript:, data: et les autres schémas.
 */
export function safeHref(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}
