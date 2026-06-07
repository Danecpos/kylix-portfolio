import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";

const canvases = Array.from(document.querySelectorAll(".lux-scene"));

if (canvases.length > 0) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: 0, y: 0 };
  const scroll = { turn: 0 };

  const updateScroll = () => {
    scroll.turn = Math.min(1.8, window.scrollY / Math.max(1, window.innerHeight));
  };

  window.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
    },
    { passive: true }
  );

  window.addEventListener("scroll", updateScroll, { passive: true });
  updateScroll();

  canvases.forEach((canvas) => createHeroScene(canvas, reducedMotion, pointer, scroll));
}

function createHeroScene(canvas, reducedMotion, pointer, scroll) {
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
  const kMark = buildKMark(sceneName);
  root.add(mediaGroup, detailGroup, kMark);

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
    root.scale.setScalar(compact ? 0.68 : pageHero ? 0.78 : 0.92);
    root.position.set(compact ? 0.2 : 1.18, compact ? -0.08 : 0.02, 0);
  };

  const render = () => {
    const t = clock.getElapsedTime();
    const motion = reducedMotion.matches ? 0 : 1;

    root.rotation.y = -0.18 + Math.sin(t * 0.44) * 0.09 * motion + pointer.x * 0.13 * motion;
    root.rotation.x = -0.02 + Math.sin(t * 0.34) * 0.035 * motion - pointer.y * 0.045 * motion;
    detailGroup.rotation.z = Math.sin(t * 0.28) * 0.025 * motion;
    kMark.rotation.y = 0.14 + scroll.turn * Math.PI * 1.08 * motion + Math.sin(t * 0.42) * 0.025 * motion;
    kMark.rotation.x = 0.04 + scroll.turn * 0.18 * motion - pointer.y * 0.05 * motion;
    kMark.rotation.z = -0.03 + pointer.x * 0.035 * motion;
    kMark.position.y = Math.sin(t * 0.65) * 0.07 * motion;

    mediaGroup.children.forEach((panel, index) => {
      panel.position.y += Math.sin(t * 0.75 + index * 0.9) * 0.0009 * motion;
      panel.rotation.z += Math.sin(t * 0.42 + index) * 0.00035 * motion;
    });

    renderer.render(scene, camera);
    canvas.dataset.rendered = "true";
    canvas.dataset.scrollTurn = scroll.turn.toFixed(3);
    canvas.dataset.kRotation = kMark.rotation.y.toFixed(3);

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

function buildKMark(sceneName) {
  const group = new THREE.Group();
  const compact = sceneName !== "home";

  const blackChrome = new THREE.MeshPhysicalMaterial({
    color: 0x130708,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    emissive: 0x3a0506,
    emissiveIntensity: 0.58,
    metalness: 0.74,
    roughness: 0.14,
  });
  const redAura = new THREE.MeshPhysicalMaterial({
    color: 0x8f0507,
    clearcoat: 1,
    emissive: 0xff1616,
    emissiveIntensity: 1.35,
    metalness: 0.12,
    opacity: 0.54,
    roughness: 0.2,
    transparent: true,
  });
  const redGlass = new THREE.MeshPhysicalMaterial({
    color: 0xff2424,
    clearcoat: 1,
    emissive: 0xff1010,
    emissiveIntensity: 2.15,
    metalness: 0.2,
    opacity: 0.78,
    roughness: 0.16,
    transparent: true,
  });
  const glint = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    opacity: 0.45,
    transparent: true,
  });
  const edge = new THREE.LineBasicMaterial({
    color: 0xff5b5b,
    transparent: true,
    opacity: 0.96,
  });
  const referenceTexture = new THREE.TextureLoader().load("assets/kylix-k-reference-cutout.png");
  referenceTexture.colorSpace = THREE.SRGBColorSpace;
  referenceTexture.anisotropy = 8;

  const addBar = ({ width, height, depth, x, y, z = 0, rz = 0, material, bevel = true }) => {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    if (bevel) {
      bevelBoxGeometry(geometry, width, height, depth);
    }
    const mesh = new THREE.Mesh(geometry, material);
    const outline = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edge);
    outline.position.z = 0.006;
    mesh.add(outline);
    mesh.position.set(x, y, z);
    mesh.rotation.z = rz;
    group.add(mesh);
    return mesh;
  };

  addBar({ width: 0.76, height: 3.34, depth: 0.7, x: -0.66, y: 0, z: -0.04, material: redAura });
  addBar({ width: 0.82, height: 2.48, depth: 0.7, x: 0.1, y: 0.78, z: -0.04, rz: -0.73, material: redAura });
  addBar({ width: 0.82, height: 2.48, depth: 0.7, x: 0.1, y: -0.78, z: -0.04, rz: 0.73, material: redAura });

  addBar({ width: 0.58, height: 3.18, depth: 0.64, x: -0.66, y: 0, z: 0.04, material: blackChrome });
  addBar({ width: 0.62, height: 2.3, depth: 0.64, x: 0.08, y: 0.76, z: 0.04, rz: -0.73, material: blackChrome });
  addBar({ width: 0.62, height: 2.3, depth: 0.64, x: 0.08, y: -0.76, z: 0.04, rz: 0.73, material: blackChrome });

  addBar({ width: 0.3, height: 2.76, depth: 0.76, x: -0.66, y: 0, z: 0.14, material: redGlass });
  addBar({ width: 0.34, height: 1.98, depth: 0.76, x: 0.03, y: 0.63, z: 0.15, rz: -0.73, material: redGlass });
  addBar({ width: 0.34, height: 1.98, depth: 0.76, x: 0.03, y: -0.63, z: 0.15, rz: 0.73, material: redGlass });

  addGlint(group, glint, { x: -0.85, y: 1.42, z: 0.5, rz: -0.08, scale: 0.58 });
  addGlint(group, glint, { x: 0.68, y: 1.28, z: 0.5, rz: -0.72, scale: 0.48 });
  addGlint(group, glint, { x: 0.78, y: -1.18, z: 0.5, rz: 0.74, scale: 0.4 });

  addShard(group, { x: -0.92, y: 1.45, z: 0.16, rz: -0.34, scale: 0.74 });
  addShard(group, { x: 0.88, y: 1.32, z: 0.16, rz: 0.46, scale: 0.62 });
  addShard(group, { x: 0.78, y: -1.34, z: 0.16, rz: -0.5, scale: 0.66 });
  addShard(group, { x: -0.82, y: -1.45, z: 0.16, rz: 0.4, scale: 0.54 });
  addReferenceKFace(group, referenceTexture);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.85, 0.012, 12, 96),
    new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.34 })
  );
  ring.position.z = -0.38;
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  group.position.set(compact ? 1.05 : 0.42, compact ? 0.1 : -0.04, compact ? 0.48 : 0.82);
  group.scale.setScalar(compact ? 0.86 : 0.94);
  group.rotation.set(0.04, -0.28, -0.03);
  group.userData.isKMark = true;

  return group;
}

function addReferenceKFace(group, texture) {
  const width = 3.82;
  const height = 3.22;
  const geometry = new THREE.PlaneGeometry(width, height);
  const layerSettings = [
    { z: 0.48, x: 0.06, opacity: 0.98, color: 0xffffff, blending: THREE.NormalBlending },
    { z: 0.34, x: 0.02, opacity: 0.28, color: 0xff2a2a, blending: THREE.AdditiveBlending },
    { z: 0.2, x: -0.02, opacity: 0.18, color: 0x9a0508, blending: THREE.AdditiveBlending },
  ];

  layerSettings.forEach((layer, index) => {
    const material = new THREE.MeshBasicMaterial({
      alphaTest: 0.015,
      blending: layer.blending,
      color: layer.color,
      depthTest: false,
      depthWrite: false,
      map: texture,
      opacity: layer.opacity,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(layer.x, -0.02, layer.z);
    mesh.rotation.set(0.015, -0.025, 0.01);
    mesh.renderOrder = 30 + index;
    group.add(mesh);
  });
}

function bevelBoxGeometry(geometry, width, height, depth) {
  const position = geometry.attributes.position;
  const bevelX = width * 0.13;
  const bevelY = height * 0.045;
  const bevelZ = depth * 0.18;

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const signX = Math.sign(x) || 1;
    const signY = Math.sign(y) || 1;
    const signZ = Math.sign(z) || 1;
    const cornerBias = Math.abs(x) > width * 0.22 && Math.abs(y) > height * 0.22;

    position.setXYZ(
      index,
      x - signX * (cornerBias ? bevelX : bevelX * 0.34),
      y - signY * (cornerBias ? bevelY : bevelY * 0.28),
      z + signZ * (cornerBias ? bevelZ : 0)
    );
  }

  geometry.computeVertexNormals();
}

function addShard(group, { x, y, z, rz, scale }) {
  const shape = new THREE.Shape();
  shape.moveTo(-0.42, -0.08);
  shape.lineTo(0.36, -0.28);
  shape.lineTo(0.18, 0.3);
  shape.lineTo(-0.34, 0.16);
  shape.lineTo(-0.42, -0.08);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.035,
    depth: 0.06,
  });
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x160607,
    clearcoat: 1,
    emissive: 0xff1515,
    emissiveIntensity: 0.9,
    metalness: 0.35,
    opacity: 0.78,
    roughness: 0.2,
    transparent: true,
  });
  const shard = new THREE.Mesh(geometry, material);
  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0xff4545, transparent: true, opacity: 0.82 })
  );
  shard.add(outline);
  shard.position.set(x, y, z);
  shard.rotation.set(0.1, -0.18, rz);
  shard.scale.setScalar(scale);
  group.add(shard);
}

function addGlint(group, material, { x, y, z, rz, scale }) {
  const shape = new THREE.Shape();
  shape.moveTo(-0.48, 0);
  shape.lineTo(0.18, 0.09);
  shape.lineTo(0.48, 0);
  shape.lineTo(0.18, -0.09);
  shape.lineTo(-0.48, 0);

  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(0.08, -0.18, rz);
  mesh.scale.setScalar(scale);
  group.add(mesh);
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
