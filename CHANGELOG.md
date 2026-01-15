# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-01-14

### Added

- 디자인 시스템 컴포넌트 섹션 확장 및 분류 체계 개선

### Changed

- 파일 업로드 방식을 비동기로 전환, 취소/재시도 기능 추가
- 파일 형식 제한 완화 및 서류 설명 줄바꿈 지원

### Fixed

- 파일 업로드 안내 문구 개선
- 중첩 ZIP 파일 검사 및 안내 문구 추가

## [0.1.0] - 2025-01-XX

### Added

- 문서함 생성/수정/삭제 기능
- 제출자 관리 및 이메일 발송
- 파일 업로드 (S3 Presigned URL)
- 무한 스크롤 목록 컴포넌트
- 회원가입 후 자동 로그인
- 문서함 수정 시 제출 내역 충돌 처리 및 강제 삭제 기능
- 전체 스크롤바 커스텀 스타일

### Fixed

- 인증 에러 메시지 처리 중앙화
- 로그인 리다이렉트 로직 개선
- CORS 헤더 설정 (INVALID_ORIGIN 에러 해결)
- Server Component 쿠키 수정 에러 수정

---

## 버전 규칙

- **MAJOR**: Breaking Change (하위 호환 X)
- **MINOR**: 새 기능 추가 (하위 호환)
- **PATCH**: 버그 수정 (하위 호환)
