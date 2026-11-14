import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";

export function createViewer(container) {
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(36, 1, 0.1, 3000);
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.46;
  renderer.domElement.setAttribute(
    "aria-label",
    "Interaktive 3D-Ansicht der STL-Datei",
  );
  container.prepend(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 5;
  controls.maxDistance = 1700;
  controls.listenToKeyEvents(container);
  scene.add(new THREE.HemisphereLight(0xffe6c6, 0x304458, 2.85));
  const key = new THREE.DirectionalLight(0xffe6bd, 3.5);
  key.position.set(100, 180, 100);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {
    left: -220,
    right: 220,
    top: 220,
    bottom: -220,
    far: 700,
  });
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.08;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff9b47, 3.2);
  rim.position.set(-130, 80, -130);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xd1deff, 1.75);
  fill.position.set(170, 50, -20);
  scene.add(fill);
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(350, 1, 350),
    new THREE.MeshStandardMaterial({
      color: 0x27201b,
      metalness: 0.26,
      roughness: 0.62,
      transparent: true,
      opacity: 0.75,
    }),
  );
  plate.position.y = -0.7;
  plate.receiveShadow = true;
  scene.add(plate);
  const grid = new THREE.GridHelper(350, 35, 0xf6aa60, 0x76614d);
  grid.material.transparent = true;
  grid.material.opacity = 0.26;
  grid.position.y = -0.12;
  scene.add(grid);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(350, 0.1, 350)),
    new THREE.LineBasicMaterial({
      color: 0xffc17a,
      transparent: true,
      opacity: 0.58,
    }),
  );
  scene.add(edges);
  let model = null,
    frame = 0,
    dirty = true,
    disposed = false,
    wire = false;
  const loader = new STLLoader();
  function wake() {
    dirty = true;
    if (!frame && !document.hidden && !disposed)
      frame = requestAnimationFrame(draw);
  }
  function draw() {
    if (disposed || document.hidden) {
      frame = 0;
      return;
    }
    // Keep the pending frame registered while update emits change events.
    // Otherwise each damping update would schedule two competing render loops.
    const changed = controls.update();
    if (dirty || changed) {
      renderer.render(scene, camera);
      dirty = false;
    }
    frame = 0;
    if (changed) frame = requestAnimationFrame(draw);
  }
  controls.addEventListener("change", wake);
  controls.addEventListener("start", wake);
  function fit() {
    // Flush a previous gesture before applying the fitted pose. Otherwise a
    // reset during damping keeps moving the camera away from its new position.
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    const size = model
      ? new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3())
      : new THREE.Vector3(130, 80, 130);
    const center = model
      ? new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3())
      : new THREE.Vector3(0, 20, 0);
    const radius = size.length() / 2;
    const distance =
      ((radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.18) /
      Math.min(camera.aspect, 1);
    controls.maxDistance = Math.max(1700, distance * 4);
    camera.position
      .copy(center)
      .add(new THREE.Vector3(1, 0.8, 1.3).normalize().multiplyScalar(distance));
    camera.near = Math.max(0.05, distance / 1000);
    camera.far = Math.max(2000, distance * 15);
    camera.updateProjectionMatrix();
    controls.target.copy(center);
    controls.update();
    controls.enableDamping = damping;
    wake();
  }
  const resize = new ResizeObserver(() => {
    const { width, height } = container.getBoundingClientRect();
    if (width && height) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      fit();
    }
  });
  resize.observe(container);
  function releaseModel() {
    if (model) {
      scene.remove(model);
      model.geometry.dispose();
      model.material.dispose();
      model = null;
    }
  }
  function load(data) {
    const geometry = loader.parse(data);
    geometry.computeBoundingBox();
    geometry.computeVertexNormals();
    // STL uses Z as height; Three.js uses Y. Center X/Y, put Z=0 on the plate.
    const box = geometry.boundingBox,
      center = box.getCenter(new THREE.Vector3());
    geometry.translate(-center.x, -center.y, -box.min.z);
    geometry.rotateX(-Math.PI / 2);
    releaseModel();
    model = new THREE.Mesh(
      geometry,
      new THREE.MeshPhysicalMaterial({
        color: 0xffc68a,
        metalness: 0.12,
        roughness: 0.31,
        clearcoat: 0.52,
        clearcoatRoughness: 0.22,
        emissive: 0x43200e,
        emissiveIntensity: 0.045,
        wireframe: wire,
        side: THREE.DoubleSide,
      }),
    );
    model.castShadow = true;
    model.receiveShadow = false;
    scene.add(model);
    fit();
    document.getElementById("viewerEmpty").hidden = true;
    container.dataset.loaded = "true";
  }
  const visibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else wake();
  };
  document.addEventListener("visibilitychange", visibility);
  const lost = (e) => {
    e.preventDefault();
    document.getElementById("viewerEmpty").hidden = false;
    document.getElementById("viewerEmpty").textContent =
      "Die 3D-Ansicht wurde unterbrochen. Lade die Seite neu. Deine Kostenschätzung bleibt verfügbar.";
  };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  fit();
  return {
    load,
    fit,
    toggleWire() {
      wire = !wire;
      if (model) model.material.wireframe = wire;
      wake();
      return wire;
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      controls.dispose();
      releaseModel();
      for (const o of [plate, grid, edges]) {
        o.geometry.dispose();
        o.material.dispose();
      }
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
