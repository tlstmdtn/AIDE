import { test, expect } from "@playwright/test";
import ExcelJS from "exceljs";

import { rows, mockBackend, fillApplication } from "./helpers/admissions";

test("intake stays closed until the server is ready and can be retried without losing answers", async ({
  page,
}) => {
  const backend = await mockBackend(page, { intakeReady: false });
  await fillApplication(page);
  await expect(page.getByRole("status")).toContainText("신청 접수를 준비 중");
  await expect(
    page.getByRole("button", { name: "제출하기", exact: true }),
  ).toBeDisabled();
  expect(backend.submissions).toHaveLength(0);
  await page.unroute("https://aide-test.supabase.co/**");
  await mockBackend(page);
  await page.getByRole("button", { name: "연결 다시 확인" }).click();
  await expect(
    page.getByRole("button", { name: "제출하기", exact: true }),
  ).toBeEnabled();
  await expect(page.getByLabel("연락처", { exact: false })).toHaveValue(
    "010-1234-5678",
  );
});

test("three-step form validates fields, retains previous answers and requires other-AI text", async ({
  page,
}) => {
  await mockBackend(page);
  await page.goto("/apply/");
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await expect(page.getByText("이름과 나이를 입력해 주세요.")).toBeVisible();
  await page.getByLabel("이름 / 나이", { exact: false }).fill("홍길동 / 21");
  await page
    .getByLabel("대학교 / 학과", { exact: false })
    .fill("연세대학교 / 컴퓨터과학과");
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await page.getByRole("checkbox", { name: /기타/ }).check();
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await expect(
    page.getByText("사용하는 AI 이름을 입력해 주세요."),
  ).toBeVisible();
  await page.getByRole("button", { name: "이전", exact: true }).click();
  await expect(page.getByLabel("이름 / 나이", { exact: false })).toHaveValue(
    "홍길동 / 21",
  );
});

test("submission shows success only after server receipt and safely retries failed requests", async ({
  page,
}) => {
  const backend = await mockBackend(page, { failFirst: true });
  await fillApplication(page);
  await page.getByRole("button", { name: "제출하기", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "제출을 완료하지 못했어요",
  );
  await expect(
    page.getByRole("heading", { name: "지원이 완료되었습니다." }),
  ).toHaveCount(0);
  await expect(page.getByLabel("연락처", { exact: false })).toHaveValue(
    "010-1234-5678",
  );
  await page.getByRole("button", { name: "제출하기", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "지원이 완료되었습니다." }),
  ).toBeVisible();
  expect(backend.submissions).toHaveLength(2);
  expect(backend.submissions[0].p_request_id).toBe(
    backend.submissions[1].p_request_id,
  );
  expect(backend.submissions[1]).toMatchObject({
    p_ai_tools: ["ChatGPT / Codex", "기타"],
    p_ai_other: "Perplexity",
    p_residence: "신촌역",
    p_consent: true,
  });
  await expect(page.getByText("2026-10-09 18:20:00")).toBeVisible();
});

test("five logo presses navigate to the protected admin page", async ({
  page,
}) => {
  const backend = await mockBackend(page);
  await page.goto("/apply/");
  const logo = page.getByRole("button", { name: "AIDE", exact: true });
  for (let i = 0; i < 4; i += 1) await logo.click();
  await expect(page).toHaveURL(/\/apply\/$/);
  await logo.click();
  await expect(page).toHaveURL(/\/admin\/$/);
  await expect(
    page.getByRole("button", { name: "관리자 로그인" }),
  ).toBeVisible();
  expect(backend.listRequests()).toBe(0);
});

test("admin can search, read full answers, export Excel safely, and sign out", async ({
  page,
}) => {
  await mockBackend(page);
  await page.goto("/admin/");
  await page.getByLabel("이메일", { exact: true }).fill("admin@example.com");
  await page
    .getByLabel("비밀번호", { exact: true })
    .fill("not-a-real-password");
  await page.getByRole("button", { name: "관리자 로그인" }).click();
  await expect(
    page.getByRole("heading", { name: "스터디 신청 관리" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "홍길동 / 21", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "홍길동 / 21", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(rows[0].motivation);
  await page.keyboard.press("Escape");
  await page.getByRole("searchbox", { name: "신청 내역 검색" }).fill("연세");
  await expect(
    page.getByRole("button", { name: "김지원 / 23", exact: true }),
  ).toHaveCount(0);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "엑셀 다운로드" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(await download.path());
  const sheet = workbook.worksheets[0];
  expect(sheet.rowCount).toBe(2);
  expect(sheet.getCell("A2").value).toBe("2026-10-09 18:20:00");
  expect(sheet.getCell("E2").value).toBe(rows[0].motivation);
  expect(sheet.getCell("G2").value).toBe("010-1234-5678");
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "관리자 로그인" }),
  ).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
});

test("authenticated non-admin sees no private application data", async ({
  page,
}) => {
  const backend = await mockBackend(page, { admin: false });
  await page.goto("/admin/");
  await page.getByLabel("이메일", { exact: true }).fill("member@example.com");
  await page
    .getByLabel("비밀번호", { exact: true })
    .fill("not-a-real-password");
  await page.getByRole("button", { name: "관리자 로그인" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "관리자 권한이 없는 계정",
  );
  expect(backend.listRequests()).toBe(0);
});

test("application fits small screens throughout all three steps", async ({
  page,
}) => {
  await mockBackend(page);
  await page.setViewportSize({ width: 320, height: 740 });
  await fillApplication(page);
  for (let step = 2; step >= 0; step -= 1) {
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (step > 0)
      await page.getByRole("button", { name: "이전", exact: true }).click();
  }
});
