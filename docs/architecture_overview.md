# Architecture Overview

## Purpose
공개 템플릿 repo와 실제 운영 블로그를 분리하기 위한 Cloudflare 블로그 아키텍처 개요입니다.

## Stack
- Cloudflare Pages: 공개 웹과 관리자 앱
- Cloudflare Workers: API / Backend
- Cloudflare R2: 이미지 및 파일 저장
- Cloudflare D1: 게시글 및 메타데이터 저장

## High-Level Flow
Visitor -> Pages -> Worker API -> D1 / R2
Admin -> Admin UI -> Worker API -> D1 / R2

## Key Principles
- Public repo = 재사용 가능한 엔진과 UI 뼈대
- Private repo = 실제 글, 도메인, 인증 키, 분석 설정
- GitHub = 코드 저장소
- Cloudflare = 콘텐츠 런타임 플랫폼
