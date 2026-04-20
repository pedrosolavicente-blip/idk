import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import type { ShowcasePost } from '../lib/showcaseApi';

interface ShowcaseContextType {
  posts: ShowcasePost[];
  loading: boolean;
  refresh: () => void;
}

const ShowcaseContext = createContext<ShowcaseContextType | undefined>(undefined);

export function useShowcase() {
  const context = useContext(ShowcaseContext);
  if (!context) {
    throw new Error('useShowcase must be used within a ShowcaseProvider');
  }
  return context;
}

export function ShowcaseProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<ShowcasePost[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const response = await fetch('/api/showcases');
      if (response.ok) {
        const fetchedPosts = await response.json();
        setPosts(fetchedPosts.sort((a: ShowcasePost, b: ShowcasePost) => b.like_count - a.like_count));
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch showcase posts:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const value: ShowcaseContextType = {
    posts,
    loading,
    refresh
  };

  return (
    <ShowcaseContext.Provider value={value}>
      {children}
    </ShowcaseContext.Provider>
  );
}
