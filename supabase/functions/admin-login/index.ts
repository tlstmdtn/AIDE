// This endpoint returns a Supabase session only after password and admin checks.
// Keep the administrator email in server settings, never in the public bundle.
export function createAdminLoginHandler({
  supabaseUrl,
  publicKey,
  adminEmail,
  allowedOrigin = "https://tlstmdtn.github.io",
  fetchImpl = fetch,
}) {
  return async (request) => {
    const origin = request.headers.get("origin");
    const headers = {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Vary: "Origin",
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    };
    const respond = (status, code) =>
      new Response(JSON.stringify({ code }), { status, headers });
    if (origin && origin !== allowedOrigin)
      return respond(403, "forbidden_origin");
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return respond(405, "method_not_allowed");
    if (!supabaseUrl || !publicKey || !adminEmail)
      return respond(503, "login_not_configured");

    let password;
    try {
      const body = await request.text();
      if (body.length > 4096) return respond(400, "invalid_request");
      password = JSON.parse(body)?.password;
      if (
        typeof password !== "string" ||
        !password.length ||
        password.length > 1024
      )
        return respond(400, "invalid_request");
    } catch {
      return respond(400, "invalid_request");
    }

    const base = supabaseUrl.replace(/\/$/, "");
    const apiHeaders = {
      apikey: publicKey,
      "Content-Type": "application/json",
    };
    let session;
    async function discardSession() {
      if (!session?.access_token) return;
      try {
        await fetchImpl(`${base}/auth/v1/logout?scope=local`, {
          method: "POST",
          headers: {
            ...apiHeaders,
            Authorization: `Bearer ${session.access_token}`,
          },
          signal: AbortSignal.timeout(3000),
        });
      } catch {
        // Never return an unverified session, including if cleanup is unavailable.
      }
    }

    try {
      // Supabase Auth validates the password and applies its own rate limits.
      const auth = await fetchImpl(
        `${base}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: apiHeaders,
          body: JSON.stringify({ email: adminEmail, password }),
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!auth.ok)
        return respond(
          auth.status === 429 ? 429 : auth.status >= 500 ? 503 : 401,
          "login_failed",
        );
      session = await auth.json();
      if (
        !session?.user?.id ||
        !session.access_token ||
        !session.refresh_token
      ) {
        await discardSession();
        return respond(503, "invalid_session");
      }
      const membership = await fetchImpl(
        `${base}/rest/v1/application_admins?select=user_id&user_id=eq.${encodeURIComponent(session.user.id)}`,
        {
          headers: {
            ...apiHeaders,
            Authorization: `Bearer ${session.access_token}`,
          },
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!membership.ok) {
        await discardSession();
        return respond(503, "permission_check_unavailable");
      }
      const admins = await membership.json();
      if (
        !Array.isArray(admins) ||
        !admins.some((admin) => admin.user_id === session.user.id)
      ) {
        await discardSession();
        return respond(401, "login_failed");
      }
      return new Response(
        JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        }),
        { status: 200, headers },
      );
    } catch {
      await discardSession();
      return respond(503, "login_unavailable");
    }
  };
}

if (typeof Deno !== "undefined") {
  Deno.serve(
    createAdminLoginHandler({
      supabaseUrl: Deno.env.get("SUPABASE_URL"),
      publicKey: Deno.env.get("SUPABASE_ANON_KEY"),
      adminEmail: Deno.env.get("AIDE_ADMIN_EMAIL"),
    }),
  );
}
