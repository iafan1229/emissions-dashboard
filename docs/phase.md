# 구현 Phase 로드맵

[spec.md](../spec.md) 의 명세를 5개 Phase로 분할하여 점진적으로 구현한다.
각 Phase 종료 시 `yarn type-check` + 브라우저 검증을 거친 후 다음 단계로 진행.

| Phase | 범위 | spec.md 참조 | 상태 |
|---|---|---|---|
| 1 | 프로젝트 초기화 + 핵심 lib 모듈 | §1~6 | ✅ 완료 |
| 2 | Context Provider + 공통 레이아웃 + 대시보드 메인 | §7~8 | ✅ 완료 |
| 3 | 제품 상세 페이지 + 4개 차트 + 리포트 작성 폼 | §9 | ✅ 완료 |
| 4 | 리포트 목록 + 활동 데이터 입력 폼 | §10~11 | ✅ 완료 |
| 5 | README + 스크린샷/캡쳐 + 체크리스트 점검 | §13 | ✅ 완료 (스크린샷/영상은 사용자 작업) |

---

## ✅ Phase 1 — 프로젝트 초기화 + 핵심 lib 모듈

### 작업
- Next.js 16.2.4 + React 19 + TypeScript + Tailwind + App Router 초기화 (현재 디렉토리)
- `recharts` 추가 설치
- `package.json` 에 `type-check` 스크립트 추가
- 핵심 lib 모듈 5개:
  - [lib/types.ts](../lib/types.ts) — 공유 타입
  - [lib/constants/emissionFactors.ts](../lib/constants/emissionFactors.ts) — 배출계수 4종 + scope/lcaStage/version
  - [lib/utils/calculateEmissions.ts](../lib/utils/calculateEmissions.ts) — `amount × factor` 계산
  - [lib/data/seed.ts](../lib/data/seed.ts) — companies/products/activityData(30건)/posts
  - [lib/api.ts](../lib/api.ts) — fake backend (200~800ms latency, 15% write failure)

### 검증
- `yarn type-check` 통과
- 배출량 총합: Scope 2 = 469.22, Scope 3 = 10,603.50, 합계 = 11,072.72 kgCO₂e — CLAUDE.md 와 정확히 일치

---

## ✅ Phase 2 — Context Provider + 공통 레이아웃 + 대시보드 메인

### 작업
- 전역 상태관리: **Context API + custom hooks** (Zustand 미사용 — 사용자 결정)
- [lib/contexts/DataContext.tsx](../lib/contexts/DataContext.tsx) — `DataProvider` + `useData()` hook
  - mount 시 5종 데이터 병렬 fetch
  - `createOrUpdatePost` / `createActivity` 에 **낙관적 업데이트 + 실패 시 롤백** 구현
- [lib/api.ts](../lib/api.ts) 에 `fetchAllActivities()` 헬퍼 추가
- [components/ui/LoadingSpinner.tsx](../components/ui/LoadingSpinner.tsx) — 중앙 정렬 스피너
- [components/ui/ErrorMessage.tsx](../components/ui/ErrorMessage.tsx) — 에러 + 재시도 버튼
- [components/layout/Sidebar.tsx](../components/layout/Sidebar.tsx) — 3개 메뉴 + 활성 라우트 하이라이트
- [components/dashboard/ProductCard.tsx](../components/dashboard/ProductCard.tsx) — 제품 요약 카드
- [app/layout.tsx](../app/layout.tsx) — `DataProvider` + Sidebar 레이아웃
- [app/page.tsx](../app/page.tsx) — 대시보드 메인 (loading/error/카드 그리드)

### 검증
- `yarn type-check` 통과
- `yarn dev` → `http://localhost:3000` 200 OK, 컴파일 에러 없음
- SSR HTML 에 Sidebar + 헤더 + 로딩 스피너 정상 렌더링
- ⚠️ 데이터 로딩 후 카드 렌더링은 브라우저에서 시각 검증 필요

---

## ✅ Phase 3 — 제품 상세 페이지 + 4개 차트 + 리포트 작성 폼

### 작업
- [lib/utils/chartHelpers.ts](../lib/utils/chartHelpers.ts) — 색상 팔레트, 단계↔Scope 매핑, 월 리스트, formatKgCO2e 등 공용 헬퍼
- [components/products/LcaStageChart.tsx](../components/products/LcaStageChart.tsx) — 원료조달/제조/운송유통 도넛 + 단계별 Scope 라벨 + 사용/폐기 "데이터 없음"
- [components/products/TimeSeriesChart.tsx](../components/products/TimeSeriesChart.tsx) — 월별 스택 바 (전기/원소재/운송) + 시작/종료 월 필터
- [components/products/ScopeChart.tsx](../components/products/ScopeChart.tsx) — Scope 1/2/3 도넛 + 월별 Scope 스택 바 + 커스텀 툴팁에 LCA 단계 표시
- [components/products/CompanyChart.tsx](../components/products/CompanyChart.tsx) — 회사별 가로 스택 바 (Scope 2/3) + 데이터 없는 회사도 0으로 표시
- [components/products/ReportForm.tsx](../components/products/ReportForm.tsx) — 월 selector + 기존 Post 자동 로드 + 작성/수정 모드 분기 + 실패 시 에러 메시지 (롤백은 DataContext 단)
- [app/products/[id]/page.tsx](../app/products/) — 4개 차트 + ReportForm 통합 + 헤더에 회사명/총 배출량 표시

### 검증
- `yarn type-check` 통과 (recharts v3 의 `TooltipContentProps` + 함수형 `content={Component}` 패턴 사용)
- `/products/ct-045` 200 OK, 컴파일 에러 없음
- ⚠️ 차트 시각 검증은 브라우저에서 직접 확인 필요 (`http://localhost:3000/products/ct-045`)

---

## ✅ Phase 4 — 리포트 목록 + 활동 데이터 입력 폼

### 작업
- [components/reports/ReportCard.tsx](../components/reports/ReportCard.tsx) — 제목/제품명/작성월/내용 요약(80자) + 제품 상세 링크
- [app/reports/page.tsx](../app/reports/page.tsx) — Post 전체 목록 (작성월 내림차순) + 빈 상태 메시지
- [components/activities/ActivityForm.tsx](../components/activities/ActivityForm.tsx) — 7개 필드 + 4종 유효성 검사 + cascade selects
  - 회사 → 제품 cascade (회사 변경 시 제품 리셋, 제품 없는 회사는 안내 메시지)
  - 활동 유형 → 설명 cascade (전기→한국전력 / 원소재→플라스틱 1,2 / 운송→트럭)
  - 설명 → 단위 자동 설정 (kWh / kg / ton-km, readonly)
  - 유효성: 필수("필수 항목입니다.") / 숫자("숫자를 입력해주세요.") / 양수("0보다 큰 값을 입력해주세요.") / 날짜형식("올바른 날짜 형식을 입력해주세요.")
  - 성공 시 `router.push('/products/[productId]')`, 실패 시 인라인 에러 메시지
- [app/activities/new/page.tsx](../app/activities/new/page.tsx) — ActivityForm 래퍼 (loading/error 처리)

### 검증
- `yarn type-check` 통과
- `/reports` 200 OK, `/activities/new` 200 OK, dev 서버 에러 없음
- ⚠️ 폼 상호작용 (cascade, 유효성, 저장 후 리다이렉트, 15% 실패 시 에러 메시지) 은 브라우저에서 직접 확인 필요

---

## ✅ Phase 5 — README + 스크린샷 + 체크리스트 점검

### 작업
- [README.md](../README.md) 전면 재작성:
  - 로컬 실행 5단계 이내 (clone → yarn install → yarn dev)
  - 페이지 구성 + 공유 기간 필터 동작 설명
  - **Assumptions** — CLAUDE.md `## Assumptions` 와 동기화 (PCF 계산 불가 / Scope 1 = 0 / 사용·폐기 데이터 없음 / 2025-05 중복 별개 처리 / Globex 더미 / Context API 확정)
  - **AI 도구 사용 내역** — Claude Code 활용 범위 + 사람이 결정한 것/직접 한 것 분리
  - Tech stack / 디렉토리 구조 / 평가 체크리스트
- 빌드 차단 lint 오류 5개 정리:
  - `lib/api.ts` 의 immutable refs (`_countries` 등) `let` → `const`
  - `ReportForm.tsx` 의 effect-기반 reset 을 React 19 권장 "compare prev prop" 패턴으로 교체 (useEffect 제거)
  - `DataContext.tsx` fetch-on-mount 는 canonical 패턴이라 disable + 사유 코멘트
- `yarn build` 성공 (App Router 6 페이지 정상 generate)

### 검증
- `yarn lint` ✅ 무경고
- `yarn type-check` ✅ 통과
- `yarn build` ✅ 성공 (Static: `/`, `/_not-found`, `/activities/new`, `/reports`; Dynamic: `/products/[id]`)
- spec.md §13 체크리스트 12/14 자동 충족, 나머지 2개 (GitHub public push, 화면 캡쳐 영상) 는 사용자 작업 영역

---

## 전역 결정 / 가정

[decision.md](../decision.md) 에 상세 기록. 핵심:

1. **PCF 계산 불가 → 전과정 배출량 시각화로 해석** (생산 수량 데이터 부재)
2. **상태관리는 Context API + custom hooks** (Zustand 미사용 — 사용자 결정)
3. **LCA 단계와 GHG Scope 매핑하여 함께 표시** (원료조달=Scope3, 제조=Scope2, 운송유통=Scope3)
4. **배출계수는 별도 모듈** (`lib/constants/emissionFactors.ts`) + version/effectiveDate 필드
5. **Scope 1 = 0 kgCO₂e 로 명시 표시**, LCA 사용/폐기 단계 = "데이터 없음" 명시
6. **현재 디렉토리에 Next.js 설치** (별도 하위 디렉토리 미생성)
7. **`@types/recharts` 미설치** (recharts v3+ 자체 타입 포함)
