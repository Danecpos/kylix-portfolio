import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";

const canvases = Array.from(document.querySelectorAll(".lux-scene"));

if (canvases.length > 0) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: 0, y: 0 };

  window.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
    },
    { passive: true }
  );

  canvases.forEach((canvas) => createHeroScene(canvas, reducedMotion, pointer));
}

function createHeroScene(canvas, reducedMotion, pointer) {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas,
    powerPreference: "high-performance",
    preserveDrawingBuffer: true,
  });

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.35, 7.2);

  const root = new THREE.Group();
  scene.add(root);

  const ambient = new THREE.AmbientLight(0xffffff, 0.72);
  const redKey = new THREE.PointLight(0xff2020, 36, 14);
  const warmFill = new THREE.PointLight(0xffb13d, 9, 10);
  redKey.position.set(2.4, 1.8, 3.2);
  warmFill.position.set(-2.8, -1.2, 3.6);
  scene.add(ambient, redKey, warmFill);

  const sceneName = canvas.dataset.scene || "home";
  const mediaGroup = new THREE.Group();
  const detailGroup = new THREE.Group();
  root.add(mediaGroup, detailGroup);

  buildMediaDeck(mediaGroup, sceneName);
  buildTimelineDetails(detailGroup, sceneName);

  let width = 0;
  let height = 0;
  let visible = true;
  const clock = new THREE.Clock();

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const compact = width < 760;
    const pageHero = canvas.closest(".page-hero") !== null;
    root.scale.setScalar(compact ? 0.64 : pageHero ? 0.78 : 0.92);
    root.position.set(compact ? 0.35 : 1.28, compact ? -0.15 : 0.02, 0);
  };

  const render = () => {
    const t = clock.getElapsedTime();
    const motion = reducedMotion.matches ? 0 : 1;

    root.rotation.y = -0.18 + Math.sin(t * 0.44) * 0.09 * motion + pointer.x * 0.13 * motion;
    root.rotation.x = -0.02 + Math.sin(t * 0.34) * 0.035 * motion - pointer.y * 0.045 * motion;
    detailGroup.rotation.z = Math.sin(t * 0.28) * 0.025 * motion;

    mediaGroup.children.forEach((panel, index) => {
      panel.position.y += Math.sin(t * 0.75 + index * 0.9) * 0.0009 * motion;
      panel.rotation.z += Math.sin(t * 0.42 + index) * 0.00035 * motion;
    });

    renderer.render(scene, camera);
    canvas.dataset.rendered = "true";

    if (!reducedMotion.matches && visible) {
      window.requestAnimationFrame(render);
    }
  };

  const observer = new IntersectionObserver(([entry]) => {
    const wasVisible = visible;
    visible = entry.isIntersecting;

    if (visible && !wasVisible) {
      clock.start();
      render();
    }
  });

  observer.observe(canvas);
  resize();
  window.addEventListener("resize", resize, { passive: true });
  reducedMotion.addEventListener?.("change", render);
  render();
}

function buildMediaDeck(group, sceneName) {
  const loader = new THREE.TextureLoader();
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x120607,
    emissive: 0x240405,
    emissiveIntensity: 0.8,
    metalness: 0.3,
    roughness: 0.42,
  });

  const imageSet = [
    "assets/edit-workstation.png",
    "assets/thumbnail-boom.jpg",
    "assets/thumbnail-ocean-eye.jpg",
    "assets/thumbnail-lucid-dreams.jpg",
    "assets/thumbnail-nuke.png",
  ];

  const layouts = {
    home: [
      [-0.15, 1.16, -0.75, -0.18, -0.32, 0.03, 2.5],
      [2.35, 0.26, -1.4, 0.03, -0.5, -0.04, 2.18],
      [0.95, -1.1, -0.2, 0.14, -0.25, 0.02, 2.32],
      [3.35, 1.43, -2.2, -0.08, -0.62, 0.06, 1.68],
      [3.15, -1.25, -1.9, 0.11, -0.42, -0.08, 1.58],
    ],
    edit: [
      [0.3, 0.78, -0.55, -0.14, -0.36, 0.03, 2.6],
      [2.4, -0.46, -1.35, 0.08, -0.5, -0.05, 2.1],
      [3.2, 1.25, -2.1, -0.04, -0.62, 0.04, 1.65],
    ],
    design: [
      [0.15, 0.88, -0.55, -0.1, -0.34, 0.03, 2.52],
      [2.25, -0.42, -1.22, 0.08, -0.47, -0.05, 2.16],
      [3.35, 1.22, -2.05, -0.05, -0.62, 0.04, 1.62],
      [1.0, -1.28, -0.7, 0.14, -0.27, 0.04, 1.92],
    ],
    thanks: [
      [0.2, 0.65, -0.6, -0.12, -0.34, 0.04, 2.44],
      [2.35, -0.48, -1.45, 0.08, -0.5, -0.04, 2.02],
    ],
  };

  const chosenLayout = layouts[sceneName] || layouts.home;

  chosenLayout.forEach(([x, y, z, rx, ry, rz, scale], index) => {
    const texture = loader.load(imageSet[index % imageSet.length]);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;

    const panel = new THREE.Group();
    const width = scale;
    const height = scale * 0.5625;
    const backplate = new THREE.Mesh(new THREE.BoxGeometry(width + 0.08, height + 0.08, 0.08), frameMaterial);
    const image = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true })
    );

    image.position.z = 0.055;
    panel.add(backplate, image);
    panel.position.set(x, y, z);
    panel.rotation.set(rx, ry, rz);
    group.add(panel);
  });
}

function buildTimelineDetails(group, sceneName) {
  const red = new THREE.MeshStandardMaterial({
    color: 0xff2020,
    emissive: 0xff2020,
    emissiveIntensity: 1.9,
    metalness: 0.18,
    roughness: 0.32,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x1a0a0c,
    emissive: 0x240405,
    emissiveIntensity: 0.35,
    roughness: 0.5,
  });

  const count = sceneName === "home" ? 14 : 10;

  for (let index = 0; index < count; index += 1) {
    const material = index % 3 === 0 ? red : dark;
    const width = 0.52 + (index % 4) * 0.18;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(width, 0.035, 0.05), material);
    bar.position.set(1.6 + (index % 5) * 0.42, -1.8 - Math.floor(index / 5) * 0.18, -0.6 - index * 0.03);
    bar.rotation.set(0.05, -0.38, 0.02);
    group.add(bar);
  }

  const points = [];
  for (let index = 0; index < 42; index += 1) {
    points.push(
      0.2 + Math.random() * 4.2,
      -1.85 + Math.random() * 3.4,
      -2.8 + Math.random() * 2.4
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  const material = new THREE.PointsMaterial({
    color: 0xff4a4a,
    size: 0.018,
    transparent: true,
    opacity: 0.82,
  });
  group.add(new THREE.Points(geometry, material));
}
