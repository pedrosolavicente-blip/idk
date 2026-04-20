import { useState, useEffect, useRef } from 'react';
import { useShowcase } from '../hooks/useShowcase';
import { useNavigate } from 'react-router-dom';
import Logo3D from './Logo3D';

const BASE = import.meta.env?.BASE_URL || '';

const LANDING_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  .lp * { font-family: 'Inter', sans-serif; box-sizing: border-box; }

  /* Premium Dark Theme Variables */
  :root {
    --bg-primary: #0a0a0a;
    --bg-secondary: #111111;
    --bg-glass: rgba(255,255,255,0.03);
    --bg-glass-hover: rgba(255,255,255,0.06);
    --neon-primary: #D8FF63;
    --neon-glow: rgba(216,255,99,0.15);
    --neon-glow-strong: rgba(216,255,99,0.3);
    --text-primary: #ffffff;
    --text-secondary: #a1a1aa;
    --text-muted: #52525b;
    --border-subtle: rgba(255,255,255,0.08);
    --border-glass: rgba(255,255,255,0.12);
  }

  /* Premium Animations */
  @keyframes fadeInUp {
    0% { opacity: 0; transform: translateY(30px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  @keyframes slideInLeft {
    0% { opacity: 0; transform: translateX(-50px); }
    100% { opacity: 1; transform: translateX(0); }
  }

  @keyframes slideInRight {
    0% { opacity: 0; transform: translateX(50px); }
    100% { opacity: 1; transform: translateX(0); }
  }

  @keyframes neonPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px) rotateX(0deg); }
    50% { transform: translateY(-10px) rotateX(2deg); }
  }

  @keyframes gridRotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  /* Premium Components */
  .glass-card {
    background: var(--bg-glass);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--border-glass);
    border-radius: 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .glass-card:hover {
    background: var(--bg-glass-hover);
    border-color: var(--neon-primary);
    box-shadow: 0 8px 32px var(--neon-glow);
    transform: translateY(-2px);
  }

  .neon-button {
    background: linear-gradient(135deg, var(--neon-primary), #c0ff40);
    color: var(--bg-primary);
    border: none;
    border-radius: 12px;
    padding: 16px 32px;
    font-weight: 600;
    font-size: 14px;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .neon-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
  }

  .neon-button:hover::before {
    left: 100%;
  }

  .neon-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px var(--neon-glow-strong);
  }

  .neon-text {
    background: linear-gradient(135deg, var(--neon-primary), #a0ff20);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 20px var(--neon-glow));
  }

  .nav-link {
    color: var(--text-muted);
    text-decoration: none;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.2s ease;
    position: relative;
    padding: 8px 16px;
    border-radius: 8px;
  }

  .nav-link:hover {
    color: var(--text-primary);
    background: var(--bg-glass);
  }

  .nav-link.active {
    color: var(--neon-primary);
    background: var(--bg-glass-hover);
  }

  .nav-link.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 2px;
    background: var(--neon-primary);
    border-radius: 2px;
  }

  .feature-badge {
    background: var(--bg-glass);
    border: 1px solid var(--border-glass);
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
  }

  .feature-badge:hover {
    border-color: var(--neon-primary);
    color: var(--text-primary);
  }

  .feature-badge .neon-dot {
    width: 6px;
    height: 6px;
    background: var(--neon-primary);
    border-radius: 50%;
    animation: neonPulse 2s ease-in-out infinite;
  }

  /* Grid Background */
  .tech-grid {
    position: absolute;
    width: 100%;
    height: 100%;
    background-image: 
      linear-gradient(rgba(216,255,99,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(216,255,99,0.03) 1px, transparent 1px);
    background-size: 50px 50px;
    animation: gridRotate 60s linear infinite;
  }

  .tech-grid::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 50% 50%, rgba(216,255,99,0.1) 0%, transparent 50%);
    animation: neonPulse 4s ease-in-out infinite;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .nav-desktop { display: none !important; }
    .nav-mobile { display: flex !important; }
    .hero-grid { grid-template-columns: 1fr !important; }
    .feature-grid { grid-template-columns: 1fr !important; }
  }

  /* Marquee Animation */
  .lp-marquee-track {
    display: flex;
    animation: marquee 30s linear infinite;
  }

  @keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  @media (max-width: 480px) {
    .neon-button { padding: 14px 24px; font-size: 13px; }
    .feature-badge { padding: 4px 8px; font-size: 11px; }
  }
`;

const PRODUCTS = [
  {
    id: 1,
    tag: 'Tool',
    name: 'Livery Previewer',
    desc: 'Design and preview ERLC vehicle liveries in real-time 3D.',
    accent: '#D8FF63',
    link: '/previewer',
    isInternal: true,
    num: '01',
  },
  {
    id: 2,
    tag: 'Coming Soon',
    name: 'itzz Portfolio',
    desc: 'A showcase of the best livery designs from the itzz community.',
    accent: '#D8FF63',
    link: null,
    isInternal: false,
    num: '02',
  },
  {
    id: 3,
    tag: 'Coming Soon',
    name: 'itzz Shop',
    desc: 'Official itzz merchandise and digital goods for the community.',
    accent: '#D8FF63',
    link: null,
    isInternal: false,
    num: '03',
  },
  {
    id: 4,
    tag: 'Community',
    name: 'Discord Server',
    desc: 'Join thousands of ERLC players in the itzz community Discord.',
    accent: '#5865F2',
    link: 'https://discord.gg/itzz',
    isInternal: false,
    num: '04',
  },
];

const STATS = [
  { value: '800+',   label: 'Members' },
  { value: '100%',  label: 'Free to Use'    },
  { value: 'ERLC',  label: 'Focused'        },
  { value: '24/7',  label: 'Available'      },
];

const FEATURES = [
  {
    icon: '🎨',
    title: 'Real-time 3D Preview',
    description: 'See your livery designs come to life with instant 3D rendering and accurate vehicle models.'
  },
  {
    icon: '🚗',
    title: '25+ Vehicle Models',
    description: 'Extensive collection of ERLC vehicles with accurate details and proper scaling.'
  },
  {
    icon: '👥',
    title: 'Community Driven',
    description: 'Built by the community, for the community with regular updates based on feedback.'
  },
  {
    icon: '☁️',
    title: 'Cloud Storage',
    description: 'Save your designs securely in the cloud and access them from anywhere.'
  },
  {
    icon: '🛠️',
    title: 'Advanced Tools',
    description: 'Professional-grade design tools with layers, textures, and precise controls.'
  },
  {
    icon: '📱',
    title: 'Mobile Friendly',
    description: 'Design on the go with full mobile support and responsive interface.'
  }
];

const TESTIMONIALS = [
  {
    name: 'Alex Chen',
    role: 'ERLC Designer',
    content: 'The Livery Previewer has completely changed how I design. The real-time 3D preview is incredible.',
    rating: 5
  },
  {
    name: 'Sarah Martinez',
    role: 'Community Member',
    content: 'Finally a tool that actually understands what ERLC designers need. It\'s intuitive and powerful.',
    rating: 5
  },
  {
    name: 'Mike Johnson',
    role: 'Fleet Manager',
    content: 'Managing our department liveries has never been easier. The cloud storage is a game changer.',
    rating: 5
  }
];

const SHOWCASE_ITEMS = [
  { id: 1, title: 'Police Cruiser', author: 'OfficerSmith', likes: 234 },
  { id: 2, title: 'Fire Department', author: 'FireChief92', likes: 189 },
  { id: 3, title: 'EMS Ambulance', author: 'MedicLife', likes: 156 },
  { id: 4, title: 'SWAT Unit', author: 'TacticalTeam', likes: 298 },
  { id: 5, title: 'Traffic Stop', author: 'HighwayPatrol', likes: 167 },
  { id: 6, title: 'K-9 Unit', author: 'K9Handler', likes: 201 }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeNav, setActiveNav] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const { posts: showcasePosts, loading: showcaseLoading, refresh } = useShowcase();

  useEffect(() => {
    if (!document.getElementById('lp-styles')) {
      const el = document.createElement('style');
      el.id = 'lp-styles';
      el.textContent = LANDING_STYLES;
      document.head.appendChild(el);
    }

    // Scroll animation for Audi render
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = Math.min(scrollY / maxScroll, 1);
      
      const audiElement = document.getElementById('audi-render');
      if (audiElement) {
        // Start showing more of the car (almost fully visible)
        const baseOffset = -0; // Positive to move more left initially
        const additionalOffset = scrollProgress * 400; // Move up to 400px more left as scroll progresses
        audiElement.style.marginRight = `-${baseOffset + additionalOffset}px`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };


    // Particle canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);

    interface P { x:number; y:number; vx:number; vy:number; r:number; o:number; }
    const pts: P[] = Array.from({ length: 50 }, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-.5)*.25, vy: (Math.random()-.5)*.25,
      r: Math.random()*1.2+.3, o: Math.random()*.3+.05,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      pts.forEach(p => {
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0) p.x=W; if(p.x>W) p.x=0;
        if(p.y<0) p.y=H; if(p.y>H) p.y=0;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(216,255,99,${p.o})`; ctx.fill();
      });
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++) {
        const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d<90) { ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y); ctx.strokeStyle=`rgba(216,255,99,${.05*(1-d/90)})`; ctx.lineWidth=.4; ctx.stroke(); }
      }
      raf=requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  const NAV_ITEMS = [
    { id: 'livery',    label: 'Livery Previewer', action: () => navigate('/previewer') },
    { id: 'portfolio', label: 'Portfolio',         action: () => {} },
    { id: 'about',     label: 'Who We Are',        action: () => document.getElementById('about')?.scrollIntoView({ behavior:'smooth' }) },
    { id: 'shop',      label: 'Shop',              action: () => {} },
  ];

  return (
    <div className="lp" style={{ minHeight:'100vh', background:'#080808', color:'#fff', overflowX:'hidden' }}>
      {/* Canvas */}
      <canvas ref={canvasRef} style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }} />

      {/* Ambient glows */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-15%', right:'-8%', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle,rgba(216,255,99,0.1) 0%,transparent 60%)', animation:'lp-glow 5s ease-in-out infinite' }} />
        <div style={{ position:'absolute', bottom:'-20%', left:'-10%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(216,255,99,0.05) 0%,transparent 65%)' }} />
        <div style={{ position:'absolute', top:'40%', left:'40%', width:400, height:400, borderRadius:'50%', transform:'translate(-50%,-50%)', background:'radial-gradient(circle,rgba(216,255,99,0.04) 0%,transparent 60%)' }} />
      </div>

      {/* Background vector */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <img 
          src={`${BASE}Vector_(7).svg`} 
          alt="" 
          aria-hidden 
          style={{ 
            width:'90%', 
            opacity:0.025, 
            filter:'brightness(0) invert(1)'
          }} 
        />
      </div>

      {/* ── Navbar ── */}
      <nav
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8"
        style={{
          paddingTop: '10px',
          paddingBottom: '10px',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 1px 0 0 rgba(196,255,13,0.05), inset 0 1px 0 0 rgba(255,255,255,0.06)',
        }}
      >
        <img src={`${BASE}itzz.svg`} alt="itzz" className="h-7 w-auto" />

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/previewer')}
            className="text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-lg transition-all"
            style={{
              color: '#c4ff0d',
              background: 'rgba(196,255,13,0.07)',
              border: '1px solid rgba(196,255,13,0.22)',
            }}
          >
            Livery Previewer
          </button>
          <button
            onClick={() => {}}
            className="text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-lg transition-all text-zinc-400 hover:text-white"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            Shop
          </button>
          <button
            onClick={() => {}}
            className="text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-lg transition-all text-zinc-400 hover:text-white"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            Portfolio
          </button>
          <button
            onClick={() => {}}
            className="text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-lg transition-all text-zinc-400 hover:text-white"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            Reviews
          </button>
          <button
            onClick={() => window.open('https://discord.gg/itzz', '_blank')}
            className="text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-lg transition-all"
            style={{
              color: '#c4ff0d',
              background: 'rgba(196,255,13,0.07)',
              border: '1px solid rgba(196,255,13,0.22)',
            }}
          >
            Discord Server
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}

      {/* Mobile Menu Overlay */}
      <div className={`lp-mobile-menu ${menuOpen ? 'open' : ''}`} style={{ display:'none' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32 }}>
          <img src={`${BASE}itzz.svg`} alt="itzz" style={{ height:24, width:'auto' }} />
          <button 
            style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', padding:'8px' }}
            onClick={() => setMenuOpen(false)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} className="lp-nav-link" style={{ fontSize:16, padding:'12px 0', textAlign:'left' }}
              onClick={() => { setActiveNav(item.id); item.action(); setMenuOpen(false); }}>
              {item.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop:32, display:'flex', flexDirection:'column', gap:12 }}>
          <button className="lp-btn-ghost" style={{ padding:'12px 24px', width:'100%' }}
            onClick={() => { window.open('https://discord.gg/itzz','_blank'); setMenuOpen(false); }}>
            Discord
          </button>
          <button className="lp-btn-primary" style={{ padding:'12px 24px', width:'100%' }} onClick={() => { navigate('/previewer'); setMenuOpen(false); }}>
            Launch App
          </button>
        </div>
      </div>

      {/* ── Premium Hero ── */}
      <section style={{ position:'relative', zIndex:10, minHeight:'100vh', padding:'0 48px', paddingTop:100 }}>
        {/* Left Content - Dashboard and Text */}
        <div style={{ position:'relative', zIndex:10, maxWidth:600, animation:'fadeInUp 0.8s ease 0.15s both', opacity:0 }}>
          <img src={`${BASE}dashboard.svg`} alt="itzz dashboard" style={{ width:'100%', maxWidth:700, height:'auto', marginBottom:40 }} />
          
          <p style={{ fontSize:28, color:'var(--text-secondary)', lineHeight:1.6, maxWidth:550, margin:'0 0 40px', fontWeight:400, animation:'fadeInUp 0.8s ease 0.25s both', opacity:0 }}>
            itzz all about quality — creating tools, designs, and experiences for players who care about the details.
          </p>

          {/* CTA Buttons */}
          <div style={{ display:'flex', gap:16, flexWrap:'wrap', animation:'fadeInUp 0.8s ease 0.35s both', opacity:0 }}>
            <button className="neon-button" onClick={() => navigate('/previewer')}>
              Launch App →
            </button>
            <button className="glass-card" style={{ padding:'18px 32px', fontSize:14, fontWeight:500, color:'var(--text-primary)' }}
              onClick={() => document.getElementById('products')?.scrollIntoView({ behavior:'smooth' })}>
              Explore
            </button>
          </div>
        </div>

        {/* Right Side - Audi Render (Positioned Absolutely) */}
        <div id="audi-render" style={{ position:'absolute', top:80, right:0, width:1000, height:1000, display:'flex', alignItems:'center', justifyContent:'flex-end', animation:'slideInRight 1.2s ease 0.6s both', opacity:0, zIndex:5, marginRight:'-400px', transition:'margin-right 0.3s ease-out' }}>
          <img 
            src="/Audi_Render_2 (1).png" 
            alt="Audi Render" 
            style={{ 
              width:'200%', 
              height:'200%', 
              objectFit:'contain',
              marginRight:'-200px'
            }} 
          />
        </div>

        {/* Bottom Stats */}
        <div style={{ position:'absolute', bottom:48, left:48, display:'flex', gap:24, animation:'fadeInUp 0.8s ease 0.5s both', opacity:0 }}>
          {STATS.map((s,i) => (
            <div key={i} className="glass-card" style={{ padding:'16px 24px', textAlign:'center' }}>
              <span style={{ fontSize:24, fontWeight:800, color:'var(--neon-primary)', display:'block', marginBottom:4 }}>{s.value}</span>
              <span style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-muted)', display:'block' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Scroll Indicator */}
        <div style={{ position:'absolute', bottom:40, right:48, display:'flex', alignItems:'center', gap:12, animation:'fadeInUp 1s ease 0.8s both', opacity:0 }}>
          <div style={{ width:1, height:32, background:'linear-gradient(to bottom, var(--neon-primary), transparent)' }} />
          <span style={{ fontSize:9, fontWeight:600, letterSpacing:'0.2em', color:'var(--text-muted)', textTransform:'uppercase', writingMode:'vertical-rl' }}>Scroll</span>
        </div>
      </section>

      {/* ── Premium Moving Strip ── */}
      <div style={{ 
        position:'relative', 
        zIndex:10, 
        overflow:'hidden', 
        borderTop:'2px solid rgba(216,255,99,0.2)', 
        borderBottom:'2px solid rgba(216,255,99,0.2)', 
        padding:'16px 0', 
        background:'linear-gradient(90deg, rgba(8,8,8,0.85) 0%, rgba(216,255,99,0.03) 50%, rgba(8,8,8,0.85) 100%)',
        backdropFilter:'blur(20px)',
        WebkitBackdropFilter:'blur(20px)'
      }}>
        <div style={{ display:'flex', overflow:'hidden' }}>
          <div className="lp-marquee-track">
            {['INNOVATION','EFFICIENCY','QUALITY','ITZZ INDUSTRIES','ADVANCED TOOLS','PROFESSIONAL DESIGNS','PREMIUM QUALITY','SEAMLESS INTEGRATION','MODERN INTERFACE','EXPERT SUPPORT','CONTINUOUS IMPROVEMENT','CUTTING EDGE','FUTURE READY','COMMUNITY DRIVEN','INDUSTRY LEADING'].map((t,i) => (
              <span key={i} style={{ 
                fontSize:12, 
                fontWeight:800, 
                letterSpacing:'0.2em', 
                textTransform:'uppercase', 
                color: i%3===0 ? '#D8FF63' : i%3===1 ? '#FFFFFF' : '#666666', 
                flexShrink:0,
                textShadow: i%3===0 ? '0 0 20px rgba(216,255,99,0.6)' : 'none',
                padding:'0 24px'
              }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Premium Products Grid ── */}
      <section id="products" style={{ position:'relative', zIndex:10, padding:'120px 48px', background:'linear-gradient(180deg, rgba(4,4,4,0.9) 0%, rgba(216,255,99,0.01) 50%, rgba(4,4,4,0.9) 100%)' }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:80 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <div style={{ width:4, height:4, borderRadius:'50%', background:'linear-gradient(45deg, #D8FF63, #c0ff40)', boxShadow:'0 0 20px rgba(216,255,99,0.6)' }} />
              <p style={{ fontSize:12, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'#D8FF63', margin:0 }}>What we build</p>
            </div>
            <h2 style={{ fontSize:'clamp(32px,4vw,56px)', fontWeight:900, letterSpacing:'-0.03em', margin:0, lineHeight:1.05, background:'linear-gradient(135deg, #FFFFFF 0%, #D8FF63 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              Our Premium<br />Products
            </h2>
          </div>
          <div style={{ textAlign:'right', maxWidth:300 }}>
            <p style={{ fontSize:14, color:'rgba(255,255,255,0.7)', lineHeight:1.8, margin:0, fontWeight:500 }}>
              Cutting-edge tools and exclusive spaces built for the itzz community
            </p>
            <div style={{ marginTop:16, display:'flex', alignItems:'center', justifyContent:'flex-end', gap:8 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#D8FF63', boxShadow:'0 0 10px rgba(216,255,99,0.8)' }} />
              <span style={{ fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.5)' }}>Premium Quality</span>
            </div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:4, position:'relative', alignItems:'stretch' }}>
          {PRODUCTS.map((p, i) => (
            <div key={p.id}
              style={{ 
                position:'relative',
                borderRadius: '16px', 
                border: '1px solid rgba(216,255,99,0.08)',
                background:'linear-gradient(135deg, rgba(4,4,4,0.85) 0%, rgba(216,255,99,0.02) 100%)',
                backdropFilter:'blur(10px)',
                WebkitBackdropFilter:'blur(10px)',
                overflow:'hidden',
                transition:'all 0.3s ease',
                cursor:'pointer'
              }}
              onClick={() => { if (p.isInternal && p.link) navigate(p.link); else if (p.link) window.open(p.link,'_blank'); }}
              onMouseEnter={e => {
                e.currentTarget.style.transform='translateY(-4px)';
                e.currentTarget.style.borderColor='rgba(216,255,99,0.2)';
                e.currentTarget.style.boxShadow='0 8px 20px rgba(216,255,99,0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform='translateY(0)';
                e.currentTarget.style.borderColor='rgba(216,255,99,0.08)';
                e.currentTarget.style.boxShadow='none';
              }}
            >

              {/* Content */}
              <div style={{ padding:'56px 48px', height:'100%', minHeight:300, display:'flex', flexDirection:'column', justifyContent:'center', position:'relative', zIndex:2 }}>
                {/* Premium Badge */}
                <div style={{ 
                  display:'inline-flex', 
                  alignItems:'center', 
                  gap:8, 
                  marginBottom:24,
                  padding:'8px 16px',
                  borderRadius:20,
                  background:'linear-gradient(45deg, rgba(216,255,99,0.2), rgba(216,255,99,0.05))',
                  border:'1px solid rgba(216,255,99,0.3)'
                }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'#D8FF63', boxShadow:'0 0 15px rgba(216,255,99,0.8)' }} />
                  <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:'#D8FF63' }}>{p.tag}</span>
                </div>

                <h3 style={{ fontSize:32, fontWeight:900, letterSpacing:'-0.025em', margin:'0 0 16px', color:'#FFFFFF', lineHeight:1.2 }}>{p.name}</h3>
                <p style={{ fontSize:14, color:'rgba(255,255,255,0.7)', lineHeight:1.8, margin:0, fontWeight:500 }}>{p.desc}</p>

              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="lp-divider" style={{ margin:'0 48px' }} />

      {/* Features */}
      <section style={{ position:'relative', zIndex:10, padding:'120px 48px', background:'linear-gradient(180deg, rgba(4,4,4,0.7) 0%, rgba(216,255,99,0.02) 50%, rgba(4,4,4,0.7) 100%)' }}>
        <div style={{ textAlign:'center', marginBottom:80 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'linear-gradient(45deg, #D8FF63, #c0ff40)', boxShadow:'0 0 20px rgba(216,255,99,0.6)' }} />
            <p style={{ fontSize:12, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'#D8FF63', margin:0 }}>Core Features</p>
          </div>
          <h2 style={{ fontSize:'clamp(36px,4vw,64px)', fontWeight:900, letterSpacing:'-0.03em', margin:'0 0 32px', lineHeight:1.05, background:'linear-gradient(135deg, #FFFFFF 0%, #D8FF63 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            Advanced Tools For<br />Professional Creators
          </h2>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.8)', lineHeight:1.8, margin:'0 auto', fontWeight:500, maxWidth:600 }}>
            Cutting-edge solutions designed to elevate your creative workflow and streamline your design process
          </p>
        </div>

        {/* Feature Cards Container */}
        <div style={{ 
          display:'grid',
          gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))',
          gap:24,
          padding:'0 20px',
          position:'relative'
        }}>
          {[
            {
              title: 'Academy Integration',
              description: 'Helping students improve by joining our comprehensive academy with expert guidance and structured learning paths',
              accent: '#D8FF63'
            },
            {
              title: 'Premium Asset Library',
              description: 'Access to top-tier assets with exclusive designs, professional templates, and industry-standard quality',
              accent: '#D8FF63'
            },
            {
              title: 'Efficiency Tools',
              description: 'Providing intelligent tools to improve workflow efficiency and reduce design time significantly',
              accent: '#D8FF63'
            },
            {
              title: 'Cloud Storage',
              description: 'Secure cloud-based storage with automatic backups, version control, and seamless collaboration features',
              accent: '#D8FF63'
            },
            {
              title: 'Real-Time 3D Preview',
              description: 'Instant 3D visualization with real-time rendering, accurate lighting, and material preview',
              accent: '#D8FF63'
            }
          ].map((feature, i) => (
            <div key={i}
              style={{ 
                position:'relative',
                borderRadius: '16px',
                border: '1px solid rgba(216,255,99,0.12)',
                background:'linear-gradient(135deg, rgba(4,4,4,0.85) 0%, rgba(216,255,99,0.05) 100%)',
                backdropFilter:'blur(12px)',
                WebkitBackdropFilter:'blur(12px)',
                overflow:'hidden',
                transition:'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor:'pointer',
                height:'200px',
                width:'100%',
                margin:'0'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform='translateY(-8px) scale(1.02)';
                e.currentTarget.style.borderColor='rgba(216,255,99,0.25)';
                e.currentTarget.style.boxShadow='0 15px 30px rgba(216,255,99,0.2)';
                e.currentTarget.style.background='linear-gradient(135deg, rgba(4,4,4,0.92) 0%, rgba(216,255,99,0.08) 100%)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform='translateY(0) scale(1)';
                e.currentTarget.style.borderColor='rgba(216,255,99,0.12)';
                e.currentTarget.style.boxShadow='none';
                e.currentTarget.style.background='linear-gradient(135deg, rgba(4,4,4,0.85) 0%, rgba(216,255,99,0.05) 100%)';
              }}
            >
              <div style={{ padding:'20px', height:'100%', display:'flex', flexDirection:'column', justifyContent:'center', textAlign:'center' }}>
                <h3 style={{ 
                  fontSize:16, 
                  fontWeight:700, 
                  letterSpacing:'-0.02em', 
                  margin:'0 0 12px', 
                  color:'#FFFFFF', 
                  lineHeight:1.3 
                }}>
                  {feature.title}
                </h3>
                <p style={{ 
                  fontSize:11, 
                  color:'rgba(255,255,255,0.8)', 
                  lineHeight:1.6, 
                  margin:0, 
                  fontWeight:400 
                }}>
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ position:'relative', zIndex:10, padding:'120px 48px', background:'linear-gradient(180deg, rgba(4,4,4,0.8) 0%, rgba(216,255,99,0.02) 50%, rgba(4,4,4,0.8) 100%)' }}>
        <div style={{ textAlign:'center', marginBottom:80 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <div style={{ width:4, height:4, borderRadius:'50%', background:'linear-gradient(45deg, #D8FF63, #c0ff40)', boxShadow:'0 0 20px rgba(216,255,99,0.6)' }} />
            <p style={{ fontSize:12, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'#D8FF63', margin:0 }}>Community Voice</p>
          </div>
          <h2 style={{ fontSize:'clamp(36px,4vw,64px)', fontWeight:900, letterSpacing:'-0.03em', margin:'0 0 32px', lineHeight:1.05, background:'linear-gradient(135deg, #FFFFFF 0%, #D8FF63 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            Trusted By<br />Professional Creators
          </h2>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.8)', lineHeight:1.8, margin:'0 auto', fontWeight:500, maxWidth:600 }}>
            Hear from the ERLC community members who rely on our tools every day
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:24, padding:'0 20px' }}>
          {TESTIMONIALS.map((testimonial, i) => (
            <div key={i}
              style={{ 
                position:'relative',
                borderRadius: '16px',
                border: '1px solid rgba(216,255,99,0.12)',
                background:'linear-gradient(135deg, rgba(4,4,4,0.85) 0%, rgba(216,255,99,0.05) 100%)',
                backdropFilter:'blur(12px)',
                WebkitBackdropFilter:'blur(12px)',
                overflow:'hidden',
                transition:'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor:'pointer',
                padding:'32px',
                height:'100%',
                margin:'0'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform='translateY(-8px) scale(1.02)';
                e.currentTarget.style.borderColor='rgba(216,255,99,0.25)';
                e.currentTarget.style.boxShadow='0 15px 30px rgba(216,255,99,0.2)';
                e.currentTarget.style.background='linear-gradient(135deg, rgba(4,4,4,0.92) 0%, rgba(216,255,99,0.08) 100%)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform='translateY(0) scale(1)';
                e.currentTarget.style.borderColor='rgba(216,255,99,0.12)';
                e.currentTarget.style.boxShadow='none';
                e.currentTarget.style.background='linear-gradient(135deg, rgba(4,4,4,0.85) 0%, rgba(216,255,99,0.05) 100%)';
              }}
            >
              {/* Rating */}
              <div style={{ display:'flex', gap:4, marginBottom:20 }}>
                {[...Array(testimonial.rating)].map((_, j) => (
                  <span key={j} style={{ color:'#D8FF63', fontSize:16, filter:'drop-shadow(0 0 8px rgba(216,255,99,0.6)' }}>★</span>
                ))}
              </div>
              
              {/* Quote */}
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.9)', lineHeight:1.7, margin:'0 0 24px', fontStyle:'italic', fontWeight:500 }}>
                "{testimonial.content}"
              </p>
              
              {/* Author */}
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ 
                  width:48, 
                  height:48, 
                  borderRadius:'12px', 
                  background:'linear-gradient(135deg, #D8FF63, #c0ff40)', 
                  display:'flex', 
                  alignItems:'center', 
                  justifyContent:'center', 
                  fontWeight:800, 
                  color:'#080808',
                  fontSize:20,
                  boxShadow:'0 8px 24px rgba(216,255,99,0.3)'
                }}>
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p style={{ fontSize:14, fontWeight:700, color:'#FFFFFF', margin:0, lineHeight:1.2 }}>{testimonial.name}</p>
                  <p style={{ fontSize:12, color:'rgba(255,255,255,0.6)', margin:0, lineHeight:1.3, fontWeight:500 }}>{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Showcase */}
      <section style={{ position:'relative', zIndex:10, padding:'120px 48px', background:'linear-gradient(180deg, rgba(4,4,4,0.7) 0%, rgba(216,255,99,0.02) 50%, rgba(4,4,4,0.7) 100%)' }}>
        <div style={{ textAlign:'center', marginBottom:80 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <div style={{ width:4, height:4, borderRadius:'50%', background:'linear-gradient(45deg, #D8FF63, #c0ff40)', boxShadow:'0 0 20px rgba(216,255,99,0.6)' }} />
            <p style={{ fontSize:12, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'#D8FF63', margin:0 }}>Community Creations</p>
          </div>
          <h2 style={{ fontSize:'clamp(36px,4vw,64px)', fontWeight:900, letterSpacing:'-0.03em', margin:'0 0 32px', lineHeight:1.05, background:'linear-gradient(135deg, #FFFFFF 0%, #D8FF63 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            Featured<br />Masterpieces
          </h2>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.8)', lineHeight:1.8, margin:'0 auto', fontWeight:500, maxWidth:600 }}>
            Exceptional liveries designed by our community's most talented creators
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:24, padding:'0 20px' }}>
          {showcasePosts.map((post: any, i: number) => (
            <div key={post.id}
              style={{ 
                position:'relative',
                borderRadius: '16px',
                border: '1px solid rgba(216,255,99,0.12)',
                background:'linear-gradient(135deg, rgba(4,4,4,0.85) 0%, rgba(216,255,99,0.05) 100%)',
                backdropFilter:'blur(12px)',
                WebkitBackdropFilter:'blur(12px)',
                overflow:'hidden',
                transition:'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor:'pointer',
                margin:'0'
              }}
              onClick={() => navigate('/showcases')}
              onMouseEnter={e => {
                e.currentTarget.style.transform='translateY(-8px) scale(1.02)';
                e.currentTarget.style.borderColor='rgba(216,255,99,0.25)';
                e.currentTarget.style.boxShadow='0 15px 30px rgba(216,255,99,0.2)';
                e.currentTarget.style.background='linear-gradient(135deg, rgba(4,4,4,0.92) 0%, rgba(216,255,99,0.08) 100%)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform='translateY(0) scale(1)';
                e.currentTarget.style.borderColor='rgba(216,255,99,0.12)';
                e.currentTarget.style.boxShadow='none';
                e.currentTarget.style.background='linear-gradient(135deg, rgba(4,4,4,0.85) 0%, rgba(216,255,99,0.05) 100%)';
              }}
            >
              {/* Image Preview */}
              <div style={{ 
                height:200, 
                background:'linear-gradient(135deg, rgba(216,255,99,0.1), rgba(216,255,99,0.05))', 
                display:'flex', 
                alignItems:'center', 
                justifyContent:'center', 
                position:'relative', 
                overflow:'hidden'
              }}>
                <img 
                  src={post.image_key ? `https://your-cloudflare-domain.com/showcases/${post.image_key}` : '/placeholder.jpg'}
                  alt={post.title || 'Showcase Image'}
                  style={{ 
                    width:'100%', 
                    height:'100%', 
                    objectFit:'cover',
                    filter:'drop-shadow(0 0 20px rgba(216,255,99,0.3))'
                  }}
                />
                <div style={{ 
                  position:'absolute', 
                  top:12, 
                  right:12, 
                  background:'linear-gradient(135deg, rgba(4,4,4,0.8), rgba(4,4,4,0.6))', 
                  backdropFilter:'blur(8px)', 
                  padding:'8px 12px', 
                  borderRadius:20, 
                  display:'flex', 
                  alignItems:'center', 
                  gap:8,
                  border:'1px solid rgba(216,255,99,0.2)'
                }}>
                  <span style={{ fontSize:14, color:'#D8FF63', filter:'drop-shadow(0 0 8px rgba(216,255,99,0.6)' }}>❤️</span>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.9)', fontWeight:600 }}>{post.like_count || 0}</span>
                </div>
              </div>
              
              {/* Content */}
              <div style={{ padding:24 }}>
                <h4 style={{ fontSize:16, fontWeight:700, color:'#FFFFFF', margin:'0 0 8px', letterSpacing:'-0.01em' }}>{post.title || 'Untitled Showcase'}</h4>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.7)', margin:0, fontWeight:500 }}>{post.caption ? post.caption.replace(/#\w+/g, '').trim() : 'No description'}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign:'center', marginTop:48 }}>
          <button 
            style={{ 
              padding:'16px 36px', 
              fontSize:14, 
              fontWeight:700,
              letterSpacing:'0.05em',
              textTransform:'uppercase',
              borderRadius:'12px',
              background:'linear-gradient(135deg, #D8FF63, #c0ff40)',
              color:'#080808',
              border:'none',
              cursor:'pointer',
              transition:'all 0.3s ease',
              boxShadow:'0 8px 24px rgba(216,255,99,0.3)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform='translateY(-2px) scale(1.05)';
              e.currentTarget.style.boxShadow='0 12px 32px rgba(216,255,99,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform='translateY(0) scale(1)';
              e.currentTarget.style.boxShadow='0 8px 24px rgba(216,255,99,0.3)';
            }}
            onClick={() => navigate('/previewer')}
          >
            Explore Gallery →
          </button>
        </div>
      </section>

      <div className="lp-divider" style={{ margin:'0 48px' }} />

      {/* About */}
      <section id="about" style={{ position:'relative', zIndex:10, padding:'120px 48px', background:'linear-gradient(180deg, rgba(4,4,4,0.8) 0%, rgba(216,255,99,0.02) 50%, rgba(4,4,4,0.8) 100%)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center', maxWidth:1200, margin:'0 auto' }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <div style={{ width:4, height:4, borderRadius:'50%', background:'linear-gradient(45deg, #D8FF63, #c0ff40)', boxShadow:'0 0 20px rgba(216,255,99,0.6)' }} />
              <p style={{ fontSize:12, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'#D8FF63', margin:0 }}>About Us</p>
            </div>
            <h2 style={{ fontSize:'clamp(36px,4vw,64px)', fontWeight:900, letterSpacing:'-0.03em', margin:'0 0 32px', lineHeight:1.05, background:'linear-gradient(135deg, #FFFFFF 0%, #D8FF63 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              Built By The<br />Community
            </h2>
            <p style={{ fontSize:16, color:'rgba(255,255,255,0.8)', lineHeight:1.8, margin:'0 0 24px', fontWeight:500 }}>
              itzz industries is a fan-made collective focused on building tools and experiences for the ERLC community. Everything we make is free, member-focused, and built with care.
            </p>
            <p style={{ fontSize:16, color:'rgba(255,255,255,0.8)', lineHeight:1.8, margin:'0 0 40px', fontWeight:500 }}>
              We believe in quality over quantity — every tool we ship is designed to be genuinely useful, well-crafted, and always improving based on community feedback.
            </p>
            <button 
              style={{ 
                padding:'16px 36px', 
                fontSize:14, 
                fontWeight:700,
                letterSpacing:'0.05em',
                textTransform:'uppercase',
                borderRadius:'12px',
                background:'linear-gradient(135deg, rgba(216,255,99,0.2), rgba(216,255,99,0.05))',
                color:'#D8FF63',
                border:'1px solid rgba(216,255,99,0.3)',
                cursor:'pointer',
                transition:'all 0.3s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform='translateY(-2px) scale(1.05)';
                e.currentTarget.style.background='linear-gradient(135deg, rgba(216,255,99,0.3), rgba(216,255,99,0.1))';
                e.currentTarget.style.borderColor='rgba(216,255,99,0.5)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform='translateY(0) scale(1)';
                e.currentTarget.style.background='linear-gradient(135deg, rgba(216,255,99,0.2), rgba(216,255,99,0.05))';
                e.currentTarget.style.borderColor='rgba(216,255,99,0.3)';
              }}
              onClick={() => window.open('https://discord.gg/itzz','_blank')}
            >
              Join Community →
            </button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            {[
              { label:'Community First',  desc:'Every decision is made with the community in mind.' },
              { label:'Always Free',      desc:'All tools are and will remain completely free.' },
              { label:'Quality Focused',  desc:'We ship things when they\'re ready, not before.' },
              { label:'Open to Feedback', desc:'We build what the community actually needs.' },
            ].map((v,i) => (
              <div key={i}
                style={{ 
                  position:'relative',
                  borderRadius: '16px',
                  border: '1px solid rgba(216,255,99,0.12)',
                  background:'linear-gradient(135deg, rgba(4,4,4,0.85) 0%, rgba(216,255,99,0.05) 100%)',
                  backdropFilter:'blur(12px)',
                  WebkitBackdropFilter:'blur(12px)',
                  overflow:'hidden',
                  transition:'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor:'pointer',
                  padding:'24px',
                  margin:'0'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform='translateY(-4px) scale(1.02)';
                  e.currentTarget.style.borderColor='rgba(216,255,99,0.25)';
                  e.currentTarget.style.boxShadow='0 8px 20px rgba(216,255,99,0.15)';
                  e.currentTarget.style.background='linear-gradient(135deg, rgba(4,4,4,0.92) 0%, rgba(216,255,99,0.08) 100%)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform='translateY(0) scale(1)';
                  e.currentTarget.style.borderColor='rgba(216,255,99,0.12)';
                  e.currentTarget.style.boxShadow='none';
                  e.currentTarget.style.background='linear-gradient(135deg, rgba(4,4,4,0.85) 0%, rgba(216,255,99,0.05) 100%)';
                }}
              >
                <div style={{ 
                  width:32, 
                  height:32, 
                  borderRadius:'8px', 
                  background:'linear-gradient(135deg, rgba(216,255,99,0.2), rgba(216,255,99,0.05))', 
                  border:'1px solid rgba(216,255,99,0.3)',
                  display:'flex', 
                  alignItems:'center', 
                  justifyContent:'center', 
                  marginBottom:16 
                }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'#D8FF63', boxShadow:'0 0 15px rgba(216,255,99,0.8)' }} />
                </div>
                <p style={{ fontSize:14, fontWeight:700, color:'#FFFFFF', margin:'0 0 8px', letterSpacing:'-0.01em' }}>{v.label}</p>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.7)', lineHeight:1.6, margin:0, fontWeight:500 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="lp-divider" style={{ margin:'0 48px' }} />

      {/* ── CTA ── */}
      <section style={{ position:'relative', zIndex:10, padding:'120px 48px', textAlign:'center', background:'linear-gradient(180deg, rgba(4,4,4,0.7) 0%, rgba(216,255,99,0.02) 50%, rgba(4,4,4,0.7) 100%)' }}>
        <div style={{ maxWidth:600, margin:'0 auto' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:12, marginBottom:24 }}>
            <div style={{ width:4, height:4, borderRadius:'50%', background:'linear-gradient(45deg, #D8FF63, #c0ff40)', boxShadow:'0 0 20px rgba(216,255,99,0.6)' }} />
            <p style={{ fontSize:12, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'#D8FF63', margin:0 }}>Get Started</p>
          </div>
          <h2 style={{ fontSize:'clamp(36px,4vw,64px)', fontWeight:900, letterSpacing:'-0.03em', margin:'0 0 32px', lineHeight:1.05, background:'linear-gradient(135deg, #FFFFFF 0%, #D8FF63 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            Ready To Create<br />Your Masterpiece?
          </h2>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.8)', margin:'0 0 48px', lineHeight:1.8, fontWeight:500 }}>
            Log in with Discord and start building your perfect livery in seconds. Free for all verified itzz members.
          </p>
          <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
            <button 
              style={{ 
                padding:'18px 40px', 
                fontSize:14, 
                fontWeight:700,
                letterSpacing:'0.05em',
                textTransform:'uppercase',
                borderRadius:'12px',
                background:'linear-gradient(135deg, #D8FF63, #c0ff40)',
                color:'#080808',
                border:'none',
                cursor:'pointer',
                transition:'all 0.3s ease',
                boxShadow:'0 8px 24px rgba(216,255,99,0.3)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform='translateY(-2px) scale(1.05)';
                e.currentTarget.style.boxShadow='0 12px 32px rgba(216,255,99,0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform='translateY(0) scale(1)';
                e.currentTarget.style.boxShadow='0 8px 24px rgba(216,255,99,0.3)';
              }}
              onClick={() => navigate('/previewer')}
            >
              Launch Previewer →
            </button>
            <button 
              style={{ 
                padding:'18px 36px', 
                fontSize:14, 
                fontWeight:700,
                letterSpacing:'0.05em',
                textTransform:'uppercase',
                borderRadius:'12px',
                background:'linear-gradient(135deg, rgba(216,255,99,0.2), rgba(216,255,99,0.05))',
                color:'#D8FF63',
                border:'1px solid rgba(216,255,99,0.3)',
                cursor:'pointer',
                transition:'all 0.3s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform='translateY(-2px) scale(1.05)';
                e.currentTarget.style.background='linear-gradient(135deg, rgba(216,255,99,0.3), rgba(216,255,99,0.1))';
                e.currentTarget.style.borderColor='rgba(216,255,99,0.5)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform='translateY(0) scale(1)';
                e.currentTarget.style.background='linear-gradient(135deg, rgba(216,255,99,0.2), rgba(216,255,99,0.05))';
                e.currentTarget.style.borderColor='rgba(216,255,99,0.3)';
              }}
              onClick={() => window.open('https://discord.gg/itzz','_blank')}
            >
              Join Discord
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ position:'relative', zIndex:10, borderTop:'1px solid var(--border-subtle)', padding:'28px 48px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
        <img src={`${BASE}itzz.svg`} alt="itzz" style={{ height:20, width:'auto', opacity:0.4 }} />
        <div style={{ display:'flex', gap:24, alignItems:'center' }}>
          <button className="nav-link" onClick={() => navigate('/previewer')}>Livery Previewer</button>
          <button className="nav-link" onClick={() => window.open('https://discord.gg/itzz','_blank')}>Discord</button>
        </div>
        <p style={{ fontSize:11, color:'var(--text-muted)', margin:0 }}>  {new Date().getFullYear()} itzz industries. Fan-made, not affiliated with PRC or Roblox.</p>
      </footer>
    </div>
  );
}
