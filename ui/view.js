import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.getElementById('view');
const objectList = document.getElementById('objects');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x12140f);

const gridGeometry = new THREE.BufferGeometry();
gridGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
  -1, -1, 0,
  3, -1, 0,
  -1, 3, 0,
]), 3));
const gridUniforms = {
  inverseProjection: { value: new THREE.Matrix4() },
  inverseView: { value: new THREE.Matrix4() },
  viewProjection: { value: new THREE.Matrix4() },
};
const grid = new THREE.Mesh(gridGeometry, new THREE.ShaderMaterial({
  uniforms: gridUniforms,
  transparent: true,
  depthWrite: false,
  toneMapped: false,
  vertexShader: `
    uniform mat4 inverseProjection;
    uniform mat4 inverseView;
    varying vec3 nearPoint;
    varying vec3 farPoint;

    vec3 unproject(float x, float y, float z) {
      vec4 eye = inverseProjection * vec4(x, y, z, 1.0);
      vec4 world = inverseView * vec4(eye.xyz / eye.w, 1.0);
      return world.xyz;
    }

    void main() {
      nearPoint = unproject(position.x, position.y, -1.0);
      farPoint = unproject(position.x, position.y, 1.0);
      gl_Position = vec4(position.x, position.y, 0.0, 1.0);
    }
  `,
  fragmentShader: `
    uniform mat4 viewProjection;
    varying vec3 nearPoint;
    varying vec3 farPoint;

    float gridLine(vec2 coord) {
      vec2 derivative = fwidth(coord);
      vec2 grid = abs(fract(coord - 0.5) - 0.5) / max(derivative, vec2(1e-6));
      float line = min(grid.x, grid.y);
      return 1.0 - min(line, 1.0);
    }

    void main() {
      float denom = farPoint.y - nearPoint.y;
      if (abs(denom) < 1e-6) discard;
      float t = -nearPoint.y / denom;
      if (t < 0.0) discard;
      vec3 fragPos = nearPoint + t * (farPoint - nearPoint);

      float minor = gridLine(fragPos.xz);
      float major = gridLine(fragPos.xz * 0.1);
      vec3 color = mix(vec3(0.35, 0.40, 0.28), vec3(0.62, 0.70, 0.45), clamp(major, 0.0, 1.0));
      float alpha = max(minor * 0.55, major);
      if (alpha < 0.02) discard;

      vec4 clipPos = viewProjection * vec4(fragPos, 1.0);
      gl_FragDepth = clipPos.z / clipPos.w * 0.5 + 0.5;
      gl_FragColor = vec4(color, alpha);
    }
  `,
}));
grid.frustumCulled = false;
scene.add(grid);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 5000);
camera.position.set(5, 8, 18);

const controls = new OrbitControls(camera, canvas);
controls.target.set(5, 0, 0);
controls.mouseButtons = {
  LEFT: null,
  MIDDLE: THREE.MOUSE.ROTATE,
  RIGHT: null,
};
controls.update();

const keys = new Set();
const move = new THREE.Vector3();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const clock = new THREE.Clock();

window.addEventListener('keydown', (event) => {
  keys.add(event.code);
});
window.addEventListener('keyup', (event) => {
  keys.delete(event.code);
});
window.addEventListener('blur', () => {
  keys.clear();
});

function updateCamera(dt) {
  camera.getWorldDirection(forward);
  right.crossVectors(forward, camera.up);
  if (right.lengthSq() < 1e-8) {
    right.set(1, 0, 0);
  } else {
    right.normalize();
  }

  move.set(0, 0, 0);
  if (keys.has('KeyW')) move.add(forward);
  if (keys.has('KeyS')) move.sub(forward);
  if (keys.has('KeyA')) move.sub(right);
  if (keys.has('KeyD')) move.add(right);
  if (keys.has('KeyR')) move.y += 1;
  if (keys.has('KeyQ')) move.y -= 1;
  if (move.lengthSq() === 0) {
    return false;
  }

  const speed = Math.max(4, camera.position.distanceTo(controls.target));
  move.normalize().multiplyScalar(speed * dt);
  camera.position.add(move);
  controls.target.add(move);
  controls.update();
  return true;
}

const meshes = [];
const colors = [0xe6c07b, 0x7fdbca, 0xd98b8b, 0x8eb4e6];

function render() {
  camera.updateMatrixWorld();
  gridUniforms.inverseProjection.value.copy(camera.projectionMatrixInverse);
  gridUniforms.inverseView.value.copy(camera.matrixWorld);
  gridUniforms.viewProjection.value.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  renderer.render(scene, camera);
}

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (width === 0 || height === 0) {
    return;
  }
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  render();
}

function format(value) {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 1e-4 || abs >= 1e6)) {
    return value.toExponential(6);
  }
  return value.toFixed(6);
}

function formatVector(values) {
  if (!values) {
    return '';
  }
  return values.map(format).join(', ');
}

function replaceMesh(index, radius) {
  const previous = meshes[index];
  if (previous) {
    scene.remove(previous);
    previous.geometry.dispose();
    previous.material.dispose();
  }
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 24),
    new THREE.MeshBasicMaterial({ color: colors[index % colors.length] }),
  );
  mesh.userData.radius = radius;
  scene.add(mesh);
  meshes[index] = mesh;
}

function renderObjects(bodies) {
  while (objectList.children.length > bodies.length) {
    objectList.lastElementChild.remove();
  }
  bodies.forEach((body, index) => {
    let card = objectList.children[index];
    if (!card) {
      card = document.createElement('article');
      card.className = 'object-card';
      const title = document.createElement('h2');
      const detail = document.createElement('p');
      detail.style.whiteSpace = 'pre-wrap';
      card.append(title, detail);
      objectList.append(card);
    }
    card.querySelector('h2').textContent = `#${index}`;
    card.querySelector('p').textContent = [
      `质量 ${format(body.mass)}`,
      `半径 ${format(body.radius)}`,
      `位置 ${formatVector(body.position)}`,
      `速度 ${formatVector(body.velocity)}`,
      `加速度 ${formatVector(body.acceleration)}`,
    ].join('\n');
  });
}

controls.addEventListener('change', render);
new ResizeObserver(resize).observe(canvas.parentElement);
resize();

function frame() {
  if (updateCamera(Math.min(clock.getDelta(), 0.05))) {
    render();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.sim.onSnapshot((snapshot) => {
  const bodies = snapshot.bodies;
  while (meshes.length > bodies.length) {
    const mesh = meshes.pop();
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  }
  bodies.forEach((body, index) => {
    if (!meshes[index] || meshes[index].userData.radius !== body.radius) {
      replaceMesh(index, body.radius);
    }
    const position = body.position;
    meshes[index].position.set(position[0], position[1], position[2]);
  });
  renderObjects(bodies);
  render();
});
