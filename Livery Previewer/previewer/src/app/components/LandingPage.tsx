import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo3D from './Logo3D';

const BASE = import.meta.env.BASE_URL;

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
  { value: '25+',   label: 'Vehicle Models' },
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

  useEffect(() => {
    if (!document.getElementById('lp-styles')) {
      const el = document.createElement('style');
      el.id = 'lp-styles';
      el.textContent = LANDING_STYLES;
      document.head.appendChild(el);
    }

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

      {/* ── Premium Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3"
          style={{ 
            height: 56, 
            background: 'var(--bg-glass)', 
            backdropFilter: 'blur(32px)', 
            WebkitBackdropFilter: 'blur(32px)', 
            borderBottom: '1px solid var(--border-subtle)', 
            boxShadow: '0 4px 24px rgba(0,0,0,0.25), 0 1px 0 var(--neon-glow), inset 0 0 0 4px var(--neon-glow)'
          }}>    
        <div className="flex items-center gap-8">
          <div className="relative group">
            <img src={`${BASE}itzz.svg`} alt="itzz" style={{ height:32, width:'auto', cursor:'pointer', transition: 'transform 0.2s ease, filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }} onClick={() => window.location.href = '/'} />
            <div className="absolute -bottom-1 left-1/2 w-2 h-0.5 bg-black/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full" />
            </div>
          </div>
          
          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-8 nav-desktop">
            {NAV_ITEMS.map(item => (
              <button key={item.id} className={`nav-link ${activeNav===item.id?'active':''}`}
                onClick={() => { setActiveNav(item.id); item.action(); }}>
                {item.label}
                {activeNav===item.id && <div className="absolute -bottom-1 left-1/2 w-2 h-0.5 bg-green-500 rounded-full" />}
              </button>
            ))}
          </div>

        {/* Mobile menu button */}
        <button 
          className="lg:hidden p-2 rounded-lg glass-card transition-all duration-300 hover:bg-white/20 nav-mobile"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>

        <div className="hidden lg:flex items-center gap-3">
          <button className="glass-card px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-white/15"
            onClick={() => window.open('https://discord.gg/itzz','_blank')}>
            <svg width="16" height="16" viewBox="0 0 71 55" fill="currentColor" className="mr-2">
              <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.401329 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978Z"/>
            </svg>
            Discord
          </button>
          <button className="neon-button"
            onClick={() => navigate('/previewer')}>
            Launch App →
          </button>
        </div>
      </div> {/* closes "flex items-center gap-8" */}
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
      <section style={{ position:'relative', zIndex:10, minHeight:'100vh', display:'flex', alignItems:'center', padding:'0 48px', paddingTop:72 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, width:'100%', maxWidth:1400, alignItems:'center' }}>
          {/* Left Content */}
          <div style={{ maxWidth:800 }}>
            {/* Feature Badges */}
            <div style={{ display:'flex', gap:12, marginBottom:32, animation:'fadeInUp 0.8s ease both' }}>
              <div className="feature-badge">
                <div className="neon-dot" />
                <span>25+ Assets</span>
              </div>
              <div className="feature-badge">
                <div className="neon-dot" />
                <span>Members Only</span>
              </div>
              <div className="feature-badge">
                <div className="neon-dot" />
                <span>100% Free</span>
              </div>
            </div>

            {/* Premium Heading */}
            <h1 className="neon-text" style={{ fontSize:'clamp(56px,7vw,120px)', fontWeight:900, lineHeight:0.95, letterSpacing:'-0.04em', margin:'0 0 40px', animation:'fadeInUp 0.8s ease 0.15s both', opacity:0 }}>
              <span style={{ display:'block', marginBottom:8 }}>itzz all</span>
              <span style={{ display:'block' }}>quality.</span>
            </h1>

            <p style={{ fontSize:18, color:'var(--text-secondary)', lineHeight:1.8, maxWidth:520, margin:'0 0 64px', fontWeight:400, animation:'fadeInUp 0.8s ease 0.25s both', opacity:0 }}>
              A community built around ERLC — creating tools, designs, and experiences for players who care about the details.
            </p>

            {/* Premium CTA Buttons */}
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

          {/* Right Side - Abstract Geometric Visual */}
          <div style={{ position:'relative', width:600, height:600, display:'flex', alignItems:'center', justifyContent:'center', animation:'slideInLeft 1.2s ease 0.6s both', opacity:0 }}>
            {/* Tech Grid Background */}
            <div className="tech-grid" />
            
            {/* Floating Geometric Elements */}
            <div style={{ position:'absolute', width:'100%', height:'100%', pointerEvents:'none' }}>
              {/* Central Hexagon */}
              <div style={{ 
                position:'absolute', 
                top:'50%', 
                left:'50%', 
                transform:'translate(-50%, -50%)', 
                width:200, 
                height:200, 
                border:'2px solid var(--neon-primary)', 
                borderRadius:20, 
                animation:'float 6s ease-in-out infinite'
              }}>
                <div style={{ 
                  position:'absolute', 
                  top:10, 
                  left:10, 
                  right:10, 
                  bottom:10, 
                  border:'1px solid var(--neon-primary)', 
                  borderRadius:16, 
                  opacity:0.5
                }} />
                <div style={{ 
                  position:'absolute', 
                  top:20, 
                  left:20, 
                  right:20, 
                  bottom:20, 
                  border:'1px solid rgba(216,255,99,0.3)', 
                  borderRadius:12, 
                  opacity:0.3
                }} />
              </div>
              
              {/* Orbiting Elements */}
              <div style={{ 
                position:'absolute', 
                top:'50%', 
                left:'50%', 
                transform:'translate(-50%, -50%)', 
                animation:'gridRotate 20s linear infinite'
              }}>
                {[0, 60, 120, 180, 240, 300].map((rotation, i) => (
                  <div
                    key={i}
                    style={{
                      position:'absolute',
                      width:8,
                      height:8,
                      background:'var(--neon-primary)',
                      borderRadius:'50%',
                      transform: `rotate(${rotation}deg) translateX(100px)`,
                      boxShadow: '0 0 20px var(--neon-glow)'
                    }}
                  />
                ))}
              </div>
              
              {/* Particle Lines */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    position:'absolute',
                    width:1,
                    height:60,
                    background:`linear-gradient(to bottom, transparent, var(--neon-primary), transparent)`,
                    transform:`rotate(${i * 45}deg) translateY(-30px)`,
                    opacity:0.6,
                    animation:`float ${3 + i * 0.5}s ease-in-out infinite`
                  }}
                />
              ))}
            </div>
          </div>
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

      {/* ── Marquee ── */}
      <div style={{ position:'relative', zIndex:10, overflow:'hidden', borderTop:'1px solid rgba(255,255,255,0.04)', borderBottom:'1px solid rgba(255,255,255,0.04)', padding:'16px 0', background:'rgba(255,255,255,0.01)' }}>
        <div style={{ display:'flex', overflow:'hidden' }}>
          <div className="lp-marquee-track">
            {['Livery Previewer','ERLC Community','itzz Industries','Quality First','Discord Community','Vehicle Design','Real-time 3D','Livery Previewer','ERLC Community','itzz Industries','Quality First','Discord Community','Vehicle Design','Real-time 3D'].map((t,i) => (
              <span key={i} style={{ fontSize:11, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color: i%3===0 ? '#D8FF63' : '#27272a', flexShrink:0 }}>
                {t} <span style={{ color:'#1f1f23', marginLeft:48 }}>✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Products ── */}
      <section id="products" style={{ position:'relative', zIndex:10, padding:'120px 48px' }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:64 }}>
          <div>
            <p className="lp-section-label" style={{ marginBottom:12 }}>What we build</p>
            <h2 style={{ fontSize:'clamp(28px,4vw,52px)', fontWeight:800, letterSpacing:'-0.025em', margin:0, lineHeight:1.1 }}>
              Our products<br />&amp; community
            </h2>
          </div>
          <p style={{ fontSize:13, color:'var(--text-muted)', maxWidth:280, lineHeight:1.7, textAlign:'right', margin:0 }}>
            Tools and spaces built for the itzz community — free, member-focused, always improving.
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:2 }}>
          {PRODUCTS.map((p, i) => (
            <div key={p.id}
              className="glass-card"
              style={{ borderRadius: i===0?'16px 0 0 0':i===1?'0 16px 0 0':i===2?'0 0 0 16px':'0 0 16px 0', borderRight: i%2===0?'1px solid var(--border-subtle)':'none', borderBottom: i<2?'1px solid var(--border-subtle)':'none' }}
              onClick={() => { if (p.isInternal && p.link) navigate(p.link); else if (p.link) window.open(p.link,'_blank'); }}
            >
              <div style={{ padding:'48px 40px', height:'100%', minHeight:260, display:'flex', flexDirection:'column', justifyContent:'space-between', position:'relative', overflow:'hidden', transition:'background 0.2s ease' }}
                onMouseEnter={e => (e.currentTarget.style.background='var(--bg-glass-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background='var(--bg-glass)')}
              >
                {/* Number */}
                <div style={{ position:'absolute', top:40, right:40, fontSize:64, fontWeight:900, color:'rgba(255,255,255,0.03)', lineHeight:1, letterSpacing:'-0.04em', userSelect:'none' }}>{p.num}</div>

                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                    <span className="feature-badge">
                      <div className="neon-dot" />
                      <span>{p.tag}</span>
                    </span>
                  </div>
                  <h3 style={{ fontSize:28, fontWeight:800, letterSpacing:'-0.02em', margin:'0 0 12px', color:'var(--text-primary)' }}>{p.name}</h3>
                  <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.7, margin:0, maxWidth:360 }}>{p.desc}</p>
                </div>

                {p.link && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:32 }}>
                    <span className="feature-badge">
                      <div className="neon-dot" />
                      <span>{p.isInternal ? 'Open Tool' : p.tag==='Community' ? 'Join Now' : 'Learn More'}</span>
                    </span>
                    <span style={{ color:p.accent, fontSize:14 }}>→</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="lp-divider" style={{ margin:'0 48px' }} />

      {/* Features */}
      <section style={{ position:'relative', zIndex:10, padding:'120px 48px' }}>
        <div style={{ textAlign:'center', marginBottom:80 }}>
          <p className="lp-section-label" style={{ marginBottom:16, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Features</p>
          <h2 style={{ fontSize:'clamp(32px,4vw,56px)', fontWeight:800, letterSpacing:'-0.025em', margin:'0 0 24px', lineHeight:1.1, color: 'var(--text-primary)' }}>
            Everything you need to<br />create amazing liveries
          </h2>
          <p style={{ fontSize:16, color:'var(--text-secondary)', maxWidth:600, margin:'0 auto', lineHeight:1.7, fontWeight: 400 }}>
            Professional tools designed specifically for ERLC livery creators. From concept to completion, we've got you covered.
          </p>
        </div>

        <div className="feature-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:32 }}>
          {FEATURES.map((feature, i) => (
            <div key={i} className="glass-card" style={{ textAlign:'center', padding:'32px 24px', animation:`fadeInUp 0.6s ease ${i*0.1}s both`, opacity:0 }}>
              <div style={{ margin:'0 auto 20px', fontSize:24, width:48, height:48, borderRadius:12, background:'var(--bg-glass)', border:'1px solid var(--border-glass)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)', margin:'0 0 12px', letterSpacing:'-0.01em' }}>
                {feature.title}
              </h3>
              <p style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.6, margin:0 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ position:'relative', zIndex:10, padding:'120px 48px', background:'var(--bg-secondary)' }}>
        <div style={{ textAlign:'center', marginBottom:64 }}>
          <p className="lp-section-label" style={{ marginBottom:16 }}>Testimonials</p>
          <h2 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:800, letterSpacing:'-0.025em', margin:'0 0 20px', lineHeight:1.1 }}>
            Loved by the community
          </h2>
          <p style={{ fontSize:15, color:'var(--text-secondary)', maxWidth:500, margin:'0 auto', lineHeight:1.7 }}>
            See what ERLC players and designers are saying about our tools
          </p>
        </div>

        <div className="feature-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
          {TESTIMONIALS.map((testimonial, i) => (
            <div key={i} className="glass-card" style={{ padding:32, animation:`fadeInUp 0.6s ease ${i*0.15}s both`, opacity:0 }}>
              <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                {[...Array(testimonial.rating)].map((_, j) => (
                  <span key={j} style={{ color:'var(--neon-primary)', fontSize:16 }}>★</span>
                ))}
              </div>
              <p style={{ fontSize:14, color:'var(--text-primary)', lineHeight:1.6, margin:'0 0 20px', fontStyle:'italic' }}>
                "{testimonial.content}"
              </p>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,var(--neon-primary),#88ff00)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'var(--bg-primary)' }}>
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', margin:0, lineHeight:1.2 }}>{testimonial.name}</p>
                  <p style={{ fontSize:11, color:'var(--text-secondary)', margin:0, lineHeight:1.2 }}>{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Showcase */}
      <section style={{ position:'relative', zIndex:10, padding:'120px 48px' }}>
        <div style={{ textAlign:'center', marginBottom:64 }}>
          <p className="lp-section-label" style={{ marginBottom:16 }}>Community Showcase</p>
          <h2 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:800, letterSpacing:'-0.025em', margin:'0 0 20px', lineHeight:1.1 }}>
            Featured designs
          </h2>
          <p style={{ fontSize:15, color:'var(--text-secondary)', maxWidth:500, margin:'0 auto', lineHeight:1.7 }}>
            Amazing liveries created by our talented community members
          </p>
        </div>

        <div className="feature-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
          {SHOWCASE_ITEMS.map((item, i) => (
            <div key={item.id} className="glass-card" style={{ animation:`fadeInUp 0.6s ease ${i*0.1}s both`, opacity:0, cursor:'pointer' }}>
              <div style={{ height:200, background:'linear-gradient(135deg,var(--neon-glow),var(--neon-glow))', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
                <div style={{ fontSize:48, opacity:0.3 }}>🚗</div>
                <div style={{ position:'absolute', top:12, right:12, background:'var(--bg-secondary)', backdropFilter:'blur(8px)', padding:'4px 8px', borderRadius:6, display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ fontSize:12, color:'var(--neon-primary)' }}>❤️</span>
                  <span style={{ fontSize:11, color:'var(--text-primary)' }}>{item.likes}</span>
                </div>
              </div>
              <div style={{ padding:16 }}>
                <h4 style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', margin:'0 0 8px' }}>{item.title}</h4>
                <p style={{ fontSize:12, color:'var(--text-secondary)', margin:0 }}>by {item.author}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign:'center', marginTop:48 }}>
          <button className="neon-button" style={{ padding:'14px 32px', fontSize:13 }} onClick={() => navigate('/previewer')}>
            View All Designs →
          </button>
        </div>
      </section>

      <div className="lp-divider" style={{ margin:'0 48px' }} />

      {/* About */}
      <section id="about" className="lp-about-grid responsive" style={{ position:'relative', zIndex:10, padding:'120px 48px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center' }}>
        <div>
          <p className="lp-section-label" style={{ marginBottom:16 }}>Who we are</p>
          <h2 style={{ fontSize:'clamp(28px,3.5vw,48px)', fontWeight:800, letterSpacing:'-0.025em', margin:'0 0 28px', lineHeight:1.15 }}>
            Built by the community,<br />for the community.
          </h2>
          <p style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.8, margin:'0 0 20px' }}>
            itzz industries is a fan-made collective focused on building tools and experiences for the ERLC community. Everything we make is free, member-focused, and built with care.
          </p>
          <p style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.8, margin:'0 0 40px' }}>
            We believe in quality over quantity — every tool we ship is designed to be genuinely useful, well-crafted, and always improving based on community feedback.
          </p>
          <button className="glass-card" style={{ padding:'12px 24px', fontSize:12, fontWeight:500 }}
            onClick={() => window.open('https://discord.gg/itzz','_blank')}>
            Join our Discord →
          </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {[
            { label:'Community First',  desc:'Every decision is made with the community in mind.' },
            { label:'Always Free',      desc:'All tools are and will remain completely free.' },
            { label:'Quality Focused',  desc:'We ship things when they\'re ready, not before.' },
            { label:'Open to Feedback', desc:'We build what the community actually needs.' },
          ].map((v,i) => (
            <div key={i} className="glass-card" style={{ padding:'24px' }}>
              <div style={{ width:28, height:28, borderRadius:8, background:'var(--bg-glass)', border:'1px solid var(--border-glass)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--neon-primary)' }} />
              </div>
              <p style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', margin:'0 0 8px' }}>{v.label}</p>
              <p style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.6, margin:0 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="lp-divider" style={{ margin:'0 48px' }} />

      {/* ── CTA ── */}
      <section style={{ position:'relative', zIndex:10, padding:'120px 48px', textAlign:'center' }}>
        <div style={{ maxWidth:560, margin:'0 auto' }}>
          <p className="lp-section-label" style={{ marginBottom:20 }}>Get started</p>
          <h2 style={{ fontSize:'clamp(28px,4vw,52px)', fontWeight:900, letterSpacing:'-0.03em', margin:'0 0 20px', lineHeight:1.1 }}>
            Ready to design?
          </h2>
          <p style={{ fontSize:15, color:'var(--text-secondary)', margin:'0 0 40px', lineHeight:1.7 }}>
            Log in with Discord and start building your perfect livery in seconds. Free for all verified itzz members.
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button className="neon-button" style={{ padding:'16px 36px', fontSize:14 }} onClick={() => navigate('/previewer')}>
              Open Livery Previewer →
            </button>
            <button className="glass-card" style={{ padding:'16px 28px', fontSize:14, fontWeight:500, color:'var(--text-primary)' }}
              onClick={() => window.open('https://discord.gg/itzz','_blank')}>
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
