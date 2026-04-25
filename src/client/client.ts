import { io } from "socket.io-client";
import State from "../lib/entity/state";
import { ClientHandler } from "../lib/events/clientHandler";
import * as THREE from "three";

const socket = io(window.location.origin);
const state = new State();
const handler = new ClientHandler(socket, state);
handler.initialize();

socket.emit("AddPlayerEvent");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111122);
scene.fog = new THREE.FogExp2(0x111122, 0.008);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // nicer shadows
document.body.appendChild(renderer.domElement);

// --- Lighting ---
const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
mainLight.position.set(5, 10, 7);
mainLight.castShadow = true;
mainLight.receiveShadow = false;
scene.add(mainLight);

const fillLight = new THREE.AmbientLight(0x404060);
scene.add(fillLight);

const backLight = new THREE.PointLight(0x4466cc, 0.5);
backLight.position.set(-2, 3, -4);
scene.add(backLight);

// --- Ground and helpers ---
const gridHelper = new THREE.GridHelper(20, 20, 0x88aaff, 0x335588);
gridHelper.position.y = -0.2;
scene.add(gridHelper);

// optional axis helper (commented)
// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

// --- Player management ---
// Map socketId -> THREE.Mesh
const playerMeshes = new Map();

// Helper to create a coloured sphere for a player
function createPlayerMesh(isLocal = false) {
  const geometry = new THREE.SphereGeometry(0.5, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: isLocal ? 0x66ff66 : 0xff8866,
    emissive: isLocal ? 0x226622 : 0x442200,
    roughness: 0.4,
    metalness: 0.1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  // add a simple ring or wireframe for local player? not necessary
  return mesh;
}

// Update the scene to match state.players
function synchronisePlayers() {
  const currentIds = new Set(state.players.map((p) => p.socketId));

  // 1. Remove players that no longer exist
  for (const [socketId, mesh] of playerMeshes.entries()) {
    if (!currentIds.has(socketId)) {
      scene.remove(mesh);
      // optional: dispose geometry/material to free memory
      mesh.geometry.dispose();
      mesh.material.dispose();
      playerMeshes.delete(socketId);
    }
  }

  // 2. Add or update existing players
  for (const player of state.players) {
    const isLocal = player.socketId === socket.id;
    let mesh = playerMeshes.get(player.socketId);
    if (!mesh) {
      mesh = createPlayerMesh(isLocal);
      playerMeshes.set(player.socketId, mesh);
      scene.add(mesh);
    }

    // Update position from player.pos (Vector with x, y, z)
    mesh.position.set(
      player.pos.x,
      player.pos.y + 0.5, // lift sphere so it stands on the grid (radius 0.5)
      player.pos.z,
    );

    // Optional: rotate the mesh according to player.rot (yaw only for simplicity)
    // Rotation: player.rot is Euler angles in radians. We'll set Y rotation.
    if (player.rot && typeof player.rot.y === "number") {
      mesh.rotation.y = player.rot.y;
    }
  }
}

function updateCamera() {
  const localPlayer = state.players.find((p) => p.socketId === socket.id);
  if (localPlayer) {
    // same offset as original: x+3, z+4
    const targetX = localPlayer.pos.x + 3;
    const targetZ = localPlayer.pos.z + 4;
    camera.position.x = targetX;
    camera.position.z = targetZ;
    camera.position.y = 3; // keep a comfortable height
    camera.lookAt(
      localPlayer.pos.x,
      localPlayer.pos.y + 0.5,
      localPlayer.pos.z,
    );
  } else {
    // fallback: if no local player yet, look at origin
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
  }
}

// --- Animation loop ---
function animate() {
  // 1. Sync Three.js objects with current state
  synchronisePlayers();

  // 2. Make camera follow local player
  updateCamera();

  // 3. Render the scene
  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}

// Start the loop
animate();

// Optional: resize handler
window.addEventListener("resize", onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
