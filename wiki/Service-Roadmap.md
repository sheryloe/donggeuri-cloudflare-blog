# cloudflare-blog Service Roadmap

## 서비스 목표

Cloudflare 환경에서 Public 블로그와 Admin CMS, API를 분리해 운영하면서도, public template와 private 운영 repo를 나눠 가져갈 수 있는 블로그 플랫폼으로 정리합니다.

## 현재 스냅샷

- Public / Admin / API 구조 준비 완료
- 템플릿 repo에서 서비스 고유 도메인과 인증 태그 제거 완료
- 공개 블로그를 단순한 블로그형 구조로 재정리 완료
- private repo 중심 배포 워크플로우 문서화 완료

## 완료된 항목

- Cloudflare Pages / Workers / D1 / R2 연결
- 공개 홈, 글 상세, 카테고리/태그 아카이브 구현
- 관리자 로그인, 글 CRUD, 카테고리/태그 관리, R2 업로드 구현
- 공개 웹과 관리자 앱의 1차 UI 정리
- 배포 경계 보강과 인증/CORS 수정

## Next

### P0. 운영 가능한 상태 만들기

- private repo 생성 가이드와 초기 설정 체크리스트 정리
- 사이트 브랜딩을 더 적은 수정으로 치환할 수 있게 구성
- 관리자에서 발행한 글이 공개 홈과 상세에 정상 노출되는지 검증
- 관리자 로그인, 세션 유지, 로그아웃 흐름 재검증

### P1. 공개 블로그 완성도 올리기

- `/about`와 홈의 placeholder copy를 더 범용적으로 다듬기
- 검색 결과 경험과 빈 상태 개선
- 커스텀 OG 이미지 전략 정리
- private repo용 SEO 설정 문서 보강

### P2. 관리자 작성 경험 개선

- Markdown 툴바 추가
- 미리보기 또는 split view 추가
- 임시저장 / 저장 상태 표시 강화
- slug 생성 및 수정 UX 개선
- 목록 필터링, 정렬, 검색 추가

### P3. 콘텐츠 모델 확장

- series 기능 연결
- related posts 추천 규칙 연결
- 예약 발행 정책과 UI 연결

## Ops

- Worker API 테스트와 관리자 E2E 테스트 추가
- GitHub Actions 기반 `pnpm build` / 검증 파이프라인 정리
- Worker 에러 로깅, health check, 기본 모니터링 정리
- private repo 커스텀 도메인 전환 시 same-site 쿠키 기준 재검증

## 메모

- 지금은 public template를 안정화하고 private repo onboarding을 쉽게 만드는 것이 더 중요합니다.
- 실제 운영 도메인과 분석 태그는 template repo가 아니라 private repo에서 관리하는 것을 기본 원칙으로 둡니다.
