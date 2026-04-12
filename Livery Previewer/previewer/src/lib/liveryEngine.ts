import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type ShowcaseSide = 'right' | 'left' | 'front' | 'back';

export interface LiveryViewer {
  loadLivery: (
    glbUrl: string,
    color: string,
    textures: Record<string, string>,
    onProgress?: (message: string, progress: number) => void
  ) => Promise<void>;
  updateColor: (color: string) => void;
  playELS: (pattern: any) => void;
  stopELS: () => void;
  captureThumbnail: () => string;
  captureShowcase: (side: ShowcaseSide) => string;
  dispose: () => void;
}


export function initLiveryViewer(container: HTMLElement): LiveryViewer {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

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

  function applyRoomEnv() {
    const roomEnv = new RoomEnvironment();
    scene.environment = pmrem.fromScene(roomEnv).texture;
    roomEnv.dispose();
    markDirty();
  }
  applyRoomEnv();

  new EXRLoader().load(
    '/skybox.exr',
    (exrTexture) => {
      const envMap = pmrem.fromEquirectangular(exrTexture).texture;
      scene.background  = envMap;
      scene.environment = envMap;
      exrTexture.dispose();
      markDirty();
    },
    undefined,
    () => {
      scene.background = new THREE.Color(0x87CEEB);
      markDirty();
    }
  );

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
        s.envMap           = probeTarget.texture;
        s.envMapIntensity  = 1.8;
        s.needsUpdate      = true;
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

  const PAINT_PREFIXES = ['Right', 'Left', 'Back', 'Top', 'Front', 'NoDecal'];
  function isPaint(name: string) { return PAINT_PREFIXES.some(p => name.startsWith(p)); }

  async function loadLivery(
    glbUrl: string,
    color: string,
    textures: Record<string, string>,
    onProgress?: (message: string, progress: number) => void
  ): Promise<void> {
    if (currentModel) { scene.remove(currentModel); currentModel = null; markDirty(); }
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
                  const prefix = panel.replace(/\d+$/, '');
                  currentModel?.traverse((child) => {
                    if (!(child as THREE.Mesh).isMesh) return;
                    const mats = Array.isArray((child as THREE.Mesh).material)
                      ? (child as THREE.Mesh).material as THREE.Material[]
                      : [(child as THREE.Mesh).material as THREE.Material];
                    mats.forEach((mat) => {
                      if (!(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) return;
                      if (!mat.name.startsWith(prefix)) return;
                      const s = mat as THREE.MeshStandardMaterial;
                      s.map = tex;
                      s.color.set(0xffffff);
                      s.needsUpdate = true;
                    });
                  });
                  res();
                }, undefined, () => res());
              })
            ));
          }

          scene.add(currentModel);

          const size = box.getSize(new THREE.Vector3());
          currentModelSize.copy(size);
          const dist = Math.max(size.x, size.y, size.z) * 2;
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
        if (s.map) return; // skip textured panels
        s.color.set(color); s.metalness = 0.4; s.roughness = 0.35; s.needsUpdate = true;
      });
    });
    markDirty();
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

    const offsets: Record<ShowcaseSide, THREE.Vector3> = {
      right: new THREE.Vector3( dist, 0, 0),
      left:  new THREE.Vector3(-dist, 0, 0),
      front: new THREE.Vector3(0, 0,  dist),
      back:  new THREE.Vector3(0, 0, -dist),
    };

    const showcaseCam = new THREE.PerspectiveCamera(fov, W / H, 0.1, 10000);
    const offset = offsets[side];
    showcaseCam.position.set(cx + offset.x, cy, cz + offset.z);
    showcaseCam.lookAt(cx, cy, cz);

    const savedBg  = scene.background;
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
    if (currentModel) scene.remove(currentModel);
    probeTarget.dispose();
    renderer.dispose();
    controls.dispose();
    if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
  }

  return { loadLivery, updateColor, playELS, stopELS, captureThumbnail, captureShowcase, dispose };
}
