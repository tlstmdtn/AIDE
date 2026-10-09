import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

let db;
const admin = "10000000-0000-4000-8000-000000000001";
const member = "10000000-0000-4000-8000-000000000002";
const id = "20000000-0000-4000-8000-000000000001";
const args = [
  id,
  "홍길동 / 21",
  "연세대학교 / 컴퓨터과학과",
  ["ChatGPT / Codex", "기타"],
  "Perplexity",
  "친구들과 함께 웹사이트를 완성하고 싶어요.",
  "신촌역",
  "010-1234-5678",
  true,
];
const submit = (values) =>
  db.query(
    "select * from public.submit_application($1::uuid,$2,$3,$4::text[],$5,$6,$7,$8,$9)",
    values,
  );

before(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    grant usage on schema public, auth to anon, authenticated;
    insert into auth.users values ('${admin}'), ('${member}');
  `);
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202610090001_admissions.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.query("insert into public.application_admins values ($1::uuid)", [
    admin,
  ]);
});
after(async () => {
  await db?.close();
});

test("anonymous submission returns a server receipt and retry does not duplicate data", async () => {
  await db.exec("set role anon");
  try {
    const first = (await submit(args)).rows[0];
    const retry = (await submit(args)).rows[0];
    assert.equal(first.application_id, id);
    assert.ok(first.submitted_at);
    assert.deepEqual(retry, first);
    await assert.rejects(
      db.query("select * from public.applications"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("delete from public.applications"),
      /permission denied/,
    );
  } finally {
    await db.exec("reset role");
  }
  assert.equal(
    (await db.query("select count(*)::int as count from applications")).rows[0]
      .count,
    1,
  );
});

test("server rejects missing consent, missing other-AI detail, duplicate tools, malformed phone and changed retries", async () => {
  const invalidCases = [
    args.map((v, i) => (i === 8 ? false : v)),
    args.map((v, i) => (i === 4 ? "" : v)),
    args.map((v, i) => (i === 3 ? ["Claude", "Claude"] : v)),
    args.map((v, i) => (i === 7 ? "call-me" : v)),
    args.map((v, i) => (i === 5 ? "changed content" : v)),
  ];
  await db.exec("set role anon");
  try {
    for (const values of invalidCases) await assert.rejects(submit(values));
  } finally {
    await db.exec("reset role");
  }
});

test("a signed-in non-admin cannot read submissions or grant their own admin access", async () => {
  await db.exec(
    `set role authenticated; set request.jwt.claim.sub = '${member}'`,
  );
  try {
    assert.deepEqual(
      (await db.query("select * from public.applications")).rows,
      [],
    );
    assert.deepEqual(
      (await db.query("select * from public.application_admins")).rows,
      [],
    );
    await assert.rejects(
      db.query("insert into public.application_admins values ($1::uuid)", [
        member,
      ]),
      /permission denied/,
    );
  } finally {
    await db.exec("reset role");
  }
});

test("registered admin can read full answers but cannot modify submissions from the browser role", async () => {
  await db.exec(
    `set role authenticated; set request.jwt.claim.sub = '${admin}'`,
  );
  try {
    const rows = (await db.query("select * from public.applications")).rows;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].ai_other, "Perplexity");
    assert.equal(rows[0].contact, "010-1234-5678");
    assert.equal(rows[0].motivation, args[5]);
    await assert.rejects(
      db.query("update public.applications set residence = 'changed'"),
      /permission denied/,
    );
  } finally {
    await db.exec("reset role");
  }
});
