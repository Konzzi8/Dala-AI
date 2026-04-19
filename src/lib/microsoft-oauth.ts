const SCOPES = ["offline_access", "Mail.Read", "User.Read"].join(" ");

export function getMicrosoftRedirectUri(): string {
  const base =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${base.replace(/\/$/, "")}/api/integrations/microsoft/callback`;
}

export function buildMicrosoftAuthorizeUrl(state: string): string {
  const tenant = process.env.MICROSOFT_TENANT_ID || "common";
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!clientId) {
    throw new Error("MICROSOFT_CLIENT_ID is not set");
  }
  const redirectUri = getMicrosoftRedirectUri();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: SCOPES,
    state,
  });
  return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const tenant = process.env.MICROSOFT_TENANT_ID || "common";
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Microsoft OAuth credentials are not configured");
  }
  const redirectUri = getMicrosoftRedirectUri();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }>;
}
