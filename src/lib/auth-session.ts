/** Cookie set by /api/auth/login; checked in middleware. Replace with real sessions later. */
export const SESSION_COOKIE_NAME = "dala-session";
export const SESSION_COOKIE_VALUE = "authenticated";

export function isSessionCookieValid(value: string | undefined): boolean {
  return value === SESSION_COOKIE_VALUE;
}
