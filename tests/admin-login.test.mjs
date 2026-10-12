import { test } from "node:test";
import assert from "node:assert/strict";
import { createAdminLoginHandler } from "../supabase/functions/admin-login/index.ts";

const session = {
  user: { id: "test-admin-id" },
  access_token: "test-access-token",
  refresh_token: "test-refresh-token",
};
function backend({
  authorized = true,
  authStatus = 200,
  membershipStatus = 200,
  configured = true,
} = {}) {
  const calls = [];
  const handler = createAdminLoginHandler({
    supabaseUrl: "https://test.supabase.co",
    publicKey: "test-public-key",
    adminEmail: configured ? "admin@example.com" : undefined,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (url.includes("/token?"))
        return Response.json(
          authStatus === 200 ? session : { message: "private upstream error" },
          { status: authStatus },
        );
      if (url.includes("/application_admins?"))
        return Response.json(authorized ? [{ user_id: session.user.id }] : [], {
          status: membershipStatus,
        });
      if (url.includes("/logout?scope=local"))
        return new Response(null, { status: 204 });
      throw new Error("Unexpected upstream request");
    },
  });
  return { handler, calls };
}
const request = (body, origin = "https://tlstmdtn.github.io") =>
  new Request("https://test.supabase.co/functions/v1/admin-login", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

test("password-only login uses server identity and verifies administrator membership before returning tokens", async () => {
  const { handler, calls } = backend();
  const response = await handler(
    request({ password: "test-password", email: "attacker@example.com" }),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    email: "admin@example.com",
    password: "test-password",
  });
  assert.equal(
    calls[1].options.headers.Authorization,
    `Bearer ${session.access_token}`,
  );
});

test("incorrect passwords and rate limits never release tokens or query applications", async () => {
  for (const [authStatus, expectedStatus] of [
    [400, 401],
    [401, 401],
    [429, 429],
    [500, 503],
  ]) {
    const { handler, calls } = backend({ authStatus });
    const response = await handler(request({ password: "wrong-password" }));
    assert.equal(response.status, expectedStatus);
    assert.deepEqual(await response.json(), { code: "login_failed" });
    assert.equal(calls.length, 1);
  }
});

test("non-admin sessions and failed permission checks are discarded", async () => {
  for (const options of [{ authorized: false }, { membershipStatus: 503 }]) {
    const { handler, calls } = backend(options);
    const response = await handler(request({ password: "test-password" }));
    assert.equal(response.status, options.authorized === false ? 401 : 503);
    assert.equal(Object.hasOwn(await response.json(), "access_token"), false);
    assert.match(calls.at(-1).url, /logout\?scope=local$/);
  }
});

test("invalid requests, untrusted origins and missing configuration fail before authentication", async () => {
  const { handler, calls } = backend();
  for (const body of [
    {},
    { password: "" },
    { password: 10 },
    { password: "a".repeat(5000) },
  ]) {
    assert.equal((await handler(request(body))).status, 400);
  }
  assert.equal(
    (
      await handler(
        request({ password: "test-password" }, "https://untrusted.example"),
      )
    ).status,
    403,
  );
  assert.equal(
    (await handler(new Request("https://test.example", { method: "GET" })))
      .status,
    405,
  );
  assert.equal(
    (
      await handler(
        new Request("https://test.example", {
          method: "OPTIONS",
          headers: { origin: "https://tlstmdtn.github.io" },
        }),
      )
    ).status,
    204,
  );
  assert.equal(calls.length, 0);
  const unconfigured = backend({ configured: false });
  assert.equal(
    (await unconfigured.handler(request({ password: "test-password" }))).status,
    503,
  );
  assert.equal(unconfigured.calls.length, 0);
});
