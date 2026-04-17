import * as THREE from "three";
import { io } from "socket.io-client";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111122);
scene.fog = new THREE.FogExp2(0x111122, 0.008);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(15, 10, 15);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 5);
directionalLight.castShadow = true;
directionalLight.receiveShadow = true;
scene.add(directionalLight);

const backLight = new THREE.PointLight(0x4466cc, 0.5);
backLight.position.set(-5, 5, -10);
scene.add(backLight);

const gridHelper = new THREE.GridHelper(30, 20, 0x88aaff, 0x335588);
gridHelper.position.y = -0.5;
scene.add(gridHelper);

const floorMat = new THREE.ShadowMaterial({
  opacity: 0.5,
  color: 0x000000,
  transparent: true,
});
const floor = new THREE.Mesh(new THREE.PlaneGeometry(25, 25), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.5;
floor.receiveShadow = true;
scene.add(floor);

const socket = io();

type Player = THREE.Mesh<
  THREE.BoxGeometry,
  THREE.MeshStandardMaterial,
  THREE.Object3DEventMap
>;

const players: Record<string, Player> = {};

let localPlayer: any = null;

const keys: Record<string, boolean> = {
  w: false,
  a: false,
  s: false,
  d: false,
};
const moveSpeed = 5;

function createLocalPlayer(color: THREE.ColorRepresentation) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({
    color: color,
    emissive: 0x222222,
  });
  const cube = new THREE.Mesh(geometry, material);
  cube.castShadow = true;
  cube.receiveShadow = true;

  const edgesGeo = new THREE.EdgesGeometry(geometry);
  const edgesMat = new THREE.LineBasicMaterial({ color: 0xffffff });
  const wireframe = new THREE.LineSegments(edgesGeo, edgesMat);
  cube.add(wireframe);

  scene.add(cube);
  return cube;
}

function createRemotePlayer(
  id: string,
  color: THREE.ColorRepresentation,
  position: THREE.Vector3,
) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: color });
  const cube = new THREE.Mesh(geometry, material);
  cube.castShadow = true;
  cube.receiveShadow = true;
  cube.userData = { id: id };
  scene.add(cube);

  if (position) {
    cube.position.set(position.x, position.y, position.z);
  }

  return cube;
}

socket.on("current-players", (serverPlayers) => {
  for (let id in serverPlayers) {
    if (id === socket.id) {
      const playerData = serverPlayers[id];
      localPlayer = createLocalPlayer(playerData.color);
      localPlayer.position.set(
        playerData.position.x,
        playerData.position.y,
        playerData.position.z,
      );
      players[id] = localPlayer;
    } else {
      // Create remote player
      const playerData = serverPlayers[id];
      const remoteCube = createRemotePlayer(
        id,
        playerData.color,
        playerData.position,
      );
      players[id] = remoteCube;
    }
  }
  updatePlayerCount();
});

socket.on("new-player", (playerData) => {
  if (playerData.id !== socket.id && !players[playerData.id]) {
    const remoteCube = createRemotePlayer(
      playerData.id,
      playerData.color,
      playerData.position,
    );
    players[playerData.id] = remoteCube;
    updatePlayerCount();
  }
});

socket.on("player-moved", (data) => {
  if (players[data.id] && data.id !== socket.id) {
    players[data.id].position.set(
      data.position.x,
      data.position.y,
      data.position.z,
    );
  }
});

socket.on("player-disconnected", (id) => {
  if (players[id]) {
    scene.remove(players[id]);
    delete players[id];
    updatePlayerCount();
  }
});

function updatePlayerCount() {
  const count = Object.keys(players).length;
  const playerCountElement = document.getElementById("player-count-value");
  if (!playerCountElement) return;
  playerCountElement.textContent = count.toString();
}

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (keys.hasOwnProperty(key)) {
    keys[key] = true;
    e.preventDefault();
  }
});

window.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();
  if (keys.hasOwnProperty(key)) {
    keys[key] = false;
    e.preventDefault();
  }
});

function updateCamera() {
  if (localPlayer) {
    const targetPos = localPlayer.position.clone();
    const cameraOffset = new THREE.Vector3(-5, 5, 5);
    const desiredPosition = targetPos.clone().add(cameraOffset);
    camera.position.lerp(desiredPosition, 0.1);
    camera.lookAt(targetPos);
  }
}

let lastTime = performance.now();

function updateMovement(deltaTime: number) {
  if (!localPlayer) return;

  let moveX = 0;
  let moveZ = 0;

  if (keys.w) moveZ -= 1;
  if (keys.s) moveZ += 1;
  if (keys.a) moveX -= 1;
  if (keys.d) moveX += 1;

  if (moveX !== 0 || moveZ !== 0) {
    const length = Math.hypot(moveX, moveZ);
    moveX /= length;
    moveZ /= length;
  }

  const speed = moveSpeed * deltaTime;
  let newX = localPlayer.position.x + moveX * speed;
  let newZ = localPlayer.position.z + moveZ * speed;

  const limit = 11;
  newX = Math.max(-limit, Math.min(limit, newX));
  newZ = Math.max(-limit, Math.min(limit, newZ));

  if (newX !== localPlayer.position.x || newZ !== localPlayer.position.z) {
    localPlayer.position.x = newX;
    localPlayer.position.z = newZ;

    socket.emit("player-move", {
      x: localPlayer.position.x,
      y: localPlayer.position.y,
      z: localPlayer.position.z,
    });
  }
}

function animate() {
  const now = performance.now();
  let deltaTime = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  updateMovement(deltaTime);
  updateCamera();

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener("resize", onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

animate();

console.log("Game client initialized");
