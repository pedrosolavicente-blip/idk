// ============================================================================
// WISHLIST SIDEBAR - Production-Ready Wishlist Sidebar Component
// ============================================================================

import { X, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { WishlistItem } from '../../api/types';

interface WishlistSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  wishlist: WishlistItem[];
  onRemove: (itemId: string) => void;
  onClear: () => void;
}

const BASE = (import.meta as any).env?.BASE_URL || '';

export function WishlistSidebar({
  isOpen,
  setIsOpen,
  wishlist,
  onRemove,
  onClear,
}: WishlistSidebarProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#000527] border-l border-white/10 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#000527]/95 backdrop-blur">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#D8FF63] fill-[#D8FF63]" />
            <h2 className="font-semibold text-white text-sm">
              Wishlist <span className="text-zinc-500">({wishlist.length})</span>
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/8 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {wishlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
              <Heart className="w-12 h-12 text-zinc-700" />
              <p className="text-zinc-500 text-sm">Your wishlist is empty</p>
              <Link
                to="/shop"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-[#D8FF63] text-black text-sm font-semibold rounded-lg hover:bg-[#D8FF63]/80 transition-colors"
              >
                Browse Shop
              </Link>
            </div>
          ) : (
            wishlist.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 p-3 bg-white/4 border border-white/8 rounded-xl hover:border-[#D8FF63]/30 transition-colors"
              >
                <img
                  src={item.product?.thumbnail_url || item.product?.image_urls?.[0] || `${BASE}marketplace.svg`}
                  alt={item.product?.title || 'Product'}
                  className="w-14 h-14 object-cover rounded-lg shrink-0 bg-white/4"
                />
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/shop/${item.product?.slug || item.product_id}`}
                    onClick={() => setIsOpen(false)}
                    className="text-sm font-medium text-white truncate hover:text-[#D8FF63] transition-colors"
                  >
                    {item.product?.title || 'Product'}
                  </Link>
                  {item.product?.price_gbp && (
                    <p className="text-xs text-[#D8FF63] font-semibold mt-0.5">
                      £{item.product.price_gbp.toFixed(2)}
                    </p>
                  )}
                  {item.variant && (
                    <p className="text-[10px] text-zinc-500 mt-0.5">{item.variant.name}</p>
                  )}
                </div>
                <button
                  onClick={() => onRemove(item.id)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Remove from wishlist"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {wishlist.length > 0 && (
          <div className="border-t border-white/10 p-4 space-y-3 bg-[#000527]/95 backdrop-blur">
            <button
              onClick={onClear}
              className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Clear wishlist
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

interface WishlistButtonProps {
  count: number;
  onClick: () => void;
}

export function WishlistButton({ count, onClick }: WishlistButtonProps) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 text-zinc-400 hover:text-white transition-colors group"
      title="Wishlist"
    >
      <Heart className="w-5 h-5 group-hover:fill-[#D8FF63] group-hover:text-[#D8FF63] transition-all" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#D8FF63] text-black text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
