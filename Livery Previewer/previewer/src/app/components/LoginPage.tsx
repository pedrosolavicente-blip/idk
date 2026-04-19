// ─── Drop-in replacement for the login screen inside App.tsx ─────────────────
// Replace the `if (authState === 'login')` block with this component.
// Also add the import at the top: import LoginPage from './LoginPage';
// Then render: <LoginPage onLogin={redirectToDiscordLogin} onDisclaimer={() => setShowDisclaimer(true)} />

import { useEffect, useRef } from 'react';
import itzzLogo from '../../imports/itzz-logo.png';

interface Props {
  onLogin: () => void;
  onDisclaimer: () => void;
}

// Minimal Three.js spinner — loads a GLB from the worker proxy and auto-rotates it
function useCarSpinner(canvasRef: React.RefObject<HTMLCanvasElement>) {
  useEffect(() => {
    let running = true;
    let animId: number;

    async function init() {
      const THREE = (window as any).THREE;
      if (!THREE || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setSize(w, h, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 200);
      camera.position.set(0, 1.2, 6);
      camera.lookAt(0, 0.3, 0);

      // Lighting
      const ambient = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambient);
      const key = new THREE.DirectionalLight(0xc4ff0d, 1.8);
      key.position.set(3, 5, 4);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0x6688cc, 0.8);
      fill.position.set(-4, 2, -3);
      scene.add(fill);
      const rim = new THREE.DirectionalLight(0xffffff, 0.5);
      rim.position.set(0, -2, -5);
      scene.add(rim);

      // Load GLB via the worker proxy
      const { GLTFLoader } = (window as any).GLTFLoader
        ? { GLTFLoader: (window as any).GLTFLoader }
        : await import('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js' as any);

      const loader = new (window as any).GLTFLoader();
      // Use a police cruiser model key from the R2 bucket via the worker proxy
      loader.load(
        '/api/models/LSPD_Cruiser.glb',
        (gltf: any) => {
          const model = gltf.scene;
          // Center and scale
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          model.position.sub(center);
          model.scale.setScalar(3 / maxDim);
          scene.add(model);

          // Make materials slightly reflective
          model.traverse((child: any) => {
            if (child.isMesh && child.material) {
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              mats.forEach((m: any) => {
                if (m.metalness !== undefined) m.metalness = Math.max(m.metalness, 0.3);
                if (m.roughness !== undefined) m.roughness = Math.min(m.roughness, 0.6);
              });
            }
          });
        },
        undefined,
        () => {
          // Fallback: show a stylised placeholder box if model fails
          const geo = new THREE.BoxGeometry(2, 0.6, 4);
          const mat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.3 });
          scene.add(new THREE.Mesh(geo, mat));
        },
      );

      let t = 0;
      function animate() {
        if (!running) return;
        animId = requestAnimationFrame(animate);
        t += 0.005;
        scene.rotation.y = t;
        renderer.render(scene, camera);
      }
      animate();
    }

    init();
    return () => {
      running = false;
      cancelAnimationFrame(animId);
    };
  }, []);
}

export default function LoginPage({ onLogin, onDisclaimer }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useCarSpinner(canvasRef as React.RefObject<HTMLCanvasElement>);

  return (
    <div className="relative flex h-screen bg-[#080808] text-white overflow-hidden font-sans select-none">

      {/* ── Subtle grid texture ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#c4ff0d 1px,transparent 1px),linear-gradient(90deg,#c4ff0d 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── Accent glow (top-right) ── */}
      <div
        className="pointer-events-none absolute -top-32 -right-32 z-0 rounded-full opacity-20"
        style={{ width: 600, height: 600, background: 'radial-gradient(circle, #c4ff0d 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 z-0 rounded-full opacity-10"
        style={{ width: 400, height: 400, background: 'radial-gradient(circle, #c4ff0d 0%, transparent 70%)' }}
      />

      {/* ── Top nav ── */}
      <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-5">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src={itzzLogo} alt="itzz" className="h-8 w-auto drop-shadow-[0_0_10px_rgba(196,255,13,0.5)]" />
          <span className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-400">Livery Previewer</span>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-6">
          <a
            href="https://discord.gg/itzz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold tracking-wider uppercase text-zinc-400 hover:text-white transition-colors"
          >
            Contact Us
          </a>
          <button
            onClick={onDisclaimer}
            className="text-xs font-semibold tracking-wider uppercase text-zinc-400 hover:text-white transition-colors"
          >
            Legal
          </button>
          <button
            onClick={onDisclaimer}
            className="text-xs font-semibold tracking-wider uppercase text-zinc-400 hover:text-white transition-colors"
          >
            Cookie
          </button>
        </div>
      </nav>

      {/* ── Left content ── */}
      <div className="relative z-10 flex flex-col justify-center px-16 w-1/2 gap-8">
        {/* Tag */}
        <div className="flex items-center gap-2">
          <div className="h-px w-8 bg-[#c4ff0d]" />
          <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#c4ff0d]">ITZZ Industries</span>
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <h1 className="text-6xl font-black tracking-tight leading-none uppercase text-white">
            Livery<br />
            <span className="text-[#c4ff0d]">Previewer</span>
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-xs mt-4">
            Design, preview, and showcase your ERLC liveries. Built exclusively for itzz community members.
          </p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-8">
          {[
            { label: 'Vehicle Models', value: '20+' },
            { label: 'Members Only', value: '✦' },
            { label: 'Free', value: '100%' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xl font-black text-white">{value}</p>
              <p className="text-[10px] uppercase tracking-widest text-zinc-600 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={onLogin}
            className="flex items-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold tracking-widest uppercase px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-[#5865F2]/30 hover:shadow-[#5865F2]/50 hover:scale-[1.02]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            Login with Discord
          </button>

          <button
            onClick={onDisclaimer}
            className="flex items-center gap-2 border border-white/10 hover:border-white/30 text-zinc-400 hover:text-white text-xs font-bold tracking-widest uppercase px-6 py-3.5 rounded-xl transition-all"
          >
            Disclaimer
          </button>
        </div>

        {/* Members only note */}
        <p className="text-[10px] text-zinc-700 tracking-wider">
          — Access restricted to verified itzz Discord members
        </p>
      </div>

      {/* ── Right: 3-D car canvas ── */}
      <div className="absolute right-0 top-0 bottom-0 w-[55%] z-10 flex items-center justify-center">
        {/* Glow behind canvas */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 60% at 60% 50%, rgba(196,255,13,0.04) 0%, transparent 70%)' }}
        />
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: 'block' }}
        />
        {/* Fade left edge into bg */}
        <div
          className="absolute inset-y-0 left-0 w-32 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #080808, transparent)' }}
        />
      </div>

      {/* ── Three.js loader ── */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (!window.THREE) {
              var s1 = document.createElement('script');
              s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
              s1.onload = function() {
                var s2 = document.createElement('script');
                s2.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
                document.head.appendChild(s2);
              };
              document.head.appendChild(s1);
            }
          `,
        }}
      />

      {/* ── Footer credits ── */}
      <p className="absolute bottom-4 left-8 text-[10px] text-zinc-700 tracking-wider z-20 pointer-events-none">
        developed by itzz industries | sonar & itzz_link
      </p>
    </div>
  );
}
