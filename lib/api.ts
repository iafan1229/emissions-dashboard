import { ActivityData, Company, Country, Post, Product } from '@/lib/types';
import {
  activityData as seedActivityData,
  companies as seedCompanies,
  countries as seedCountries,
  posts as seedPosts,
  products as seedProducts,
} from '@/lib/data/seed';

const _countries: Country[] = [...seedCountries];
const _companies: Company[] = [...seedCompanies];
const _products: Product[] = [...seedProducts];
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

export async function fetchActivityData(productId: string): Promise<ActivityData[]> {
  await delay(jitter());
  return _activityData.filter((a) => a.productId === productId);
}

export async function fetchAllActivities(): Promise<ActivityData[]> {
  await delay(jitter());
  return _activityData;
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
