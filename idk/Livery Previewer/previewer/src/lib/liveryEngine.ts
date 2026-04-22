import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type ShowcaseSide = 'right' | 'left' | 'front' | 'back'
  | 'front-right' | 'front-left' | 'back-right' | 'back-left'
  | 'top' | 'top-front' | 'top-back' | 'top-left' | 'top-right';

export interface SceneSettings {
  brightness:    number;
  skyRotX:       number; // skybox X tilt  in degrees
  skyRotY:       number; // skybox Y spin   in degrees
  skyRotZ:       number; // skybox Z roll   in degrees
  background:    'default' | 'sunset' | 'night' | 'custom';
  bgCustomUrl:   string;
  bgCustomIsEXR: boolean;
}

export interface LiveryViewer {
  loadLivery: (
    glbUrl: string,
    color: string,
    textures: Record<string, string>,
    onProgress?: (message: string, progress: number) => void
  ) => Promise<void>;
  updateColor: (color: string) => void;
  updateScene: (settings: SceneSettings) => void;
  playELS: (pattern: any) => void;
  stopELS: () => void;
  captureThumbnail: () => string;
  captureShowcase: (side: ShowcaseSide) => string;
  dispose: () => void;
}

export function initLiveryViewer(container: HTMLElement, options?: { zoomFactor?: number }): LiveryViewer {
  const _zoomFactor = options?.zoomFactor ?? 2;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    10000
  );
  camera.position.set(10, 5, 10);

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 0, 0);
  controls.update();

  let needsRender = true;
  function markDirty() { needsRender = true; }
  controls.addEventListener('change', markDirty);

  function animate() {
    requestAnimationFrame(animate);
    if (controls.update()) needsRender = true;
    if (needsRender) {
      renderer.render(scene, camera);
      needsRender = false;
    }
  }
  animate();

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  // Room environment as fallback for PBR reflections while skybox loads
  function applyRoomEnv() {
    const roomEnv = new RoomEnvironment();
    scene.environment = pmrem.fromScene(roomEnv).texture;
    roomEnv.dispose();
    markDirty();
  }
  applyRoomEnv();

  // EXR cache — stores both the raw equirectangular texture (for background display)
  // and the PMREM-processed cube-UV texture (for PBR environment reflections).
  // The raw texture must NOT be disposed — Three.js needs it to render the skybox.
  interface EXREntry { bg: THREE.Texture; env: THREE.Texture; }
  const exrCache = new Map<string, EXREntry>();
  const exrLoader = new EXRLoader();

  function loadEXR(path: string): Promise<EXREntry> {
    if (exrCache.has(path)) return Promise.resolve(exrCache.get(path)!);
    return new Promise((resolve, reject) => {
      exrLoader.load(
        path,
        (exrTexture) => {
          // Keep raw texture for background (equirectangular projection, rotates with camera)
          exrTexture.mapping = THREE.EquirectangularReflectionMapping;
          // Generate PMREM version for accurate PBR reflections on paint
          const env   = pmrem.fromEquirectangular(exrTexture).texture;
          const entry: EXREntry = { bg: exrTexture, env };
          exrCache.set(path, entry);
          resolve(entry);
        },
        undefined,
        reject,
      );
    });
  }

  const handleResize = () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    markDirty();
  };
  window.addEventListener('resize', handleResize);

  const probeTarget = new THREE.WebGLCubeRenderTarget(256, {
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
  });
  const cubeCamera = new THREE.CubeCamera(0.5, 2000, probeTarget);
  scene.add(cubeCamera);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 2, 1);
  scene.add(directionalLight);

  const bgTextureLoader = new THREE.TextureLoader();

  function updateProbe(model: THREE.Group, paintY: number) {
    model.visible = false;
    cubeCamera.position.set(0, paintY, 0);
    cubeCamera.update(renderer, scene);
    model.visible = true;

    model.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mats = Array.isArray((child as THREE.Mesh).material)
        ? (child as THREE.Mesh).material as THREE.Material[]
        : [(child as THREE.Mesh).material as THREE.Material];
      mats.forEach((mat) => {
        if (!(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) return;
        if (!isPaint(mat.name)) return;
        const s = mat as THREE.MeshStandardMaterial;
        s.envMap          = probeTarget.texture;
        s.envMapIntensity = 1.8;
        s.needsUpdate     = true;
      });
    });
    markDirty();
  }

  const loader    = new GLTFLoader();
  const texLoader = new THREE.TextureLoader();
  let currentModel: THREE.Group | null = null;
  let currentModelSize = new THREE.Vector3();
  let currentLoadId = 0;
  let elsInterval: number | null = null;
  let elsLights: THREE.PointLight[] = [];
  let overlayMeshes: THREE.Mesh[] = [];

  const PAINT_PREFIXES = ['Right', 'Left', 'Back', 'Top', 'Front', 'NoDecal'];
  function isPaint(name: string) { return PAINT_PREFIXES.some(p => name.startsWith(p)); }

  function removeOverlays() {
    overlayMeshes.forEach(m => {
      scene.remove(m);
      (m.material as THREE.Material).dispose();
      m.geometry.dispose();
    });
    overlayMeshes = [];
  }

  async function loadLivery(
    glbUrl: string,
    color: string,
    textures: Record<string, string>,
    onProgress?: (message: string, progress: number) => void
  ): Promise<void> {
    if (currentModel) { scene.remove(currentModel); currentModel = null; markDirty(); }
    removeOverlays();
    const loadId = ++currentLoadId;

    return new Promise((resolve, reject) => {
      onProgress?.('Loading model...', 0);
      loader.load(
        glbUrl,
        async (gltf) => {
          if (loadId !== currentLoadId) { resolve(); return; }
          currentModel = gltf.scene;

          currentModel.traverse((child) => {
            if (!(child as THREE.Mesh).isMesh) return;
            const mesh = child as THREE.Mesh;
            if (!mesh.material) return;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((mat) => {
              if (!(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) return;
              const s = mat as THREE.MeshStandardMaterial;
              s.side = THREE.DoubleSide;
              s.transparent = false;
              s.opacity = 1;
              if (isPaint(mat.name)) {
                s.color.set(color);
                s.metalness = 0.4;
                s.roughness = 0.35;
                s.envMapIntensity = 1.0;
              }
              s.needsUpdate = true;
            });
          });

          const box    = new THREE.Box3().setFromObject(currentModel);
          const center = box.getCenter(new THREE.Vector3());
          currentModel.position.sub(center);
          currentModel.position.y = -box.min.y;

          scene.add(currentModel);

          if (Object.keys(textures).length > 0) {
            await Promise.all(Object.entries(textures).map(([panel, url]) =>
              new Promise<void>((res) => {
                texLoader.load(url, (tex) => {
                  tex.flipY           = false;
                  tex.colorSpace      = THREE.SRGBColorSpace;
                  tex.minFilter       = THREE.LinearFilter;
                  tex.magFilter       = THREE.LinearFilter;
                  tex.generateMipmaps = false;
                  tex.anisotropy      = renderer.capabilities.getMaxAnisotropy();
                  tex.needsUpdate     = true;

                  const prefix = panel;

                  currentModel?.traverse((child) => {
                    if (!(child as THREE.Mesh).isMesh) return;
                    const mesh = child as THREE.Mesh;
                    const mats = Array.isArray(mesh.material)
                      ? mesh.material as THREE.Material[]
                      : [mesh.material as THREE.Material];

                    mats.forEach((mat) => {
                      if (!mat.name.startsWith(prefix)) return;

                      const overlayGeo = mesh.geometry.clone();
                      const overlayMat = new THREE.MeshStandardMaterial({
                        map: tex,
                        transparent: true,
                        alphaTest: 0.01,
                        depthWrite: false,
                        depthTest: true,
                        metalness: 0.0,
                        roughness: 1.0,
                        envMapIntensity: 0.0,
                        side: THREE.DoubleSide,
                        polygonOffset: true,
                        polygonOffsetFactor: -1,
                        polygonOffsetUnits: -1,
                      });

                      const overlayMesh = new THREE.Mesh(overlayGeo, overlayMat);
                      overlayMesh.renderOrder = 1;
                      overlayMesh.position.copy(mesh.getWorldPosition(new THREE.Vector3()));
                      overlayMesh.quaternion.copy(mesh.getWorldQuaternion(new THREE.Quaternion()));
                      overlayMesh.scale.copy(mesh.getWorldScale(new THREE.Vector3()));

                      scene.add(overlayMesh);
                      overlayMeshes.push(overlayMesh);
                    });
                  });

                  res();
                }, undefined, () => res());
              })
            ));
          }

          const size = box.getSize(new THREE.Vector3());
          currentModelSize.copy(size);
          const dist = Math.max(size.x, size.y, size.z) * _zoomFactor;
          camera.position.set(dist, dist * 0.5, dist);
          camera.lookAt(0, size.y / 2, 0);
          controls.target.set(0, size.y / 2, 0);
          controls.update();

          updateProbe(currentModel, size.y / 2);
          markDirty();
          onProgress?.('Model loaded', 100);
          resolve();
        },
        (p) => onProgress?.('Loading...', p.total > 0 ? (p.loaded / p.total) * 100 : 0),
        () => { if (loadId === currentLoadId) reject(new Error('Failed to load model')); else resolve(); }
      );
    });
  }

  function playELS(_pattern: any): void {}
  function stopELS(): void {
    if (elsInterval !== null) { clearInterval(elsInterval); elsInterval = null; }
    elsLights.forEach(l => { scene.remove(l); l.dispose(); });
    elsLights = [];
  }

  function updateColor(color: string): void {
    if (!currentModel) return;
    currentModel.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mats = Array.isArray((child as THREE.Mesh).material)
        ? (child as THREE.Mesh).material as THREE.Material[]
        : [(child as THREE.Mesh).material as THREE.Material];
      mats.forEach((mat) => {
        if (!(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) return;
        if (!isPaint(mat.name)) return;
        const s = mat as THREE.MeshStandardMaterial;
        s.color.set(color); s.metalness = 0.4; s.roughness = 0.35; s.needsUpdate = true;
      });
    });
    markDirty();
  }

  // Track the currently active background key so we only reload when it actually changes.
  // Changing brightness / light direction must NOT re-trigger skybox loading.
  let activeBgKey = '';

  function applyEXRBackground(path: string, fallbackColor: number) {
    loadEXR(path).then(({ bg, env }) => {
      scene.background  = bg;   // raw equirectangular — displays & rotates correctly
      scene.environment = env;  // PMREM — used for paint reflections
      markDirty();
    }).catch(() => {
      scene.background = new THREE.Color(fallbackColor);
      markDirty();
    });
  }

  function updateScene(settings: SceneSettings): void {
    renderer.toneMappingExposure = settings.brightness;

    // Sky rotation — all three axes, converted from degrees to radians
    const toRad = (d: number) => (d * Math.PI) / 180;
    scene.backgroundRotation.x  = toRad(settings.skyRotX);
    scene.backgroundRotation.y  = toRad(settings.skyRotY);
    scene.backgroundRotation.z  = toRad(settings.skyRotZ);
    scene.environmentRotation.x = toRad(settings.skyRotX);
    scene.environmentRotation.y = toRad(settings.skyRotY);
    scene.environmentRotation.z = toRad(settings.skyRotZ);
    markDirty();

    // Compute a key for the current background selection
    const bgKey = settings.background === 'custom'
      ? `custom:${settings.bgCustomUrl}`
      : settings.background;

    // Skip background reload if nothing changed
    if (bgKey === activeBgKey) return;
    activeBgKey = bgKey;

    switch (settings.background) {
      case 'sunset':
        applyEXRBackground('/noon.exr', 0xff7043);
        break;
      case 'night':
        applyEXRBackground('/night.exr', 0x0a0a1a);
        break;
      case 'custom':
        if (settings.bgCustomUrl) {
          // Use EXR loader for .exr files, regular texture loader for everything else
          if (settings.bgCustomUrl.toLowerCase().endsWith('.exr') || settings.bgCustomIsEXR) {
            loadEXR(settings.bgCustomUrl).then(({ bg, env }) => {
              scene.background  = bg;
              scene.environment = env;
              markDirty();
            }).catch(() => markDirty());
          } else {
            bgTextureLoader.load(settings.bgCustomUrl, (tex) => {
              tex.colorSpace   = THREE.SRGBColorSpace;
              tex.mapping      = THREE.EquirectangularReflectionMapping;
              scene.background = tex;
              markDirty();
            });
          }
        }
        break;
      case 'default':
      default:
        applyEXRBackground('/day.exr', 0x87CEEB);
        break;
    }
  }

  function captureThumbnail(): string {
    const vw = container.clientWidth, vh = container.clientHeight;
    renderer.setSize(3840, 2160, false);
    camera.aspect = 3840 / 2160;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL('image/png', 1.0);
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh;
    camera.updateProjectionMatrix();
    markDirty();
    return dataUrl;
  }

  function captureShowcase(side: ShowcaseSide): string {
    if (!currentModel) return '';

    const W = 4096, H = 2048;
    const cx = 0, cy = currentModelSize.y / 2, cz = 0;
    const longestSide = Math.max(currentModelSize.x, currentModelSize.z);
    const fov  = 20;
    const dist = (longestSide / 2) / Math.tan((fov / 2) * (Math.PI / 180)) * 1.15;
    const d45  = dist / Math.SQRT2;                    // diagonal component
    const lift = currentModelSize.y * 0.45;            // slight elevation for corners

    const hi = dist * 0.75; // horizontal component for high-angle shots
    const up = dist * 0.9;  // vertical component for high-angle shots

    const offsets: Record<ShowcaseSide, THREE.Vector3> = {
      right:       new THREE.Vector3( dist, 0,     0),
      left:        new THREE.Vector3(-dist, 0,     0),
      front:       new THREE.Vector3(0,     0,     dist),
      back:        new THREE.Vector3(0,     0,    -dist),
      'front-right': new THREE.Vector3( d45,  lift,  d45),
      'front-left':  new THREE.Vector3(-d45,  lift,  d45),
      'back-right':  new THREE.Vector3( d45,  lift, -d45),
      'back-left':   new THREE.Vector3(-d45,  lift, -d45),
      top:           new THREE.Vector3(0,     dist,  0),
      'top-front':   new THREE.Vector3(0,     up,    hi),
      'top-back':    new THREE.Vector3(0,     up,   -hi),
      'top-left':    new THREE.Vector3(-hi,   up,    0),
      'top-right':   new THREE.Vector3( hi,   up,    0),
    };

    const isTop = side === 'top';
    const showcaseCam = new THREE.PerspectiveCamera(isTop ? 30 : fov, W / H, 0.1, 10000);
    if (isTop) showcaseCam.up.set(0, 0, -1); // prevent gimbal flip looking straight down
    const offset = offsets[side];
    showcaseCam.position.set(cx + offset.x, cy + offset.y, cz + offset.z);
    showcaseCam.lookAt(cx, cy, cz);

    const savedBg = scene.background;
    scene.background = null;
    renderer.setClearColor(0x000000, 0);

    renderer.setSize(W, H, false);
    renderer.render(scene, showcaseCam);
    const dataUrl = renderer.domElement.toDataURL('image/png', 1.0);

    scene.background = savedBg;
    renderer.setClearColor(0x000000, 1);
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    markDirty();

    return dataUrl;
  }

  function dispose(): void {
    window.removeEventListener('resize', handleResize);
    stopELS();
    removeOverlays();
    if (currentModel) scene.remove(currentModel);
    probeTarget.dispose();
    renderer.dispose();
    controls.dispose();
    if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
  }

  return { loadLivery, updateColor, updateScene, playELS, stopELS, captureThumbnail, captureShowcase, dispose };
}
