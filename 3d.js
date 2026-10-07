// ============================================================
// NEBULA — 3D Scene (Three.js)
// Global starfield + hero icosahedron interaktif
// ============================================================
import * as THREE from 'three';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const C = {
  accent:  0xFF2D55,
  accent2: 0xFF5075,
  warm:    0xE5B565
};

// ------------------------------------------------------------
// GLOBAL FX — subtle red starfield on #fx canvas
// ------------------------------------------------------------
function initFx() {
  const canvas = document.getElementById('fx');
  if (!canvas || REDUCED) return;

  const renderer = new THREE.WebGLRenderer({
    canvas, alpha: true, antialias: !IS_MOBILE, powerPreference: 'low-power'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 8;

  const count = IS_MOBILE ? 400 : 800;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 40;
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: C.accent, size: 0.04, transparent: true, opacity: 0.5
  }));
  scene.add(stars);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  function loop() {
    const t = clock.getElapsedTime();
    stars.rotation.y = t * 0.015;
    stars.rotation.x = t * 0.008;
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  loop();
}

// ------------------------------------------------------------
// HERO — icosahedron + inner solid + orbiters + ring
// ------------------------------------------------------------
function initHero() {
  const canvas = document.getElementById('hero3d');
  if (!canvas || REDUCED) return;

  const rect = () => canvas.getBoundingClientRect();

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !IS_MOBILE,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_MOBILE ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(C.accent, 1.6);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(C.warm, 1.0);
  rim.position.set(-4, -2, 3);
  scene.add(rim);
  const back = new THREE.PointLight(C.accent2, 1.2, 20);
  back.position.set(0, 0, -4);
  scene.add(back);

  const group = new THREE.Group();
  scene.add(group);

  const ico = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.85, 1),
    new THREE.MeshBasicMaterial({
      color: C.accent, wireframe: true, transparent: true, opacity: 0.55
    })
  );
  group.add(ico);

  const innerMat = new THREE.MeshStandardMaterial({
    color: C.accent2,
    emissive: C.accent,
    emissiveIntensity: 0.45,
    metalness: 0.7,
    roughness: 0.25,
    flatShading: true,
    transparent: true,
    opacity: 0.85
  });
  const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 0), innerMat);
  group.add(inner);

  const orbiters = [];
  const orbitCount = IS_MOBILE ? 4 : 6;
  for (let i = 0; i < orbitCount; i++) {
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 12, 12),
      new THREE.MeshBasicMaterial({ color: i % 2 ? C.warm : C.accent2 })
    );
    const a = (i / orbitCount) * Math.PI * 2;
    s.position.set(Math.cos(a) * 2.6, Math.sin(a * 1.3) * 1.2, Math.sin(a) * 2.6);
    group.add(s);
    orbiters.push({ mesh: s, angle: a, radius: 2.6, speed: 0.15 + i * 0.04, yPhase: i * 0.9 });
  }

  const ringCount = IS_MOBILE ? 40 : 80;
  const ringPos = new Float32Array(ringCount * 3);
  for (let i = 0; i < ringCount; i++) {
    const a = (i / ringCount) * Math.PI * 2;
    const r = 2.85 + Math.random() * 0.15;
    ringPos[i * 3] = Math.cos(a) * r;
    ringPos[i * 3 + 1] = (Math.random() - 0.5) * 0.15;
    ringPos[i * 3 + 2] = Math.sin(a) * r;
  }
  const ringGeo = new THREE.BufferGeometry();
  ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3));
  const ring = new THREE.Points(ringGeo, new THREE.PointsMaterial({
    color: C.accent2, size: 0.055, transparent: true, opacity: 0.75, sizeAttenuation: true
  }));
  group.add(ring);

  let px = 0, py = 0, tx = 0, ty = 0;
  const onMove = (e) => {
    const r = rect();
    const cx = e.clientX;
    const cy = e.clientY;
    if (cx == null) return;
    tx = ((cx - r.left) / r.width - 0.5) * 2;
    ty = ((cy - r.top) / r.height - 0.5) * 2;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  function resize() {
    const r = rect();
    const W = Math.max(1, r.width);
    const H = Math.max(1, r.height);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const intro = { t: 0 };
  camera.position.z = 14;
  camera.rotation.x = -0.4;

  const clock = new THREE.Clock();
  let raf = 0;

  function loop() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (intro.t < 1) {
      intro.t = Math.min(1, intro.t + dt * 0.9);
      const e = 1 - Math.pow(1 - intro.t, 3);
      camera.position.z = 14 - e * 8;
      camera.rotation.x = -0.4 + e * 0.4;
    }

    px += (tx - px) * 0.06;
    py += (ty - py) * 0.06;

    group.rotation.y += dt * 0.25;
    group.rotation.x = py * 0.35 + Math.sin(t * 0.4) * 0.08;
    group.rotation.z = px * 0.15;

    for (const o of orbiters) {
      o.angle += dt * o.speed;
      o.mesh.position.x = Math.cos(o.angle) * o.radius;
      o.mesh.position.z = Math.sin(o.angle) * o.radius;
      o.mesh.position.y = Math.sin(t * 0.8 + o.yPhase) * 1.3;
    }

    ring.rotation.y += dt * 0.4;
    innerMat.emissiveIntensity = 0.35 + Math.sin(t * 2.2) * 0.15;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  loop();

  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { if (!raf) loop(); }
    else { cancelAnimationFrame(raf); raf = 0; }
  }, { threshold: 0 });
  io.observe(canvas);
}

// ------------------------------------------------------------
// BOOT — aman dipanggil di login.html maupun index.html
// ------------------------------------------------------------
window.addEventListener('load', () => {
  initFx();
  initHero();
});