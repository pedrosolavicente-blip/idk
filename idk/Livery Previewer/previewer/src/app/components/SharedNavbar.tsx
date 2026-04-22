import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const BASE = (import.meta as any).env?.BASE_URL || '';

interface NavItem {
  id: string;
  label: string;
  action: () => void;
  isPrimary?: boolean;
}

export default function SharedNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigation items
  const NAV_ITEMS: NavItem[] = [
    { 
      id: 'livery', 
      label: 'Livery Previewer', 
      action: () => navigate('/previewer'),
      isPrimary: true
    },
    { 
      id: 'shop', 
      label: 'Shop', 
      action: () => navigate('/shop'),
      isPrimary: location.pathname === '/shop'
    },
    { 
      id: 'portfolio', 
      label: 'Portfolio', 
      action: () => {}, 
    },
    { 
      id: 'reviews', 
      label: 'Reviews', 
      action: () => {}, 
    },
    { 
      id: 'discord', 
      label: 'Discord Server', 
      action: () => window.open('https://discord.gg/itzz', '_blank'),
      isPrimary: true
    },
    { 
      id: 'admin', 
      label: 'Admin Panel', 
      action: () => navigate('/admin'),
      isPrimary: false
    },
  ];

  const handleNavClick = (item: NavItem) => {
    item.action();
    setMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 transition-all duration-300"
        style={{
          paddingTop: '10px',
          paddingBottom: '10px',
          background: scrolled 
            ? 'linear-gradient(to bottom, rgba(8,8,8,0.95) 0%, rgba(8,8,8,0.9) 100%)'
            : 'linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: scrolled
            ? '1px solid rgba(255,255,255,0.1)'
            : '1px solid rgba(255,255,255,0.06)',
          boxShadow: scrolled
            ? '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 0 rgba(196,255,13,0.05)'
            : '0 1px 0 0 rgba(196,255,13,0.05), inset 0 1px 0 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <img 
          src={`${BASE}itzz.svg`} 
          alt="itzz" 
          className="h-7 w-auto cursor-pointer transition-transform hover:scale-105"
          onClick={() => navigate('/')}
        />

        {/* Navigation Items */}
        <div className="hidden md:flex items-center gap-2">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className="text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-lg transition-all duration-300"
              style={{
                color: item.isPrimary ? '#c4ff0d' : '#a1a1aa',
                background: item.isPrimary 
                  ? 'rgba(196,255,13,0.07)' 
                  : 'rgba(255,255,255,0.04)',
                border: item.isPrimary 
                  ? '1px solid rgba(196,255,13,0.22)' 
                  : '1px solid rgba(255,255,255,0.08)',
                transform: item.isPrimary ? 'scale(1.02)' : 'scale(1)',
              }}
              onMouseEnter={(e) => {
                if (!item.isPrimary) {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                if (!item.isPrimary) {
                  e.currentTarget.style.color = '#a1a1aa';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            padding: '8px',
          }}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          menuOpen 
            ? 'opacity-100 pointer-events-auto' 
            : 'opacity-0 pointer-events-none'
        }`}
        style={{
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={() => setMenuOpen(false)}
      >
        <div
          className={`absolute top-0 right-0 h-full w-80 bg-[#0a0a0a] border-l border-white/10 transform transition-transform duration-300 ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <img src={`${BASE}itzz.svg`} alt="itzz" className="h-6 w-auto" />
            <button
              className="text-white"
              onClick={() => setMenuOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Mobile Menu Items */}
          <div className="p-6 space-y-2">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className="w-full text-left px-4 py-3 rounded-lg transition-all duration-200"
                style={{
                  color: item.isPrimary ? '#c4ff0d' : '#ffffff',
                  background: item.isPrimary 
                    ? 'rgba(196,255,13,0.1)' 
                    : 'rgba(255,255,255,0.05)',
                  border: item.isPrimary 
                    ? '1px solid rgba(196,255,13,0.3)' 
                    : '1px solid rgba(255,255,255,0.1)',
                  fontWeight: item.isPrimary ? '600' : '400',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = item.isPrimary 
                    ? 'rgba(196,255,13,0.15)' 
                    : 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = item.isPrimary 
                    ? 'rgba(196,255,13,0.1)' 
                    : 'rgba(255,255,255,0.05)';
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile Menu Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10">
            <button
              onClick={() => {
                navigate('/previewer');
                setMenuOpen(false);
              }}
              className="w-full py-3 px-6 bg-[#c4ff0d] text-black font-bold text-sm tracking-wider uppercase rounded-lg transition-all duration-200 hover:bg-[#d4ff3d]"
              style={{
                boxShadow: '0 4px 12px rgba(196,255,13,0.3)',
              }}
            >
              Launch App
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
