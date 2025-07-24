import { OrbitControls } from './OrbitControls.js'
const hoopRims   = [];              // filled from createHoop()
const backboards = [];                 // filled in createHoop()
const trailPoints = [];
const trailMax    = 40;  // number of segments to store (~0.5–1.5s)
let   trailLine   = null;

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
  backboards.push(backboard);
  backboard.userData.halfW  = backboard.geometry.parameters.width  * 0.5;
  backboard.userData.halfH  = backboard.geometry.parameters.height * 0.5;
  // backboard.userData.normal = new THREE.Vector3(Math.sign(-direction), 0, 0); // faces court
  backboard.userData.normal = new THREE.Vector3(direction, 0, 0).normalize();



  


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
  hoopRims.push(rim);        // ⇐ track for nearest-hoop lookup

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
    <br>SPACE : shoot toward rim
  </p>`;

// ── UI: power indicator ────────────────────────────────────────────────
const powerWrap  = document.createElement('div');
powerWrap.style.marginTop = '8px';

const label      = document.createElement('span');
label.textContent = 'Power 0%  ';
powerWrap.appendChild(label);

const barOuter   = document.createElement('div');
barOuter.style.cssText = `
   display:inline-block; width:120px; height:12px;
   background:#444; border:1px solid #999; border-radius:4px;
`;
const barInner   = document.createElement('div');
barInner.style.cssText = `
   height:100%; width:0%; background:#28a745; border-radius:3px;
`;
barOuter.appendChild(barInner);
powerWrap.appendChild(barOuter);

instructionsElement.appendChild(powerWrap);


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

// 🟠 Add trail AFTER ball is created, but BEFORE adding to scene
const trailGeo = new THREE.BufferGeometry().setFromPoints(
  Array(trailMax).fill(ball.position.clone())
);
const trailMat = new THREE.LineBasicMaterial({
  color: 0xffa000,
  transparent: true,
  opacity: 0.6,
  linewidth: 5
});
trailLine = new THREE.Line(trailGeo, trailMat);
scene.add(trailLine);

scene.add(ball);  // ← now the ball is added too

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

/* ── Phase-2 shot-power state ────────────────────────────────────────── */
let   shotPower   = 0;    // 0 … 1   (0-100 %)
const POWER_STEP  = 0.4;  // ↑ / ↓ per second while key is held
const POWER_MIN   = 0;
const POWER_MAX   = 1;

const powerKey = { up:false, down:false };   // W / S
const MAX_SHOT_SPEED = 22;   // m/s – used later in Phases 3-5
function currentShotVelocity() { return shotPower * MAX_SHOT_SPEED; }

/* ── Phase-3 physics state ─────────────────────────────────────────── */
const GRAVITY = -9.8;               // m · s-2  (court units ≈ metres)  :contentReference[oaicite:0]{index=0}

let   inFlight   = false;           // true once spacebar is pressed
let   vel        = new THREE.Vector3();     // live velocity during flight

/* ----------------------------------------------------------------------- */

/* ── Phase-4 collision params ───────────────────────────────────────── */
const GROUND_Y            = 2 * RADIUS;   // ball just touches floor
const GROUND_RESTITUTION  = 0.58;  // ↑ bouncier, ↓ deader
const FLOOR_FRICTION      = 0.82;  // ↓ more sliding, ↑ more immediate stop
const RIM_RESTITUTION     = 0.45;  // ↑ more spring off rim
const STOP_EPS            = 0.15;  // ↓ stops sooner
const BACKBOARD_RESTITUTION = 0.35;    // tune as you like

/* ── Phase-5 rotation params ────────────────────────────────────────── */
let   spinAxis   = new THREE.Vector3(1,0,0);   // arbitrary non-zero default
let   spinSpeed  = 0;                          // rad / s  (signed)
const MIN_SPEED  = 0.05;                       // m/s →  no visible roll

/* ── Phase-6 scoring state ────────────────────────────────────────── */
/* ── time-challenge state ─────────────────────────────────────────── */
let inTimeChallenge   = false;   // true while the clock is running
let countdown         = 0;       // seconds remaining
let countdownInterval = null;
/*-end-time-challenge state*/
/* ── LEADERBOARD (localStorage, 20 entries) ─────────────────────────── */
const LB_KEY = 'hw6_leaderboard';          // storage slot name
const LB_SIZE = 20;                        // keep only best 20 scores

function loadLB(){
  const raw = localStorage.getItem(LB_KEY) || '';
  return raw ? raw.split(',').map(Number).filter(n=>!isNaN(n)) : [];
}
function saveLB(arr){
  localStorage.setItem(LB_KEY, arr.join(','));   // ultra-thin CSV
}

/** insert score, keep sorted-desc, trim to LB_SIZE.
    @return {number} 1-based rank (or −1 if outside Top-10) */
function recordScore(score){
  if (score <= 0) return -1;
  const lb = loadLB();
  lb.push(score);
  lb.sort((a,b)=>b-a);
  const rank = lb.indexOf(score) + 1;      // first occurrence
  if (lb.length > LB_SIZE) lb.length = LB_SIZE;
  saveLB(lb);
  return (rank && rank <= 10) ? rank : -1;
}


let totalScore    = 0;
let shotAttempts  = 0;
let shotsMade     = 0;
let shotEvaluated = false;   // per-shot flag
let streakCount  = 0;           // 0 = no active streak
let streakBasket = null;        // 'home' | 'away
let hitRimThisShot = false;  // TRUE once the rim is touched during current shot
const SWISH_BONUS  = 1;      // +1 for a perfect swish
// track arc-crossing per shot
let shotPassedRimPlane = false;  // becomes true once centre rises above rim
let targetRimY         = 0;      // the rim-plane Y for this shot

// --- team scoring + 3pt detection ---
let homeScore = 0;
let awayScore = 0;

const THREE_PT_RADIUS = 6;   // same value you use to draw the arc【:contentReference[oaicite:1]{index=1}】
const THREE_PT_EPS    = 0.05;   // tiny tolerance

// store info at launch time
const shotStartPos  = new THREE.Vector3();
let   shotTargetRim = null;

function syncSpinWithVelocity(v){
  const speed = v.length();
  if (speed < MIN_SPEED) return;               // nothing to do

  /* axis = perpendicular to motion, lying in XZ so the ball “rolls” */
  const axis = new THREE.Vector3(-v.z, 0, v.x).normalize();
  spinAxis.copy(axis);

  /* for pure rolling contact   ω = v / R */
  spinSpeed = speed / RADIUS;
}



// Small helper to reflect velocity about a normal with some energy loss
function reflectVelocity(v, normal, restitution){
  const vn = v.dot(normal);
  if (vn >= 0) return; // moving away, no reflection
  v.addScaledVector(normal, -(1 + restitution) * vn);
}

// === extra UI hooks ===
let scoreBox = document.getElementById('score-ui');
if (!scoreBox){                               // create it if it wasn’t in HTML
  scoreBox           = document.createElement('div');
  scoreBox.id        = 'score-ui';
  scoreBox.style.cssText = `
      position:absolute; top:15px; right:20px;
      background:rgba(0,0,0,0.55); color:#fff;
      padding:12px 16px; border-radius:8px;
      font-family:Arial, sans-serif; font-size:15px;
  `;
  Object.assign(scoreBox.style, {
  top        : '80px',      // ↓ push below the clock/period board
  left       : '50%',       // ⬅ center horizontally
  right      : 'auto',
  transform  : 'translateX(-50%)',
  textAlign  : 'center'
  });
  document.body.appendChild(scoreBox);
}

/* scoreboard layout --------------------------------------------------- */
scoreBox.innerHTML = `
  <h3 style="margin:0 0 6px 0;">Scoreboard</h3>
  Attempts: <span id="score-attempts">0</span> &nbsp; | &nbsp;
  Made: <span id="score-makes">0</span> &nbsp; | &nbsp;
  Accuracy: <span id="score-pct">0%</span><br>
  <br>
  Streak: <span id="score-streak">0</span>
  <span id="shot-message"
        style="display:block;margin-top:6px;font-weight:bold;"></span>
`;
const homeEl     = document.getElementById('home-score');
const awayEl     = document.getElementById('away-score');
const attemptsEl = document.getElementById('score-attempts');
const makesEl    = document.getElementById('score-makes');
const pctEl      = document.getElementById('score-pct');
const messageEl  = document.getElementById('shot-message');
const controlsUI = document.getElementById('controls-ui');
const orbitText  = document.getElementById('orbit-status');
const streakEl   = document.getElementById('score-streak');

/* timer & new-mode UI -------------------------------------------------- */
const timerEl  = document.getElementById('game-timer');
const timeBtn  = document.getElementById('time-challenge-btn');

const bannerEl = (()=>{                      // centred end-of-game banner
  const d = document.createElement('div');
  Object.assign(d.style,{
    position:'absolute',top:'50%',left:'50%',
    transform:'translate(-50%,-50%)',
    fontSize:'48px',fontWeight:'700',
    color:'#fff',background:'rgba(0,0,0,0.75)',
    padding:'20px 40px',borderRadius:'12px',
    display:'none',zIndex:20
  });
  document.body.appendChild(d);
  return d;
})();

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
    case 'w': case 'W': case '\'': powerKey.up   = isDown; break;
    case 's': case 'S': case 'ד': powerKey.down = isDown; break;
    case 'o': case 'O': case 'ם':
      if (isDown){ isOrbitEnabled = !isOrbitEnabled; }
      break;
    case ' ':                 // SPACE
      if (isDown && !inFlight)   shootBall();
      e.preventDefault(); 
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

// --- sound effects ----------------------------------------------------
const SFX = {
  bounce: document.getElementById('sfx-bounce'),
  tada  : document.getElementById('sfx-tada')
};

function playSfx(a){
  if (!a) return;
  a.currentTime = 0;
  a.play().catch(()=>{});
}


function shootBall(){
  /* ----  pick nearest hoop  ---------------------------------------- */
  const target = hoopRims.reduce((closest, rim) =>
    ball.position.distanceTo(rim.position) <
    ball.position.distanceTo(closest.position) ? rim : closest);
    shotStartPos.copy(ball.position);
    hitRimThisShot = false;          // fresh shot → assume swish until proven otherwise
    shotTargetRim = target;
    // store rim height for arc test
    targetRimY         = target.position.y;
    shotPassedRimPlane = false;

  /* ----  build initial velocity  ----------------------------------- */
  const vTot   = currentShotVelocity();   // uses Phase-2 shotPower

  const theta  = THREE.MathUtils.degToRad(50);  // launch angle (~ NBA average)
  const horDir = new THREE.Vector3().subVectors(target.position, ball.position);
  horDir.y = 0;
  horDir.normalize();

  const vHor   = vTot * Math.cos(theta);
  const vVert  = vTot * Math.sin(theta);

  vel.copy(horDir).multiplyScalar(vHor);
  vel.y = vVert;
  shotAttempts++;
  updateScoreUI();
  shotEvaluated = false;

  inFlight = true;
  trailPoints.length = 0; // clear previous trail
  for (let i = 0; i < trailMax; i++) {
    trailPoints.push(ball.position.clone());
  }
  syncSpinWithVelocity(vel);   // start spin immediately
  shotPassedRimPlane = false

}

function handleRimCollision(){
  // quick exit if we're far below/above rims
  // (optional but saves checks)
  for (const rim of hoopRims){
    const rimPos  = rim.position;
    const majorR  = rim.geometry.parameters.radius; // torus ring radius
    const tubeR   = rim.geometry.parameters.tube;   // torus thickness

    // Horizontal distance from rim center axis
    const dx = ball.position.x - rimPos.x;
    const dz = ball.position.z - rimPos.z;
    const horizDist = Math.hypot(dx, dz);

    // Distance to the ideal ring circle (in XZ)
    const distToRing = Math.abs(horizDist - majorR);

    // Vertical distance between ball center and rim plane
    const dy = Math.abs(ball.position.y - rimPos.y);

    // Effective collision radius = tube thickness + ball radius
    const hitRadius = tubeR + RADIUS;

    // Collide if we are near ring circle in XZ and near rim plane in Y
    if (distToRing < hitRadius && dy < hitRadius){

      hitRimThisShot = true;          // not a swish anymore  ← NEW LINE

      // Find nearest point on ring circle to the ball in XZ:
      // (project ball horizontally, clamp radius to majorR)
      if (horizDist === 0) continue; // avoid NaN
      const nx = dx / horizDist;
      const nz = dz / horizDist;
      const nearest = new THREE.Vector3(
        rimPos.x + nx * majorR,
        rimPos.y,
        rimPos.z + nz * majorR
      );

      const normal = new THREE.Vector3()
                      .subVectors(ball.position, nearest)
                      .normalize();

      // Push ball out of penetration
      const penetration = hitRadius -
              new THREE.Vector3()
                .subVectors(ball.position, nearest)
                .length();
      if (penetration > 0){
        ball.position.addScaledVector(normal, penetration + 0.001);
      }

      // Reflect velocity with rim restitution
      reflectVelocity(vel, normal, RIM_RESTITUTION);
      playSfx(SFX.bounce);
    }
  }
}

function handleGroundCollision(){
  if (ball.position.y < GROUND_Y && vel.y < 0){
    ball.position.y = GROUND_Y;

    // bounce up
    vel.y = -vel.y * GROUND_RESTITUTION;
    playSfx(SFX.bounce); 

    // horizontal energy loss (friction)
    vel.x *= FLOOR_FRICTION;
    vel.z *= FLOOR_FRICTION;

    // stop completely if we're basically still
    if (vel.length() < STOP_EPS){
      vel.set(0,0,0);
      spinSpeed = 0;
      inFlight = false;
      trailPoints.length = 0;
      trailLine.geometry.setFromPoints([]);
    }

    if (!shotEvaluated){
      shotEvaluated = true;
      showMessage('MISSED SHOT', '#ff4040');
      // ── break combo on a miss ─────────────────────
      streakCount  = 0;
      streakBasket = null;
      updateScoreUI();      
    }
  }
}

function handleBackboardCollision(){
  for (const bb of backboards){
    const n = bb.userData.normal;              // board outward normal
    // signed distance of ball center from plane
    // const dist = n.dot(ball.position) - n.dot(bb.position);
    const dist = new THREE.Vector3().subVectors(ball.position, bb.position).dot(n);

    // we only care when penetrating the plane (dist < RADIUS) and moving into it
    // if (dist < RADIUS && vel.dot(n) < 0){
    if (dist <= RADIUS && dist >= -RADIUS && vel.dot(n) < 0){ 
      // Check if ball is within board rectangle (project on two in-plane axes)
      const up = new THREE.Vector3(0,1,0);               // board is vertical
      const right = new THREE.Vector3().crossVectors(up, n).normalize();

      const rel   = new THREE.Vector3().subVectors(ball.position, bb.position);
      const yAbs  = Math.abs(rel.dot(up));
      const zAbs  = Math.abs(rel.dot(right));            // horizontal along board

      if (yAbs <= bb.userData.halfH + RADIUS &&
          zAbs <= bb.userData.halfW + RADIUS){

        // push ball out of the plane
        // const penetration = RADIUS - dist;
        // ball.position.addScaledVector(n, penetration + 0.001);
        const penetration = RADIUS - dist;
        if (penetration > 0) {
        ball.position.addScaledVector(n, penetration + 0.001);
        }
        // reflect velocity with energy loss
        reflectVelocity(vel, n, BACKBOARD_RESTITUTION);
        playSfx(SFX.bounce);  
      }
    }
  }
}

function updateScoreUI(){
  // keep totalScore for other uses
  totalScore = homeScore + awayScore;

  homeEl.textContent     = homeScore;
  awayEl.textContent     = awayScore;
  attemptsEl.textContent = shotAttempts;
  makesEl.textContent    = shotsMade;
  pctEl.textContent      = shotAttempts
    ? ((shotsMade / shotAttempts * 100).toFixed(1) + '%')
    : '0%';
  streakEl.textContent  = streakCount;
}

/* ––– timer display ––– */
function updateTimerDisplay(){
  const m = String(Math.floor(countdown/60)).padStart(2,'0');
  const s = String(countdown%60).padStart(2,'0');
  timerEl.textContent = `${m}:${s}`;
}

/* ––– show winner banner ––– */
function showBanner(txt){
  bannerEl.textContent = txt;
  bannerEl.style.display = 'block';
  setTimeout(()=>bannerEl.style.display='none', 3000);
}

/* ––– start & stop the challenge ––– */
function startTimeChallenge(){
  if(inTimeChallenge) return;            // avoid double-start
  inTimeChallenge = true;
  timeBtn.blur();

  // reset scoreboard
  homeScore = 0; awayScore = 0;
  updateScoreUI();

  // init clock
  countdown = 60;                        // 1-minute round
  updateTimerDisplay();

  countdownInterval = setInterval(()=>{
    countdown--;
    updateTimerDisplay();
    if(countdown<=0) endTimeChallenge();
  },1000);
}

function endTimeChallenge(){
  clearInterval(countdownInterval);
  inTimeChallenge = false;

  // decide winner
  let msg = 'tie game!';
  if(awayScore>homeScore) msg = 'away wins!';
  else if(homeScore>awayScore) msg = 'home wins!';

  showBanner(msg.toUpperCase());

  /* === leaderboard update ====================================== */
  const roundScore = totalScore;          // total points this minute
  const rank = recordScore(roundScore);   // −1 if not in Top-10
  if (rank > 0){
    // wait a moment so it appears after the WIN banner fades
    setTimeout(()=>showBanner(`NUMBER ${rank} IN LEADERBOARD!`), 3100);
  }

  // hard-reset for free-shoot mode
  homeScore = awayScore = 0;
  updateScoreUI();
  countdown  = 0;
  updateTimerDisplay();
}

function showMessage(txt, color){
  messageEl.textContent = txt;
  messageEl.style.color = color || '#ffd700';
  messageEl.style.opacity = '1';
  setTimeout(()=>{ messageEl.style.opacity='0'; }, 1500);
}

function checkScore(){
  // only evaluate once and only when descending
  if (shotEvaluated || vel.y >= 0) return;

  for (const rim of hoopRims){
    const planeY = rim.position.y;

    // wait until centre is clearly below rim plane
    if (ball.position.y > planeY - RADIUS) continue;

    // horizontal distance from rim centre = “through the hole” test
    const dx = ball.position.x - rim.position.x;
    const dz = ball.position.z - rim.position.z;
    const dist = Math.hypot(dx, dz);

    const innerR = rim.geometry.parameters.radius -
                   rim.geometry.parameters.tube;    // ring inner radius
    const crossed = shotPassedRimPlane &&
                    ball.position.y < rim.position.y - RADIUS;

    if (crossed && dist < innerR){
      // --- determine team (left hoop = HOME) ---
      const isHome = rim.position.x < 0;

      // --- 2 or 3 points? measure at launch ---
      const startDx = shotStartPos.x - rim.position.x;
      const startDz = shotStartPos.z - rim.position.z;
      const startDist = Math.hypot(startDx, startDz);
      const pts = (startDist > THREE_PT_RADIUS + THREE_PT_EPS) ? 3 : 2;

      /* ----- combo logic ---------------------------------------------------- */
      const basket = isHome ? 'home' : 'away';

      if (streakBasket === basket){
        streakCount += 1;              // extend streak
      }else{
        streakCount  = 1;              // new streak starts
        streakBasket = basket;
      }
      const bonus    = Math.max(0, streakCount - 1); // +1 per extra link
      const swishBonus = hitRimThisShot ? 0 : SWISH_BONUS;   // NEW
      const totalPts   = pts + bonus + swishBonus;           // base + combo + swish

      /* ----- apply score ---------------------------------------------------- */
      if (isHome) homeScore += totalPts; else awayScore += totalPts;
      totalScore += totalPts;
      shotsMade  += 1;

      shotEvaluated = true;
      updateScoreUI();
      playSfx(SFX.tada); 

      /* ----- feedback ------------------------------------------------------- */
      const txt = `${basket.toUpperCase()} ${pts}PT` +
                  (bonus      ? ` +${bonus}🔥`  : '') +
                  (swishBonus ? ' SWISH✨'      : '');
      showMessage(txt, swishBonus ? '#00d9ff'
                                  : (bonus ? '#ffa500' : '#40ff40'));

      return;

    }
  }
}

let lastT = performance.now();

/* click → start timed round */
timeBtn.addEventListener('click', startTimeChallenge);

function animate() {
  requestAnimationFrame(animate);

  /* ---- delta-time ---------------------------------------------------- */
  const now = performance.now();
  const dt  = (now - lastT) / 1000;   // seconds
  lastT     = now;

/* ───────────────── update physics / input ────────────────────────── */
if (inFlight) {
  /* ---- airborne: integrate parabolic flight ---------------------- */
  vel.y += GRAVITY * dt;                  // constant downward g
  ball.position.addScaledVector(vel, dt);
  // update trail
  trailPoints.shift();                          // drop oldest point
  trailPoints.push(ball.position.clone());      // add current position
  trailLine.geometry.setFromPoints(trailPoints);
  syncSpinWithVelocity(vel);
  if (spinSpeed !== 0){
    const angle = spinSpeed * dt;                // Δθ
    ball.rotateOnWorldAxis(spinAxis, -angle);
  }
  if (!shotPassedRimPlane &&
      ball.position.y > targetRimY + RADIUS) {

    // Only count if the ball is horizontally inside the ring cylinder
    const dx = ball.position.x - shotTargetRim.position.x;
    const dz = ball.position.z - shotTargetRim.position.z;
    const innerR = shotTargetRim.geometry.parameters.radius -
                  shotTargetRim.geometry.parameters.tube;

    if (dx*dx + dz*dz < innerR*innerR){
      shotPassedRimPlane = true;    // armed → a proper down-through can now score
    }
  }
  checkScore();
  // rim collision (before ground so we don't miss hits)
  handleRimCollision();
  
  handleBackboardCollision();

  // ground collision + bounce
  handleGroundCollision();                   // ready for next dribble / shot




} else {
  /* ---- Phase-1 planar movement ----------------------------------- */
  const dir = new THREE.Vector3(
      (moveKey.right ? 1 : 0) - (moveKey.left ? 1 : 0),
      0,
      (moveKey.down  ? 1 : 0) - (moveKey.up   ? 1 : 0)
  );

  if (dir.lengthSq() > 0) dir.normalize().multiplyScalar(MOVE_SPEED);
  ballVel.lerp(dir, LERP_FACTOR);
  ball.position.addScaledVector(ballVel, dt);
  syncSpinWithVelocity(ballVel);
  if (spinSpeed !== 0){
    const angle = - spinSpeed * dt;                // Δθ
    ball.rotateOnWorldAxis(spinAxis, angle);
  }

  /* ---- Phase-2 power adjustment ---------------------------------- */
  if (powerKey.up)   shotPower += POWER_STEP * dt;
  if (powerKey.down) shotPower -= POWER_STEP * dt;
  shotPower = THREE.MathUtils.clamp(shotPower, POWER_MIN, POWER_MAX);

  const pct = Math.round(shotPower * 100);
  label.textContent    = `Power ${pct}%  `;
  barInner.style.width = `${pct}%`;

  /* ---- keep ball on the court ------------------------------------ */
  ball.position.x = THREE.MathUtils.clamp(ball.position.x,
                                          COURT_BOUNDS.xMin, COURT_BOUNDS.xMax);
  ball.position.z = THREE.MathUtils.clamp(ball.position.z,
                                          COURT_BOUNDS.zMin, COURT_BOUNDS.zMax);
}


  /* ---- camera controls & render ------------------------------------- */
  controls.enabled = isOrbitEnabled;
  controls.update();
  renderer.render(scene, camera);
}
animate();
