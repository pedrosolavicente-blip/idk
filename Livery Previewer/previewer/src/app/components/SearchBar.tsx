import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Filter, Clock, TrendingUp, Star, SlidersHorizontal } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedSort: string;
  setSelectedSort: (sort: string) => void;
  uploadCount: number;
}

const POST_TYPES = [
  { id: 'all',       name: 'All Posts'  },
  { id: 'products',  name: 'Products'   },
  { id: 'tutorials', name: 'Tutorials'  },
  { id: 'showcase',  name: 'Showcase'   },
];

const CATEGORIES = [
  { id: 'all',          name: 'All Categories' },
  { id: 'software',     name: 'Software'       },
  { id: 'digital',      name: 'Digital'        },
  { id: 'merchandise',  name: 'Merchandise'    },
];

const SORT_OPTIONS = [
  { id: 'latest',     name: 'Latest',     icon: Clock       },
  { id: 'popular',    name: 'Popular',    icon: TrendingUp  },
  { id: 'featured',   name: 'Featured',   icon: Star        },
];

// ─── Generic dropdown ─────────────────────────────────────────────────────────

function Dropdown<T extends { id: string; name: string; icon?: React.ElementType }>({
  options,
  value,
  onChange,
  label,
  icon: TriggerIcon,
}: {
  options: T[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  icon?: React.ElementType;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.id === value) || options[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-colors text-white text-sm whitespace-nowrap"
      >
        {TriggerIcon && <TriggerIcon className="w-4 h-4 text-zinc-400 shrink-0" />}
        {selected.icon && <selected.icon className="w-4 h-4 text-zinc-400 shrink-0" />}
        <span>{label || selected.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 min-w-[160px] bg-[#111] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => { onChange(opt.id); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors text-left ${
                value === opt.id ? 'text-[#c4ff0d] bg-[#c4ff0d]/8' : 'text-zinc-300 hover:bg-white/6 hover:text-white'
              }`}
            >
              {opt.icon && <opt.icon className="w-3.5 h-3.5 shrink-0" />}
              {opt.name}
              {value === opt.id && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#c4ff0d]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SearchBar ─────────────────────────────────────────────────────────────────

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedSort,
  setSelectedSort,
  uploadCount,
}: SearchBarProps) {
  const [postType, setPostType] = useState('all');

  return (
    <div className="rounded-2xl p-3 bg-white/4 border border-white/8 backdrop-blur-xl">
      <div className="flex items-center gap-2.5 flex-wrap md:flex-nowrap">
        {/* Search Input */}
        <div className="flex-1 min-w-0 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title, creator, or category…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/8 rounded-xl focus:outline-none focus:border-[#c4ff0d]/40 focus:ring-1 focus:ring-[#c4ff0d]/10 text-white text-sm placeholder-zinc-600 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Post Type */}
          <Dropdown
            options={POST_TYPES}
            value={postType}
            onChange={setPostType}
            icon={Filter}
            label={POST_TYPES.find(t => t.id === postType)?.name}
          />

          {/* Category */}
          <Dropdown
            options={CATEGORIES}
            value={selectedCategory}
            onChange={setSelectedCategory}
          />

          {/* Sort */}
          <Dropdown
            options={SORT_OPTIONS}
            value={selectedSort}
            onChange={setSelectedSort}
            icon={SlidersHorizontal}
          />

          {/* Count badge */}
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 bg-white/5 border border-white/8 rounded-lg text-xs text-zinc-500 whitespace-nowrap">
            {uploadCount.toLocaleString()} result{uploadCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}