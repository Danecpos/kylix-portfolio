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
    kMark.rotation.y = 0.04 + scroll.turn * Math.PI * 1.02 * motion + Math.sin(t * 0.42) * 0.018 * motion;
    kMark.rotation.x = 0.04 + scroll.turn * 0.18 * motion - pointer.y * 0.05 * motion;
    kMark.rotation.z = -0.03 + pointer.x * 0.035 * motion;
    kMark.position.y = Math.sin(t * 0.65) * 0.07 * motion;
    animateKMark(kMark, t, motion);

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
  const referenceTexture = new THREE.TextureLoader().load("assets/kylix-3d-mark.png");
  referenceTexture.colorSpace = THREE.SRGBColorSpace;
  referenceTexture.anisotropy = 8;

  addArtworkModule(group, referenceTexture);

  group.position.set(compact ? 1.58 : 0.82, compact ? 0.08 : -0.04, compact ? 0.42 : 0.68);
  group.scale.setScalar(compact ? 0.72 : 0.82);
  group.rotation.set(0.035, -0.05, -0.025);
  group.userData.isKMark = true;

  return group;
}

function addArtworkModule(group, texture) {
  const width = 4.72;
  const height = 2.66;
  const frameMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0c0305,
    clearcoat: 1,
    clearcoatRoughness: 0.18,
    emissive: 0x360405,
    emissiveIntensity: 0.75,
    metalness: 0.55,
    roughness: 0.22,
  });
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff2020,
    emissive: 0xff1515,
    emissiveIntensity: 1.4,
    metalness: 0.35,
    roughness: 0.28,
  });
  const backplate = new THREE.Mesh(new THREE.BoxGeometry(width + 0.16, height + 0.16, 0.18), frameMaterial);
  backplate.position.z = -0.28;
  backplate.renderOrder = 10;
  group.add(backplate);

  [
    [0, height / 2 + 0.09, -0.15, width + 0.18, 0.035, 0.12],
    [0, -height / 2 - 0.09, -0.15, width + 0.18, 0.035, 0.12],
    [-width / 2 - 0.09, 0, -0.15, 0.035, height + 0.18, 0.12],
    [width / 2 + 0.09, 0, -0.15, 0.035, height + 0.18, 0.12],
  ].forEach(([x, y, z, w, h, d]) => {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), edgeMaterial);
    edge.position.set(x, y, z);
    group.add(edge);
  });

  const geometry = new THREE.PlaneGeometry(width, height);
  const animatedMaterials = [];
  const glints = [];
  const shards = [];

  const makeLayer = ({ x = 0, y = 0, z, scale = 1, opacity, color, blending, renderOrder }) => {
    const material = new THREE.MeshBasicMaterial({
      alphaTest: 0.015,
      blending,
      color,
      depthTest: false,
      depthWrite: false,
      map: texture,
      opacity,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(scale);
    mesh.renderOrder = renderOrder;
    material.userData.baseOpacity = opacity;
    animatedMaterials.push(material);
    group.add(mesh);
    return mesh;
  };

  makeLayer({ z: -0.62, scale: 1.08, opacity: 0.22, color: 0xff2020, blending: THREE.AdditiveBlending, renderOrder: 18 });
  makeLayer({ z: -0.48, scale: 1.04, opacity: 0.3, color: 0xff1010, blending: THREE.AdditiveBlending, renderOrder: 19 });

  for (let index = 0; index < 12; index += 1) {
    const progress = index / 11;
    makeLayer({
      x: -0.18 + progress * 0.16,
      y: -0.025 + progress * 0.015,
      z: -0.44 + progress * 0.05,
      scale: 1.006 - progress * 0.005,
      opacity: 0.1 + progress * 0.018,
      color: index % 2 === 0 ? 0x3a0304 : 0xff1a1a,
      blending: index % 2 === 0 ? THREE.NormalBlending : THREE.AdditiveBlending,
      renderOrder: 20 + index,
    });
  }

  makeLayer({ z: 0.16, opacity: 0.98, color: 0xffffff, blending: THREE.NormalBlending, renderOrder: 46 });
  makeLayer({ x: 0.018, y: 0.006, z: 0.18, scale: 1.006, opacity: 0.2, color: 0xffffff, blending: THREE.AdditiveBlending, renderOrder: 47 });
  makeLayer({ x: -0.018, y: -0.004, z: 0.19, scale: 1.012, opacity: 0.18, color: 0xff2020, blending: THREE.AdditiveBlending, renderOrder: 48 });

  [
    [-0.78, 1.08, 0.26, 0.52],
    [0.76, 1.02, 0.29, 0.5],
    [1.32, -0.62, 0.27, 0.42],
  ].forEach(([x, y, z, scale], index) => {
    const glint = createGlint(scale);
    glint.position.set(x, y, z);
    glint.rotation.z = index === 1 ? -0.7 : index === 2 ? 0.75 : -0.08;
    glint.renderOrder = 60 + index;
    glint.userData.baseScale = scale;
    glints.push(glint);
    group.add(glint);
  });

  [
    [-2.15, 1.14, -0.16, -0.48, 0.42],
    [2.16, 1.0, -0.22, 0.34, 0.38],
    [2.0, -1.0, -0.22, -0.42, 0.34],
    [-2.04, -1.02, -0.18, 0.52, 0.32],
  ].forEach(([x, y, z, rz, scale], index) => {
    const shard = createFloatingShard(scale);
    shard.position.set(x, y, z);
    shard.rotation.set(0.1, -0.1, rz);
    shard.userData.basePosition = shard.position.clone();
    shard.userData.spin = 0.25 + index * 0.07;
    shards.push(shard);
    group.add(shard);
  });

  group.userData.referenceMaterials = animatedMaterials;
  group.userData.referenceGlints = glints;
  group.userData.referenceShards = shards;
}

function animateKMark(group, t, motion) {
  group.userData.referenceMaterials?.forEach((material, index) => {
    const base = material.userData.baseOpacity || material.opacity;
    material.opacity = base * (1 + Math.sin(t * 1.1 + index * 0.48) * 0.08 * motion);
  });

  group.userData.referenceGlints?.forEach((glint, index) => {
    const pulse = 1 + Math.sin(t * 2.2 + index * 1.7) * 0.22 * motion;
    glint.scale.setScalar(glint.userData.baseScale * pulse);
    glint.material.opacity = 0.18 + (Math.sin(t * 2.8 + index) + 1) * 0.18 * motion;
  });

  group.userData.referenceShards?.forEach((shard, index) => {
    const base = shard.userData.basePosition;
    shard.position.y = base.y + Math.sin(t * 0.95 + index * 1.2) * 0.055 * motion;
    shard.rotation.z += shard.userData.spin * 0.004 * motion;
  });
}

function createFloatingShard(scale) {
  const shape = new THREE.Shape();
  shape.moveTo(-0.42, -0.1);
  shape.lineTo(0.34, -0.24);
  shape.lineTo(0.16, 0.28);
  shape.lineTo(-0.34, 0.18);
  shape.lineTo(-0.42, -0.1);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.035,
    depth: 0.06,
  });
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x140405,
    clearcoat: 1,
    emissive: 0xff2020,
    emissiveIntensity: 0.95,
    metalness: 0.35,
    opacity: 0.68,
    roughness: 0.2,
    transparent: true,
  });
  const shard = new THREE.Mesh(geometry, material);
  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0xff4545, transparent: true, opacity: 0.82 })
  );
  shard.add(outline);
  shard.scale.setScalar(scale);
  return shard;
}

function createGlint(scale) {
  const shape = new THREE.Shape();
  shape.moveTo(-0.48, 0);
  shape.lineTo(0.18, 0.09);
  shape.lineTo(0.48, 0);
  shape.lineTo(0.18, -0.09);
  shape.lineTo(-0.48, 0);

  const mesh = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({
      blending: THREE.AdditiveBlending,
      color: 0xffffff,
      depthTest: false,
      opacity: 0.34,
      transparent: true,
    })
  );
  mesh.rotation.set(0.08, -0.18, 0);
  mesh.scale.setScalar(scale);
  return mesh;
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
