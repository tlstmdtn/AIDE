import { test, expect } from "@playwright/test";

test("curriculum tabs and FAQ expose the requested content", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "웹사이트가 되는 순간",
  );
  await page.getByRole("tab", { name: /WEEK 02/ }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "버튼 · 링크 · 입력 폼의 실제 동작 확인하기",
  );
  await page.getByRole("tab", { name: /WEEK 02/ }).press("ArrowRight");
  await expect(page.getByRole("tab", { name: /WEEK 03/ })).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText(
    "개선 사항 반영하고 최종 배포하기",
  );
  const faq = page.getByRole("button", {
    name: /개발 경험이 없어도 참여할 수 있나요/,
  });
  await faq.click();
  await expect(faq).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#faq-answer-0")).toBeVisible();
  await faq.click();
  await expect(page.locator("#faq-answer-0")).toBeHidden();
  expect(errors).toEqual([]);
});

test("application drafts persist, download, restore and can be deleted", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "참여 신청", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("이름", { exact: true }).fill("테스트 참여자");
  await page
    .getByLabel("이메일", { exact: true })
    .fill("participant@example.com");
  await page
    .getByLabel("만들고 싶은 웹사이트", { exact: true })
    .fill("좋아하는 전시를 모아보는 웹사이트");
  await page.getByRole("button", { name: "신청서 저장하기" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "아직 스터디 접수가 완료된 것은 아니에요.",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "신청서 다운로드" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("AIDE-신청서.txt");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    page.getByRole("button", { name: "참여 신청", exact: true }),
  ).toBeFocused();
  await page.reload();
  await page.getByRole("button", { name: "참여 신청", exact: true }).click();
  await expect(page.getByLabel("이름", { exact: true })).toHaveValue(
    "테스트 참여자",
  );
  await expect(
    page.getByLabel("만들고 싶은 웹사이트", { exact: true }),
  ).toHaveValue("좋아하는 전시를 모아보는 웹사이트");
  await page.getByRole("button", { name: "저장된 내용 삭제하기" }).click();
  await expect(page.getByLabel("이름", { exact: true })).toHaveValue("");
  expect(
    await page.evaluate(() => localStorage.getItem("aide-application")),
  ).toBeNull();
});

test("project details and contact dialog work with keyboard navigation", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /나를 보여주는 포트폴리오/ }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "프로젝트 갤러리와 상세 페이지",
  );
  await page.keyboard.press("Shift+Tab");
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "나의 아이디어 시작하기" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "닫기", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "다른 질문이 있어요" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "공식 문의 채널은 준비 중입니다.",
  );
  await page.getByRole("link", { name: "자주 묻는 질문 확인하기" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  expect(new URL(page.url()).hash).toBe("#faq");
});

test("mobile navigation, sections and form fit the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  await page.getByRole("link", { name: "커리큘럼", exact: true }).click();
  await expect(page.getByRole("button", { name: "메뉴 열기" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  expect(new URL(page.url()).hash).toBe("#curriculum");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflows, `No horizontal overflow at ${width}px`).toBe(false);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "참여 신청", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const rect = await page.getByRole("dialog").boundingBox();
  expect(rect.x).toBeGreaterThanOrEqual(0);
  expect(rect.x + rect.width).toBeLessThanOrEqual(390);
});

test("scroll animations reveal sections as they enter the viewport", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const section = page.locator("#projects .section-top");
  await section.scrollIntoViewIfNeeded();
  await expect(section).toHaveClass(/visible/);
  await expect(section).toHaveCSS("opacity", "1");
});
