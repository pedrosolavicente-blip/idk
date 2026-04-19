import { useEffect, useRef } from 'react';

interface Props {
  onLogin: () => void;
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
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.4;
      renderer.shadowMap.enabled = true;
      el!.appendChild(renderer.domElement);

      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 200);
      camera.position.set(0, 0.8, 3.6);
      camera.lookAt(0, 0, 0);

      scene.add(new THREE.AmbientLight(0x0a1800, 1.0));

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

      const fill = new THREE.PointLight(0xffd080, 1.5, 10);
      fill.position.set(4, 1, 1);
      scene.add(fill);

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 1, metalness: 0 }),
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.82;
      ground.receiveShadow = true;
      scene.add(ground);

      const loader = new GLTFLoader();
      let model: any = null;

      loader.load(
        '/api/models/Falcon%20Interceptor%20Utility%202024.glb',
        (gltf: any) => {
          model = gltf.scene;
          const box    = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size   = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          model.position.set(-center.x, -center.y - size.y * 0.08, -center.z);
          model.scale.setScalar(2.6 / maxDim);
          model.traverse((child: any) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              mats.forEach((m: any) => {
                if (m.metalness !== undefined) m.metalness = Math.max(m.metalness, 0.6);
                if (m.roughness !== undefined) m.roughness = Math.min(m.roughness, 0.38);
              });
            }
          });
          scene.add(model);
        },
        undefined,
        (err: any) => console.warn('Model load failed', err),
      );

      let angle = 0;
      function animate() {
        if (stopped) return;
        frameId = requestAnimationFrame(animate);
        angle += 0.003;
        if (model) model.rotation.y = angle;
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

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}

export default function LoginPage({ onLogin, onDisclaimer }: Props) {
  return (
    <div className="relative flex h-screen bg-[#080808] text-white overflow-hidden">

      {/* Green ambient glows */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-32 -right-32 rounded-full opacity-25"
          style={{ width: 700, height: 700, background: 'radial-gradient(circle, #c4ff0d 0%, transparent 65%)' }} />
        <div className="absolute -bottom-24 -left-24 rounded-full opacity-15"
          style={{ width: 500, height: 500, background: 'radial-gradient(circle, #88ff00 0%, transparent 65%)' }} />
        <div className="absolute top-1/2 left-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.12]"
          style={{ width: 620, height: 620, background: 'radial-gradient(circle, #c4ff0d 0%, transparent 60%)' }} />
        <div className="absolute top-1/3 left-1/4 rounded-full opacity-10"
          style={{ width: 300, height: 300, background: 'radial-gradient(circle, #aaff00 0%, transparent 70%)' }} />
        <div className="absolute bottom-16 right-1/4 rounded-full opacity-[0.08]"
          style={{ width: 250, height: 250, background: 'radial-gradient(circle, #c4ff0d 0%, transparent 70%)' }} />
        <div className="absolute top-16 left-1/3 rounded-full opacity-[0.07]"
          style={{ width: 180, height: 180, background: 'radial-gradient(circle, #ccff33 0%, transparent 70%)' }} />
      </div>

      {/* Top nav */}
      <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-5">
        {/* Logo only — no "LIVERY PREVIEWER" text */}
        <img src="/itzz.svg" alt="itzz" className="h-8 w-auto drop-shadow-[0_0_12px_rgba(196,255,13,0.6)]" />

        <div className="flex items-center gap-3">
          
            <button
  onClick={() => window.open('https://discord.gg/itzz', '_blank')}
  className="text-xs font-semibold tracking-wider uppercase text-zinc-400 hover:text-white transition-colors px-4 py-2"
>
  Contact Us
</button>
          <button
            onClick={onDisclaimer}
            className="border border-white/10 hover:border-white/30 text-zinc-400 hover:text-white text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-xl transition-all"
          >
            Legal
          </button>
          <button
            onClick={onDisclaimer}
            className="border border-white/10 hover:border-white/30 text-zinc-400 hover:text-white text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-xl transition-all"
          >
            Cookie
          </button>
        </div>
      </nav>

      {/* Left: login content */}
      <div className="relative z-10 flex flex-col justify-center px-16 w-[44%] gap-8">

        {/* Label */}
        <div className="flex items-center gap-2">
          <div className="h-px w-8 bg-[#c4ff0d]" />
          <span
            className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#c4ff0d]"
            style={{ fontFamily: '"Georgia", "Times New Roman", serif', letterSpacing: '0.35em' }}
          >
            ITZZ Industries
          </span>
        </div>

        {/* Heading — SVG replaces the old h1 */}
        <div>
          <img
            src="/Group_15.svg"
            alt="Livery Previewer"
            className="w-full max-w-sm drop-shadow-[0_0_20px_rgba(196,255,13,0.3)]"
          />
          <p className="text-sm text-zinc-500 leading-relaxed max-w-xs mt-4">
            Design, preview, and showcase your ERLC liveries. Built exclusively for itzz community members.
          </p>
        </div>

        {/* Stats — card style */}
        <div className="flex items-stretch gap-4">
          <div className="flex flex-col justify-center bg-white/5 border border-white/10 rounded-xl px-5 py-3 min-w-[80px]">
            <p className="text-2xl font-black text-white leading-none">20+</p>
            <p className="text-[9px] uppercase tracking-widest text-zinc-500 mt-1">Vehicle Models</p>
          </div>
          <div className="flex flex-col justify-center items-center bg-white/5 border border-white/10 rounded-xl px-5 py-3 min-w-[80px]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mb-1">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <p className="text-[9px] uppercase tracking-widest text-zinc-500">Members Only</p>
          </div>
          <div className="flex flex-col justify-center bg-[#c4ff0d]/10 border border-[#c4ff0d]/20 rounded-xl px-5 py-3 min-w-[80px]">
            <p className="text-2xl font-black text-[#c4ff0d] leading-none">100%</p>
            <p className="text-[9px] uppercase tracking-widest text-zinc-500 mt-1">Free</p>
          </div>
        </div>

        {/* CTA — only Login with Discord */}
        <div>
          <button
            onClick={onLogin}
            className="flex items-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold tracking-widest uppercase px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-[#5865F2]/30 hover:shadow-[#5865F2]/50 hover:scale-[1.02]"
          >
            <svg width="20" height="15" viewBox="0 0 71 55" fill="currentColor" className="shrink-0">
              <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.401329 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/>
            </svg>
            Login with Discord
          </button>
        </div>

        {/* Footer note */}
        <p className="text-[11px] text-zinc-500 tracking-wider">
          — Access restricted to verified itzz Discord members
        </p>
      </div>

      {/* Right: spinning car */}
      <div className="absolute right-0 top-0 bottom-0 w-[60%] z-10">
        <div className="absolute inset-y-0 left-0 w-56 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #080808, transparent)' }} />
        <div className="absolute inset-0 pointer-events-none z-0"
          style={{ background: 'radial-gradient(ellipse 40% 70% at 50% -5%, rgba(196,255,13,0.20) 0%, transparent 65%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-0"
          style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 100%, rgba(196,255,13,0.14) 0%, transparent 80%)' }} />
        <CarSpinner />
      </div>

      {/* Footer */}
      <p className="absolute bottom-4 left-8 text-[11px] text-zinc-400 tracking-wider z-20 pointer-events-none">
        developed by itzz industries | sonar &amp; itzz_link
      </p>
    </div>
  );
}
