const userId = "10000000-0000-4000-8000-000000000001";
export const rows = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    created_at: "2026-10-09T09:20:00Z",
    name_age: "홍길동 / 21",
    university_major: "연세대학교 / 컴퓨터과학과",
    ai_tools: ["ChatGPT / Codex", "기타"],
    ai_other: "Perplexity",
    motivation:
      "=SUM(1,2)\n이 문자열도 수식이 아닌 지원자의 답변으로 보존되어야 합니다.",
    residence: "신촌역",
    contact: "010-1234-5678",
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    created_at: "2026-10-08T03:00:00Z",
    name_age: "김지원 / 23",
    university_major: "서울대학교 / 디자인학과",
    ai_tools: ["Claude"],
    ai_other: "",
    motivation: "나만의 포트폴리오를 만들고 싶어요.",
    residence: "서울대입구역",
    contact: "010-2222-3333",
  },
];

export async function mockBackend(
  page,
  { admin = true, failFirst = false } = {},
) {
  const submissions = [];
  let listRequests = 0;
  const user = {
    id: userId,
    aud: "authenticated",
    role: "authenticated",
    email: "admin@example.com",
    app_metadata: {},
    user_metadata: {},
    created_at: "2026-01-01T00:00:00Z",
  };
  const encode = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const token = `${encode({ alg: "HS256" })}.${encode({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600, role: "authenticated" })}.test-signature`;
  await page.route("https://aide-test.supabase.co/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const headers = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "content-type": "application/json",
    };
    if (route.request().method() === "OPTIONS")
      return route.fulfill({ status: 204, headers });
    if (path.endsWith("/rpc/submit_application")) {
      submissions.push(route.request().postDataJSON());
      if (failFirst && submissions.length === 1)
        return route.fulfill({
          status: 503,
          headers,
          body: JSON.stringify({ message: "Simulated outage" }),
        });
      return route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify([
          {
            application_id: submissions.at(-1).p_request_id,
            submitted_at: "2026-10-09T09:20:00Z",
          },
        ]),
      });
    }
    if (path.endsWith("/auth/v1/token"))
      return route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify({
          access_token: token,
          refresh_token: "test-refresh",
          expires_in: 3600,
          token_type: "bearer",
          user,
        }),
      });
    if (path.endsWith("/auth/v1/user"))
      return route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify(user),
      });
    if (path.endsWith("/auth/v1/logout"))
      return route.fulfill({ status: 204, headers });
    if (path.endsWith("/application_admins"))
      return route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify(admin ? [{ user_id: userId }] : []),
      });
    if (path.endsWith("/applications")) {
      listRequests += 1;
      return route.fulfill({
        status: admin ? 200 : 403,
        headers,
        body: JSON.stringify(admin ? rows : { message: "Forbidden" }),
      });
    }
    throw new Error(`Unexpected test API route: ${path}`);
  });
  return { submissions, listRequests: () => listRequests };
}

export async function fillApplication(page) {
  await page.goto("/apply/");
  await page.getByLabel("이름 / 나이", { exact: false }).fill("홍길동 / 21");
  await page
    .getByLabel("대학교 / 학과", { exact: false })
    .fill("연세대학교 / 컴퓨터과학과");
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await page.getByRole("checkbox", { name: /ChatGPT/ }).check();
  await page.getByRole("checkbox", { name: /기타/ }).check();
  await page.getByLabel("기타 AI 이름", { exact: true }).fill("Perplexity");
  await page
    .getByLabel("지원 동기", { exact: false })
    .fill("관심 있는 전시를 모아서 친구들과 나누는 웹사이트를 만들고 싶어요.");
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await page.getByLabel("거주지", { exact: false }).fill("신촌역");
  await page.getByLabel("연락처", { exact: false }).fill("010-1234-5678");
  await page.getByRole("checkbox", { name: /정보 제공에 동의/ }).check();
}
