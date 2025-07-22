import { OrbitControls } from './OrbitControls.js'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping; 
renderer.toneMappingExposure = 1.2; 

scene.background = new THREE.Color(0x000000).convertSRGBToLinear(); 

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 15);
directionalLight.castShadow = true;
scene.add(directionalLight);
renderer.shadowMap.enabled = true;

// Court builder
function createBasketballCourt() {
  const courtGeometry = new THREE.BoxGeometry(30, 0.2, 15);
  const courtMaterial = new THREE.MeshPhongMaterial({ 
    color: new THREE.Color(0xc68642).convertSRGBToLinear(),
    shininess: 50 
  });
  const court = new THREE.Mesh(courtGeometry, courtMaterial);
  court.receiveShadow = true;
  scene.add(court);

  const lineMaterial = new THREE.LineBasicMaterial({ color: new THREE.Color(0xffffff).convertSRGBToLinear() });

  // Center line
  const centerLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.11, -7.5),
    new THREE.Vector3(0, 0.11, 7.5)
  ]);
  scene.add(new THREE.Line(centerLineGeometry, lineMaterial));

  // Center circle
  const centerCircleRadius = 1.8;
  const centerCirclePath = new THREE.Path();
  centerCirclePath.absarc(0, 0, centerCircleRadius, 0, Math.PI * 2, false);
  const centerPoints = centerCirclePath.getPoints(64).map(p => new THREE.Vector3(p.x, 0.11, p.y));
  const centerGeometry = new THREE.BufferGeometry().setFromPoints(centerPoints);
  scene.add(new THREE.LineLoop(centerGeometry, lineMaterial));

  // 3-point arcs
  createThreePointLine(-15);
  createThreePointLine(15);

  // Free-throw circles - FIXED: Moved closer to hoops
  createFreeThrowCircle(-11.5);
  createFreeThrowCircle(11.5);

  // Key areas - FIXED: Much narrower and repositioned
  createKeyArea(-15, -11.5);
  createKeyArea(15, 11.5);

  // Optional: boundary
  createBoundaryLines();

  // --- helper functions ---
  function createThreePointLine(xOffset) {
    const radius = 6.65;
    const sideOffset = 4.7;
    const yHeight = 0.201;
    const direction = -1 * Math.sign(xOffset);
    const angle = Math.acos(sideOffset / radius);

    const arcCurve = new THREE.EllipseCurve(
      -xOffset, 0,
      radius, radius,
      direction < 0 ? -angle : Math.PI - angle,
      direction < 0 ? angle : Math.PI + angle,
      false
    );
    const arcPoints = arcCurve.getPoints(256).map(p => new THREE.Vector3(p.x, yHeight, p.y));
    const arcGeometry = new THREE.BufferGeometry().setFromPoints(arcPoints);
    scene.add(new THREE.Line(arcGeometry, lineMaterial));

    const sideZ1 = -sideOffset;
    const sideZ2 = sideOffset;
    const arcX = xOffset + direction * radius * Math.cos(angle);

    const leftLine = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(xOffset, yHeight, sideZ1),
      new THREE.Vector3(arcX, yHeight, sideZ1)
    ]);
    scene.add(new THREE.Line(leftLine, lineMaterial));

    const rightLine = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(arcX, yHeight, sideZ2),
      new THREE.Vector3(xOffset, yHeight, sideZ2)
    ]);
    scene.add(new THREE.Line(rightLine, lineMaterial));
  }

  function createFreeThrowCircle(centerX) {
    const radius = 1.2;
    const circlePath = new THREE.Path();
    circlePath.absarc(centerX, 0, radius, 0, Math.PI * 2, false);
    const points = circlePath.getPoints(64).map(p => new THREE.Vector3(p.x, 0.11, p.y));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    scene.add(new THREE.LineLoop(geometry, lineMaterial));
  }

  function createKeyArea(baselineX, freeThrowX) {
    const halfWidth = 1.2; 
    const y = 0.11;
    const points = [
      new THREE.Vector3(baselineX, y, -halfWidth),
      new THREE.Vector3(freeThrowX, y, -halfWidth),
      new THREE.Vector3(freeThrowX, y, halfWidth),
      new THREE.Vector3(baselineX, y, halfWidth),
      new THREE.Vector3(baselineX, y, -halfWidth),
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    scene.add(new THREE.Line(geometry, lineMaterial));
  }

  function createBoundaryLines() {
    const zMin = -7.5, zMax = 7.5, xMin = -15, xMax = 15, y = 0.11;
    const corners = [
      new THREE.Vector3(xMin, y, zMin),
      new THREE.Vector3(xMax, y, zMin),
      new THREE.Vector3(xMax, y, zMax),
      new THREE.Vector3(xMin, y, zMax),
      new THREE.Vector3(xMin, y, zMin),
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(corners);
    scene.add(new THREE.Line(geometry, lineMaterial));
  }
}


// Build court
createBasketballCourt();

function createHoop(xOffset) {
  const yHeight = 3.05; // 10 feet
  const backboardWidth = 1.8;
  const backboardHeight = 1.05;
  const backboardThickness = 0.05;

  const rimRadius = 0.3;
  const rimThickness = 0.05;
  const netLength = 0.5;

  const direction = -1 * Math.sign(xOffset); // -1 for left, +1 for right

 const lineMaterial = new THREE.LineBasicMaterial({ color: new THREE.Color(0xffffff).convertSRGBToLinear() });
 const netMaterial = new THREE.LineBasicMaterial({ color: new THREE.Color(0xffffff).convertSRGBToLinear() });
 const supportMaterial = new THREE.MeshPhongMaterial({ color: new THREE.Color(0x888888).convertSRGBToLinear() });

  //
  // SUPPORT POLE (now on courtside)
  //
  const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4);
  const pole = new THREE.Mesh(poleGeometry, supportMaterial);
  pole.position.set(xOffset+0.1, 2, 0);
  pole.castShadow = true;
  scene.add(pole);

  //
  // ------------------------------------------------------------------
  // SUPPORT ARM  – now a thick grey cylinder במקום קו דק
  // ------------------------------------------------------------------
  const rimOffset = (backboardThickness / 2) + (rimThickness / 2);
  const armLength = 0.4;                      // אותו אורך
  const armEndX   = pole.position.x + direction * armLength;

  const armStart  = new THREE.Vector3(pole.position.x, yHeight, 0);
  const armEnd    = new THREE.Vector3(armEndX,        yHeight,       0);

  // vector, midpoint, length
  const armVec  = new THREE.Vector3().subVectors(armEnd, armStart);
  const armLen  = armVec.length();
  const armMid  = new THREE.Vector3().addVectors(armStart, armEnd).multiplyScalar(0.5);

  // thick cylinder (radius 7 cm)
  const armGeom = new THREE.CylinderGeometry(0.07, 0.07, armLen, 16);
  const armMat  = new THREE.MeshPhongMaterial({ color: new THREE.Color(0x555555).convertSRGBToLinear() });
  const armMesh = new THREE.Mesh(armGeom, armMat);
  armMesh.castShadow = true;

  // align cylinder with the vector armVec (default up-vector is +Y)
  armMesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    armVec.clone().normalize()
  );
  armMesh.position.copy(armMid);
  scene.add(armMesh);
  // ------------------------------------------------------------------


  //
  // BACKBOARD
  //
  const backboardGeometry = new THREE.BoxGeometry(backboardWidth, backboardHeight, backboardThickness);
  const backboardMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.8
  });
  const backboard = new THREE.Mesh(backboardGeometry, backboardMaterial);
  backboard.rotation.y = -direction * Math.PI / 2;
  backboard.position.set(armEndX, yHeight, 0);
  backboard.castShadow = true;
  scene.add(backboard);

  //
  // RIM
  //
  const rimGeometry = new THREE.TorusGeometry(rimRadius, rimThickness, 16, 100);
  const rimMaterial = new THREE.MeshPhongMaterial({ color: 0xcc3300 }); // כתום
  const rim = new THREE.Mesh(rimGeometry, rimMaterial);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(armEndX + direction * rimOffset * 7, yHeight - 0.15, 0);
  rim.castShadow = true;
  scene.add(rim);

  //
  // NET (8 segments)
  //
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x1 = rim.position.x + Math.cos(angle) * rimRadius;
    const z1 = rim.position.z + Math.sin(angle) * rimRadius;
    const netGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x1, rim.position.y, z1),
      new THREE.Vector3(x1, rim.position.y - netLength, z1)
    ]);
    scene.add(new THREE.Line(netGeo, netMaterial));
  }
}



createHoop(-15); // Left hoop
createHoop(15);  // Right hoop

// Camera
const cameraTranslate = new THREE.Matrix4().makeTranslation(0, 15, 30);
camera.applyMatrix4(cameraTranslate);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
let isOrbitEnabled = true;

// UI instructions  ──────────────────────────────────────────────
const instructionsElement = document.getElementById('controls-ui');
instructionsElement.innerHTML = `
  <h3>Controls:</h3>
  <p>
    ←/→  : move left/right<br>
    ↑/↓  : move forward/back<br>
    O    : toggle orbit camera
  </p>`;

// Keyboard toggle
document.addEventListener('keydown', (e) => {
  if (e.key === "o") {
    isOrbitEnabled = !isOrbitEnabled;
  }
});


const RADIUS = 0.123;  // 24.6 cm

function makeBasketballTexture(res = 1024) {
  const c  = document.createElement('canvas');
  c.width  = c.height = res;
  const ctx = c.getContext('2d');

  /* granular base -------------------------------------------------------- */
  const tile = document.createElement('canvas');
  tile.width = tile.height = 6;
  const tctx = tile.getContext('2d');

  tctx.fillStyle = '#a04f1d';
  tctx.fillRect(0, 0, 6, 6);

  tctx.fillStyle = '#793a14';
  [[1.5,1.5],[4,2],[2,4]].forEach(([x,y])=>{
    tctx.beginPath(); tctx.arc(x, y, 0.9, 0, Math.PI*2); tctx.fill();
  });

  ctx.fillStyle = ctx.createPattern(tile, 'repeat');
  ctx.fillRect(0, 0, res, res);

  /* seams ---------------------------------------------------------------- */
  ctx.fillStyle = '#000';
  const w = res * 0.02;

  [0.4, 0.6].forEach(v => ctx.fillRect(0, res*v - w/2, res, w));

  [0, 0.25, 0.5, 0.75].forEach(u => {
    ctx.fillRect(res*u - w/2, 0, w, res);
    if (u === 0) ctx.fillRect(res - w/2, 0, w, res); // UV wrap seam
  });

  const tex = new THREE.CanvasTexture(c);
  tex.encoding   = THREE.sRGBEncoding;
  tex.anisotropy = 8;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/* textures */
const colorMap = makeBasketballTexture();
const bumpMap  = colorMap.clone();          // same canvas for bumps
bumpMap.encoding = THREE.LinearEncoding;

/* geometry + material */
const geo = new THREE.SphereGeometry(RADIUS, 128, 128);
const mat = new THREE.MeshStandardMaterial({
  map        : colorMap,
  bumpMap    : bumpMap,
  bumpScale  : 0.03,
  roughness  : 0.95,
  metalness  : 0
});

/* mesh */
const ball = new THREE.Mesh(geo, mat);
ball.castShadow = true;
ball.position.set(0, 2*RADIUS -0.01 , 0);
scene.add(ball);

// --- court extents -------------------------------------------------------
const COURT_HALF_LEN   = 15;    // along X
const COURT_HALF_WIDTH = 7.5;   // along Z

// === Phase-1 movement state  --------------------------------------------
const COURT_BOUNDS = {
  xMin: -COURT_HALF_LEN   + RADIUS,
  xMax:  COURT_HALF_LEN   - RADIUS,
  zMin: -COURT_HALF_WIDTH + RADIUS,
  zMax:  COURT_HALF_WIDTH - RADIUS
};

const MOVE_SPEED   = 4;   // metres / second  (court units are metres)
const LERP_FACTOR  = 0.15; // 0-1, higher = snappier

const moveKey = { left:false, right:false, up:false, down:false };
let   ballVel = new THREE.Vector3();         // smoothed velocity


/* ----------------------------------------------------------------------- */



// === extra UI hooks ===
const scoreBox   = document.getElementById('score-ui');
const controlsUI = document.getElementById('controls-ui');
const orbitText  = document.getElementById('orbit-status');

// update orbit status without touching old instructionsElement
document.addEventListener('keydown', e => {
  if (e.key === 'o' || e.key === 'O') {
    orbitText.textContent =
      `Orbit camera: ${isOrbitEnabled ? 'ON' : 'OFF'} (press O to toggle)`;
  }
});

// === Ball Phase-2 movement logic ===
function onKeyChange(e, isDown){
  switch (e.key){
    case 'ArrowLeft' : moveKey.left  = isDown; break;
    case 'ArrowRight': moveKey.right = isDown; break;
    case 'ArrowUp'   : moveKey.up    = isDown; break;
    case 'ArrowDown' : moveKey.down  = isDown; break;
    case 'o': case 'O':
      if (isDown){ isOrbitEnabled = !isOrbitEnabled; }
      break;
  }
  // Stop the browser or OrbitControls from swallowing the arrow keys
  if (/Arrow/.test(e.key)) e.preventDefault();
}

window.addEventListener('keydown', e => onKeyChange(e, true ));
window.addEventListener('keyup'  , e => onKeyChange(e, false));


// placeholder: whenever you change score in future, call this helper
function setScore(val){
  document.getElementById('home-score').textContent = val;
}


// // Animation loop
// function animate() {
//   requestAnimationFrame(animate);
//   controls.enabled = isOrbitEnabled;
//   controls.update();
//   renderer.render(scene, camera);
// }

let lastT = performance.now();

function animate() {
  requestAnimationFrame(animate);

  /* ---- delta-time ---------------------------------------------------- */
  const now = performance.now();
  const dt  = (now - lastT) / 1000;   // seconds
  lastT     = now;

  /* ---- Phase-1 ball movement ---------------------------------------- */
  // 1. desired direction from keys
  const dir = new THREE.Vector3(
      (moveKey.right ? 1 : 0) - (moveKey.left ? 1 : 0),
      0,
      (moveKey.down  ? 1 : 0) - (moveKey.up   ? 1 : 0)
  );

  // 2. turn it into a target velocity
  if (dir.lengthSq() > 0) dir.normalize().multiplyScalar(MOVE_SPEED);

  // 3. smooth-step (LERP) current velocity toward the target
  ballVel.lerp(dir, LERP_FACTOR);

  // 4. integrate position
  ball.position.addScaledVector(ballVel, dt);

  // 5. boundary-clamp so the ball never leaves the wood
  ball.position.x = THREE.MathUtils.clamp(ball.position.x,
                                          COURT_BOUNDS.xMin, COURT_BOUNDS.xMax);
  ball.position.z = THREE.MathUtils.clamp(ball.position.z,
                                          COURT_BOUNDS.zMin, COURT_BOUNDS.zMax);

  /* ---- camera controls & render ------------------------------------- */
  controls.enabled = isOrbitEnabled;
  controls.update();
  renderer.render(scene, camera);
}
animate();
