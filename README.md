# 직원 시간관리 웹 서비스 (MVP)

소규모 사업장(카페/식당/편의점 등)을 위한 **직원 근무시간 관리 웹 애플리케이션**입니다.

## 주요 기능

- **회원가입/로그인**: 이메일+비밀번호, bcrypt 해시, JWT 세션 쿠키(httpOnly)
- **직원 관리**: 직원 추가/수정/비활성화, 기본 출근시간(30분 단위), 색상 태그, 시급(선택)
- **근무 입력**: 날짜/직원/출퇴근(30분 단위) 입력, 같은 날짜는 자동 수정(upsert)
- **달력 뷰**: 월간 달력에서 근무기록 표시, 직원 필터, 날짜 클릭 시 근무 입력으로 이동
- **2주 집계**: 월~일 기준 주차별 합산, 주 15시간 이상 배지 표시
- **월별 통계**: 직원별 총시간/근무일수/예상 인건비, 주차별 바 차트, CSV 다운로드

## 기술 스택

- **Next.js(App Router)** + **TypeScript** + **Tailwind CSS**
- **PostgreSQL** + **Prisma**
- **FullCalendar**(달력), **Recharts**(차트)

## 로컬 실행 (가장 쉬운 방법: Docker로 Postgres)

### 1) 환경변수 설정

`.env.example`를 참고해서 `.env`를 준비합니다.

- **필수**: `DATABASE_URL`, `JWT_SECRET`

Docker 기본값을 쓰면 `DATABASE_URL` 예시는 아래처럼 설정합니다.

```
DATABASE_URL="postgresql://staffapp:staffapp_password@localhost:5432/staffapp?schema=public"
JWT_SECRET="dev_change_me_to_a_long_random_string_please"
APP_URL="http://localhost:3000"
```

### 2) Postgres 실행

```bash
docker compose up -d
```

### 3) 마이그레이션(테이블 생성) + Prisma Client 생성

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

### 4) 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 후, `/register`에서 계정을 생성하면 됩니다.

## 배포

DB는 Supabase(Postgres) 같은 관리형 서비스를 쓰고, 앱은 Vercel 배포를 권장합니다.
