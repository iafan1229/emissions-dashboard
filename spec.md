# spec.md — HanaLoop Emissions Dashboard 구현 명세

## ⚠️ 구현 전 반드시 확인

과제 데이터에 **생산 수량이 없어 PCF(제품 1개당 배출량) 계산이 불가능하다.**
이 대시보드는 PCF를 계산하는 것이 아니라, **PCF를 구성하는 전과정(원료조달/제조/운송) 단계별 배출량을 시각화**하는 것으로 해석하여 구현한다.
→ 자세한 근거는 `decision.md #0` 참고

---

## 목표
Next.js 14 App Router + TypeScript로 CT-045의 **전과정(LCA) 단계별 배출량을 시각화**하는 인터랙티브 대시보드를 구현한다.
- 전과정 단계별 (원료조달/제조/운송) 배출량 시각화
- GHG Scope별 (Scope 1/2/3) 배출량 시각화
- 시간별 (월별) 배출량 추이 시각화
- 회사별 배출량 비교

---

## 1. 프로젝트 초기 설정

### 1-1. 프로젝트 생성
```bash
npx create-next-app@latest hanaloop-emissions-dashboard \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir
```

### 1-2. 디렉토리 구조 생성
```
app/
  layout.tsx               # 사이드바 포함 공통 레이아웃
  page.tsx                 # 대시보드 메인 (/)
  products/
    [id]/
      page.tsx             # 제품 상세 (/products/[id])
  reports/
    page.tsx               # 리포트 목록 (/reports)
  activities/
    new/
      page.tsx             # 활동 데이터 입력 (/activities/new)
components/
  layout/
    Sidebar.tsx            # 네비게이션 사이드바
  dashboard/
    ProductCard.tsx        # 제품 요약 카드
  products/
    LcaStageChart.tsx      # 전과정 단계별 차트
    TimeSeriesChart.tsx    # 시간별 월별 차트
    ScopeChart.tsx         # Scope별 도넛 차트
    CompanyChart.tsx       # 회사별 바 차트
    ReportForm.tsx         # 리포트 작성/수정 폼 (제품 상세 내)
  reports/
    ReportList.tsx         # 전체 리포트 목록
    ReportCard.tsx         # 리포트 카드
  activities/
    ActivityForm.tsx       # 활동 데이터 입력 폼
  ui/
    LoadingSpinner.tsx     # 로딩 인디케이터
    ErrorMessage.tsx       # 에러 메시지
lib/
  api.ts                   # Fake backend
  types.ts                 # 공유 타입 정의
  data/
    seed.ts                # seed data (companies, products, activityData, posts)
  constants/
    emissionFactors.ts     # 배출계수 상수
  utils/
    calculateEmissions.ts  # 배출량 계산 함수
```

### 1-3. 패키지 설치
```bash
yarn add recharts
yarn add -D @types/recharts
```

---

## 2. 타입 정의 (`lib/types.ts`)

아래 타입을 정의한다.

```typescript
export type ActivityType = '전기' | '원소재' | '운송';
export type LcaStage = '원료조달' | '제조' | '운송유통' | '사용' | '폐기';
export type GhgScope = 'scope1' | 'scope2' | 'scope3';

export type Country = {
  code: string;
  name: string;
};

export type Company = {
  id: string;
  name: string;
  country: string;
};

export type Product = {
  id: string;
  name: string;
  companyId: string;
};

export type ActivityData = {
  id: string;
  date: string;
  activityType: ActivityType;
  description: string;
  amount: number;
  unit: string;
  productId: string;
  companyId: string;
};

export type EmissionFactor = {
  source: string;
  factor: number;
  unit: string;
  scope: GhgScope;
  lcaStage: LcaStage;
  version: number;
  effectiveDate: string;
};

export type GhgEmission = {
  yearMonth: string;
  source: string;
  emissions: number;
  scope: GhgScope;
  lcaStage: LcaStage;
  productId: string;
  companyId: string;
};

export type Post = {
  id: string;
  title: string;
  resourceUid: string;
  dateTime: string;
  content: string;
};
```

---

## 3. 배출계수 상수 (`lib/constants/emissionFactors.ts`)

```typescript
import { EmissionFactor } from '../types';

export const EMISSION_FACTORS: EmissionFactor[] = [
  {
    source: '한국전력',
    factor: 0.456,
    unit: 'kgCO₂e / kWh',
    scope: 'scope2',
    lcaStage: '제조',
    version: 1,
    effectiveDate: '2025-01-01',
  },
  {
    source: '플라스틱 1',
    factor: 2.3,
    unit: 'kgCO₂e / kg',
    scope: 'scope3',
    lcaStage: '원료조달',
    version: 1,
    effectiveDate: '2025-01-01',
  },
  {
    source: '플라스틱 2',
    factor: 3.2,
    unit: 'kgCO₂e / kg',
    scope: 'scope3',
    lcaStage: '원료조달',
    version: 1,
    effectiveDate: '2025-01-01',
  },
  {
    source: '트럭',
    factor: 3.5,
    unit: 'kgCO₂e / ton-km',
    scope: 'scope3',
    lcaStage: '운송유통',
    version: 1,
    effectiveDate: '2025-01-01',
  },
];
```

---

## 4. 배출량 계산 함수 (`lib/utils/calculateEmissions.ts`)

```typescript
import { ActivityData, GhgEmission } from '../types';
import { EMISSION_FACTORS } from '../constants/emissionFactors';

export function calculateEmissions(activities: ActivityData[]): GhgEmission[] {
  return activities.map(activity => {
    const factor = EMISSION_FACTORS.find(f => f.source === activity.description);
    if (!factor) throw new Error(`배출계수 없음: ${activity.description}`);

    return {
      yearMonth: activity.date.slice(0, 7), // "2025-01"
      source: activity.description,
      emissions: activity.amount * factor.factor,
      scope: factor.scope,
      lcaStage: factor.lcaStage,
      productId: activity.productId,
      companyId: activity.companyId,
    };
  });
}
```

---

## 5. Seed Data (`lib/data/seed.ts`)

CLAUDE.md의 Seed Data 섹션을 그대로 구현한다.
- `countries`, `companies`, `products`, `activityData`, `posts` 를 export한다.
- `activityData`는 모두 `productId: "ct-045"`, `companyId: "c1"`에 연결한다.

---

## 6. Fake Backend (`lib/api.ts`)

CLAUDE.md의 Fake Backend 섹션의 stub 코드를 그대로 구현한다.

추가로 아래 함수를 구현한다:
```typescript
export async function fetchProducts(): Promise<Product[]>
export async function fetchActivityData(productId: string): Promise<ActivityData[]>
```

---

## 7. 공통 레이아웃 (`app/layout.tsx`)

- 사이드바(`Sidebar`) + 메인 콘텐츠 영역으로 구성
- 사이드바 메뉴:
  - 대시보드 (`/`)
  - 리포트 (`/reports`)
  - 활동 데이터 입력 (`/activities/new`)

---

## 8. 대시보드 메인 (`app/page.tsx`)

### 역할
전체 제품 목록을 카드 형태로 표시. 카드 클릭 시 제품 상세로 이동.

### 구현 요구사항
- `fetchProducts()`, `fetchCompanies()` 호출
- 각 제품의 총 배출량(kgCO₂e)을 계산하여 카드에 표시
- 로딩 중: `LoadingSpinner` 표시
- 에러 시: `ErrorMessage` 표시

### ProductCard 컴포넌트
| 표시 항목 | 내용 |
|---|---|
| 제품명 | Product.name |
| 회사명 | Company.name |
| 총 배출량 | X,XXX.XX kgCO₂e |
| Scope 2 비중 | XX% |
| Scope 3 비중 | XX% |

---

## 9. 제품 상세 (`app/products/[id]/page.tsx`)

### 역할
선택한 제품의 **전과정(LCA) 단계별 배출량**을 다각도로 시각화.
(PCF 계산 불가 — 생산 수량 없음. 전과정 배출량 데이터를 시각화하는 것으로 해석)

### 구현 요구사항
- `fetchActivityData(productId)`, `fetchPosts()` 호출
- `calculateEmissions()`로 배출량 계산
- 4개 차트 섹션 + Post 섹션으로 구성

### 9-1. 전과정 단계별 차트 (`LcaStageChart`)
- 원료조달 / 제조 / 운송유통 배출량 비중 — 도넛 차트 (Recharts `PieChart`)
- 사용 / 폐기 단계는 "데이터 없음"으로 별도 표시
- **각 단계에 해당하는 GHG Scope를 함께 표시**

| LCA 단계 | GHG Scope | 표시 예시 |
|---|---|---|
| 원료조달 | Scope 3 | 원료조달 (Scope 3) |
| 제조 | Scope 2 | 제조 (Scope 2) |
| 운송유통 | Scope 3 | 운송유통 (Scope 3) |
| 사용 / 폐기 | — | 데이터 없음 |

- 각 단계 클릭 시 해당 활동 상세 표시

### 9-2. 시간별 차트 (`TimeSeriesChart`)
- 월별 배출량 추이 — 바 차트 (Recharts `BarChart`)
- X축: 월 (2025-01 ~ 2025-08)
- Y축: 배출량 (kgCO₂e)
- 기간 필터 UI (시작월 ~ 종료월 선택)
- 활동 유형별 색상 구분 (전기/원소재/운송)

### 9-3. Scope별 차트 (`ScopeChart`)
- Scope 1 / 2 / 3 비중 — 도넛 차트
- Scope 1: 0 kgCO₂e (데이터 없음 명시)
- Scope별 월별 추이 — 스택 바 차트
- **툴팁에 해당 Scope의 LCA 단계 함께 표시**
  - 예: "Scope 2 — 제조 단계 (전기)", "Scope 3 — 원료조달 + 운송유통"

### 9-4. 회사별 차트 (`CompanyChart`)
- 회사별 총 배출량 비교 — 가로 바 차트
- 회사별 Scope 비중

### 9-5. 리포트 작성 섹션 (`ReportForm`)
- 제품 상세 페이지에서 월 선택 후 해당 월의 리포트 작성/수정
- 선택한 월에 기존 Post가 있으면 수정 모드, 없으면 작성 모드로 표시
- 저장 시 `createOrUpdatePost()` 호출
- 저장 실패 시:
  - 에러 메시지 표시 ("저장에 실패했습니다. 다시 시도해주세요.")
  - 낙관적 업데이트 롤백
- 작성 완료 후 `/reports`에서 전체 목록 확인 가능하도록 링크 제공

---

## 10. 리포트 목록 (`app/reports/page.tsx`)

### 역할
전체 Post(월별 지속가능성 리포트) 목록을 표시.

### 구현 요구사항
- `fetchPosts()`, `fetchProducts()`, `fetchCompanies()` 호출
- 로딩 중: `LoadingSpinner` 표시
- 에러 시: `ErrorMessage` 표시

### ReportCard 컴포넌트
| 표시 항목 | 내용 |
|---|---|
| 제목 | Post.title |
| 제품명 | Product.name |
| 작성 월 | Post.dateTime |
| 내용 요약 | Post.content (일부) |
| 상세 링크 | → `/products/[id]` 로 이동 |

---

## 11. 활동 데이터 입력 (`app/activities/new/page.tsx`)

### 역할
새로운 활동 데이터를 입력하는 폼.

### 입력 필드
| 필드 | 타입 | 필수 | 비고 |
|---|---|---|---|
| 회사 | select | ✅ | `fetchCompanies()` 목록 |
| 제품 | select | ✅ | 회사 선택 시 해당 제품 목록 필터링 |
| 일자 | date | ✅ | YYYY-MM-DD |
| 활동 유형 | select | ✅ | 전기 / 원소재 / 운송 |
| 설명 | select | ✅ | 활동 유형 선택 시 자동 연동 (한국전력 / 플라스틱 1,2 / 트럭) |
| 단위 | text (자동) | ✅ | 설명 선택 시 자동 설정 (kWh / kg / ton-km) |
| 량 | number | ✅ | 양수만 허용 |

### 유효성 검사 (에러 메시지 필수)
| 조건 | 에러 메시지 |
|---|---|
| 필수 필드 미입력 | "필수 항목입니다." |
| 량 ≤ 0 | "0보다 큰 값을 입력해주세요." |
| 량이 숫자가 아님 | "숫자를 입력해주세요." |
| 일자 형식 오류 | "올바른 날짜 형식을 입력해주세요." |

### 제출 후
- 성공 시: `/products/[productId]`로 이동
- 실패 시: 에러 메시지 표시

---

## 12. 공통 UI 컴포넌트

### LoadingSpinner
- 데이터 로딩 중 표시
- 전체 영역 중앙에 위치

### ErrorMessage
- 에러 발생 시 표시
- 재시도 버튼 포함

---

## 13. 체크리스트 (제출 전 확인)

### 필수
- [ ] PCF 계산 결과가 시각화되어 있으며 단위(kgCO₂e)가 명확히 표시된다
- [ ] 전과정(LCA) 단계별 시각화가 포함되어 있다
- [ ] Scope 1 / 2 / 3 분류가 대시보드에 반영되어 있다
- [ ] LCA 단계와 GHG Scope가 연결되어 함께 표시된다
- [ ] 데이터 입력 화면에서 오류 입력 시 에러 메시지가 표시된다
- [ ] 리포트 작성/수정 실패 시 에러 메시지 + 롤백이 동작한다
- [ ] 전체 리포트 목록 페이지(`/reports`)가 구현되어 있다
- [ ] 로딩 상태가 표시된다
- [ ] `yarn dev`로 오류 없이 실행된다
- [ ] GitHub 저장소가 public이고 커밋 히스토리가 있다
- [ ] README에 로컬 실행 방법 (5단계 이내) 포함
- [ ] README에 AI 도구 사용 내역 포함
- [ ] README에 Assumptions 포함
- [ ] UI 실행 비디오캡쳐 + 스크린샷 포함

### 보너스
- [ ] Docker Compose로 즉시 실행 가능
- [ ] Excel 파일 직접 PostgreSQL 임포트 인터페이스
- [ ] OpenAPI / Swagger 문서
