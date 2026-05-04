import { ActivityData, Company, Country, Post, Product } from '@/lib/types';

export const countries: Country[] = [
  { code: 'US', name: 'United States' },
  { code: 'DE', name: 'Germany' },
  { code: 'KR', name: 'South Korea' },
];

export const companies: Company[] = [
  { id: 'c1', name: 'Acme Corp', country: 'US' },
  { id: 'c2', name: 'Globex', country: 'DE' },
];

export const products: Product[] = [
  { id: 'ct-045', name: '컴퓨터 화면 CT-045', companyId: 'c1' },
];

export const activityData: ActivityData[] = [
  { id: 'a1',  date: '2025-01-01', activityType: '전기',   description: '한국전력',   amount: 110.0, unit: 'kWh',    productId: 'ct-045', companyId: 'c1' },
  { id: 'a2',  date: '2025-02-01', activityType: '전기',   description: '한국전력',   amount: 112.0, unit: 'kWh',    productId: 'ct-045', companyId: 'c1' },
  { id: 'a3',  date: '2025-03-01', activityType: '전기',   description: '한국전력',   amount: 115.0, unit: 'kWh',    productId: 'ct-045', companyId: 'c1' },
  { id: 'a4',  date: '2025-04-01', activityType: '전기',   description: '한국전력',   amount: 130.0, unit: 'kWh',    productId: 'ct-045', companyId: 'c1' },
  { id: 'a5',  date: '2025-05-01', activityType: '전기',   description: '한국전력',   amount: 120.0, unit: 'kWh',    productId: 'ct-045', companyId: 'c1' },
  { id: 'a6',  date: '2025-06-01', activityType: '전기',   description: '한국전력',   amount: 110.0, unit: 'kWh',    productId: 'ct-045', companyId: 'c1' },
  { id: 'a7',  date: '2025-07-01', activityType: '전기',   description: '한국전력',   amount: 120.0, unit: 'kWh',    productId: 'ct-045', companyId: 'c1' },
  { id: 'a8',  date: '2025-08-01', activityType: '전기',   description: '한국전력',   amount: 111.0, unit: 'kWh',    productId: 'ct-045', companyId: 'c1' },
  { id: 'a9',  date: '2025-05-01', activityType: '전기',   description: '한국전력',   amount: 101.0, unit: 'kWh',    productId: 'ct-045', companyId: 'c1' },
  { id: 'a10', date: '2025-01-01', activityType: '원소재', description: '플라스틱 1', amount: 230.0, unit: 'kg',     productId: 'ct-045', companyId: 'c1' },
  { id: 'a11', date: '2025-02-01', activityType: '원소재', description: '플라스틱 1', amount: 340.0, unit: 'kg',     productId: 'ct-045', companyId: 'c1' },
  { id: 'a12', date: '2025-03-01', activityType: '원소재', description: '플라스틱 2', amount: 23.0,  unit: 'kg',     productId: 'ct-045', companyId: 'c1' },
  { id: 'a13', date: '2025-03-01', activityType: '원소재', description: '플라스틱 1', amount: 430.0, unit: 'kg',     productId: 'ct-045', companyId: 'c1' },
  { id: 'a14', date: '2025-04-01', activityType: '원소재', description: '플라스틱 1', amount: 510.0, unit: 'kg',     productId: 'ct-045', companyId: 'c1' },
  { id: 'a15', date: '2025-05-01', activityType: '원소재', description: '플라스틱 1', amount: 424.0, unit: 'kg',     productId: 'ct-045', companyId: 'c1' },
  { id: 'a16', date: '2025-05-01', activityType: '원소재', description: '플라스틱 2', amount: 40.0,  unit: 'kg',     productId: 'ct-045', companyId: 'c1' },
  { id: 'a17', date: '2025-06-01', activityType: '원소재', description: '플라스틱 1', amount: 450.0, unit: 'kg',     productId: 'ct-045', companyId: 'c1' },
  { id: 'a18', date: '2025-07-01', activityType: '원소재', description: '플라스틱 1', amount: 340.0, unit: 'kg',     productId: 'ct-045', companyId: 'c1' },
  { id: 'a19', date: '2025-07-01', activityType: '원소재', description: '플라스틱 2', amount: 43.0,  unit: 'kg',     productId: 'ct-045', companyId: 'c1' },
  { id: 'a20', date: '2025-08-01', activityType: '원소재', description: '플라스틱 1', amount: 230.0, unit: 'kg',     productId: 'ct-045', companyId: 'c1' },
  { id: 'a21', date: '2025-05-01', activityType: '원소재', description: '플라스틱 1', amount: 232.0, unit: 'kg',     productId: 'ct-045', companyId: 'c1' },
  { id: 'a22', date: '2025-01-01', activityType: '운송',   description: '트럭',       amount: 41.0,  unit: 'ton-km', productId: 'ct-045', companyId: 'c1' },
  { id: 'a23', date: '2025-02-01', activityType: '운송',   description: '트럭',       amount: 211.0, unit: 'ton-km', productId: 'ct-045', companyId: 'c1' },
  { id: 'a24', date: '2025-03-01', activityType: '운송',   description: '트럭',       amount: 123.0, unit: 'ton-km', productId: 'ct-045', companyId: 'c1' },
  { id: 'a25', date: '2025-04-01', activityType: '운송',   description: '트럭',       amount: 42.0,  unit: 'ton-km', productId: 'ct-045', companyId: 'c1' },
  { id: 'a26', date: '2025-05-01', activityType: '운송',   description: '트럭',       amount: 123.0, unit: 'ton-km', productId: 'ct-045', companyId: 'c1' },
  { id: 'a27', date: '2025-06-01', activityType: '운송',   description: '트럭',       amount: 123.0, unit: 'ton-km', productId: 'ct-045', companyId: 'c1' },
  { id: 'a28', date: '2025-07-01', activityType: '운송',   description: '트럭',       amount: 41.0,  unit: 'ton-km', productId: 'ct-045', companyId: 'c1' },
  { id: 'a29', date: '2025-08-01', activityType: '운송',   description: '트럭',       amount: 123.0, unit: 'ton-km', productId: 'ct-045', companyId: 'c1' },
  { id: 'a30', date: '2025-05-01', activityType: '운송',   description: '트럭',       amount: 12.0,  unit: 'ton-km', productId: 'ct-045', companyId: 'c1' },
];

export const posts: Post[] = [
  {
    id: 'p1',
    title: 'Sustainability Report',
    resourceUid: 'ct-045',
    dateTime: '2025-02',
    content: 'Quarterly CO2 update',
  },
];
