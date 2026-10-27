/**
 * "Where to buy" links for a book. Stored as a JSON array on the book itself
 * (jsonb in Supabase, JSON text in SQLite); array order is display order.
 *
 * Retailers are completely free-form: the admin types the platform name
 * (Amazon, Kobo, a local independent bookstore, a publisher's own shop, ...)
 * and a direct HTTPS link. Nothing is hardcoded per retailer, nothing is
 * generated, and no logo or metadata is ever fetched from a URL.
 *
 * Safe to import from client components (no server-only code).
 */

export type BookRetailer = {
  /** Exactly as the admin typed it — rendered verbatim as text. */
  name: string;
  /** Normalized absolute https URL. */
  url: string;
};

/** Practical ceiling for validation and storage (also enforced in the database). */
export const MAX_RETAILERS = 20;
export const MAX_RETAILER_NAME_LENGTH = 60;
const MAX_URL_LENGTH = 500;

/** Hosts that can never be a public bookstore: localhost, bare names, IP literals, internal TLDs. */
function isPublicHostname(host: string): boolean {
  if (!host.includes(".")) return false;
  if (host.startsWith("[") || host.includes(":")) return false; // IPv6 literal
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false; // IPv4 literal
  if (/\.(local|localhost|internal|lan|home|corp|test|invalid|example)$/.test(host)) return false;
  // Letters-only TLD, or an internationalised one in its punycode form (xn--…).
  return /\.([a-z]{2,}|xn--[a-z0-9-]{2,})$/.test(host);
}

/** Collapses internal whitespace and strips control characters from a typed name. */
function cleanName(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

export type RetailerCheck = { ok: true; retailer: BookRetailer } | { ok: false; error: string };

/** Validates one entry. Returns the normalized entry or a human-readable error. */
export function checkRetailer(input: unknown): RetailerCheck {
  if (typeof input !== "object" || input === null) return { ok: false, error: "Not a valid retailer entry." };
  const raw = input as Record<string, unknown>;

  const name = cleanName(raw.name);
  const urlText = typeof raw.url === "string" ? raw.url.trim() : "";
  const label = name || "A retailer";

  if (!name) return { ok: false, error: "Enter the retailer or platform name." };
  if (name.length > MAX_RETAILER_NAME_LENGTH) {
    return { ok: false, error: `“${name.slice(0, 20)}…”: the name must be ${MAX_RETAILER_NAME_LENGTH} characters or fewer.` };
  }
  if (!urlText) return { ok: false, error: `${label}: enter the book's link.` };
  if (urlText.length > MAX_URL_LENGTH) return { ok: false, error: `${label}: the link is too long.` };

  let url: URL;
  try {
    url = new URL(urlText);
  } catch {
    return { ok: false, error: `${label}: that isn't a valid link (include https://).` };
  }
  if (url.protocol !== "https:") return { ok: false, error: `${label}: the link must start with https://.` };
  if (url.username || url.password) return { ok: false, error: `${label}: the link can't contain a username or password.` };
  if (url.port) return { ok: false, error: `${label}: the link can't specify a port.` };
  if (!isPublicHostname(url.hostname.toLowerCase())) {
    return { ok: false, error: `${label}: that isn't a public web address.` };
  }
  return { ok: true, retailer: { name, url: url.toString() } };
}

/**
 * Validates a submitted list. Rows left completely blank (no name, no link)
 * are dropped; every other row must be valid or the whole list is rejected.
 */
export function validateRetailers(input: unknown): { retailers: BookRetailer[]; errors: string[] } {
  if (!Array.isArray(input)) return { retailers: [], errors: ["Retailers must be a list."] };
  const retailers: BookRetailer[] = [];
  const errors: string[] = [];
  for (const entry of input) {
    const e = (entry ?? {}) as Record<string, unknown>;
    const blank = !cleanName(e.name) && (typeof e.url !== "string" || !e.url.trim());
    if (blank) continue;
    const result = checkRetailer(entry);
    if (result.ok) retailers.push(result.retailer);
    else errors.push(result.error);
  }
  if (retailers.length > MAX_RETAILERS) errors.push(`Add at most ${MAX_RETAILERS} retailers.`);
  return { retailers, errors };
}

/**
 * Reads the stored value (JSON text in SQLite, an array from Supabase).
 * Re-validates every entry so a malformed or hand-edited row can never
 * produce a non-https link on the public site — invalid entries are dropped.
 */
export function parseStoredRetailers(raw: unknown): BookRetailer[] {
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  const out: BookRetailer[] = [];
  for (const entry of value.slice(0, MAX_RETAILERS)) {
    const result = checkRetailer(entry);
    if (result.ok) out.push(result.retailer);
  }
  return out;
}
