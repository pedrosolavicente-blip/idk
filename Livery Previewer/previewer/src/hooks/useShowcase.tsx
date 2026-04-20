import { useState, useEffect, createContext, useContext, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import { fetchPosts } from '../lib/showcaseApi';
import type { ShowcasePost } from '../lib/showcaseApi';

export type SortMode = 'new' | 'liked' | 'viewed' | 'comments';

interface ShowcaseContextType {
  posts:        ShowcasePost[];
  loading:      boolean;
  error:        string | null;
  sort:         SortMode;
  setSort:      Dispatch<SetStateAction<SortMode>>;
  activeTag:    string | null;
  setActiveTag: Dispatch<SetStateAction<string | null>>;
  setPosts:     Dispatch<SetStateAction<ShowcasePost[]>>;
  refresh:      () => void;
}

const ShowcaseContext = createContext<ShowcaseContextType | undefined>(undefined);

export function useShowcase(): ShowcaseContextType {
  const ctx = useContext(ShowcaseContext);
  if (!ctx) throw new Error('useShowcase must be used within ShowcaseProvider');
  return ctx;
}

export function ShowcaseProvider({ children }: { children: ReactNode }) {
  const [posts,     setPosts]     = useState<ShowcasePost[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [sort,      setSort]      = useState<SortMode>('new');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    setError(null);
    fetchPosts(sort, activeTag ?? undefined)
      .then(setPosts)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [sort, activeTag]);

  return (
    <ShowcaseContext.Provider value={{ posts, loading, error, sort, setSort, activeTag, setActiveTag, setPosts, refresh }}>
      {children}
    </ShowcaseContext.Provider>
  );
}