# AIDE — AI Design & Engineering

AI와 함께 웹사이트 기획부터 배포까지 경험하는 3주 스터디의 반응형 모집 사이트입니다.

## 개발

Node.js 22 이상을 권장합니다. 현재 환경에서는 Node.js 24로 검증합니다.

```sh
cd /workspace/AIDE
npm ci
npm run dev
```

## 검증 및 배포 빌드

```sh
npm run build
npm test
```

`npm test`는 PGlite의 PostgreSQL 엔진에서 데이터베이스 저장·접근 권한을 검증한 뒤 브라우저 테스트를 실행합니다. 브라우저 테스트는 모의 Supabase 응답으로 정상 접수·실패 재시도·권한·엑셀 다운로드를 검증하며 실제 공개 DB 연결 확인을 대신하지 않습니다.

브라우저 테스트는 시스템 Chromium이 있으면 사용합니다. 다른 머신에서는 최초 1회 `npx playwright install --with-deps chromium`으로 브라우저를 준비하세요. 테스트 전용 서버는 5175 포트를 사용합니다. `dist/`를 정적 웹 호스팅에 배포할 수 있습니다.

## GitHub Pages 배포

공개 주소: **https://tlstmdtn.github.io/AIDE/**

`.github/workflows/deploy.yml`이 `main`에 push할 때 사이트를 빌드하고 게시합니다. Pages 활성화 후 빌드와 배포가 성공했습니다. GitHub Pages 설정은 완료된 상태이며, 아래 절차는 설정을 다시 하거나 수동으로 재배포할 때 사용합니다.

1. [저장소 Pages 설정](https://github.com/tlstmdtn/AIDE/settings/pages)에서 **Build and deployment → Source → GitHub Actions**를 선택합니다.
2. [배포 워크플로](https://github.com/tlstmdtn/AIDE/actions/workflows/deploy.yml)에서 **Run workflow → main → Run workflow**를 실행합니다.
3. 배포 작업이 성공하면 `https://tlstmdtn.github.io/AIDE/`에서 확인합니다.

GitHub Pages에서는 `VITE_BASE_PATH=/AIDE/`로 빌드합니다. 다른 호스팅의 도메인 루트에 배포할 때는 기본 `npm run build`를 사용하세요.

Pages용 빌드를 로컬에서 확인하려면 다음을 실행합니다.

```sh
VITE_BASE_PATH=/AIDE/ npm run build
VITE_BASE_PATH=/AIDE/ npm run preview
```

## 구성

- React, Vite, Lucide 아이콘
- 반응형 레이아웃과 CSS로 제작한 입체 그래픽 및 프로젝트 콘셉트
- 스크롤 진입 애니메이션과 부유 모션; 기기의 모션 감소 설정 지원
- 키보드로 조작 가능한 커리큘럼 탭, FAQ, 포커스가 유지되는 모달
- 별도 `/apply/` 페이지의 3단계 신청 양식과 실제 서버 접수 확인
- `/admin/`의 운영진 로그인, 접수 시간·전체 답변 표, 검색·기간·AI 필터, 엑셀 다운로드
- 신청 페이지 AIDE 로고 5번 클릭 시 관리자 로그인 페이지로 이동
- Supabase Auth + Postgres RLS: 운영진만 신청 내역 읽기 가능
- 신청·관리자 화면: `src/pages/`, `src/admissions.css`
- 데이터 접근과 엑셀: `src/lib/admissions.js`
- 주요 콘텐츠와 인터랙션: `src/main.jsx`
- 스타일 및 모션: `src/styles.css`

## 실제 모집 전 연결할 항목

신청 페이지는 `https://tlstmdtn.github.io/AIDE/apply/`, 관리자 로그인은 `https://tlstmdtn.github.io/AIDE/admin/`입니다. GitHub Pages에서 두 주소를 직접 방문하거나 새로고침할 수 있도록 각각 HTML 진입점을 빌드합니다.

**실제 데이터 저장을 활성화하려면 [Supabase 연결 안내](supabase/README.md)를 따라 프로젝트·운영진 계정·공개 연결 값 두 개를 설정해야 합니다.** 연결 전에는 제출을 비활성화하며, 서버에 저장되지 않은 신청을 접수 완료로 표시하지 않습니다. 작성 중인 답변은 메모리에만 유지하며 새로고침·페이지 이탈 시 사라집니다.

문의 채널과 상세 일정·장소·비용도 확정 후 반영해야 합니다. 로고 클릭만으로 개인정보에 접근할 수는 없고, 등록된 운영진 계정으로 로그인해야 합니다.

프로젝트 카드의 화면은 제작 가능성을 설명하는 콘셉트 예시이며, 실제 참가자의 결과물로 표시하지 않습니다.
