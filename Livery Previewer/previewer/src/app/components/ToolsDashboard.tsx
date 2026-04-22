import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BASE = import.meta.env.BASE_URL;

interface Props {
  onDisclaimer: () => void;
}

function CarSpinner() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    let frameId: number;
    let renderer: any;
    let stopped = false;

    async function init() {
      const THREE = await import('three');
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');

      const w = el!.clientWidth;
      const h = el!.clientHeight;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setClearColor(0x000000, 0);
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.4;
      renderer.shadowMap.enabled = true;
      el!.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 1000);

      scene.add(new THREE.AmbientLight(0xffffff, 0.8));

      const spot = new THREE.SpotLight(0xd4ff5a, 120, 30, Math.PI / 5, 0.4, 1.5);
      spot.position.set(0, 8, 4);
      spot.target.position.set(0, 0, 0);
      spot.castShadow = true;
      scene.add(spot);
      scene.add(spot.target);

      const rim = new THREE.DirectionalLight(0x4466ff, 1.8);
      rim.position.set(-3, 2, -5);
      scene.add(rim);

      const under = new THREE.PointLight(0xaaff00, 4, 6);
      under.position.set(0, -1.2, 0);
      scene.add(under);

      const fill = new THREE.PointLight(0xffd080, 2.0, 10);
      fill.position.set(4, 1, 1);
      scene.add(fill);

      const loader = new GLTFLoader();
      let pivot: any = null;

      loader.load(
        'https://pub-13c1fc73579544bdb2eb07e28434bd74.r2.dev/Falcon%20Interceptor%20Utility%202024.glb',
        (gltf: any) => {
          const model = gltf.scene;

          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);

          const scale = 4 / maxDim;
          model.scale.setScalar(scale);

          const box2 = new THREE.Box3().setFromObject(model);
          const center2 = box2.getCenter(new THREE.Vector3());
          const size2 = box2.getSize(new THREE.Vector3());

          model.position.set(-center2.x, -box2.min.y, -center2.z);

          pivot = new THREE.Object3D();
          pivot.add(model);
          scene.add(pivot);

          const dist = size2.z * 1.1;
          const height = size2.y * 0.8;
          camera.position.set(-0.5, height, dist);
          camera.lookAt(-0.5, size2.y * 0.4, 0);

          model.traverse((child: any) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              child.material = new THREE.MeshBasicMaterial({
                color: '#c4ff0d',
                wireframe: true,
                transparent: true,
                opacity: 0.4,
              });
            }
          });
        },
        undefined,
        (err: any) => console.warn('Model load failed', err),
      );

      let angle = 0;
      function animate() {
        if (stopped) return;
        frameId = requestAnimationFrame(animate);
        angle += 0.003;
        if (pivot) pivot.rotation.y = angle;
        renderer.render(scene, camera);
      }
      animate();

      function onResize() {
        if (!el) return;
        const nw = el.clientWidth;
        const nh = el.clientHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      }
      window.addEventListener('resize', onResize);
    }

    init().catch(console.error);

    return () => {
      stopped = true;
      cancelAnimationFrame(frameId);
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%', background: 'transparent' }} />
  );
}

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

export default function ToolsDashboard({ onDisclaimer }: Props) {
  const [showCookies, setShowCookies] = useState(false);
  const navigate = useNavigate();

  const tools: Tool[] = [
    {
      id: 'battenburg',
      title: 'Battenburg Generator',
      description: 'Create custom battenburg patterns for emergency vehicles',
      icon: 'M4 4h16v16H4z M8 8h8v8H8z',
      route: '/tools/battenburg',
      color: '#ff6b6b'
    },
    {
      id: 'chevron',
      title: 'Chevron Generator',
      description: 'Design chevron patterns for vehicle rear markings',
      icon: 'M2 12l4-4 4 4-4 4zm8 0l4-4 4 4-4 4z',
      route: '/tools/chevron',
      color: '#4ecdc4'
    },
    {
      id: 'previewer',
      title: 'Livery Previewer',
      description: 'Preview and test your liveries on various vehicle models',
      icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
      route: '/previewer',
      color: '#c4ff0d'
    }
  ];

  const handleToolClick = (tool: Tool) => {
    navigate(tool.route);
  };

  return (
    <div className="relative flex h-screen w-full bg-[#080808] text-white overflow-hidden">

      {/* Background layer */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <img
          src={`${BASE}Vector_(7).svg`}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '92%',
            height: 'auto',
            opacity: 0.045,
            filter: 'brightness(0) invert(1)',
            pointerEvents: 'none',
          }}
        />
        <div className="absolute -top-32 -right-32 rounded-full" style={{ width: 700, height: 700, opacity: 0.2, background: 'radial-gradient(circle, #c4ff0d 0%, transparent 65%)' }} />
        <div className="absolute -bottom-24 -left-24 rounded-full" style={{ width: 500, height: 500, opacity: 0.12, background: 'radial-gradient(circle, #88ff00 0%, transparent 65%)' }} />
        <div className="absolute rounded-full" style={{ width: 620, height: 620, top: '50%', left: '58%', transform: 'translate(-50%,-50%)', opacity: 0.09, background: 'radial-gradient(circle, #c4ff0d 0%, transparent 60%)' }} />
        <div className="absolute rounded-full" style={{ width: 280, height: 280, top: '33%', left: '22%', opacity: 0.07, background: 'radial-gradient(circle, #aaff00 0%, transparent 70%)' }} />
      </div>

      {/* Navbar */}
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
            onClick={() => window.open('https://discord.gg/itzz', '_blank')}
            className="text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-lg transition-all"
            style={{
              color: '#c4ff0d',
              background: 'rgba(196,255,13,0.07)',
              border: '1px solid rgba(196,255,13,0.22)',
            }}
          >
            Contact Us
          </button>
          <button
            onClick={onDisclaimer}
            className="text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-lg transition-all text-zinc-400 hover:text-white"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            Legal
          </button>
          <button
            onClick={() => setShowCookies(true)}
            className="text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-lg transition-all text-zinc-400 hover:text-white"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            Cookie
          </button>
        </div>
      </nav>

      {/* Cookie modal */}
      {showCookies && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onMouseDown={e => { if (e.target === e.currentTarget) setShowCookies(false); }}
        >
          <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-300">Cookie & Data Policy</p>
              <button onClick={() => setShowCookies(false)} className="text-zinc-500 hover:text-white">X</button>
            </div>
            <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-zinc-400 leading-relaxed">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">What We Collect</p>
                <p>When you log in with Discord, our bot collects the servers (guilds) you are currently a member of, along with your Discord user ID and username. This is used solely to verify your membership in the itzz community.</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Server Access</p>
                <p>As part of the OAuth2 login process, our bot has the technical capability to add you to our Discord server. This is used only to grant verified members access and will never be used without your knowledge.</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">What We Don't Collect</p>
                <p>We do not collect passwords, email addresses, payment information, or any data unrelated to Discord membership verification.</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">How We Use Your Data</p>
                <p>Your data is used only to verify membership and grant access to the Livery Previewer. We do not sell, share, or distribute your data to any third parties.</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Data Retention</p>
                <p>Your data is not stored permanently. We only use it at the time of login to verify access.</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Contact</p>
                <p>Questions? Reach us on Discord at <span className="text-[#c4ff0d]">discord.gg/itzz</span>.</p>
              </div>
            </div>
            <div className="px-5 pb-4">
              <button
                onClick={() => setShowCookies(false)}
                className="w-full text-xs font-bold bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black py-2.5 rounded-xl transition-all"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left: tools dashboard content */}
      <div className="relative z-10 flex flex-col justify-center px-16 w-[44%] gap-7">

        <img
          src={`${BASE}Group_15.svg`}
          alt="Livery Previewer"
          style={{
            width: '540px',
            maxWidth: '100%',
            mixBlendMode: 'lighten',
            display: 'block',
          }}
        />

        <p
          className="text-[13px] text-zinc-400 leading-relaxed max-w-xs pl-4"
          style={{ borderLeft: '2px solid rgba(196,255,13,0.4)' }}
        >
          Professional tools for ERLC livery design and development.{' '}
          <span className="text-zinc-600">Built exclusively for itzz community.</span>
        </p>

        {/* Tools Grid */}
        <div className="space-y-4">
          <h2 className="text-[18px] font-bold text-white tracking-tight">Available Tools</h2>
          <div className="grid gap-4">
            {tools.map((tool, index) => (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool)}
                className="group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(8px)',
                }}
                onMouseEnter={(e) => {
                  const button = e.currentTarget;
                  button.style.background = 'rgba(255,255,255,0.06)';
                  button.style.borderColor = tool.color + '40';
                  button.style.boxShadow = `0 8px 32px ${tool.color}20, inset 0 1px 0 rgba(255,255,255,0.1)`;
                }}
                onMouseLeave={(e) => {
                  const button = e.currentTarget;
                  button.style.background = 'rgba(255,255,255,0.03)';
                  button.style.borderColor = 'rgba(255,255,255,0.08)';
                  button.style.boxShadow = 'none';
                }}
              >
                {/* Sliding overlay */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${tool.color}20 50%, transparent 100%)`,
                    transform: 'translateX(-100%)',
                    transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateX(100%)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateX(-100%)';
                  }}
                />
                
                <div className="relative z-10 flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: `${tool.color}20`, border: `1px solid ${tool.color}40` }}
                  >
                    <svg 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke={tool.color} 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d={tool.icon} />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[14px] font-semibold text-white mb-1">{tool.title}</h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{tool.description}</p>
                  </div>
                  <div className="text-zinc-500 group-hover:text-white transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-px w-4 bg-white/10" />
          <p className="text-[10px] text-zinc-600 tracking-[0.2em] uppercase">
            Professional tools for livery designers
          </p>
        </div>
      </div>

      {/* Right: spinning car */}
      <div
        className="absolute right-0 top-0 bottom-0 w-[62%] z-10"
        style={{ background: 'transparent' }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
          style={{
            height: '30%',
            background: 'linear-gradient(to top, #080808 0%, transparent 100%)',
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
          style={{
            height: '15%',
            background: 'linear-gradient(to bottom, #080808 0%, transparent 100%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: 'radial-gradient(ellipse 55% 55% at 58% 52%, rgba(196,255,13,0.07) 0%, transparent 70%)',
          }}
        />
        <CarSpinner />
      </div>

      {/* Footer */}
      <div className="absolute bottom-5 left-8 z-20 pointer-events-none flex items-center gap-2">
        <div className="h-px w-4 bg-[#c4ff0d]/30" />
        <p className="text-[10px] text-zinc-600 tracking-[0.18em] uppercase">
          Developed by itzz industries
        </p>
        <span className="text-zinc-700 text-[10px]">·</span>
        <p className="text-[10px] text-zinc-700 tracking-[0.12em] uppercase">
          sonar & itzz_link
        </p>
      </div>

    </div>
  );
}
