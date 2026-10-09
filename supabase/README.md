# 실제 신청 접수 연결

사이트는 GitHub Pages에서 실행됩니다. 신청 내역은 Supabase Postgres에 저장하고, Supabase Auth 로그인 및 데이터베이스 RLS로 관리자 접근을 제한합니다. 로고 5번 클릭은 관리자 페이지의 진입 방법일 뿐, 인증을 대체하지 않습니다.

## 1. 프로젝트와 테이블

Supabase에서 프로젝트를 만들고 SQL Editor에서 `migrations/202610090001_admissions.sql`을 한 번 실행하세요. 이 마이그레이션은 신규 테이블을 생성하므로 같은 프로젝트에서 다시 실행하지 마세요.

- `applications`: 접수 시간(서버 시간), 모든 신청 항목, 동의 시간을 저장합니다.
- `application_admins`: 운영진의 Auth 사용자 UUID를 저장합니다.
- `submit_application`: 검증된 신규 신청만 저장하고 접수 번호·시간만 돌려줍니다. 동일 요청의 재시도는 중복 저장하지 않습니다.
- 익명 방문자는 신청 목록을 읽거나 수정·삭제할 수 없습니다.
- 관리자 자격이 없는 로그인 사용자에게도 신청 내역을 공개하지 않습니다.

## 2. 운영진 로그인

Supabase Authentication의 Users 화면에서 운영진 이메일로 사용자를 생성하고 비밀번호를 안전하게 설정하세요. 비밀번호는 채팅, GitHub 파일, 프론트엔드 환경변수에 넣지 마세요. 공개 회원 가입은 필요하지 않으므로 Auth 설정에서 신규 가입을 비활성화하세요.

생성한 운영진 사용자 UUID를 아래 SQL에 넣어 SQL Editor에서 실행합니다.

```sql
insert into public.application_admins (user_id)
values ('운영진-사용자의-UUID');
```

## 3. 공개 연결 값

프로젝트 Connect 또는 Settings → API Keys에서 Project URL과 **publishable key**를 확인합니다. 두 값은 공개 프론트엔드 설정이며 DB 관리자 비밀 키가 아닙니다. **service_role, sb_secret 키나 DB 비밀번호는 사용하면 안 됩니다.**

로컬 개발은 `.env.example`을 참고해 `.env.local`에 설정합니다.

```dotenv
VITE_SUPABASE_URL=https://프로젝트.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=공개_publishable_key
```

GitHub 공개 사이트는 저장소 **Settings → Secrets and variables → Actions → Variables**에 같은 이름의 Repository variables 두 개를 등록한 뒤 배포 워크플로를 다시 실행하세요. 이 환경의 GitHub 인증은 Repository variables 목록·설정 권한이 없어 계정에서 등록해야 합니다.

관리자는 `https://tlstmdtn.github.io/AIDE/apply/` 상단의 AIDE 로고를 5번 눌러 이동하거나 `/AIDE/admin/`에 직접 접속할 수 있습니다. 인증 후에만 실제 신청 데이터를 불러옵니다.

## 4. 연결 후 실제 검증

1. 신청 페이지에서 테스트 신청을 제출하고 실제 접수 번호·시간이 표시되는지 확인합니다.
2. 별도 브라우저에서 운영진 로그인 후 동일 신청 내용과 시간이 표시되는지 확인합니다.
3. 엑셀 다운로드에서 모든 입력 항목과 한국 시간이 유지되는지 확인합니다.
4. 비로그인·일반 계정으로 신청 목록을 읽을 수 없는지 확인합니다.
5. 검증용 신청은 SQL Editor에서 해당 UUID만 대상으로 삭제합니다.

연결 값이 없으면 사이트는 실제 접수가 준비 중임을 알리고 제출을 막습니다. 로컬 저장이나 가짜 성공 화면으로 실제 접수를 대신하지 않습니다. 테스트의 모의 API 응답은 실제 공개 DB 연결 검증이 아닙니다.
