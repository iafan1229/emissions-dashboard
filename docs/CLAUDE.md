# CLAUDE.md — HanaLoop Emissions Dashboard

## ⚠️ 핵심 해석 (반드시 먼저 읽을 것)

과제 요구사항은 **"PCF 전과정 데이터를 시각화"** 이나, 제공된 데이터에는 **생산 수량이 없어 PCF(제품 1개당 배출량) 계산이 불가능하다.**

따라서 이 대시보드는 아래와 같이 해석하여 구현한다:

> **PCF를 계산해서 보여주는 것이 아니라,**
> **PCF를 구성하는 전과정(원료조달/제조/운송) 활동 데이터의 배출량을 시각화하여**
> **어느 단계/Scope에서 배출이 집중되는지 파악할 수 있도록 한다.**

이 모호함(ambiguity)은 README Assumption과 decision.md에 명시한다.

---

## Project Overview
HanaLoop 채용 과제 — 탄소 배출량 데이터를 시각화하는 인터랙티브 대시보드.
CT-045(컴퓨터 화면) 샘플 데이터를 활용하여 PCF 전과정 데이터를 시각화한다.
대상 사용자: 실무자 및 경영진.

**핵심 방향: PCF 중심 대시보드 — 회사는 필수 속성 (제품이 속한 회사)**

---

## Tech Stack & Constraints
- **Next.js 14+ (App Router)**, React 18, TypeScript
- Styling: Tailwind CSS 또는 CSS Modules
- State: Zustand / React Context + custom hooks
- ❌ MUI, Ant Design 등 heavy UI 라이브러리 사용 금지
- ✅ shadcn/ui, headless UI 등 경량 유틸리티는 허용
- Optional: PostgreSQL

---

## Directory Structure
```
app/                  # Next.js App Router pages
components/           # 재사용 UI 컴포넌트
lib/
  api.ts              # fake backend (latency 200~800ms + 10~15% failure 시뮬레이션)
  data/               # seed data (activity data, emission factors)
  types.ts            # 공유 TypeScript 타입 정의
  constants/
    emissionFactors.ts # 배출계수 상수 (DB 미사용 시)
```

---

## Domain Concepts

### PCF (Product Carbon Footprint)
- **제품 1개를 만드는 데 발생하는 탄소 배출량의 총합**
- 단위: kgCO₂e (킬로그램), tCO₂e (톤)
- 계산식: `배출량 = 활동량 × 배출계수`

### PCF 전과정 단계 (LCA)
제품의 전 생애주기 단계. 이 과제 데이터는 앞 3단계만 포함.

| 단계 | 내용 | 이 과제 데이터 |
|---|---|---|
| **원료 조달** | 원자재 채취/구매 | 원소재 (플라스틱 1, 2) ✅ |
| **제조** | 공장 생산 (전기 사용) | 전기 (한국전력) ✅ |
| **운송/유통** | 제품 배송 | 운송 (트럭) ✅ |
| **사용** | 소비자 사용 단계 | ❌ 데이터 없음 |
| **폐기** | 수명 종료 후 처리 | ❌ 데이터 없음 |

### GHG Scope
PCF 안에서 배출 원인을 아래와 같이 분류한다.

| Scope | 정의 | 이 과제 데이터 |
|---|---|---|
| Scope 1 | 직접 배출 (연료 연소 등) | 해당 없음 → **0 kgCO₂e** |
| Scope 2 | 구매한 전력/열 간접 배출 | **전기 (한국전력)** |
| Scope 3 | 공급망/운송 등 기타 간접 배출 | **원소재 (플라스틱 1, 2), 운송 (트럭)** |

### LCA 단계 ↔ GHG Scope 매핑
이 과제에서 두 개념은 아래와 같이 연결된다. **대시보드에서 LCA 단계별로 시각화하되, 각 단계가 어떤 Scope에 해당하는지 함께 표시한다.**

| 활동 | LCA 단계 | GHG Scope |
|---|---|---|
| 전기 (한국전력) | 제조 | Scope 2 |
| 원소재 (플라스틱 1, 2) | 원료조달 | Scope 3 |
| 운송 (트럭) | 운송유통 | Scope 3 |
| — | 사용 / 폐기 | 데이터 없음 |

### 배출계수 (Emission Factors)
배출계수는 별도 모듈로 관리하고 버전 이력을 추적할 수 있도록 설계한다.

| 항목 | 계수 | 단위 |
|---|---|---|
| 전기 (한국전력 기본값) | 0.456 | kgCO₂e / kWh |
| 원소재 (플라스틱 1) | 2.3 | kgCO₂e / kg |
| 원소재 (플라스틱 2) | 3.2 | kgCO₂e / kg |
| 운송 (트럭) | 3.5 | kgCO₂e / ton-km |

---

## Sample Data (CT-045)
과제용 데이터는 **컴퓨터 화면 CT-045 생산 활동 데이터 (2025.01~08)** 이다.

### 기간 총 배출량 계산 결과 (2025.01~08)
※ 생산 수량 데이터 없음 → PCF(제품 1개당) 계산 불가. 총 배출량으로만 표시.

| Scope | 활동 | 배출량 |
|---|---|---|
| Scope 1 | 없음 | 0 kgCO₂e (0%) |
| Scope 2 | 전기 (한국전력) | 469.22 kgCO₂e (4.2%) |
| Scope 3 | 원소재 (플라스틱 1, 2) + 운송 (트럭) | 10,603.50 kgCO₂e (95.8%) |
| **합계** | | **11,072.72 kgCO₂e = 11.07 tCO₂e** |

---

## Data Model (TypeScript)
```typescript
type ActivityType = '전기' | '원소재' | '운송';
type LcaStage = '원료조달' | '제조' | '운송유통' | '사용' | '폐기';
type GhgScope = 'scope1' | 'scope2' | 'scope3';

// ActivityType → LcaStage 매핑
// '원소재' → '원료조달'
// '전기'   → '제조'
// '운송'   → '운송유통'

// 국가
type Country = {
  code: string;   // "KR", "US", "DE"
  name: string;
};

// 회사
type Company = {
  id: string;
  name: string;
  country: string;  // Country.code
};

// 제품 (PCF 분석의 기본 단위)
type Product = {
  id: string;       // "ct-045"
  name: string;     // "컴퓨터 화면 CT-045"
  companyId: string; // Company.id
};

// 활동 데이터 (xlsx 기준 — 입력 원본)
type ActivityData = {
  id: string;
  date: string;           // "2025-01-01"
  activityType: ActivityType;
  description: string;    // "한국전력", "플라스틱 1", "트럭"
  amount: number;
  unit: string;           // "kWh", "kg", "ton-km"
  productId: string;      // Product.id
  companyId: string;      // Company.id
};

// 배출계수 (별도 모듈로 관리, 버전 이력 추적)
type EmissionFactor = {
  source: string;
  factor: number;
  unit: string;
  scope: GhgScope;
  version: number;
  effectiveDate: string;
};

// 배출량 계산 결과 (ActivityData × EmissionFactor)
type GhgEmission = {
  yearMonth: string;      // "2025-01"
  source: string;         // "전기", "원소재", "운송"
  emissions: number;      // kgCO₂e
  scope: GhgScope;
  productId: string;      // Product.id
  companyId: string;      // Company.id
};

// 게시글 (제품+월에 연결)
type Post = {
  id: string;
  title: string;
  resourceUid: string;    // Product.id
  dateTime: string;       // "2025-01"
  content: string;
};
```

### 데이터 구조
```
Company
  └── Product (CT-045 등)
        └── ActivityData (전기/원소재/운송 활동 입력)
              └── × EmissionFactor
                    └── GhgEmission (배출량 계산 결과)
```

### 데이터 흐름
```
ActivityData × EmissionFactor → GhgEmission (계산 결과)
GhgEmission → 대시보드 시각화 (시간별, Scope별, 회사별)
Post → 제품별 월간 리포트/코멘트
```

---

## Seed Data

### companies (docx 기준)
```typescript
export const companies: Company[] = [
  { id: "c1", name: "Acme Corp", country: "US" },
  { id: "c2", name: "Globex",    country: "DE" }
];
```

### products
```typescript
export const products: Product[] = [
  { id: "ct-045", name: "컴퓨터 화면 CT-045", companyId: "c1" }
];
```

### activityData (xlsx CT-045 기준)
```typescript
export const activityData: ActivityData[] = [
  { id: "a1",  date: "2025-01-01", activityType: "전기",   description: "한국전력",  amount: 110.0, unit: "kWh",    productId: "ct-045", companyId: "c1" },
  { id: "a2",  date: "2025-02-01", activityType: "전기",   description: "한국전력",  amount: 112.0, unit: "kWh",    productId: "ct-045", companyId: "c1" },
  { id: "a3",  date: "2025-03-01", activityType: "전기",   description: "한국전력",  amount: 115.0, unit: "kWh",    productId: "ct-045", companyId: "c1" },
  { id: "a4",  date: "2025-04-01", activityType: "전기",   description: "한국전력",  amount: 130.0, unit: "kWh",    productId: "ct-045", companyId: "c1" },
  { id: "a5",  date: "2025-05-01", activityType: "전기",   description: "한국전력",  amount: 120.0, unit: "kWh",    productId: "ct-045", companyId: "c1" },
  { id: "a6",  date: "2025-06-01", activityType: "전기",   description: "한국전력",  amount: 110.0, unit: "kWh",    productId: "ct-045", companyId: "c1" },
  { id: "a7",  date: "2025-07-01", activityType: "전기",   description: "한국전력",  amount: 120.0, unit: "kWh",    productId: "ct-045", companyId: "c1" },
  { id: "a8",  date: "2025-08-01", activityType: "전기",   description: "한국전력",  amount: 111.0, unit: "kWh",    productId: "ct-045", companyId: "c1" },
  { id: "a9",  date: "2025-05-01", activityType: "전기",   description: "한국전력",  amount: 101.0, unit: "kWh",    productId: "ct-045", companyId: "c1" },
  { id: "a10", date: "2025-01-01", activityType: "원소재", description: "플라스틱 1", amount: 230.0, unit: "kg",    productId: "ct-045", companyId: "c1" },
  { id: "a11", date: "2025-02-01", activityType: "원소재", description: "플라스틱 1", amount: 340.0, unit: "kg",    productId: "ct-045", companyId: "c1" },
  { id: "a12", date: "2025-03-01", activityType: "원소재", description: "플라스틱 2", amount: 23.0,  unit: "kg",    productId: "ct-045", companyId: "c1" },
  { id: "a13", date: "2025-03-01", activityType: "원소재", description: "플라스틱 1", amount: 430.0, unit: "kg",    productId: "ct-045", companyId: "c1" },
  { id: "a14", date: "2025-04-01", activityType: "원소재", description: "플라스틱 1", amount: 510.0, unit: "kg",    productId: "ct-045", companyId: "c1" },
  { id: "a15", date: "2025-05-01", activityType: "원소재", description: "플라스틱 1", amount: 424.0, unit: "kg",    productId: "ct-045", companyId: "c1" },
  { id: "a16", date: "2025-05-01", activityType: "원소재", description: "플라스틱 2", amount: 40.0,  unit: "kg",    productId: "ct-045", companyId: "c1" },
  { id: "a17", date: "2025-06-01", activityType: "원소재", description: "플라스틱 1", amount: 450.0, unit: "kg",    productId: "ct-045", companyId: "c1" },
  { id: "a18", date: "2025-07-01", activityType: "원소재", description: "플라스틱 1", amount: 340.0, unit: "kg",    productId: "ct-045", companyId: "c1" },
  { id: "a19", date: "2025-07-01", activityType: "원소재", description: "플라스틱 2", amount: 43.0,  unit: "kg",    productId: "ct-045", companyId: "c1" },
  { id: "a20", date: "2025-08-01", activityType: "원소재", description: "플라스틱 1", amount: 230.0, unit: "kg",    productId: "ct-045", companyId: "c1" },
  { id: "a21", date: "2025-05-01", activityType: "원소재", description: "플라스틱 1", amount: 232.0, unit: "kg",    productId: "ct-045", companyId: "c1" },
  { id: "a22", date: "2025-01-01", activityType: "운송",   description: "트럭",       amount: 41.0,  unit: "ton-km", productId: "ct-045", companyId: "c1" },
  { id: "a23", date: "2025-02-01", activityType: "운송",   description: "트럭",       amount: 211.0, unit: "ton-km", productId: "ct-045", companyId: "c1" },
  { id: "a24", date: "2025-03-01", activityType: "운송",   description: "트럭",       amount: 123.0, unit: "ton-km", productId: "ct-045", companyId: "c1" },
  { id: "a25", date: "2025-04-01", activityType: "운송",   description: "트럭",       amount: 42.0,  unit: "ton-km", productId: "ct-045", companyId: "c1" },
  { id: "a26", date: "2025-05-01", activityType: "운송",   description: "트럭",       amount: 123.0, unit: "ton-km", productId: "ct-045", companyId: "c1" },
  { id: "a27", date: "2025-06-01", activityType: "운송",   description: "트럭",       amount: 123.0, unit: "ton-km", productId: "ct-045", companyId: "c1" },
  { id: "a28", date: "2025-07-01", activityType: "운송",   description: "트럭",       amount: 41.0,  unit: "ton-km", productId: "ct-045", companyId: "c1" },
  { id: "a29", date: "2025-08-01", activityType: "운송",   description: "트럭",       amount: 123.0, unit: "ton-km", productId: "ct-045", companyId: "c1" },
  { id: "a30", date: "2025-05-01", activityType: "운송",   description: "트럭",       amount: 12.0,  unit: "ton-km", productId: "ct-045", companyId: "c1" },
];
```

### posts (docx 기준)
```typescript
export const posts: Post[] = [
  {
    id: "p1",
    title: "Sustainability Report",
    resourceUid: "ct-045",
    dateTime: "2025-02",
    content: "Quarterly CO2 update"
  }
];
```

---

## Page Structure

| 페이지 | 경로 | 설명 |
|---|---|---|
| 대시보드 메인 | `/` | 전체 제품 목록 + 제품별 PCF 요약 카드 → 클릭 시 상세로 이동 |
| 제품 상세 | `/products/[id]` | 전과정 시각화 (시간별/Scope별/전과정 단계별/회사별) + 리포트 작성 |
| 리포트 목록 | `/reports` | 전체 Post(월별 지속가능성 리포트) 목록 |
| 활동 데이터 입력 | `/activities/new` | 활동 데이터 입력 폼 (회사 + 제품 선택 필수) |

### 네비게이션 흐름
```
메인 (/)
  → 제품 카드 클릭 → 제품 상세 (/products/[id])
                      → 월 선택 → 리포트 작성/수정
  → 사이드바 → 리포트 목록 (/reports)
            → 활동 데이터 입력 (/activities/new)
```

---

## Dashboard Views (제품 상세 기준)

### 전과정 단계별 뷰 (LCA Stage)
- 원료조달 / 제조 / 운송유통 단계별 배출량 비중 — 도넛 또는 바 차트
- 사용/폐기 단계는 "데이터 없음"으로 명시

### 시간별 뷰 (Time)
- 월별 배출량 추이 — 라인 또는 바 차트
- 기간 필터 (월 선택)

### Scope별 뷰 (Scope)
- Scope 1 / 2 / 3 비중 — 도넛 차트
- Scope별 월별 추이 — 스택 바 차트

### 회사별 뷰 (Company)
- 회사별 총 배출량 비교 — 바 차트
- 회사별 Scope 비중

### 리포트 작성 (Post)
- 제품 상세에서 월 선택 후 해당 월의 리포트 작성/수정
- `createOrUpdatePost` API 사용
- 저장 실패 시 (10~15% 확률) 에러 메시지 + 롤백 처리 필수
- 작성된 리포트는 `/reports`에서 전체 목록 확인 가능

---

## Fake Backend (`lib/api.ts`)

실제 DB 없이 네트워크 I/O를 시뮬레이션하는 모듈. **모든 API 호출은 이 모듈을 경유해야 한다.**

### 동작 규칙
- **지연 (latency)**: 200~800ms 랜덤 딜레이
- **실패 (failure)**: write 작업 시 10~15% 확률로 에러 발생
- **실패 대상**: `createOrUpdatePost` 등 쓰기 작업만 해당 (읽기는 항상 성공)

### 제공 stub 코드 (docx 기준 — 그대로 구현할 것)
```typescript
// lib/api.ts
let _countries = [...countries];
let _companies = [...companies];
let _posts = [...posts];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
const jitter = () => 200 + Math.random() * 600;
const maybeFail = () => Math.random() < 0.15;

export async function fetchCountries() {
  await delay(jitter());
  return _countries;
}

export async function fetchCompanies() {
  await delay(jitter());
  return _companies;
}

export async function fetchPosts() {
  await delay(jitter());
  return _posts;
}

export async function createOrUpdatePost(p: Omit<Post, "id"> & { id?: string }) {
  await delay(jitter());
  if (maybeFail()) throw new Error("Save failed");
  if (p.id) {
    _posts = _posts.map(x => x.id === p.id ? (p as Post) : x);
    return p as Post;
  }
  const created = { ...p, id: crypto.randomUUID() };
  _posts = [..._posts, created];
  return created;
}
```

### 추가 구현 함수 (과제 데이터 기준)
```typescript
export async function fetchProducts() {
  await delay(jitter());
  return _products;
}

export async function fetchActivityData(productId: string) {
  await delay(jitter());
  return _activityData.filter(a => a.productId === productId);
}
```

### UI 처리 요구사항
- 로딩 중: 로딩 인디케이터 표시
- 읽기 실패: 에러 상태 표시
- 쓰기 실패: 에러 메시지 + **롤백** (낙관적 업데이트 취소)

---

## Assumptions
- 과제용 데이터는 CT-045의 2025.01~08 생산 활동 전체의 배출량으로 간주한다.
- 생산 수량 데이터가 없어 제품 1개당 PCF 계산은 포함하지 않는다.
- 대시보드에서는 **기간 총 배출량(kgCO₂e)** 으로 표시한다. (PCF ≠ 총 배출량)
- Scope 1 데이터가 없으므로 0으로 명시한다.
- 2025-05-01 중복 데이터는 별개의 활동 기록으로 간주하여 모두 합산한다.
- 전과정(LCA) 중 원료 조달/제조/운송 단계만 데이터가 제공되어 사용 및 폐기 단계는 포함하지 않는다.

---

## Commands
```bash
yarn dev        # 개발 서버 시작
yarn build      # 프로덕션 빌드
yarn lint       # ESLint 실행
yarn type-check # tsc --noEmit
```

---

## Coding Conventions
- 컴포넌트: PascalCase, 파일명과 동일
- 함수: camelCase
- 배출계수 상수: UPPER_SNAKE_CASE
- API 함수는 `lib/api.ts`에만 위치
- 숫자 포맷: `toFixed(2)` 후 단위(kgCO₂e) 병기
- Scope는 `scope1` / `scope2` / `scope3` 문자열로 통일

---

## Evaluation Priorities
1. **시스템 설계 (30%)** — 모듈형 컴포넌트, 배출계수 별도 관리, 확장성
2. **도메인 이해 (25%)** — PCF/GHG Scope 개념이 코드와 UI에 반영
3. **UX (25%)** — 비전문가도 Scope별 배출량을 직관적으로 읽을 수 있는가
4. **논리적 설명 (20%)** — 설계 결정 이유, trade-off, AI 활용 방식

---

## Don'ts
- MUI, Ant Design 등 heavy 라이브러리 사용 금지
- 배출계수를 컴포넌트 안에 하드코딩 금지 → `lib/constants/emissionFactors.ts`로 분리
- API 호출을 컴포넌트 내부에서 직접 하지 말 것 → `lib/api.ts` 경유
- 단위 없이 숫자만 표시 금지 (항상 kgCO₂e 또는 tCO₂e 병기)
