import { createServiceRoleClient } from "@/lib/supabase/service";
import { ingestEmailContent } from "@/lib/ingest-email";

type OutlookRow = {
  user_id: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
};

async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const tenant = process.env.MICROSOFT_TENANT_ID || "common";
  const clientId = process.env.MICROSOFT_CLIENT_ID!;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET!;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
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
    const t = await res.text();
    throw new Error(`Refresh failed: ${res.status} ${t}`);
  }
  return res.json();
}

async function getValidAccessToken(row: OutlookRow): Promise<string> {
  const admin = createServiceRoleClient();
  if (!admin) throw new Error("Service role not configured");

  const exp = row.token_expires_at ? new Date(row.token_expires_at).getTime() : 0;
  const needsRefresh = Date.now() > exp - 120_000;

  if (!needsRefresh && row.access_token) {
    return row.access_token;
  }

  if (!row.refresh_token) {
    throw new Error("No refresh token");
  }

  const tokens = await refreshAccessToken(row.refresh_token);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await admin
    .from("outlook_connections")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? row.refresh_token,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", row.user_id);

  return tokens.access_token;
}

type GraphMessage = {
  id: string;
  subject?: string;
  body?: { content?: string; contentType?: string };
  from?: { emailAddress?: { address?: string } };
  receivedDateTime?: string;
};

export async function syncUserInbox(row: OutlookRow): Promise<{ processed: number }> {
  const admin = createServiceRoleClient();
  if (!admin) throw new Error("Service role not configured");

  const access = await getValidAccessToken(row);
  const url =
    "https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=15&$orderby=receivedDateTime desc";

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${access}` },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Graph inbox failed: ${res.status} ${t}`);
  }

  const json = (await res.json()) as { value?: GraphMessage[] };
  const messages = json.value ?? [];
  let processed = 0;

  for (const m of messages) {
    const graphId = m.id;
    const { data: existing } = await admin
      .from("emails")
      .select("id")
      .eq("graph_message_id", graphId)
      .maybeSingle();
    if (existing) continue;

    const subject = m.subject || "(no subject)";
    const from = m.from?.emailAddress?.address || "unknown@sender.com";
    const bodyText =
      m.body?.contentType === "html"
        ? (m.body?.content || "").replace(/<[^>]+>/g, " ")
        : m.body?.content || "";

    await ingestEmailContent(admin, row.user_id, {
      subject,
      from,
      text: bodyText.slice(0, 120_000),
      graphMessageId: graphId,
    });

    processed += 1;
  }

  return { processed };
}

/** Full cron: all connected Outlook accounts. */
export async function syncAllOutlookInboxes(): Promise<{ users: number; messages: number }> {
  const admin = createServiceRoleClient();
  if (!admin) {
    return { users: 0, messages: 0 };
  }

  const { data: rows, error } = await admin.from("outlook_connections").select("*");
  if (error || !rows?.length) {
    return { users: 0, messages: 0 };
  }

  let messages = 0;
  for (const r of rows as OutlookRow[]) {
    try {
      const { processed } = await syncUserInbox(r);
      messages += processed;
    } catch {
      /* skip user */
    }
  }

  return { users: rows.length, messages };
}
