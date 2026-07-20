import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.47.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function base64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization) return json({ error: "Authentication required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const publishableKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}");
  const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
  const publishableKey = publishableKeys.default || Deno.env.get("SUPABASE_ANON_KEY");
  const secretKey = secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  const userClient = createClient(supabaseUrl, publishableKey!, {
    global: { headers: { Authorization: authorization } },
  });
  const adminClient = createClient(supabaseUrl, secretKey!);

  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: "Invalid session" }, 401);

  const { data: profile } = await userClient
    .from("profiles")
    .select("id, company_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) return json({ error: "Profile is not ready" }, 403);
  if (!["owner", "admin", "manager", "account_manager", "sales_rep"].includes(profile.role)) {
    return json({ error: "You do not have permission to send company email" }, 403);
  }

  const payload = await req.json();
  const to = String(payload.to || "").trim();
  const subject = String(payload.subject || "").trim();
  const body = String(payload.body || "").trim();
  const customerId = payload.customer_id || null;
  const entityType = payload.entity_type || null;
  const entityId = payload.entity_id || null;

  if (!to || !subject || !body) {
    return json({ error: "Recipient, subject, and message are required" }, 400);
  }

  if (customerId) {
    const { data: customer } = await userClient
      .from("customers")
      .select("id")
      .eq("id", customerId)
      .eq("company_id", profile.company_id)
      .maybeSingle();
    if (!customer) return json({ error: "Customer is outside your company" }, 403);
  }

  const clientId = Deno.env.get("GMAIL_CLIENT_ID");
  const clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GMAIL_REFRESH_TOKEN");
  const sender = Deno.env.get("GMAIL_SENDER_EMAIL");

  if (!clientId || !clientSecret || !refreshToken || !sender) {
    return json({ error: "Gmail is not configured", code: "gmail_not_configured" }, 503);
  }

  const { data: communication, error: communicationError } = await adminClient
    .from("communication_messages")
    .insert({
      company_id: profile.company_id,
      customer_id: customerId,
      created_by_profile_id: user.id,
      channel: "email",
      direction: "outbound",
      provider: "gmail",
      from_address: sender,
      to_addresses: [to],
      subject,
      body_text: body,
      status: "sending",
      related_entity_type: entityType,
      related_entity_id: entityId,
    })
    .select("id")
    .single();

  if (communicationError) return json({ error: communicationError.message }, 500);

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || "Unable to refresh Gmail access token");
    }

    const mime = [
      `From: ${sender}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "",
      body,
    ].join("\r\n");

    const gmailResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: base64Url(mime) }),
    });

    const gmailData = await gmailResponse.json();
    if (!gmailResponse.ok) throw new Error(gmailData.error?.message || "Gmail rejected the message");

    await adminClient.from("communication_messages").update({
      status: "sent",
      provider_message_id: gmailData.id,
      provider_thread_id: gmailData.threadId,
      sent_at: new Date().toISOString(),
      error_message: null,
    }).eq("id", communication.id);

    if (customerId) {
      await adminClient.from("customer_timeline_events").insert({
        company_id: profile.company_id,
        customer_id: customerId,
        actor_profile_id: user.id,
        event_type: "email_sent",
        title: subject,
        body,
        metadata: {
          communication_message_id: communication.id,
          provider: "gmail",
          to,
        },
      });
    }

    return json({ ok: true, message_id: communication.id, gmail_message_id: gmailData.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email delivery failed";
    await adminClient.from("communication_messages").update({
      status: "failed",
      error_message: message,
    }).eq("id", communication.id);
    return json({ error: message, message_id: communication.id }, 502);
  }
});
