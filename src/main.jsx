import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/noto-sans-kr";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  Plus,
  Minus,
  X,
  Check,
  Menu,
  Sparkles,
  MousePointer2,
  Globe2,
  Layers3,
  Code2,
  Lightbulb,
  Laptop,
  MapPin,
  Users,
  CalendarDays,
} from "lucide-react";
import "./styles.css";

const APPLICATION_URL = `${import.meta.env.BASE_URL}apply/`;
const ApplicationPage = React.lazy(() => import("./pages/ApplicationPage"));
const AdminPage = React.lazy(() => import("./pages/AdminPage"));

const weeks = [
  {
    label: "아이디어를 설계로",
    title: (
      <>
        막연한 생각을,
        <br />
        구체적인 첫 화면으로.
      </>
    ),
    description:
      "누가, 어떤 목적으로 사용할 웹사이트인지 정의해요. 꼭 필요한 기능과 사용자 흐름을 정리하고, AI와 함께 첫 화면을 만들어봅니다.",
    tasks: [
      "사용 대상과 웹사이트의 목적 정의하기",
      "핵심 기능 · 페이지 구조 · 사용자 흐름 설계하기",
      "AI가 실행할 수 있는 요청을 작성하고 첫 화면 구현하기",
    ],
    results: ["웹사이트 기획안", "페이지 구조", "첫 화면 구현"],
    tag: "01",
    art: "plan",
  },
  {
    label: "화면을 작동하게",
    title: (
      <>
        보이는 화면에서,
        <br />
        작동하는 웹사이트로.
      </>
    ),
    description:
      "기획한 구조를 바탕으로 주요 페이지와 핵심 기능을 구현해요. PC와 모바일을 오가며 화면을 살펴보고, 발견한 오류를 AI와 함께 해결합니다.",
    tasks: [
      "주요 페이지와 핵심 기능 구현하기",
      "버튼 · 링크 · 입력 폼의 실제 동작 확인하기",
      "PC와 모바일 화면 점검하고 오류 수정하기",
    ],
    results: ["핵심 기능 구현", "반응형 화면", "오류 수정"],
    tag: "02",
    art: "build",
  },
  {
    label: "세상에 공개하기",
    title: (
      <>
        우리의 피드백으로,
        <br />더 나은 완성까지.
      </>
    ),
    description:
      "서로의 웹사이트를 직접 사용하고 피드백을 나눠요. 개선 사항을 반영해 세상에 공개하고, 제작 과정과 문제 해결 경험을 정리합니다.",
    tasks: [
      "디자인 · 기능 · 사용성 피드백 나누기",
      "개선 사항 반영하고 최종 배포하기",
      "프로젝트 소개와 AI 활용 경험 정리하기",
    ],
    results: ["웹사이트 배포", "프로젝트 소개", "제작 과정 정리"],
    tag: "03",
    art: "launch",
  },
];
const projects = [
  {
    name: "나를 보여주는 포트폴리오",
    category: "PERSONAL BRANDING",
    type: "portfolio",
    description: "프로젝트와 경험을 나답게 소개하는 공간.",
    detail:
      "소개, 프로젝트, 경험, 연락처를 하나의 흐름으로 연결해요. 나만의 색과 타이포그래피로 개성을 표현하고, 모바일에서도 읽기 편한 포트폴리오를 만들 수 있어요.",
    features: [
      "나를 소개하는 메인 화면",
      "프로젝트 갤러리와 상세 페이지",
      "반응형 레이아웃",
    ],
  },
  {
    name: "마음을 움직이는 랜딩 페이지",
    category: "BRAND & SERVICE",
    type: "brand",
    description: "브랜드의 가치가 한눈에 전달되는 웹사이트.",
    detail:
      "내가 좋아하는 브랜드나 새롭게 떠올린 서비스를 소개해요. 방문자가 가치를 이해하고 다음 행동으로 이어질 수 있도록 정보와 시각 요소를 설계합니다.",
    features: [
      "브랜드를 담은 비주얼",
      "서비스 소개와 핵심 가치",
      "신청 또는 문의 동선",
    ],
  },
  {
    name: "취향을 모은 큐레이션",
    category: "CURATION",
    type: "curation",
    description: "좋아하는 것들을 모아, 더 쉽게 발견하도록.",
    detail:
      "책, 음악, 전시처럼 관심 있는 분야의 정보를 모아요. 카테고리와 필터를 활용해 방문자가 원하는 정보를 쉽게 발견할 수 있는 탐색 경험을 만듭니다.",
    features: ["카드형 콘텐츠 목록", "카테고리별 탐색", "콘텐츠 상세 정보"],
  },
  {
    name: "일상을 바꾸는 작은 서비스",
    category: "LIFE & PRODUCTIVITY",
    type: "utility",
    description: "작은 불편함에서 시작하는 유용한 아이디어.",
    detail:
      "일정 관리나 체크리스트처럼 일상에 필요한 기능을 직접 만들어요. 한 가지 문제에 집중하고, 입력과 저장 등 핵심 동작을 완성해봅니다.",
    features: [
      "간편한 입력 폼",
      "할 일과 일정 관리",
      "사용하기 쉬운 모바일 화면",
    ],
  },
];
const faqs = [
  [
    "개발 경험이 없어도 참여할 수 있나요?",
    "개발 경험보다 직접 만들어보고 싶은 아이디어와 배우려는 마음이 중요해요. AI를 활용해 기획부터 구현까지 경험하는 스터디이며, 모르는 부분은 함께 질문하고 해결해 나갑니다.",
  ],
  [
    "어떤 웹사이트를 만들게 되나요?",
    "개인 포트폴리오, 브랜드 소개, 정보 큐레이션, 생활 편의 서비스 등 자유롭게 정할 수 있어요. 3주 안에 완성할 수 있도록 핵심 기능에 집중하는 것을 권장합니다.",
  ],
  [
    "언제, 어디서 만나나요?",
    "서울 지역의 스터디룸에서 3주간 주 1회, 총 3회 만납니다. 구체적인 날짜와 장소는 모집 안내가 확정되면 별도로 안내할 예정입니다.",
  ],
  [
    "준비물과 참여 비용이 있나요?",
    "개인 노트북을 준비해 주세요. 스터디룸 대관비와 AI 도구 사용 비용의 부담 방식은 아직 확정되지 않았으며, 신청 전에 안내될 예정입니다.",
  ],
];

function Mark({ small = false }) {
  return (
    <a
      className={`wordmark ${small ? "small" : ""}`}
      href="#home"
      aria-label="AIDE 홈"
    >
      AIDE
      <span className="logo-dot" />
    </a>
  );
}

function Star({ className = "" }) {
  return (
    <div className={`star-shape ${className}`} aria-hidden="true">
      <i />
      <i />
      <i />
    </div>
  );
}

function Art({ type, className = "" }) {
  return (
    <div className={`art art-${type} ${className}`} aria-hidden="true">
      {type === "plan" && (
        <>
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="idea-core">
            <Lightbulb strokeWidth={1.3} />
          </div>
          <span className="satellite" />
        </>
      )}
      {type === "design" && (
        <>
          <div className="design-plane plane-back" />
          <div className="design-plane plane-front">
            <div />
            <span />
            <span />
            <span />
          </div>
          <div className="design-ball" />
          <MousePointer2 className="design-cursor" fill="currentColor" />
        </>
      )}
      {type === "build" && (
        <>
          <div className="code-window">
            <div className="window-top">
              <i />
              <i />
              <i />
              <span>hello-world.jsx</span>
            </div>
            <div className="code-lines">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <Code2 />
          </div>
          <div className="code-cube" />
        </>
      )}
      {type === "launch" && (
        <>
          <div className="launch-globe">
            <Globe2 strokeWidth={0.65} />
          </div>
          <div className="launch-orbit" />
          <div className="launch-chip">
            <span /> LIVE
          </div>
          <div className="launch-dot" />
        </>
      )}
    </div>
  );
}

function ProjectVisual({ type }) {
  return (
    <div className={`project-visual visual-${type}`} aria-hidden="true">
      {type === "portfolio" && (
        <div className="mini-browser portfolio-browser">
          <div className="mini-top">
            <b>Studio. me</b>
            <span>ABOUT ↗</span>
          </div>
          <div className="portfolio-heading">
            Creative
            <br />
            by nature<span>®</span>
          </div>
          <div className="portfolio-flower">
            <Star />
          </div>
          <div className="portfolio-bottom">
            DESIGNER & MAKER <span>2026</span>
          </div>
        </div>
      )}
      {type === "brand" && (
        <div className="mini-browser brand-browser">
          <div className="mini-top">
            <b>off.</b>
            <span>EVERYDAY, SLOWLY.</span>
          </div>
          <div className="brand-heading">
            A little pause.
            <br />
            <i>A better day.</i>
          </div>
          <div className="bottle">
            <span>off.</span>
          </div>
          <div className="bottle-shadow" />
          <span className="brand-bottom">FIND YOUR BALANCE ↗</span>
        </div>
      )}
      {type === "curation" && (
        <div className="mini-browser curation-browser">
          <div className="mini-top">
            <b>collected.</b>
            <span>YOUR DAILY INSPIRATION</span>
          </div>
          <div className="curation-heading">
            Good things,
            <br />
            all in one place.
          </div>
          <div className="curation-grid">
            <div>
              <i />
            </div>
            <div>
              <i />
            </div>
            <div>
              <i />
            </div>
          </div>
          <div className="mini-tags">
            <span>Design</span>
            <span>Spaces</span>
            <span>Culture</span>
          </div>
        </div>
      )}
      {type === "utility" && (
        <div className="mini-browser utility-browser">
          <div className="mini-top">
            <b>
              day by day <span>✳</span>
            </b>
            <span>MY SPACE</span>
          </div>
          <div className="utility-heading">
            Small steps.
            <br />
            <span>Big changes.</span>
          </div>
          <div className="todo-row">
            <span className="todo-check">✓</span> 오늘도, 10분 독서{" "}
            <span>📚</span>
          </div>
          <div className="todo-row">
            <span className="todo-check">✓</span> 아이디어 하나 기록하기{" "}
            <span>💡</span>
          </div>
          <div className="todo-row">
            <span className="todo-check empty" /> 나만의 웹사이트 만들기{" "}
            <span>💻</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const lastFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const node = ref.current;
    node.querySelector("button, input, a, textarea")?.focus();
    function keydown(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const items = Array.from(
          node.querySelectorAll(
            'button, input, a[href], textarea, [tabindex="0"]',
          ),
        ).filter((el) => !el.disabled);
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keydown);
      lastFocus?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={ref}
      >
        <button
          className="icon-button modal-close"
          onClick={onClose}
          aria-label="닫기"
        >
          <X />
        </button>
        <h2 id="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function App() {
  const [week, setWeek] = useState(0);
  const [faq, setFaq] = useState(null);
  const [modal, setModal] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeModal = React.useCallback(() => setModal(null), []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 },
    );
    document
      .querySelectorAll("[data-reveal]")
      .forEach((el) => observer.observe(el));
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);
  const activeWeek = weeks[week];
  return (
    <>
      <a className="skip-link" href="#about">
        본문으로 바로가기
      </a>
      <header className={`header ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-wrap">
          <Mark />
          <nav
            className={mobileOpen ? "nav-links open" : "nav-links"}
            aria-label="주 메뉴"
          >
            {[
              ["#about", "AIDE 소개"],
              ["#curriculum", "커리큘럼"],
              ["#projects", "프로젝트"],
              ["#join", "모집 안내"],
            ].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMobileOpen(false)}>
                {label}
              </a>
            ))}
          </nav>
          <div className="nav-actions">
            <a className="nav-apply" href={APPLICATION_URL}>
              참여 신청 <ArrowUpRight size={14} />
            </a>
            <button
              className="menu-toggle icon-button"
              aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main>
        <section className="hero" id="home">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-glow" aria-hidden="true" />
          <div className="hero-sculpture sculpture-left">
            <Star />
            <div className="sculpture-shadow" />
          </div>
          <div className="hero-sculpture sculpture-right" aria-hidden="true">
            <div className="hero-ring" />
            <div className="hero-sphere" />
            <span className="sparkle sparkle-one">✦</span>
          </div>
          <div className="hero-orb orb-one" aria-hidden="true" />
          <div className="hero-orb orb-two" aria-hidden="true" />
          <div className="hero-content">
            <div className="eyebrow hero-eyebrow">
              <span /> FROM IDEA TO WEBSITE
            </div>
            <h1>
              상상만 하던 아이디어,
              <br />
              <span>웹사이트가 되는 순간.</span>
            </h1>
            <p>
              기획부터 디자인, 구현, 배포까지.
              <br />
              AI와 함께 나만의 웹사이트를 완성하는 3주, <strong>AIDE.</strong>
            </p>
            <a className="button button-white hero-cta" href={APPLICATION_URL}>
              나의 아이디어 시작하기 <ArrowUpRight size={18} />
            </a>
            <div className="hero-caption">
              <Sparkles size={14} className="tiny-star" /> 경험보다 중요한 건,
              만들고 싶은 마음.
            </div>
          </div>
          <div className="hero-bottom">
            <span className="hero-bottom-label">
              AI DESIGN
              <br />& ENGINEERING
            </span>
            <div className="hero-facts">
              <div>
                <span className="fact-number">03</span>
                <span>주간의 여정</span>
              </div>
              <div>
                <span className="fact-number">01</span>
                <span>나만의 웹사이트</span>
              </div>
              <div>
                <span className="fact-symbol">∞</span>
                <span>가능한 아이디어</span>
              </div>
            </div>
            <a className="scroll-indicator" href="#about">
              <span>SCROLL TO EXPLORE</span>
              <ArrowDown size={15} />
            </a>
          </div>
        </section>

        <section className="about section" id="about">
          <div className="container">
            <div className="section-top" data-reveal>
              <div>
                <div className="eyebrow section-eyebrow">MAKE IT REAL</div>
                <h2>
                  생각에서 그치지 않도록.
                  <br />
                  만드는 경험, <span className="blue-text">AIDE.</span>
                </h2>
              </div>
              <p className="section-description">
                좋은 아이디어가 있다면, 이제 직접 만들어볼 차례.
                <br />
                AI를 도구로 활용하고, 서로의 동료가 되어
                <br />
                기획부터 배포까지 한 걸음씩 함께해요.
              </p>
            </div>
            <div className="process-grid">
              {[
                {
                  type: "plan",
                  en: "PLAN",
                  title: (
                    <>
                      작은 아이디어에
                      <br />
                      방향을 더하다.
                    </>
                  ),
                  desc: "사용자와 목적을 정하고,\n꼭 필요한 기능을 설계해요.",
                  icon: Lightbulb,
                },
                {
                  type: "design",
                  en: "DESIGN",
                  title: (
                    <>
                      생각의 윤곽을
                      <br />
                      화면으로 그리다.
                    </>
                  ),
                  desc: "정보의 배치부터 사용자 흐름까지,\n아이디어를 눈에 보이게 만들어요.",
                  icon: Layers3,
                },
                {
                  type: "build",
                  en: "BUILD",
                  title: (
                    <>
                      AI와 함께,
                      <br />
                      직접 구현하다.
                    </>
                  ),
                  desc: "화면과 기능을 하나씩 만들고,\n오류를 해결하며 앞으로 나아가요.",
                  icon: Code2,
                },
                {
                  type: "launch",
                  en: "LAUNCH",
                  title: (
                    <>
                      나만의 결과물을
                      <br />
                      세상에 공개하다.
                    </>
                  ),
                  desc: "피드백으로 한 번 더 다듬고,\n실제 접속 가능한 웹사이트로 완성해요.",
                  icon: Globe2,
                },
              ].map((item, i) => (
                <a
                  href="#curriculum"
                  onClick={() => setWeek(i < 2 ? 0 : i - 1)}
                  className={`process-card process-${item.type}`}
                  key={item.type}
                  data-reveal
                  style={{ "--delay": `${i * 80}ms` }}
                >
                  <div className="card-overline">
                    <span>
                      0{i + 1} / {item.en}
                    </span>
                    <item.icon size={17} strokeWidth={1.5} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                  <Art type={item.type} />
                  <span className="card-bottom">
                    {i === 0
                      ? "아이디어를 구체적으로"
                      : i === 1
                        ? "사용하기 편하게"
                        : i === 2
                          ? "실제로 작동하게"
                          : "누구나 만날 수 있게"}
                    <ArrowUpRight size={18} />
                  </span>
                </a>
              ))}
            </div>
            <div className="about-footnote" data-reveal>
              <Sparkles size={16} />
              <p>
                AI가 대신 만드는 것을 넘어,{" "}
                <strong>AI와 함께 만드는 방법을 배웁니다.</strong>
              </p>
              <span>A LITTLE IDEA. A REAL WEBSITE.</span>
            </div>
          </div>
        </section>

        <section className="curriculum section" id="curriculum">
          <div className="container">
            <div className="section-top" data-reveal>
              <div>
                <div className="eyebrow section-eyebrow">
                  THE 3-WEEK JOURNEY
                </div>
                <h2>
                  3주, 하나의 아이디어가
                  <br />
                  나만의 웹사이트로.
                </h2>
              </div>
              <div className="section-side-note">
                <span className="pill">
                  <CalendarDays size={14} /> 주 1회 · 총 3회
                </span>
                <p>작게 시작하고, 함께 끝까지 완성해요.</p>
              </div>
            </div>
            <div className="curriculum-content" data-reveal>
              <div
                className="week-tabs"
                role="tablist"
                aria-label="주차별 커리큘럼"
              >
                {weeks.map((item, i) => (
                  <button
                    key={item.tag}
                    id={`week-tab-${i}`}
                    role="tab"
                    aria-controls="week-panel"
                    aria-selected={week === i}
                    tabIndex={week === i ? 0 : -1}
                    onKeyDown={(e) => {
                      if (
                        [
                          "ArrowRight",
                          "ArrowDown",
                          "ArrowLeft",
                          "ArrowUp",
                          "Home",
                          "End",
                        ].includes(e.key)
                      ) {
                        e.preventDefault();
                        const next =
                          e.key === "Home"
                            ? 0
                            : e.key === "End"
                              ? 2
                              : (i +
                                  (e.key === "ArrowRight" ||
                                  e.key === "ArrowDown"
                                    ? 1
                                    : 2)) %
                                3;
                        setWeek(next);
                        document.getElementById(`week-tab-${next}`)?.focus();
                      }
                    }}
                    className={`week-tab ${week === i ? "active" : ""}`}
                    onClick={() => setWeek(i)}
                  >
                    <span className="week-tab-number">WEEK {item.tag}</span>
                    <span>{item.label}</span>
                    <ArrowUpRight size={19} />
                  </button>
                ))}
              </div>
              <div
                className="week-panel"
                id="week-panel"
                role="tabpanel"
                aria-labelledby={`week-tab-${week}`}
                tabIndex={0}
              >
                <div key={week} className="week-panel-inner">
                  <div className="week-visual">
                    <span className="week-watermark">0{week + 1}</span>
                    <Art type={activeWeek.art} />
                    <div className="week-visual-label">
                      IDEA → DESIGN → BUILD → LAUNCH
                    </div>
                  </div>
                  <div className="week-copy">
                    <div className="week-copy-label">
                      <span className="blue-dot" /> WEEK {activeWeek.tag}
                      <span>작은 시작, 확실한 한 걸음</span>
                    </div>
                    <h3>{activeWeek.title}</h3>
                    <p>{activeWeek.description}</p>
                    <ul>
                      {activeWeek.tasks.map((task) => (
                        <li key={task}>
                          <Check size={15} />
                          {task}
                        </li>
                      ))}
                    </ul>
                    <div className="week-results">
                      <span>이번 주 결과물</span>
                      <div>
                        {activeWeek.results.map((r) => (
                          <span key={r}>{r}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="projects section" id="projects">
          <div className="container">
            <div className="section-top" data-reveal>
              <div>
                <div className="eyebrow section-eyebrow">YOUR NEXT PROJECT</div>
                <h2>무엇이든, 나다운 웹사이트.</h2>
                <p className="section-subtitle">
                  거창하지 않아도 괜찮아요. 평소 만들고 싶었던 것부터 시작해요.
                </p>
              </div>
              <span className="small-outline-label">
                이런 아이디어는 어때요? <ArrowDown size={14} />
              </span>
            </div>
            <div className="project-grid">
              {projects.map((project, i) => (
                <button
                  className="project-card"
                  key={project.type}
                  onClick={() => setModal(i)}
                  data-reveal
                  style={{ "--delay": `${i * 70}ms` }}
                >
                  <ProjectVisual type={project.type} />
                  <div className="project-meta">
                    <span>{project.category}</span>
                    <ArrowUpRight size={18} />
                  </div>
                  <h3>{project.name}</h3>
                  <p>{project.description}</p>
                </button>
              ))}
            </div>
            <p className="project-disclaimer">
              위 이미지는 제작할 수 있는 프로젝트의 콘셉트 예시입니다.
            </p>
          </div>
        </section>

        <section className="join section" id="join">
          <div className="container">
            <div className="join-heading" data-reveal>
              <div className="eyebrow section-eyebrow">
                LET’S BUILD TOGETHER
              </div>
              <h2>
                혼자서는 막막했던 시작,
                <br />
                함께라면 가능하니까.
              </h2>
              <p>아이디어를 현실로 만들고 싶은 여러분을 기다려요.</p>
            </div>
            <div className="join-facts" data-reveal>
              {[
                {
                  icon: Users,
                  label: "함께할 사람",
                  value: "서울 지역 20대 대학생",
                  sub: "만들고 싶은 마음이 있다면",
                },
                {
                  icon: CalendarDays,
                  label: "함께할 시간",
                  value: "3주간, 주 1회",
                  sub: "총 3번의 만남과 꾸준한 실천",
                },
                {
                  icon: MapPin,
                  label: "함께할 공간",
                  value: "서울 내 스터디룸",
                  sub: "상세 장소는 추후 안내",
                },
                {
                  icon: Laptop,
                  label: "시작을 위한 준비",
                  value: "개인 노트북",
                  sub: "그리고 여러분의 작은 아이디어",
                },
              ].map((item) => (
                <div className="join-fact" key={item.label}>
                  <item.icon size={25} strokeWidth={1.4} />
                  <span>{item.label}</span>
                  <h3>{item.value}</h3>
                  <p>{item.sub}</p>
                </div>
              ))}
            </div>
            <div className="join-banner" data-reveal>
              <div className="banner-copy">
                <span className="eyebrow">YOUR IDEA STARTS HERE</span>
                <h3>
                  당신의 첫 웹사이트,
                  <br />
                  AIDE에서 시작하세요.
                </h3>
                <a className="button button-white" href={APPLICATION_URL}>
                  함께 만들어볼까요? <ArrowUpRight size={18} />
                </a>
                <span className="banner-note">
                  3주 뒤, 아이디어는 하나의 링크가 됩니다.
                </span>
              </div>
              <div className="banner-art" aria-hidden="true">
                <div className="banner-ring ring-back" />
                <div className="banner-ring ring-front" />
                <Star />
                <span className="banner-sparkle">✦</span>
              </div>
            </div>
          </div>
        </section>

        <section className="faq-section section" id="faq">
          <div className="container faq-layout">
            <div data-reveal>
              <div className="eyebrow section-eyebrow">
                A FEW THINGS TO KNOW
              </div>
              <h2>궁금한 게 있나요?</h2>
              <p className="section-subtitle">
                시작하기 전, 가볍게 확인해 보세요.
              </p>
              <button
                className="contact-link"
                onClick={() => setModal("contact")}
              >
                다른 질문이 있어요 <ArrowUpRight size={16} />
              </button>
            </div>
            <div className="faq-list" data-reveal>
              {faqs.map(([q, a], i) => (
                <div
                  className={`faq-item ${faq === i ? "expanded" : ""}`}
                  key={q}
                >
                  <h3>
                    <button
                      aria-expanded={faq === i}
                      aria-controls={`faq-answer-${i}`}
                      onClick={() => setFaq(faq === i ? null : i)}
                    >
                      <span>
                        <b>0{i + 1}</b>
                        {q}
                      </span>
                      {faq === i ? <Minus size={18} /> : <Plus size={18} />}
                    </button>
                  </h3>
                  <div
                    id={`faq-answer-${i}`}
                    className="faq-answer"
                    hidden={faq !== i}
                  >
                    <p>{a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer>
        <div className="container">
          <div className="footer-top">
            <div>
              <Mark />
              <p>작은 아이디어에서, 새로운 가능성으로.</p>
            </div>
            <a href="#home" className="back-to-top">
              BACK TO TOP <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} AIDE. AI Design & Engineering.
            </span>
            <span>
              MADE WITH IDEAS, BUILT TOGETHER.
              <span className="blue-dot" />
            </span>
          </div>
        </div>
      </footer>
      {typeof modal === "number" && (
        <Modal title={projects[modal].name} onClose={closeModal}>
          <ProjectVisual type={projects[modal].type} />
          <p className="project-modal-description">{projects[modal].detail}</p>
          <ul className="project-features">
            {projects[modal].features.map((f) => (
              <li key={f}>
                <Check size={16} />
                {f}
              </li>
            ))}
          </ul>
          <a className="button button-blue" href={APPLICATION_URL}>
            나의 아이디어 시작하기 <ArrowUpRight size={16} />
          </a>
        </Modal>
      )}
      {modal === "contact" && (
        <Modal title="궁금한 점을 함께 풀어봐요." onClose={closeModal}>
          <p className="modal-note">
            공식 문의 채널은 준비 중입니다. 일정, 장소, 비용 등 확정되지 않은
            내용은 모집 안내와 함께 공개할 예정이에요.
          </p>
          <a href="#faq" className="button button-blue" onClick={closeModal}>
            자주 묻는 질문 확인하기 <ArrowRight size={16} />
          </a>
        </Modal>
      )}
    </>
  );
}

const path = window.location.pathname
  .replace(/\/index\.html$/, "")
  .replace(/\/$/, "");
const Page = path.endsWith("/apply")
  ? ApplicationPage
  : path.endsWith("/admin")
    ? AdminPage
    : App;
createRoot(document.getElementById("root")).render(
  <React.Suspense
    fallback={
      <div className="route-loading" role="status">
        AIDE 페이지를 불러오고 있어요.
      </div>
    }
  >
    <Page />
  </React.Suspense>,
);
