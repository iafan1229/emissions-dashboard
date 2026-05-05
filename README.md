# Emissions Dashboard

CT-045 (컴퓨터 화면) 의 **PCF 전과정(LCA) 활동 데이터 배출량을 시각화** 하는 인터랙티브 대시보드.
Next.js 16 App Router + TypeScript + Tailwind + Recharts 로 구현.

> **핵심 해석**: 과제 데이터에 생산 수량이 없어 PCF(제품 1개당 배출량) 계산은 불가하므로,
> PCF 를 구성하는 전과정 단계별 (원료조달 / 제조 / 운송유통) 배출량을 LCA × GHG Scope 관점에서 시각화한다.
> 자세한 근거는 [decision.md #0](decision.md) 참고.

---

## 로컬 실행 방법

```bash
# 1. clone
git clone <repo-url> dashboard && cd dashboard

# 2. 의존성 설치 (Node.js 20+, yarn 1.22+ 필요)
yarn install

# 3. 개발 서버 실행 → http://localhost:3000
yarn dev
```

추가 명령:
```bash
yarn build       # 프로덕션 빌드
yarn type-check  # tsc --noEmit
yarn lint        # ESLint
```

---

## 페이지 구성

| 경로 | 설명 |
|---|---|
| `/` | 대시보드 메인 — 제품 카드 (총 배출량 + Scope 2/3 비중) |
| `/products/[id]` | 제품 상세 — 4개 차트 + 월별 리포트 작성 폼 + **공통 기간 필터** |
| `/reports` | 전체 월간 지속가능성 리포트 목록 (Post) |
| `/activities/new` | 활동 데이터 입력 폼 (회사→제품 cascade, 활동→설명/단위 자동 연동) |

`/products/[id]` 의 4개 차트는 페이지 상단 기간 필터에 동기화되어 함께 반응:
- **전과정 단계별 (LCA)** — 원료조달 / 제조 / 운송유통 도넛, 각 단계에 GHG Scope 함께 표시 (사용/폐기는 "데이터 없음")
- **GHG Scope별** — Scope 1/2/3 도넛 + 월별 스택 바, 툴팁에 LCA 단계 함께 표시 (Scope 1 = 0 명시)
- **월별 추이** — 활동 유형별 (전기/원소재/운송) 스택 바
- **회사별 비교** — 가로 스택 바 (시간 축이 아니므로 필터에 영향 없음)

---

## Assumptions

CLAUDE.md `## Assumptions` 와 동기화. 발표/제출 시 명시적으로 짚어야 할 해석:

- 과제용 데이터는 CT-045 의 2025.01~08 생산 활동 전체의 배출량으로 간주한다.
- **생산 수량 데이터가 없어 제품 1개당 PCF 계산은 포함하지 않는다.** 대신 "기간 총 배출량(kgCO₂e)" 으로 표시한다 (PCF ≠ 총 배출량).
- Scope 1 데이터가 없으므로 0 kgCO₂e 로 명시한다 (항목 자체는 표시).
- 전과정(LCA) 5단계 중 원료 조달 / 제조 / 운송유통 단계만 데이터가 제공되어 사용 / 폐기 단계는 "데이터 없음" 으로 표시한다.
- 2025-05-01 중복 데이터는 별개의 활동 기록으로 간주하여 모두 합산한다.
- 회사 c2 (Globex) 는 비교 시연용 더미로, 등록된 제품이 없다 (`/activities/new` 폼에서 안내 메시지 표시).
- **상태관리는 React Context API + custom hooks** 로 통일 (Zustand 미사용).

---

## AI 도구 사용 내역

본 프로젝트는 **Anthropic Claude Code (Claude Opus 4.7)** 와 페어 프로그래밍 형태로 진행했다.

### 활용 범위
- **설계 단계**: spec.md / decision.md / docs/phase.md 의 구조 작성, 트레이드오프 정리, 평가 기준 매핑 (시스템 설계 30% / 도메인 25% / UX 25% / 논리 20%)
- **PCF / GHG Scope 도메인 해석**: "PCF 계산 불가 → 전과정 활동 배출량 시각화" 로의 재해석 ([decision.md #0](decision.md))
- **구현**: Phase 1~5 전 코드 작성 (타입 정의, 배출계수 분리, fake backend, Context Provider + 낙관적 업데이트/롤백, 4개 Recharts 차트, 활동 입력 폼 cascade/유효성, README)
- **검증**: 시드 데이터 합계가 CLAUDE.md 의 Scope 2 = 469.22, Scope 3 = 10,603.50, 합계 = 11,072.72 kgCO₂e 와 정확히 일치하는지 확인
- **이슈 해결**: Recharts v3 의 `TooltipContentProps` 타이핑, ESLint `react-hooks/set-state-in-effect` 규칙 우회 패턴 ("compare prev prop" / 명시적 disable + 사유)

### 사람이 결정한 것
- 상태 관리 라이브러리 선택 (Zustand 후보를 제거하고 Context API 확정)
- 공유 기간 필터 도입 결정 (LCA / Scope / TimeSeries 차트 동기화)
- spec.md / decision.md 의 도메인 해석 방향성 (PCF 계산 불가 시 어떤 시각화로 대체할지)
- 플로우 단위 작업 분할 (Phase 1~5)

### 사람이 직접 한 작업
- 디스크 공간 확보 (Phase 1 빌드 차단 이슈)
- 브라우저에서의 시각 검증 (차트 렌더링, 폼 인터랙션, 15% 실패 시 롤백 동작 확인)

---

## Tech Stack

| 영역 | 선택 |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Runtime | React 19.2 |
| Language | TypeScript 5+ |
| Styling | Tailwind CSS v4 |
| Charts | Recharts v3 |
| State | React Context API + custom hooks |
| Backend | Fake API (in-memory, 200~800ms latency, 15% write 실패 시뮬레이션) |

---

## 디렉토리 구조

```
app/                       # Next.js App Router 페이지
  layout.tsx               # DataProvider + Sidebar 공통 레이아웃
  page.tsx                 # 대시보드 메인
  products/[id]/page.tsx   # 제품 상세 (4 차트 + 리포트 폼 + 기간 필터)
  reports/page.tsx         # 리포트 목록
  activities/new/page.tsx  # 활동 데이터 입력
components/
  layout/Sidebar.tsx
  dashboard/ProductCard.tsx
  products/                # LcaStage / TimeSeries / Scope / Company / PeriodFilter / ReportForm
  reports/ReportCard.tsx
  activities/ActivityForm.tsx
  ui/                      # LoadingSpinner / ErrorMessage
lib/
  api.ts                   # Fake backend (latency + failure)
  types.ts                 # 공유 TypeScript 타입
  contexts/DataContext.tsx # 전역 상태 + 낙관적 업데이트 + 롤백
  data/seed.ts             # 시드 데이터 (companies / products / activityData / posts)
  constants/emissionFactors.ts  # 배출계수 (version, effectiveDate 포함)
  utils/calculateEmissions.ts   # amount × factor 계산
  utils/chartHelpers.ts    # 색상 팔레트 / 매핑 / formatter
docs/phase.md              # 5-Phase 구현 로드맵
spec.md                    # 구현 명세
decision.md                # 설계 의사결정 기록
CLAUDE.md                  # 도메인 컨텍스트 + sample data
```

---

## 스크린샷 / 데모 영상

> ⚠️ 캡쳐 첨부 위치 — 제출 시 아래에 추가:
>
> - 대시보드 메인 (`/`) 스크린샷
> - 제품 상세 (`/products/ct-045`) — 기간 필터 동작 비포/애프터
> - 리포트 작성 + 저장 실패 시 롤백 시연
> - 활동 데이터 입력 폼 + 유효성 검사 에러 메시지
> - 화면 캡쳐 영상 링크 (Loom / YouTube 등)

---

## 평가 체크리스트 ([spec.md §13](spec.md))

- [x] PCF 전과정 배출량 시각화 + 단위(kgCO₂e) 명시
- [x] LCA 단계별 시각화 (LcaStageChart)
- [x] Scope 1/2/3 분류 (ScopeChart)
- [x] LCA 단계와 GHG Scope 연결 표시 (도넛 라벨 + 툴팁)
- [x] 활동 데이터 입력 유효성 에러 메시지 (필수 / 숫자 / 양수 / 날짜형식)
- [x] 리포트 저장 실패 시 롤백 (DataContext 의 낙관적 업데이트 + 에러 메시지)
- [x] 전체 리포트 목록 페이지 `/reports`
- [x] 로딩 상태 (LoadingSpinner)
- [x] `yarn dev` 오류 없이 실행 + `yarn build` 성공
- [x] README 로컬 실행 5단계 이내
- [x] README AI 도구 사용 내역
- [x] README Assumptions
- [ ] GitHub public + 커밋 히스토리 — **사용자가 push 시 확인**
- [ ] UI 실행 비디오캡쳐 + 스크린샷 — **사용자가 캡쳐 후 첨부**
