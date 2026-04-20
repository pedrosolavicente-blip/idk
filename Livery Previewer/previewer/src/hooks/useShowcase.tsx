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

function sortPosts(posts: ShowcasePost[], mode: SortMode): ShowcasePost[] {
  const copy = [...posts];
  switch (mode) {
    case 'new':      return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case 'liked':    return copy.sort((a, b) => b.like_count    - a.like_count);
    case 'viewed':   return copy.sort((a, b) => b.view_count    - a.view_count);
    case 'comments': return copy.sort((a, b) => b.comment_count - a.comment_count);
    default:         return copy;
  }
}

export function useShowcase(): UseShowcaseReturn {
  const [allPosts,  setAllPosts]  = useState<ShowcasePost[]>([]);
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

    fetchPosts()
      .then(data => { if (!cancelled) setAllPosts(data); })
      .catch(e   => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load posts'); })
      .finally(  () => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [tick]);

  // Derive filtered + sorted posts
  const posts = sortPosts(
    activeTag
      ? allPosts.filter(p => p.caption.toLowerCase().includes(`#${activeTag}`))
      : allPosts,
    sort,
  );

  return {
    posts,
    loading,
    error,
    sort,
    setSort,
    activeTag,
    setActiveTag,
    setPosts: setAllPosts,
    refresh,
  };
}