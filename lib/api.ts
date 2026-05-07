import { ActivityData, Company, Country, Post, Product } from '@/lib/types';
import {
  activityData as seedActivityData,
  companies as seedCompanies,
  countries as seedCountries,
  posts as seedPosts,
  products as seedProducts,
} from '@/lib/data/seed';

const _countries: Country[] = [...seedCountries];
let _companies: Company[] = [...seedCompanies];
let _products: Product[] = [...seedProducts];
let _activityData: ActivityData[] = [...seedActivityData];
let _posts: Post[] = [...seedPosts];

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
const jitter = () => 200 + Math.random() * 600;
const maybeFail = () => Math.random() < 0.15;

export async function fetchCountries(): Promise<Country[]> {
  await delay(jitter());
  return _countries;
}

export async function fetchCompanies(): Promise<Company[]> {
  await delay(jitter());
  return _companies;
}

export async function fetchProducts(): Promise<Product[]> {
  await delay(jitter());
  return _products;
}

async function fetchPgActivities(productId?: string): Promise<ActivityData[]> {
  if (typeof window === 'undefined') return [];
  try {
    const url = productId
      ? `/api/activities?productId=${encodeURIComponent(productId)}`
      : '/api/activities';
    const res = await fetch(url);
    if (!res.ok) return [];
    return (await res.json()) as ActivityData[];
  } catch {
    return [];
  }
}

export async function fetchActivityData(productId: string): Promise<ActivityData[]> {
  await delay(jitter());
  const fake = _activityData.filter((a) => a.productId === productId);
  const pg = await fetchPgActivities(productId);
  return [...fake, ...pg];
}

export async function fetchAllActivities(): Promise<ActivityData[]> {
  await delay(jitter());
  const pg = await fetchPgActivities();
  return [..._activityData, ...pg];
}

export async function fetchPosts(): Promise<Post[]> {
  await delay(jitter());
  return _posts;
}

export async function createOrUpdatePost(
  p: Omit<Post, 'id'> & { id?: string },
): Promise<Post> {
  await delay(jitter());
  if (maybeFail()) throw new Error('Save failed');
  if (p.id) {
    _posts = _posts.map((x) => (x.id === p.id ? (p as Post) : x));
    return p as Post;
  }
  const created: Post = { ...p, id: crypto.randomUUID() };
  _posts = [..._posts, created];
  return created;
}

export async function createActivity(
  a: Omit<ActivityData, 'id'>,
): Promise<ActivityData> {
  await delay(jitter());
  if (maybeFail()) throw new Error('Save failed');
  const created: ActivityData = { ...a, id: crypto.randomUUID() };
  _activityData = [..._activityData, created];
  return created;
}

export async function createProduct(
  p: Omit<Product, 'id'>,
): Promise<Product> {
  await delay(jitter());
  if (maybeFail()) throw new Error('Save failed');
  const created: Product = { ...p, id: crypto.randomUUID() };
  _products = [..._products, created];
  return created;
}

export async function createCompany(
  c: Omit<Company, 'id'>,
): Promise<Company> {
  await delay(jitter());
  if (maybeFail()) throw new Error('Save failed');
  const created: Company = { ...c, id: crypto.randomUUID() };
  _companies = [..._companies, created];
  return created;
}
