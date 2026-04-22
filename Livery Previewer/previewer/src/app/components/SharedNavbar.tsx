import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Settings } from 'lucide-react';
import { validateStoredToken, clearAuth, redirectToDiscordLogin, type DiscordUser } from '../../lib/discordAuth';

const BASE = (import.meta as any).env?.BASE_URL || '';

interface NavItem {
  id: string;
  label: string;
  action: () => void;
  isPrimary?: boolean;
}

export default function SharedNavbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check for stored user on mount
  useEffect(() => {
    const checkUser = async () => {
      const storedUser = await validateStoredToken();
      setUser(storedUser);
    };
    checkUser();
  }, []);

  const handleLogin = async () => {
    await redirectToDiscordLogin();
  };

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setAccountMenuOpen(false);
  };

  // Navigation items
  const NAV_ITEMS: NavItem[] = [
    { 
      id: 'tools', 
      label: 'Tools', 
      action: () => {
        if (user) {
          navigate('/previewer');
        } else {
          handleLogin();
        }
      },
    },
    { 
      id: 'shop', 
      label: 'Shop', 
      action: () => {
        alert('Shop unavailable at the moment');
      },
    },
    { 
      id: 'portfolio', 
      label: 'Portfolio', 
      action: () => {}, 
    },
    { 
      id: 'server', 
      label: 'Server', 
      action: () => window.open('https://discord.gg/itzz', '_blank'),
      isPrimary: true
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
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.9) 100%)'
            : 'linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.85) 100%)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 1px 0 0 rgba(196,255,13,0.03), inset 0 1px 0 0 rgba(255,255,255,0.05)',
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
              className="text-[10px] font-bold tracking-widest uppercase px-4 py-2.5 rounded-lg transition-all duration-300 relative overflow-hidden group"
              style={{
                color: item.isPrimary ? '#c4ff0d' : '#a1a1aa',
                background: item.isPrimary 
                  ? 'linear-gradient(135deg, rgba(196,255,13,0.08) 0%, rgba(196,255,13,0.05) 100%)' 
                  : 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                border: item.isPrimary 
                  ? '1px solid rgba(196,255,13,0.25)' 
                  : '1px solid rgba(255,255,255,0.12)',
                transform: item.isPrimary ? 'scale(1.02)' : 'scale(1)',
                boxShadow: item.isPrimary
                  ? '0 2px 8px rgba(196,255,13,0.15), inset 0 1px 0 rgba(255,255,255,0.1)'
                  : '0 1px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={(e) => {
                const button = e.currentTarget;
                if (!item.isPrimary) {
                  button.style.color = '#ffffff';
                  button.style.borderColor = 'rgba(255,255,255,0.2)';
                  button.style.transform = 'scale(1.03)';
                  button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)';
                } else {
                  button.style.transform = 'scale(1.05)';
                  button.style.boxShadow = '0 4px 16px rgba(196,255,13,0.25), inset 0 1px 0 rgba(255,255,255,0.2)';
                }
                // Trigger sliding animations
                const overlay1 = button.querySelector('.slide-overlay-1') as HTMLElement;
                const overlay2 = button.querySelector('.slide-overlay-2') as HTMLElement;
                if (overlay1) overlay1.style.transform = 'translateX(100%)';
                if (overlay2) overlay2.style.transform = 'translateX(100%) translateY(100%) rotate(45deg)';
              }}
              onMouseLeave={(e) => {
                const button = e.currentTarget;
                if (!item.isPrimary) {
                  button.style.color = '#a1a1aa';
                  button.style.borderColor = 'rgba(255,255,255,0.12)';
                  button.style.transform = 'scale(1)';
                  button.style.boxShadow = '0 1px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)';
                } else {
                  button.style.transform = 'scale(1.02)';
                  button.style.boxShadow = '0 2px 8px rgba(196,255,13,0.15), inset 0 1px 0 rgba(255,255,255,0.1)';
                }
                // Reset sliding animations
                const overlay1 = button.querySelector('.slide-overlay-1') as HTMLElement;
                const overlay2 = button.querySelector('.slide-overlay-2') as HTMLElement;
                if (overlay1) overlay1.style.transform = 'translateX(-100%)';
                if (overlay2) overlay2.style.transform = 'translateX(-100%) translateY(-100%) rotate(45deg)';
              }}
            >
              {/* Sliding overlay */}
              <div 
                className="slide-overlay-1 absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out"
                style={{
                  background: item.isPrimary
                    ? 'linear-gradient(90deg, transparent 0%, rgba(196,255,13,0.3) 50%, transparent 100%)'
                    : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                  transform: 'translateX(-100%)',
                  transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
              
              {/* Secondary shimmer effect */}
              <div 
                className="slide-overlay-2 absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out"
                style={{
                  background: item.isPrimary
                    ? 'linear-gradient(90deg, transparent 0%, rgba(196,255,13,0.2) 30%, rgba(196,255,13,0.4) 50%, rgba(196,255,13,0.2) 70%, transparent 100%)'
                    : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 70%, transparent 100%)',
                  transform: 'translateX(-100%) translateY(-100%) rotate(45deg)',
                  transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  width: '200%',
                  height: '200%',
                  top: '-50%',
                  left: '-50%',
                }}
              />
              
              <span className="relative z-10">{item.label}</span>
            </button>
          ))}
          
          {/* Account Section */}
          <div className="relative">
            {user ? (
              <div className="flex items-center gap-3">
                {/* User Profile */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" 
                  style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(255,255,255,0.1)' 
                  }}>
                  <div className="relative">
                    <img 
                      src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`} 
                      alt="" 
                      className="w-6 h-6 rounded-full" 
                      onError={e => {(e.target as HTMLImageElement).style.display = 'none';}}
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" 
                      style={{ 
                        background: '#c4ff0d', 
                        border: '1.5px solid #080808' 
                      }} />
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-[10px] font-semibold leading-none" 
                      style={{ color: '#ffffff' }}>
                      {user.global_name ?? user.username}
                    </p>
                    <p className="text-[8px] font-bold uppercase tracking-widest leading-none mt-0.5 group-hover:animate-pulse" 
                      style={{ 
                        color: '#c4ff0d',
                        textShadow: '0 0 8px rgba(196,255,13,0.3)',
                        transition: 'all 0.3s ease'
                      }}>
                      Member
                    </p>
                  </div>
                </div>

                {/* Account Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    className="p-2 text-zinc-400 hover:text-white transition-all duration-300 relative overflow-hidden group"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                    }}
                    onMouseEnter={(e) => {
                      const button = e.currentTarget;
                      button.style.background = 'rgba(255,255,255,0.08)';
                      button.style.borderColor = 'rgba(255,255,255,0.15)';
                      button.style.transform = 'scale(1.05)';
                      button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)';
                      // Trigger sliding animation
                      const overlay = button.querySelector('.slide-overlay') as HTMLElement;
                      if (overlay) overlay.style.transform = 'translateX(100%)';
                    }}
                    onMouseLeave={(e) => {
                      const button = e.currentTarget;
                      button.style.background = 'rgba(255,255,255,0.04)';
                      button.style.borderColor = 'rgba(255,255,255,0.08)';
                      button.style.transform = 'scale(1)';
                      button.style.boxShadow = 'none';
                      // Reset sliding animation
                      const overlay = button.querySelector('.slide-overlay') as HTMLElement;
                      if (overlay) overlay.style.transform = 'translateX(-100%)';
                    }}
                  >
                    {/* Sliding overlay */}
                    <div 
                      className="slide-overlay absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                        transform: 'translateX(-100%)',
                        transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                    <Settings size={16} className="relative z-10 group-hover:animate-spin" style={{ animationDuration: '0.5s' }} />
                  </button>
                  
                  {accountMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden z-60"
                      style={{ 
                        background: 'rgba(5,5,5,0.99)', 
                        border: '1px solid rgba(255,255,255,0.08)', 
                        backdropFilter: 'blur(32px)', 
                        boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
                        animation: 'slideDown 0.18s cubic-bezier(0.16,1,0.3,1) both'
                      }}>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-semibold transition-colors"
                        style={{ 
                          color: '#ef4444', 
                          background: 'transparent', 
                          border: 'none' 
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        }}
                      >
                        <LogOut size={12} />
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Login Button */
              <button
                onClick={handleLogin}
                className="text-[10px] font-bold tracking-widest uppercase px-4 py-2.5 rounded-lg transition-all duration-300 relative overflow-hidden group"
                style={{
                  color: '#c4ff0d',
                  background: 'linear-gradient(135deg, rgba(196,255,13,0.08) 0%, rgba(196,255,13,0.05) 100%)',
                  border: '1px solid rgba(196,255,13,0.25)',
                  transform: 'scale(1.02)',
                  boxShadow: '0 2px 8px rgba(196,255,13,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(8px)',
                }}
                onMouseEnter={(e) => {
                  const button = e.currentTarget;
                  button.style.transform = 'scale(1.05)';
                  button.style.boxShadow = '0 4px 16px rgba(196,255,13,0.25), inset 0 1px 0 rgba(255,255,255,0.2)';
                  // Trigger sliding animations
                  const overlay1 = button.querySelector('.slide-overlay-1') as HTMLElement;
                  const overlay2 = button.querySelector('.slide-overlay-2') as HTMLElement;
                  if (overlay1) overlay1.style.transform = 'translateX(100%)';
                  if (overlay2) overlay2.style.transform = 'translateX(100%) translateY(100%) rotate(45deg)';
                }}
                onMouseLeave={(e) => {
                  const button = e.currentTarget;
                  button.style.transform = 'scale(1.02)';
                  button.style.boxShadow = '0 2px 8px rgba(196,255,13,0.15), inset 0 1px 0 rgba(255,255,255,0.1)';
                  // Reset sliding animations
                  const overlay1 = button.querySelector('.slide-overlay-1') as HTMLElement;
                  const overlay2 = button.querySelector('.slide-overlay-2') as HTMLElement;
                  if (overlay1) overlay1.style.transform = 'translateX(-100%)';
                  if (overlay2) overlay2.style.transform = 'translateX(-100%) translateY(-100%) rotate(45deg)';
                }}
              >
                {/* Sliding overlay */}
                <div 
                  className="slide-overlay-1 absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(196,255,13,0.3) 50%, transparent 100%)',
                    transform: 'translateX(-100%)',
                    transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
                
                {/* Secondary shimmer effect */}
                <div 
                  className="slide-overlay-2 absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(196,255,13,0.2) 30%, rgba(196,255,13,0.4) 50%, rgba(196,255,13,0.2) 70%, transparent 100%)',
                    transform: 'translateX(-100%) translateY(-100%) rotate(45deg)',
                    transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                    width: '200%',
                    height: '200%',
                    top: '-50%',
                    left: '-50%',
                  }}
                />
                
                <span className="relative z-10 flex items-center">
                  <User size={12} className="mr-2 group-hover:animate-pulse" />
                  Account
                </span>
              </button>
            )}
          </div>
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
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10 space-y-3">
            
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
              Livery Previewer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
