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
  productName?: string;
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
