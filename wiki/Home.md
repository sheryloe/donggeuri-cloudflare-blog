# cloudflare-blog Wiki

## 목적

cloudflare-blog는 Cloudflare 기반의 Public 블로그, Admin CMS, API를 분리한 공개 템플릿 워크스페이스입니다.

- Public repo에는 재사용 가능한 UI와 구조만 둡니다.
- 실제 도메인, 인증 메타, Analytics ID, 실제 Cloudflare 리소스 값은 private repo에서 채웁니다.
- Cloudflare Pages는 private repo에 연결해 배포하는 흐름을 기본으로 가정합니다.

## 현재 상태

- Public / Admin / API 분리 구조가 준비되어 있습니다.
- 공개 웹은 SEO shell, RSS, sitemap 흐름을 포함합니다.
- 관리자 앱은 로그인, 글 편집, 미디어 업로드, 분류 관리를 다룹니다.

## 이번에 정리된 것

- 공개 template에서 실제 서비스 도메인과 인증 메타를 제거했습니다.
- 문서를 public repo -> private repo 워크플로우 기준으로 다시 정리했습니다.
- 관리자와 공개 웹의 기본 브랜딩을 범용 템플릿 톤으로 바꿨습니다.
- Cloudflare 리소스 이름과 URL 기본값을 example 기반으로 일반화했습니다.

## 지금 남아 있는 핵심 TODO

- private repo에서 도메인, 콘텐츠, 인증 키를 연결합니다.
- 사이트 브랜딩을 환경 변수 또는 설정 파일로 더 쉽게 치환할 수 있게 다듬습니다.
- 관리자 에디터와 미디어 라이브러리 UX를 보강합니다.
- 테스트, CI, 로깅, 모니터링을 정리해 운영 안정성을 올립니다.

## 바로 볼 문서

- [README.md](../README.md)
- [남은 작업.md](../남은%20작업.md)
- [Service-Roadmap.md](./Service-Roadmap.md)

## 메모

- public repo는 템플릿 순도를 유지하는 것이 우선입니다.
- 개인 운영값은 코드보다 private repo나 배포 설정으로 분리하는 편이 안전합니다.
