import { useState, useEffect, useCallback } from 'react';
import type { ShowcasePost } from '../../lib/showcaseApi';
import { fetchPosts } from '../../lib/showcaseApi';

export type SortMode = 'new' | 'liked' | 'viewed' | 'comments';

interface UseShowcaseReturn {
  posts:        ShowcasePost[];
  loading:      boolean;
  error:        string | null;
  sort:         SortMode;
  setSort:      (mode: SortMode) => void;
  activeTag:    string | null;
  setActiveTag: (tag: string | null) => void;
  setPosts:     React.Dispatch<React.SetStateAction<ShowcasePost[]>>;
  refresh:      () => void;
}

export function useShowcase(): UseShowcaseReturn {
  const [posts,     setPosts]     = useState<ShowcasePost[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [sort,      setSort]      = useState<SortMode>('new');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [tick,      setTick]      = useState(0);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPosts(sort, activeTag ?? undefined)
      .then(data => { if (!cancelled) setPosts(data); })
      .catch(e   => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load posts'); })
      .finally(  () => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [sort, activeTag, tick]);

  return {
    posts,
    loading,
    error,
    sort,
    setSort,
    activeTag,
    setActiveTag,
    setPosts,
    refresh,
  };
}