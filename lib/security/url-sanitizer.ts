/**
 * Open Redirect & Destination URL Sanitizer
 * Kannada Kaliri — Milestone 11 Security Hardening
 *
 * Prevents open redirect attacks (CWE-601) via:
 * - Protocol-relative URLs (//attacker.com)
 * - Backslash trickery (/\attacker.com, /\\attacker.com, /%5Cattacker.com)
 * - CRLF / Header injection characters
 * - Explicit URI schemes (javascript:, data:, https:, ftp:, etc.)
 * - Malformed path navigations
 */

export function sanitizeDestination(
  url: string | null | undefined,
  fallback: string = '/dashboard'
): string {
  if (!url || typeof url !== 'string') {
    return fallback;
  }

  // Trim whitespace
  const trimmed = url.trim();

  // Reject empty string or strings containing control characters (CR, LF, null byte, tab)
  if (!trimmed || /[\r\n\t\0]/.test(trimmed)) {
    return fallback;
  }

  // Reject any backslashes or percent-encoded backslashes (%5C, %5c)
  if (trimmed.includes('\\') || /%5c/i.test(trimmed)) {
    return fallback;
  }

  // Reject protocol-relative navigations or custom/standard schemes (http:, https:, javascript:, data:, etc.)
  if (trimmed.startsWith('//') || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return fallback;
  }

  // Must strictly start with a single forward slash
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }

  // Parse against dummy localhost origin to rigorously validate structure
  try {
    const parsed = new URL(trimmed, 'http://localhost');

    // Origin must remain exactly the dummy origin
    if (parsed.origin !== 'http://localhost') {
      return fallback;
    }

    // Pathname must begin with '/'
    if (!parsed.pathname.startsWith('/')) {
      return fallback;
    }

    // Reject consecutive slashes in pathname (e.g. /foo//attacker.com)
    if (parsed.pathname.includes('//')) {
      return fallback;
    }

    // Disallow backslashes anywhere in parsed components
    if (parsed.pathname.includes('\\') || parsed.search.includes('\\') || parsed.hash.includes('\\')) {
      return fallback;
    }

    // Reconstruct safe relative path with search params and hash
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

