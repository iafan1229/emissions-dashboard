'use client';

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  createActivity as apiCreateActivity,
  createOrUpdatePost as apiCreateOrUpdatePost,
  fetchAllActivities,
  fetchCompanies,
  fetchCountries,
  fetchPosts,
  fetchProducts,
} from '@/lib/api';
import {
  ActivityData,
  Company,
  Country,
  Post,
  Product,
} from '@/lib/types';

type DataState = {
  countries: Country[];
  companies: Company[];
  products: Product[];
  activityData: ActivityData[];
  posts: Post[];
  isLoading: boolean;
  error: Error | null;
};

type DataActions = {
  refetch: () => Promise<void>;
  createOrUpdatePost: (
    post: Omit<Post, 'id'> & { id?: string },
  ) => Promise<Post>;
  createActivity: (
    activity: Omit<ActivityData, 'id'>,
  ) => Promise<ActivityData>;
};

type DataContextValue = DataState & DataActions;

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [c, co, p, a, ps] = await Promise.all([
        fetchCountries(),
        fetchCompanies(),
        fetchProducts(),
        fetchAllActivities(),
        fetchPosts(),
      ]);
      setCountries(c);
      setCompanies(co);
      setProducts(p);
      setActivityData(a);
      setPosts(ps);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createOrUpdatePost = useCallback<DataActions['createOrUpdatePost']>(
    async (post) => {
      // Optimistic update
      const optimisticId = post.id ?? `__optimistic_${crypto.randomUUID()}`;
      const optimisticPost: Post = { ...post, id: optimisticId };
      const previousPosts = posts;
      setPosts((prev) =>
        post.id
          ? prev.map((p) => (p.id === post.id ? optimisticPost : p))
          : [...prev, optimisticPost],
      );
      try {
        const saved = await apiCreateOrUpdatePost(post);
        setPosts((prev) =>
          prev.map((p) => (p.id === optimisticId ? saved : p)),
        );
        return saved;
      } catch (err) {
        // Rollback
        setPosts(previousPosts);
        throw err;
      }
    },
    [posts],
  );

  const createActivity = useCallback<DataActions['createActivity']>(
    async (activity) => {
      const optimisticId = `__optimistic_${crypto.randomUUID()}`;
      const optimistic: ActivityData = { ...activity, id: optimisticId };
      const previous = activityData;
      setActivityData((prev) => [...prev, optimistic]);
      try {
        const saved = await apiCreateActivity(activity);
        setActivityData((prev) =>
          prev.map((a) => (a.id === optimisticId ? saved : a)),
        );
        return saved;
      } catch (err) {
        setActivityData(previous);
        throw err;
      }
    },
    [activityData],
  );

  const value: DataContextValue = {
    countries,
    companies,
    products,
    activityData,
    posts,
    isLoading,
    error,
    refetch,
    createOrUpdatePost,
    createActivity,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
