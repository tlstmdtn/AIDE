import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  LoaderCircle,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import AdmissionsShell from "../components/AdmissionsShell";
import {
  AI_OPTIONS,
  SITE_BASE,
  admissionsConfigured,
  blankApplication,
  koreanTime,
  submitApplication,
  validateStep,
} from "../lib/admissions";

const steps = [
  {
    name: "기본 정보",
    caption: "먼저, 당신을 소개해 주세요.",
    description: "함께할 여러분에 대해 조금 더 알고 싶어요.",
  },
  {
    name: "AI와 나의 이야기",
    caption: "어떤 시작을 꿈꾸고 있나요?",
    description: "평소 사용하는 AI와 함께하고 싶은 이유를 들려주세요.",
  },
  {
    name: "연락 정보",
    caption: "함께할 준비, 거의 다 됐어요.",
    description: "만남을 준비하고 소식을 전할 수 있도록 알려주세요.",
  },
];

function Field({ id, label, hint, error, children }) {
  return (
    <div className={`admission-field ${error ? "has-error" : ""}`}>
      <label htmlFor={id}>
        {label}
        <span aria-hidden="true">*</span>
      </label>
      {hint && (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p className="field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ApplicationPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ ...blankApplication });
  const [errors, setErrors] = useState({});
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState("");
  const [receipt, setReceipt] = useState(null);
  const requestId = useRef(crypto.randomUUID());
  const inFlight = useRef(false);
  const heading = useRef(null);
  const fieldRefs = useRef({});
  const dirty = Object.values(form).some((value) =>
    Array.isArray(value) ? value.length : value.trim(),
  );

  useEffect(() => {
    if (!dirty || receipt) return;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, receipt]);
  useEffect(() => {
    if (step > 0) heading.current?.focus({ preventScroll: true });
  }, [step]);
  useEffect(() => {
    if (receipt) heading.current?.focus({ preventScroll: true });
  }, [receipt]);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setFailure("");
  }
  function inputProps(name) {
    return {
      id: name,
      name,
      value: form[name],
      required: true,
      ref: (node) => {
        fieldRefs.current[name] = node;
      },
      "aria-invalid": Boolean(errors[name]),
      "aria-describedby": errors[name] ? `${name}-error` : undefined,
      onChange: (e) => update(name, e.target.value),
    };
  }
  async function next(event) {
    event.preventDefault();
    if (inFlight.current) return;
    const nextErrors = validateStep(step, form, consent);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      fieldRefs.current[Object.keys(nextErrors)[0]]?.focus();
      return;
    }
    if (step < 2) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!admissionsConfigured) return;
    inFlight.current = true;
    setSubmitting(true);
    setFailure("");
    try {
      const result = await submitApplication(form, requestId.current);
      setReceipt(result);
      setForm({ ...blankApplication });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setFailure(error.message);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  if (receipt)
    return (
      <AdmissionsShell>
        <main className="application-success-page">
          <div className="application-success-card">
            <div className="receipt-check">
              <CheckCheck size={32} />
            </div>
            <div className="eyebrow section-eyebrow">A NEW BEGINNING</div>
            <h1 ref={heading} tabIndex={-1}>
              지원이 완료되었습니다.
            </h1>
            <p>
              아이디어를 현실로 만드는 여정에
              <br />
              함께해 주셔서 감사합니다.
            </p>
            <div className="receipt-details">
              <span>
                접수 시간 <b>{koreanTime(receipt.submitted_at)}</b>
              </span>
              <span>
                접수 번호 <b className="receipt-id">{receipt.application_id}</b>
              </span>
            </div>
            <p className="receipt-note">
              운영진이 신청 내용을 확인한 뒤 남겨주신 연락처로 안내드릴게요.
            </p>
            <a className="button button-blue" href={SITE_BASE}>
              AIDE 홈으로 돌아가기 <ArrowUpRight size={17} />
            </a>
          </div>
          <span className="success-footer-word">LET’S MAKE IT REAL.</span>
        </main>
      </AdmissionsShell>
    );

  return (
    <AdmissionsShell>
      <main className="application-layout">
        <aside className="application-intro">
          <div className="eyebrow">FROM IDEA TO WEBSITE</div>
          <h1>
            당신의 아이디어가 <br />
            시작되는 곳.
          </h1>
          <p>
            나만의 웹사이트를 만드는 3주. <br />
            첫걸음을 함께해요.
          </p>
          <ol className="application-steps" aria-label="신청 단계">
            {steps.map((item, i) => (
              <li
                className={`${step === i ? "current" : ""} ${step > i ? "completed" : ""}`}
                aria-current={step === i ? "step" : undefined}
                key={item.name}
              >
                <span className="step-indicator">
                  {step > i ? <Check size={16} /> : `0${i + 1}`}
                </span>
                <div>
                  <span>STEP 0{i + 1}</span>
                  <strong>{item.name}</strong>
                </div>
              </li>
            ))}
          </ol>
          <div className="intro-art" aria-hidden="true">
            <div className="intro-ring" />
            <div className="intro-orb" />
            <Sparkles />
          </div>
          <div className="intro-bottom">
            A LITTLE IDEA.
            <br />A REAL WEBSITE.
          </div>
        </aside>
        <section
          className="application-form-section"
          aria-labelledby="application-step-title"
        >
          <div className="form-step-top">
            <span>참여 신청</span>
            <span>
              0{step + 1} <b>/ 03</b>
            </span>
          </div>
          <div className="step-progress" aria-hidden="true">
            <span style={{ width: `${((step + 1) / 3) * 100}%` }} />
          </div>
          {!admissionsConfigured && (
            <div className="admission-notice" role="status">
              현재 신청 접수를 준비 중입니다. 양식을 살펴볼 수 있으며, 실제
              제출은 접수 연결 후 가능합니다.
            </div>
          )}
          <div className="form-step-heading">
            <span className="eyebrow section-eyebrow">STEP 0{step + 1}</span>
            <h2 id="application-step-title" ref={heading} tabIndex={-1}>
              {steps[step].caption}
            </h2>
            <p>{steps[step].description}</p>
          </div>
          <form onSubmit={next} noValidate className="admission-form">
            <div className="step-fields" key={step}>
              {step === 0 && (
                <>
                  <Field
                    id="name_age"
                    label="이름 / 나이"
                    error={errors.name_age}
                  >
                    <input
                      {...inputProps("name_age")}
                      placeholder="홍길동 / 21"
                      autoComplete="name"
                      maxLength={100}
                    />
                  </Field>
                  <Field
                    id="university_major"
                    label="대학교 / 학과"
                    error={errors.university_major}
                  >
                    <input
                      {...inputProps("university_major")}
                      placeholder="연세대학교 / 컴퓨터과학과"
                      maxLength={200}
                    />
                  </Field>
                  <div className="form-small-note">
                    <Sparkles size={16} />
                    <p>
                      잘하는 것보다, 만들고 싶은 마음이 중요해요.
                      <br />
                      편안하게 여러분의 이야기를 들려주세요.
                    </p>
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <fieldset
                    className="ai-fieldset"
                    aria-describedby={
                      errors.ai_tools ? "ai-tools-error" : "ai-tools-hint"
                    }
                  >
                    <legend>
                      자주 쓰는 AI <span>*</span>
                    </legend>
                    <p className="field-hint" id="ai-tools-hint">
                      여러 개를 선택해도 좋아요.
                    </p>
                    <div className="ai-options">
                      {AI_OPTIONS.slice(0, 3).map((tool, i) => (
                        <label
                          key={tool}
                          className={`ai-option ${form.ai_tools.includes(tool) ? "selected" : ""}`}
                        >
                          <input
                            type="checkbox"
                            value={tool}
                            checked={form.ai_tools.includes(tool)}
                            ref={
                              i === 0
                                ? (node) => {
                                    fieldRefs.current.ai_tools = node;
                                  }
                                : undefined
                            }
                            onChange={(e) => {
                              update(
                                "ai_tools",
                                e.target.checked
                                  ? [...form.ai_tools, tool]
                                  : form.ai_tools.filter((t) => t !== tool),
                              );
                              if (tool === "기타" && !e.target.checked)
                                update("ai_other", "");
                            }}
                          />
                          <span className="ai-option-mark" aria-hidden="true">
                            {i === 0
                              ? "✳"
                              : i === 1
                                ? "✦"
                                : i === 2
                                  ? "✴"
                                  : "+"}
                          </span>
                          <span>{tool}</span>
                          <span className="ai-option-check" aria-hidden="true">
                            {form.ai_tools.includes(tool) && (
                              <Check size={12} />
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                    <div className="ai-other-row">
                      <label
                        className={`ai-option ${form.ai_tools.includes("기타") ? "selected" : ""}`}
                      >
                        <input
                          type="checkbox"
                          value="기타"
                          checked={form.ai_tools.includes("기타")}
                          onChange={(e) => {
                            update(
                              "ai_tools",
                              e.target.checked
                                ? [...form.ai_tools, "기타"]
                                : form.ai_tools.filter(
                                    (tool) => tool !== "기타",
                                  ),
                            );
                            if (!e.target.checked) update("ai_other", "");
                          }}
                        />
                        <span className="ai-option-mark" aria-hidden="true">
                          +
                        </span>
                        <span>기타</span>
                        <span className="ai-option-check" aria-hidden="true">
                          {form.ai_tools.includes("기타") && (
                            <Check size={12} />
                          )}
                        </span>
                      </label>
                      {form.ai_tools.includes("기타") && (
                        <div className="other-ai-field">
                          <label className="sr-only" htmlFor="ai_other">
                            기타 AI 이름
                          </label>
                          <input
                            {...inputProps("ai_other")}
                            placeholder="사용하는 AI를 알려주세요"
                            maxLength={200}
                          />
                        </div>
                      )}
                    </div>
                    {errors.ai_tools && (
                      <p
                        className="field-error"
                        id="ai-tools-error"
                        role="alert"
                      >
                        {errors.ai_tools}
                      </p>
                    )}
                    {form.ai_tools.includes("기타") && errors.ai_other && (
                      <p
                        className="field-error"
                        id="ai_other-error"
                        role="alert"
                      >
                        {errors.ai_other}
                      </p>
                    )}
                  </fieldset>
                  <Field
                    id="motivation"
                    label="지원 동기"
                    hint="AIDE에서 해보고 싶은 것, 만들고 싶은 웹사이트를 자유롭게 적어주세요."
                    error={errors.motivation}
                  >
                    <textarea
                      {...inputProps("motivation")}
                      aria-describedby={
                        errors.motivation
                          ? "motivation-error"
                          : "motivation-hint"
                      }
                      placeholder="어떤 계기로 AIDE에 관심을 갖게 되었나요?"
                      rows={7}
                      maxLength={5000}
                    />
                    <span className="character-count">
                      {form.motivation.length.toLocaleString()} / 5,000
                    </span>
                  </Field>
                </>
              )}
              {step === 2 && (
                <>
                  <Field
                    id="residence"
                    label="거주지"
                    hint="상세 주소 대신 동네나 가까운 역을 적어주세요."
                    error={errors.residence}
                  >
                    <input
                      {...inputProps("residence")}
                      placeholder="신촌역"
                      maxLength={200}
                    />
                  </Field>
                  <Field
                    id="contact"
                    label="연락처"
                    hint="신청 확인과 참여 안내를 받을 수 있는 번호를 입력해 주세요."
                    error={errors.contact}
                  >
                    <input
                      {...inputProps("contact")}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="010-1234-5678"
                      maxLength={30}
                    />
                  </Field>
                  <div className="application-privacy">
                    <ShieldCheck size={19} />
                    <p>
                      작성한 정보는 AIDE 운영진이 신청 내용을 확인하고 참여를
                      안내하기 위해 확인합니다.
                    </p>
                  </div>
                  <label className="consent-label">
                    <input
                      type="checkbox"
                      checked={consent}
                      ref={(node) => {
                        fieldRefs.current.consent = node;
                      }}
                      aria-invalid={Boolean(errors.consent)}
                      aria-describedby={
                        errors.consent ? "consent-error" : undefined
                      }
                      onChange={(e) => {
                        setConsent(e.target.checked);
                        setErrors((current) => ({
                          ...current,
                          consent: undefined,
                        }));
                      }}
                    />
                    <span>신청 확인과 안내를 위한 정보 제공에 동의합니다.</span>
                  </label>
                  {errors.consent && (
                    <p className="field-error" id="consent-error" role="alert">
                      {errors.consent}
                    </p>
                  )}
                </>
              )}
            </div>
            {failure && (
              <div className="form-failure" role="alert">
                {failure}
              </div>
            )}
            <div className="application-form-bottom">
              <span className="required-caption">모든 항목은 필수예요.</span>
              <div>
                {step > 0 && (
                  <button
                    type="button"
                    className="button back-step"
                    disabled={submitting}
                    onClick={() => {
                      setStep(step - 1);
                      setErrors({});
                      setFailure("");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <ArrowLeft size={16} /> 이전
                  </button>
                )}
                <button
                  className="button button-blue next-step"
                  type="submit"
                  disabled={submitting || (step === 2 && !admissionsConfigured)}
                >
                  {submitting ? (
                    <>
                      <LoaderCircle size={17} className="spin" /> 제출 중
                    </>
                  ) : (
                    <>
                      {step === 2 ? "제출하기" : "다음"}{" "}
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </section>
      </main>
    </AdmissionsShell>
  );
}
