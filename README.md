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

브라우저 테스트는 시스템 Chromium이 있으면 사용합니다. 다른 머신에서는 최초 1회 `npx playwright install --with-deps chromium`으로 브라우저를 준비하세요. `dist/`를 정적 웹 호스팅에 배포할 수 있습니다.

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
- 신청서 로컬 저장·수정·삭제·복사·다운로드
- 주요 콘텐츠와 인터랙션: `src/main.jsx`
- 스타일 및 모션: `src/styles.css`

## 실제 모집 전 연결할 항목

원문에 실제 신청·문의 URL이 없어 외부 접수는 연결하지 않았습니다. 신청서는 브라우저에만 저장되며 서버로 전송되지 않습니다. UI에서도 공식 접수와 임시 작성을 구분합니다.

공식 신청 URL과 문의 채널이 확정되면 `src/main.jsx`의 신청 버튼과 문의 동작을 해당 링크에 연결하세요. 상세 일정·장소·비용도 확정 후 반영해야 합니다. 개인정보는 공용 기기에 남기지 않도록 저장 내용 삭제 기능을 제공합니다.

프로젝트 카드의 화면은 제작 가능성을 설명하는 콘셉트 예시이며, 실제 참가자의 결과물로 표시하지 않습니다.
