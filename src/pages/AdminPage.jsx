import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Download,
  FileText,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import AdmissionsShell from "../components/AdmissionsShell";
import {
  AI_OPTIONS,
  admissionsConfigured,
  aiSummary,
  downloadApplications,
  fetchApplications,
  isApplicationAdmin,
  koreanDate,
  koreanTime,
  supabase,
} from "../lib/admissions";

function ApplicationDetail({ application, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const escape = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", escape);
      previousFocus?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="admin-detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="applicant-name"
      >
        <button
          ref={ref}
          className="icon-button modal-close"
          onClick={onClose}
          aria-label="상세 내용 닫기"
        >
          <X size={20} />
        </button>
        <div className="eyebrow section-eyebrow">APPLICATION DETAILS</div>
        <h2 id="applicant-name">{application.name_age}</h2>
        <p className="detail-timestamp">
          {koreanTime(application.created_at)} 접수 · 한국 시간
        </p>
        <dl>
          {[
            ["대학교 / 학과", application.university_major],
            ["자주 쓰는 AI", aiSummary(application)],
            ["거주지", application.residence],
            ["연락처", application.contact],
            ["지원 동기", application.motivation],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <span className="detail-id">접수 번호 {application.id}</span>
      </section>
    </div>
  );
}

export default function AdminPage() {
  const [session, setSession] = useState(undefined);
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(admissionsConfigured);
  const [authError, setAuthError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [lastLoaded, setLastLoaded] = useState(null);
  const [search, setSearch] = useState("");
  const [tool, setTool] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [exporting, setExporting] = useState(false);
  const requestVersion = useRef(0);
  const closeDetail = useCallback(() => setSelected(null), []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error)
        setAuthError("로그인 상태를 확인하지 못했어요. 다시 로그인해 주세요.");
      setSession(data.session || null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (active) setSession(nextSession);
      },
    );
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;
    requestVersion.current += 1;
    setAuthorized(false);
    setRows([]);
    setSelected(null);
    setLastLoaded(null);
    if (!session) {
      if (session !== undefined) setChecking(false);
      return;
    }
    setChecking(true);
    isApplicationAdmin(session.user.id)
      .then((isAdmin) => {
        if (!active) return;
        setAuthorized(isAdmin);
        if (!isAdmin)
          setAuthError(
            "관리자 권한이 없는 계정입니다. 운영진 계정으로 로그인해 주세요.",
          );
      })
      .catch((error) => {
        if (active) setAuthError(error.message);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [session]);

  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setLoadError("");
    try {
      const applications = await fetchApplications();
      if (version !== requestVersion.current) return;
      setRows(applications);
      setLastLoaded(new Date());
      setPage(0);
    } catch (error) {
      if (version === requestVersion.current) setLoadError(error.message);
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (authorized) refresh();
  }, [authorized, refresh]);

  async function login(event) {
    event.preventDefault();
    if (!supabase || signingIn) return;
    setSigningIn(true);
    setAuthError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error)
        setAuthError("로그인하지 못했어요. 이메일과 비밀번호를 확인해 주세요.");
      else setPassword("");
    } catch {
      setAuthError("연결을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setSigningIn(false);
    }
  }
  async function logout() {
    requestVersion.current += 1;
    setRows([]);
    setAuthorized(false);
    setSelected(null);
    setSession(null);
    setPassword("");
    await supabase.auth.signOut({ scope: "local" });
  }

  const dateError = from && to && from > to;
  const filtered = useMemo(() => {
    if (dateError) return [];
    const term = search.toLocaleLowerCase().trim();
    return rows.filter((row) => {
      const day = koreanDate(row.created_at);
      return (
        (!term ||
          [
            row.name_age,
            row.university_major,
            aiSummary(row),
            row.motivation,
            row.residence,
            row.contact,
          ].some((value) => value.toLocaleLowerCase().includes(term))) &&
        (!tool || row.ai_tools.includes(tool)) &&
        (!from || day >= from) &&
        (!to || day <= to)
      );
    });
  }, [rows, search, tool, from, to, dateError]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 20));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleRows = filtered.slice(currentPage * 20, (currentPage + 1) * 20);
  const todayCount = rows.filter(
    (row) => koreanDate(row.created_at) === koreanDate(new Date()),
  ).length;

  if (checking)
    return (
      <AdmissionsShell admin>
        <main className="admissions-loading" role="status">
          <LoaderCircle className="spin" size={28} />
          <p>관리자 권한을 확인하고 있어요.</p>
        </main>
      </AdmissionsShell>
    );
  if (!authorized)
    return (
      <AdmissionsShell admin>
        <main className="admin-login-layout">
          <section className="admin-login-card">
            <div className="admin-lock">
              <LockKeyhole size={27} />
            </div>
            <div className="eyebrow section-eyebrow">AIDE ADMIN</div>
            <h1>
              함께할 사람들의
              <br />
              이야기를 만나보세요.
            </h1>
            <p>운영진 계정으로 로그인해 주세요.</p>
            {!admissionsConfigured && (
              <div className="admission-notice" role="status">
                관리자 서비스 연결을 준비 중입니다. 연결 완료 후 로그인할 수
                있습니다.
              </div>
            )}
            <form onSubmit={login}>
              <div className="admission-field">
                <label htmlFor="admin-email">이메일</label>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  placeholder="운영진 이메일"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="admission-field">
                <label htmlFor="admin-password">비밀번호</label>
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력해 주세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {authError && (
                <p className="form-failure" role="alert">
                  {authError}
                </p>
              )}
              <button
                className="button button-blue admin-login-submit"
                disabled={!admissionsConfigured || signingIn}
              >
                {signingIn ? (
                  <LoaderCircle className="spin" size={17} />
                ) : (
                  <>
                    관리자 로그인 <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
            {session && (
              <button className="text-button" onClick={logout}>
                현재 계정 로그아웃
              </button>
            )}
            <span className="admin-login-note">
              <ShieldCheck size={14} /> 신청 정보는 권한이 있는 운영진만 확인할
              수 있습니다.
            </span>
          </section>
        </main>
      </AdmissionsShell>
    );

  return (
    <AdmissionsShell admin>
      <main className="admin-dashboard">
        <div className="admin-heading">
          <div>
            <div className="eyebrow section-eyebrow">
              THE PEOPLE BEHIND THE IDEAS
            </div>
            <h1>스터디 신청 관리</h1>
            <p>AIDE와 함께할 사람들의 이야기를 한곳에서 확인하세요.</p>
          </div>
          <div className="admin-account">
            <span>{session.user.email}</span>
            <button onClick={logout}>
              <LogOut size={14} /> 로그아웃
            </button>
          </div>
        </div>
        <div className="admin-stats">
          {[
            { icon: Users, label: "전체 신청", value: rows.length },
            { icon: CalendarDays, label: "오늘 접수", value: todayCount },
            { icon: FileText, label: "검색 결과", value: filtered.length },
          ].map((item) => (
            <div className="admin-stat" key={item.label}>
              <item.icon size={20} />
              <span>{item.label}</span>
              <strong>
                {loading && !lastLoaded ? "—" : item.value.toLocaleString()}
                <small>명</small>
              </strong>
            </div>
          ))}
        </div>
        <section className="admin-table-section" aria-label="신청 내역">
          <div className="admin-table-heading">
            <div>
              <h2>
                신청 내역 <span>{filtered.length}</span>
              </h2>
              <p>
                {lastLoaded
                  ? `${koreanTime(lastLoaded)} 기준 · 한국 시간`
                  : "접수 시간은 한국 시간으로 표시합니다."}
              </p>
            </div>
            <div className="admin-table-actions">
              <button
                className="button button-light"
                disabled={loading}
                onClick={refresh}
              >
                <RefreshCw size={14} className={loading ? "spin" : ""} />{" "}
                새로고침
              </button>
              <button
                className="button button-blue"
                disabled={
                  !filtered.length || loading || exporting || Boolean(loadError)
                }
                onClick={async () => {
                  setExporting(true);
                  try {
                    await downloadApplications(filtered);
                  } catch {
                    setLoadError(
                      "엑셀 파일을 만들지 못했어요. 다시 시도해 주세요.",
                    );
                  } finally {
                    setExporting(false);
                  }
                }}
              >
                {exporting ? (
                  <LoaderCircle size={14} className="spin" />
                ) : (
                  <Download size={14} />
                )}{" "}
                엑셀 다운로드
              </button>
            </div>
          </div>
          <div className="admin-filters">
            <label className="admin-search">
              <Search size={16} />
              <input
                type="search"
                aria-label="신청 내역 검색"
                placeholder="이름, 학교, 연락처, 지원 동기 검색"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </label>
            <label className="filter-select">
              <span className="sr-only">AI 도구 필터</span>
              <select
                aria-label="AI 도구 필터"
                value={tool}
                onChange={(e) => {
                  setTool(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">모든 AI 도구</option>
                {AI_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <div className="admin-date-filters">
              <input
                type="date"
                aria-label="접수 시작일"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(0);
                }}
              />
              <span>—</span>
              <input
                type="date"
                aria-label="접수 종료일"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            {(search || tool || from || to) && (
              <button
                className="filter-reset"
                onClick={() => {
                  setSearch("");
                  setTool("");
                  setFrom("");
                  setTo("");
                  setPage(0);
                }}
              >
                초기화
              </button>
            )}
          </div>
          {dateError && (
            <p className="admin-inline-error" role="alert">
              종료일은 시작일과 같거나 이후여야 합니다.
            </p>
          )}
          {loadError && (
            <p className="admin-inline-error" role="alert">
              {loadError}
            </p>
          )}
          <div
            className="applications-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="신청 내역 표, 좌우로 스크롤 가능"
          >
            <table className="applications-table">
              <thead>
                <tr>
                  <th scope="col">이름 / 나이</th>
                  <th scope="col">접수 시간 ↧</th>
                  <th scope="col">대학교 / 학과</th>
                  <th scope="col">자주 쓰는 AI</th>
                  <th scope="col">지원 동기</th>
                  <th scope="col">거주지</th>
                  <th scope="col">연락처</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row">
                      <button
                        className="applicant-detail-button"
                        onClick={() => setSelected(row)}
                      >
                        {row.name_age}
                        <ArrowUpRight size={14} />
                      </button>
                    </th>
                    <td className="table-time">{koreanTime(row.created_at)}</td>
                    <td>{row.university_major}</td>
                    <td>
                      <div className="table-ai-tags">
                        {row.ai_tools.map((ai) => (
                          <span key={ai}>
                            {ai === "기타" ? row.ai_other : ai}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <button
                        className="motivation-preview"
                        onClick={() => setSelected(row)}
                        aria-label={`${row.name_age} 지원 동기 전체 보기`}
                      >
                        {row.motivation}
                      </button>
                    </td>
                    <td>{row.residence}</td>
                    <td className="table-contact">{row.contact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visibleRows.length && (
              <div className="admin-empty" role="status">
                {loading ? (
                  <>
                    <LoaderCircle className="spin" size={27} />
                    <h3>신청 내역을 불러오고 있어요.</h3>
                  </>
                ) : loadError ? (
                  <>
                    <FileText size={28} />
                    <h3>신청 내역을 불러오지 못했어요.</h3>
                    <p>새로고침을 눌러 다시 시도해 주세요.</p>
                  </>
                ) : (
                  <>
                    <FileText size={28} />
                    <h3>
                      {rows.length
                        ? "조건에 맞는 신청이 없어요."
                        : "아직 접수된 신청이 없어요."}
                    </h3>
                    <p>
                      {rows.length
                        ? "검색어나 기간을 바꿔보세요."
                        : "신청서가 제출되면 이곳에 표시됩니다."}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="admin-table-footer">
            <span>
              총 {filtered.length.toLocaleString()}건 · 검색 결과 전체를 엑셀로
              내려받습니다.
            </span>
            <div>
              <button
                aria-label="이전 목록"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                <ArrowLeft size={15} />
              </button>
              <span>
                {currentPage + 1} / {pageCount}
              </span>
              <button
                aria-label="다음 목록"
                disabled={currentPage >= pageCount - 1}
                onClick={() => setPage(currentPage + 1)}
              >
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </section>
        <p className="admin-bottom-note">
          <ShieldCheck size={14} /> 신청자의 개인정보가 포함되어 있습니다.
          내려받은 파일은 운영진 내에서 안전하게 관리해 주세요.
        </p>
      </main>
      {selected && (
        <ApplicationDetail application={selected} onClose={closeDetail} />
      )}
    </AdmissionsShell>
  );
}
