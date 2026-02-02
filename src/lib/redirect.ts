/**
 * Utility functions for handling authentication redirects
 */

/**
 * Get the list of allowed redirect URLs from environment variables
 */
export function getAllowedRedirectUrls(): string[] {
  const urls = process.env.NEXT_PUBLIC_ALLOWED_REDIRECT_URLS || "";
  return urls.split(",").map((url) => url.trim()).filter(Boolean);
}

/**
 * Validate if a redirect URL is allowed
 */
export function isValidRedirectUrl(url: string): boolean {
  if (!url) return false;

  try {
    const redirectUrl = new URL(url);
    const allowedUrls = getAllowedRedirectUrls();

    return allowedUrls.some((allowedUrl) => {
      const allowed = new URL(allowedUrl);
      return (
        redirectUrl.origin === allowed.origin ||
        redirectUrl.hostname === allowed.hostname
      );
    });
  } catch {
    return false;
  }
}

/**
 * Get the redirect URL from query parameters, validate it, and return it
 * Returns null if no valid redirect URL is found
 */
export function getValidatedRedirectUrl(searchParams: URLSearchParams): string | null {
  const redirectUrl = searchParams.get("redirect") || searchParams.get("returnUrl");
  
  if (!redirectUrl) return null;
  
  return isValidRedirectUrl(redirectUrl) ? redirectUrl : null;
}

/**
 * Build a redirect URL with authentication token
 */
export async function buildAuthRedirectUrl(
  baseUrl: string,
  idToken: string
): Promise<string> {
  const url = new URL(baseUrl);
  url.searchParams.set("token", idToken);
  return url.toString();
}
