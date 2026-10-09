import { createClient } from "@supabase/supabase-js";

export const SITE_BASE = import.meta.env.BASE_URL;
export const AI_OPTIONS = ["ChatGPT / Codex", "Gemini", "Claude", "기타"];

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
export const admissionsConfigured = Boolean(
  url && /^https:\/\//.test(url) && publicKey,
);
export const supabase = admissionsConfigured
  ? createClient(url, publicKey, {
      auth: {
        persistSession: true,
        storage: window.sessionStorage,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export const blankApplication = {
  name_age: "",
  university_major: "",
  ai_tools: [],
  ai_other: "",
  motivation: "",
  residence: "",
  contact: "",
};

export function validateStep(step, form, consent = false) {
  const errors = {};
  if (step === 0) {
    if (!form.name_age.trim()) errors.name_age = "이름과 나이를 입력해 주세요.";
    if (!form.university_major.trim())
      errors.university_major = "대학교와 학과를 입력해 주세요.";
  }
  if (step === 1) {
    if (!form.ai_tools.length)
      errors.ai_tools = "자주 쓰는 AI를 하나 이상 선택해 주세요.";
    if (form.ai_tools.includes("기타") && !form.ai_other.trim())
      errors.ai_other = "사용하는 AI 이름을 입력해 주세요.";
    if (!form.motivation.trim())
      errors.motivation = "함께하고 싶은 이유를 들려주세요.";
  }
  if (step === 2) {
    if (!form.residence.trim())
      errors.residence = "거주 지역이나 가까운 역을 입력해 주세요.";
    if (
      !/^[+\d\s()-]+$/.test(form.contact) ||
      !/^\d{9,15}$/.test(form.contact.replace(/\D/g, ""))
    ) {
      errors.contact = "연락 가능한 전화번호를 확인해 주세요.";
    }
    if (!consent)
      errors.consent = "신청 확인과 안내를 위한 정보 제공에 동의해 주세요.";
  }
  return errors;
}

export async function submitApplication(form, requestId) {
  if (!supabase)
    throw new Error("접수 연결을 준비 중입니다. 잠시 후 다시 방문해 주세요.");
  const { data, error } = await supabase.rpc("submit_application", {
    p_request_id: requestId,
    p_name_age: form.name_age.trim(),
    p_university_major: form.university_major.trim(),
    p_ai_tools: form.ai_tools,
    p_ai_other: form.ai_tools.includes("기타") ? form.ai_other.trim() : "",
    p_motivation: form.motivation.trim(),
    p_residence: form.residence.trim(),
    p_contact: form.contact.trim(),
    p_consent: true,
  });
  if (error) {
    if (error.code === "22023" || error.code === "23514")
      throw new Error("입력 내용을 다시 확인해 주세요.");
    throw new Error(
      "제출을 완료하지 못했어요. 작성 내용은 유지되어 있으니 잠시 후 다시 시도해 주세요.",
    );
  }
  const receipt = data?.[0];
  if (!receipt?.application_id || !receipt?.submitted_at)
    throw new Error("접수 확인을 받지 못했어요. 다시 제출해 주세요.");
  return receipt;
}

export async function isApplicationAdmin(userId) {
  const { data, error } = await supabase
    .from("application_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error)
    throw new Error("관리자 권한을 확인하지 못했어요. 다시 로그인해 주세요.");
  return Boolean(data);
}

export async function fetchApplications() {
  const rows = new Map();
  let cursor = null;
  const batch = 500;
  while (true) {
    let query = supabase
      .from("applications")
      .select(
        "id,created_at,name_age,university_major,ai_tools,ai_other,motivation,residence,contact",
      )
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(batch);
    // Cursor pagination keeps new submissions from shifting previously loaded pages.
    if (cursor)
      query = query.or(
        `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
      );
    const { data, error } = await query;
    if (error)
      throw new Error(
        "신청 내역을 불러오지 못했어요. 잠시 후 새로고침해 주세요.",
      );
    for (const row of data) rows.set(row.id, row);
    if (data.length < batch) return [...rows.values()];
    cursor = data[data.length - 1];
  }
}

export function koreanDate(value) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function koreanTime(value) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

export function aiSummary(row) {
  return row.ai_tools
    .map((tool) => (tool === "기타" ? `기타: ${row.ai_other}` : tool))
    .join(", ");
}

export async function downloadApplications(rows) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AIDE";
  const sheet = workbook.addWorksheet("스터디 신청 내역", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = [
    { header: "접수 시간 (한국)", key: "submitted", width: 24 },
    { header: "이름 / 나이", key: "name_age", width: 22 },
    { header: "대학교 / 학과", key: "university_major", width: 30 },
    { header: "자주 쓰는 AI", key: "ai", width: 36 },
    { header: "지원 동기", key: "motivation", width: 70 },
    { header: "거주지", key: "residence", width: 24 },
    { header: "연락처", key: "contact", width: 24 },
    { header: "접수 번호", key: "id", width: 40 },
  ];
  rows.forEach((row) =>
    sheet.addRow({
      ...row,
      submitted: koreanTime(row.created_at),
      ai: aiSummary(row),
    }),
  );
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2057DC" },
  };
  sheet.getRow(1).height = 28;
  sheet.eachRow((row, index) => {
    row.alignment = { vertical: "top", wrapText: true };
    if (index > 1) row.height = 48;
  });
  sheet.autoFilter = { from: "A1", to: "H1" };
  // ExcelJS stores answers as string cells; user input never becomes an Excel formula.
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `AIDE-신청내역-${koreanDate(new Date())}.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
