# Cloudflare Blog Template

Cloudflare Pages, Workers, D1, R2를 바탕으로 공개 블로그, 관리자 앱, API를 분리해 운영할 수 있게 만든 재사용용 템플릿 저장소입니다.

- 저장소: `https://github.com/sheryloe/cloudflare-blog`

## 이 저장소의 역할

- 이 repo는 공개용 뼈대입니다.
- 개인 도메인, Search Console 인증 태그, GA 측정 ID, 실제 Cloudflare 리소스 이름은 넣지 않습니다.
- 실제 배포는 이 repo를 가져와 별도 비공개 저장소를 만든 뒤, 그 private repo에서 운영값을 넣는 흐름을 권장합니다.

## 추천 워크플로우

1. 이 public repo를 로컬로 내려받습니다.
2. GitHub에 새 private repository를 만듭니다.
3. 이 코드베이스를 새 private repo에 push 합니다.
4. private repo에서 도메인, 인증 메타, 분석 태그, 콘텐츠를 추가합니다.
5. Cloudflare Pages는 private repo에 연결해서 배포합니다.

이렇게 하면 템플릿 코드와 실제 운영 블로그를 분리할 수 있고, 실수로 개인 콘텐츠나 운영 설정을 공개 저장소에 올리는 사고를 줄일 수 있습니다.

## 워크스페이스 구성

- `apps/web`: 공개 블로그 프런트엔드
- `apps/admin`: 관리자 앱
- `apps/api`: D1/R2 바인딩을 사용하는 Worker API
- `packages/shared`: 공용 타입
- `docs`: 구조 설명과 소개 문서
- `wiki`: 작업 메모와 로드맵

## 보안 전제

- 관리자 세션은 HTTP-only cookie 기준입니다.
- 같은 eTLD+1 아래에서 Public/Admin/API를 분리하는 배포 모델을 권장합니다.
- Worker CORS는 허용 목록 기반으로 동작합니다.

## 포함된 기능

- Public posts/categories/tags/search 조회
- Admin login/logout/session
- Admin posts CRUD
- Admin media CRUD
- Admin categories/tags CRUD
- Worker RSS / sitemap XML
- Worker asset proxy (`/assets/*`)

## 로컬 실행

```bash
pnpm install
pwsh ./scripts/setup-local-dev.ps1
pnpm --filter @cloudflare-blog/api exec wrangler d1 migrations apply cloudflare-blog --local
pnpm dev:api
pnpm dev:web
pnpm dev:admin
```

- 로컬 설정 예제는 `apps/api/.dev.vars.example`, `apps/web/.env.example`, `apps/admin/.env.example`를 참고합니다.
- `apps/api/wrangler.toml`은 템플릿용 예시값이므로, 실제 배포 전에는 private repo에서 프로젝트 이름과 리소스 ID를 교체해야 합니다.

## SEO / Analytics 원칙

- 공개 웹은 Cloudflare Pages advanced mode `_worker.js`로 라우트별 메타데이터를 보강합니다.
- 공개 웹 빌드 환경 변수 `VITE_GA_MEASUREMENT_ID`에 `G-XXXXXXXXXX` 형식의 GA4 측정 ID를 넣으면 Google tag가 활성화됩니다.
- 측정 ID가 비어 있으면 Google Analytics 코드는 로드되지 않습니다.
- Search Console / Naver 사이트 인증 메타는 public template에 기본 포함하지 않습니다.
- 사이트 검증 메타, 실제 canonical 도메인, 운영용 OG 이미지는 private repo에서 넣는 것을 권장합니다.

## Private Repo에서 채울 것

- 실제 도메인과 canonical URL
- Google / Naver 사이트 검증 메타
- Google Analytics 측정 ID
- Cloudflare Pages / Workers 프로젝트 이름
- D1 / R2 실제 리소스 이름과 ID
- 실제 글 콘텐츠, 카테고리, 태그, 미디어

## 다음 확장 아이디어

- 예약 발행과 draft 상태
- 관리자 감사 로그와 역할 분리
- 사이트 설정 UI 또는 환경 변수 기반 브랜딩
- 대표 글 큐레이션과 커스텀 OG 이미지
