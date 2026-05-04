# 구현 Phase 로드맵

[spec.md](../spec.md) 의 명세를 5개 Phase로 분할하여 점진적으로 구현한다.
각 Phase 종료 시 `yarn type-check` + 브라우저 검증을 거친 후 다음 단계로 진행.

| Phase | 범위 | spec.md 참조 | 상태 |
|---|---|---|---|
| 1 | 프로젝트 초기화 + 핵심 lib 모듈 | §1~6 | ✅ 완료 |
| 2 | Context Provider + 공통 레이아웃 + 대시보드 메인 | §7~8 | ✅ 완료 |
| 3 | 제품 상세 페이지 + 4개 차트 + 리포트 작성 폼 | §9 | ⏳ 대기 |
| 4 | 리포트 목록 + 활동 데이터 입력 폼 | §10~11 | ⏳ 대기 |
| 5 | README + 스크린샷/캡쳐 + 체크리스트 점검 | §13 | ⏳ 대기 |

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

## ⏳ Phase 3 — 제품 상세 페이지 + 4개 차트 + 리포트 작성 폼

### 범위 (spec.md §9)
- [app/products/[id]/page.tsx](../app/products/) — 제품 상세 라우트
- 4개 차트 컴포넌트:
  - `components/products/LcaStageChart.tsx` — 원료조달/제조/운송유통 도넛 (Scope 함께 표시)
  - `components/products/TimeSeriesChart.tsx` — 월별 배출량 추이 바 차트 + 기간 필터
  - `components/products/ScopeChart.tsx` — Scope 1/2/3 도넛 + 월별 스택 바 + LCA 단계 툴팁
  - `components/products/CompanyChart.tsx` — 회사별 가로 바 차트
- `components/products/ReportForm.tsx` — 월 선택 후 Post 작성/수정 (저장 실패 시 롤백)

### 핵심 고려사항
- recharts 의 `PieChart`, `BarChart`, `Tooltip` 사용
- `useMemo` 로 차트 데이터 가공 (월별 그룹핑, scope/stage 합산)
- LCA 사용/폐기 단계는 "데이터 없음" 명시
- Scope 1 은 0 kgCO₂e 명시
- ReportForm 은 `useData().createOrUpdatePost` 호출 (롤백 이미 구현됨)

### 검증
- `yarn type-check` 통과
- 4개 차트가 모두 렌더링되고, 합계가 Phase 1 검증값과 일치
- 리포트 작성/수정 + 강제 실패(15% 확률) 재시도로 롤백 동작 확인

---

## ⏳ Phase 4 — 리포트 목록 + 활동 데이터 입력 폼

### 범위 (spec.md §10~11)
- [app/reports/page.tsx](../app/reports/) — 전체 Post 목록
  - `components/reports/ReportList.tsx`, `components/reports/ReportCard.tsx`
- [app/activities/new/page.tsx](../app/activities/new/) — 활동 데이터 입력 폼
  - `components/activities/ActivityForm.tsx`
  - 회사 → 제품 cascade select
  - 활동 유형 → 설명/단위 자동 연동 (전기→한국전력/kWh, 원소재→플라스틱 1,2/kg, 운송→트럭/ton-km)
  - 유효성 검사 4종 (필수/0 초과/숫자/날짜)
  - 성공 시 `/products/[productId]` 이동, 실패 시 에러 메시지

### 검증
- `/reports` 에서 Post 목록 표시
- `/activities/new` 에서 입력 → 저장 → 리다이렉트 + ProductCard 의 총 배출량 갱신 확인
- 모든 유효성 에러 메시지 노출

---

## ⏳ Phase 5 — README + 스크린샷 + 체크리스트 점검

### 범위 (spec.md §13)
- [README.md](../README.md) 작성:
  - 로컬 실행 방법 (5단계 이내)
  - AI 도구 사용 내역
  - Assumptions (CLAUDE.md `## Assumptions` 동기화)
  - 스크린샷 + 화면 캡쳐 비디오 링크
- spec.md §13 체크리스트 전 항목 점검
- (보너스) Docker Compose, OpenAPI 등은 시간 여유 시

### 검증
- `yarn build` 성공
- `yarn lint` 무경고
- README 만 보고 5분 내에 새 환경에서 `yarn dev` 까지 도달 가능한지

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
