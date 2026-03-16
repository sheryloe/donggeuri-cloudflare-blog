# Donggeuri Cloudflare Blog

Cloudflare Pages, Workers, D1, R2를 사용해 공개 블로그와 관리자 CMS를 분리하는 블로그 플랫폼 실험 저장소입니다.

- 저장소: `https://github.com/sheryloe/donggeuri-cloudflare-blog`

## 서비스 개요

- 공개 사이트와 관리자 앱, API를 독립 배포 단위로 분리합니다.
- Cloudflare 네이티브 스택만으로 블로그 운영 구조를 구성하는 것이 목표입니다.
- 향후 다중 사이트 운영이나 경량 CMS로 확장하기 좋은 기반을 갖고 있습니다.

## 워크스페이스 구성

- `apps/web`: 공개 블로그 프런트엔드
- `apps/admin`: 관리자 앱
- `apps/api`: D1/R2 바인딩을 사용하는 Worker API
- `packages/shared`: 공용 타입

## 보안 전제

- 관리자 세션은 HTTP-only cookie 기준입니다.
- 같은 eTLD+1 아래에서 Public/Admin/API를 분리하는 배포 모델을 권장합니다.
- Worker CORS는 허용 목록 기반으로 동작합니다.

## 구현된 API

- Public posts/categories/tags 조회
- Admin login/logout/session
- Admin posts CRUD
- Admin media CRUD
- Admin categories/tags CRUD

## 실행 방법

```bash
pnpm install
pnpm dev:api
pnpm dev:web
pnpm dev:admin
```

## 다음 단계

- 예약 발행, 초안 상태, 미리보기 추가
- 관리자 감사 로그와 역할 분리 강화
- RSS/SEO/검색 기능을 공개 블로그 측에 완성
