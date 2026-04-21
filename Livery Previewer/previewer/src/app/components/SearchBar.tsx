import { useState } from 'react';
import { Search, ChevronDown, Filter, Clock } from 'lucide-react';

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
  { id: 'all', name: 'All Posts', icon: null },
  { id: 'products', name: 'Products', icon: null },
  { id: 'tutorials', name: 'Tutorials', icon: null },
  { id: 'showcase', name: 'Showcase', icon: null },
];

const CATEGORIES = [
  { id: 'all', name: 'All', icon: null },
  { id: 'software', name: 'Software', icon: null },
  { id: 'digital', name: 'Digital', icon: null },
  { id: 'merchandise', name: 'Merchandise', icon: null },
];

const SORT_OPTIONS = [
  { id: 'latest', name: 'Latest', icon: Clock },
  { id: 'popular', name: 'Popular', icon: null },
  { id: 'featured', name: 'Featured', icon: null },
];

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedSort,
  setSelectedSort,
  uploadCount,
}: SearchBarProps) {
  const [postTypeOpen, setPostTypeOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const selectedPostType = POST_TYPES.find(type => type.id === 'all') || POST_TYPES[0];
  const selectedCategoryOption = CATEGORIES.find(cat => cat.id === selectedCategory) || CATEGORIES[0];
  const selectedSortOption = SORT_OPTIONS.find(sort => sort.id === selectedSort) || SORT_OPTIONS[0];

  return (
    <div
      className="rounded-2xl p-4 transition-all duration-300"
      style={{
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 1px 0 0 rgba(196,255,13,0.05), inset 0 1px 0 0 rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" 
          />
          <input
            type="text"
            placeholder="Search by title, creator, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#c4ff0d]/50 text-white placeholder-gray-400 transition-all duration-200"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />
        </div>

        {/* Post Type Dropdown */}
        <div className="relative">
          <button
            onClick={() => setPostTypeOpen(!postTypeOpen)}
            className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-200 text-white"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{selectedPostType.name}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {postTypeOpen && (
            <div 
              className="absolute top-full left-0 mt-2 w-48 bg-[#0a0a0a]/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-xl z-50"
              style={{
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
              }}
            >
              {POST_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => {
                    setPostTypeOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors text-white text-sm first:rounded-t-xl last:rounded-b-xl"
                >
                  {type.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="relative">
          <button
            onClick={() => setCategoryOpen(!categoryOpen)}
            className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-200 text-white"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <span className="text-sm">{selectedCategoryOption.name}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {categoryOpen && (
            <div 
              className="absolute top-full left-0 mt-2 w-40 bg-[#0a0a0a]/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-xl z-50"
              style={{
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
              }}
            >
              {CATEGORIES.map(category => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setCategoryOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors text-white text-sm first:rounded-t-xl last:rounded-b-xl"
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-200 text-white"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            {selectedSortOption.icon && <selectedSortOption.icon className="w-4 h-4 text-gray-400" />}
            <span className="text-sm">{selectedSortOption.name}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {sortOpen && (
            <div 
              className="absolute top-full left-0 mt-2 w-40 bg-[#0a0a0a]/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-xl z-50"
              style={{
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
              }}
            >
              {SORT_OPTIONS.map(sort => (
                <button
                  key={sort.id}
                  onClick={() => {
                    setSelectedSort(sort.id);
                    setSortOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors text-white text-sm first:rounded-t-xl last:rounded-b-xl"
                >
                  {sort.icon && <sort.icon className="w-4 h-4 inline mr-2" />}
                  {sort.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Upload Count */}
        <div className="text-sm text-gray-400 whitespace-nowrap">
          {uploadCount.toLocaleString()} uploads
        </div>
      </div>
    </div>
  );
}
