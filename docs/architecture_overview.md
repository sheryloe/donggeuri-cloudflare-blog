# Architecture Overview

## Purpose
Cloudflare Only 블로그 플랫폼의 전체 아키텍처 개요.

## Stack
- Cloudflare Pages: 공개 웹
- Cloudflare Workers: API / Backend
- Cloudflare R2: 이미지 및 파일 저장
- Cloudflare D1: 게시글 및 메타데이터 저장

## High-Level Flow
Visitor → Pages → Worker API → D1 / R2
Admin → Admin UI → Worker API → D1 / R2

## Key Principles
- GitHub = 코드 저장소
- Cloudflare = 콘텐츠 런타임 플랫폼