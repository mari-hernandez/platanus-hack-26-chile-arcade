(() => {
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PANEL_WIDTH = GAME_WIDTH / 2;
const MAKEUP_PANEL_WORLD_X = 1000;
const OVERLAY_WORLD_X = 3000;

// DO NOT replace existing keys — they match the physical arcade cabinet wiring.
// To add local testing shortcuts, append extra keys to any array.
const CABINET_KEYS = {
  P1_U: ['w'],
  P1_D: ['s'],
  P1_L: ['a'],
  P1_R: ['d'],
  P1_1: ['u'],
  P1_2: ['i'],
  P1_3: ['o'],
  P1_4: ['j'],
  P1_5: ['k'],
  P1_6: ['l'],
  P2_U: ['ArrowUp'],
  P2_D: ['ArrowDown'],
  P2_L: ['ArrowLeft'],
  P2_R: ['ArrowRight'],
  P2_1: ['r'],
  P2_2: ['t'],
  P2_3: ['y'],
  P2_4: ['f'],
  P2_5: ['g'],
  P2_6: ['h'],
  START1: ['Enter'],
  START2: ['2'],
};

const KEYBOARD_TO_ARCADE = {};
for (const [arcadeCode, keys] of Object.entries(CABINET_KEYS)) {
  for (const key of keys) {
    KEYBOARD_TO_ARCADE[normalizeIncomingKey(key)] = arcadeCode;
  }
}

const HORIZON_Y = 205;
const NEAREST_VISIBLE_DEPTH = 3;
const FARTHEST_VISIBLE_DEPTH = 90;
const ROAD_SLICE_LENGTH = 0.5;
const PERSPECTIVE_SCALE = 1200;
const PERSPECTIVE_HEIGHT = (GAME_HEIGHT - HORIZON_Y) * NEAREST_VISIBLE_DEPTH;
const ROAD_HALF_WIDTH = 0.5;
const ROAD_CENTER_X = PANEL_WIDTH / 2;
const LANE_WIDTH = (ROAD_HALF_WIDTH * 2) / 3;
const CAR_DEPTH = 3.3;
const CAR_SCREEN_Y = HORIZON_Y + PERSPECTIVE_HEIGHT / CAR_DEPTH + 16;
const CAR_IMAGE_SCALE = 0.85;
const FIRST_OBSTACLE_POSITION = 60;
const CRASH_RECOVERY_MS = 1500;
const JUMP_DURATION_MS = 450;
const SELFIE_DURATION_MS = 1800;
const SELFIE_PHOTO_WIDTH = 260;
const SELFIE_PHOTO_HEIGHT = 200;
const JUMP_HEIGHT_PX = 70;
const JUMP_HEIGHT_TO_CLEAR_SPIKES = 0.3;
const LAST_OBSTACLE_MARGIN = 30;
const CAR_STOP_OFFSET = 4;
const DESTINATION_OFFSET = 11;
const DISTANCE_SHARE_TO_REACH_MAX_SPEED = 0.8;
const PROGRESS_STORAGE_KEY = 'makeup-racing:progress';
const RESULTS_DELAY_MS = 1800;
const PROGRESS_BAR_X = 16;
const PROGRESS_BAR_WIDTH = 318;
const START_BUTTONS = ['START1', 'START2', 'P1_1', 'P2_1'];

const PALETTE = {
  ink: 0x1d1230,
  white: 0xffffff,
  pink: 0xff5f9e,
  purple: 0x7a3fe8,
  blue: 0x5bb8ff,
  mint: 0x6fd6b0,
  green: 0x5cb850,
  yellow: 0xffcf4a,
  orange: 0xff8a3d,
  red: 0xe8384f,
  brown: 0x8b5a3c,
  skin: 0xffe3d3,
};

function light(color, amount) {
  return blendColor(color, PALETTE.white, amount);
}

function dark(color, amount) {
  return blendColor(color, PALETTE.ink, amount);
}

function css(color) {
  return `#${color.toString(16).padStart(6, '0')}`;
}

const FONTS = {
  display: 'Arial Black, Impact, sans-serif',
  body: 'Trebuchet MS, Arial',
};

const FONT_SIZES = {
  body: '18px',
  large: '22px',
  heading: '32px',
  display: '52px',
  hero: '76px',
};

const UI = {
  radius: 14,
  accentWidth: 5,
  shadowOffset: 5,
  shadow: dark(PALETTE.purple, 0.35),
  textStroke: dark(PALETTE.purple, 0.55),
  surface: PALETTE.white,
  surfaceSoft: light(PALETTE.pink, 0.88),
  accent: PALETTE.purple,
  accentLight: light(PALETTE.purple, 0.25),
  idle: light(PALETTE.purple, 0.85),
};

function drawPanel(graphics, centerX, centerY, width, height, options = {}) {
  const { isSelected = false, fill = UI.surface } = options;
  const left = centerX - width / 2;
  const top = centerY - height / 2;
  const radius = Math.min(UI.radius, width / 4, height / 4);
  graphics.fillStyle(UI.shadow, 0.3);
  graphics.fillRoundedRect(left, top + UI.shadowOffset, width, height, radius);
  if (isSelected) {
    graphics.fillStyle(UI.accent, 1);
    graphics.fillRoundedRect(left - UI.accentWidth, top - UI.accentWidth, width + UI.accentWidth * 2, height + UI.accentWidth * 2, radius + UI.accentWidth);
  }
  graphics.fillStyle(fill, 1);
  graphics.fillRoundedRect(left, top, width, height, radius);
}

function drawButton(graphics, centerX, centerY, width, height, isSelected) {
  const left = centerX - width / 2;
  const top = centerY - height / 2;
  const radius = Math.min(UI.radius, height / 2);
  graphics.fillStyle(UI.shadow, 0.3);
  graphics.fillRoundedRect(left, top + UI.shadowOffset, width, height, radius);
  graphics.fillStyle(isSelected ? UI.accent : UI.idle, 1);
  graphics.fillRoundedRect(left, top, width, height, radius);
  if (!isSelected) return;
  graphics.fillStyle(UI.accentLight, 1);
  graphics.fillRoundedRect(left + 10, top + 4, width - 20, 6, 3);
}

const TEXT_STYLES = {
  onDark: {
    fontFamily: FONTS.body,
    fontStyle: 'bold',
    fontSize: FONT_SIZES.body,
    color: css(PALETTE.white),
    stroke: css(UI.textStroke),
    strokeThickness: 6,
    align: 'center',
  },
  onLight: {
    fontFamily: FONTS.body,
    fontStyle: 'bold',
    fontSize: FONT_SIZES.body,
    color: css(dark(PALETTE.pink, 0.3)),
    align: 'center',
  },
  display: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.display,
    color: css(PALETTE.pink),
    stroke: css(UI.textStroke),
    strokeThickness: 10,
  },
  button: {
    fontFamily: FONTS.body,
    fontStyle: 'bold',
    fontSize: FONT_SIZES.large,
    color: css(PALETTE.white),
  },
};

const COLORS = {
  background: PALETTE.ink,
  sunGlow: light(PALETTE.yellow, 0.7),
  sun: light(PALETTE.yellow, 0.85),
  cloud: PALETTE.white,
  curbPink: PALETTE.pink,
  curbWhite: light(PALETTE.pink, 0.92),
  asphaltLight: light(PALETTE.ink, 0.3),
  asphaltDark: light(PALETTE.ink, 0.27),
  laneLine: light(PALETTE.yellow, 0.9),
  shadow: dark(PALETTE.green, 0.55),
  trunk: PALETTE.brown,
  leaves: PALETTE.green,
  leavesHighlight: light(PALETTE.green, 0.25),
  blossom: light(PALETTE.pink, 0.35),
  blossomHighlight: light(PALETTE.pink, 0.65),
  pineTrunk: dark(PALETTE.brown, 0.1),
  pineDark: dark(PALETTE.mint, 0.4),
  pineLight: dark(PALETTE.mint, 0.25),
  bush: PALETTE.green,
  flowerPink: light(PALETTE.pink, 0.2),
  flowerYellow: light(PALETTE.yellow, 0.4),
  windshield: light(PALETTE.blue, 0.6),
  driverHair: dark(PALETTE.brown, 0.6),
  passengerHair: PALETTE.brown,
  carBody: PALETTE.yellow,
  carHighlight: light(PALETTE.yellow, 0.4),
  carShade: dark(PALETTE.yellow, 0.15),
  tire: PALETTE.ink,
  bumper: light(PALETTE.ink, 0.2),
  tailLight: PALETTE.red,
  tailLightGlow: light(PALETTE.red, 0.5),
  plate: PALETTE.white,
  trafficBodies: [PALETTE.mint, light(PALETTE.purple, 0.4), PALETTE.blue, light(PALETTE.orange, 0.25)],
  trafficGlass: light(PALETTE.ink, 0.1),
  barrierStripe: PALETTE.pink,
  barrierLeg: light(PALETTE.ink, 0.35),
  cone: PALETTE.orange,
  spikeMetal: light(PALETTE.ink, 0.85),
  spikeShade: light(PALETTE.ink, 0.5),
  crashFlash: light(PALETTE.pink, 0.2),
  skin: PALETTE.skin,
  skinShade: dark(PALETTE.skin, 0.1),
  noseTip: light(PALETTE.pink, 0.6),
  outline: dark(PALETTE.brown, 0.4),
  hair: light(PALETTE.brown, 0.08),
  hairDark: dark(PALETTE.brown, 0.25),
  hairShine: light(PALETTE.brown, 0.35),
  iris: PALETTE.blue,
  irisDark: dark(PALETTE.blue, 0.5),
  irisLight: light(PALETTE.blue, 0.6),
  shopWall: light(PALETTE.yellow, 0.9),
  shopTrim: light(PALETTE.mint, 0.3),
  iceCreamCone: dark(PALETTE.yellow, 0.1),
  coneLines: dark(PALETTE.yellow, 0.3),
  scoopStrawberry: light(PALETTE.pink, 0.45),
  scoopMint: light(PALETTE.mint, 0.3),
  scoopVanilla: light(PALETTE.yellow, 0.8),
  cherry: PALETTE.red,
  windowLight: light(PALETTE.yellow, 0.85),
  lampPost: light(PALETTE.ink, 0.2),
  lampBulb: light(PALETTE.yellow, 0.6),
  buildingColors: [light(PALETTE.pink, 0.5), light(PALETTE.blue, 0.55), light(PALETTE.yellow, 0.55), light(PALETTE.purple, 0.55)],
  cinemaWall: dark(PALETTE.purple, 0.2),
  cinemaTrim: dark(PALETTE.purple, 0.45),
  marquee: light(PALETTE.yellow, 0.2),
  curtain: dark(PALETTE.pink, 0.15),
  deck: light(PALETTE.brown, 0.3),
  chapelWall: light(PALETTE.pink, 0.97),
  chapelRoof: light(PALETTE.pink, 0.5),
  bell: PALETTE.yellow,
  bone: light(PALETTE.yellow, 0.85),
  flameRed: PALETTE.red,
  flameOrange: PALETTE.orange,
  flameYellow: light(PALETTE.yellow, 0.3),
  roofRed: dark(PALETTE.red, 0.25),
  bottleMilk: PALETTE.white,
  bottleRing: PALETTE.blue,
  nipple: light(PALETTE.orange, 0.55),
  makeupTop: light(PALETTE.pink, 0.8),
  makeupBottom: light(PALETTE.pink, 0.55),
};

const LEVELS = [
  {
    name: 'Primera cita',
    arrivalText: 'Llegaron a la primera cita',
    distance: 600,
    startingSpeed: 14,
    maxSpeed: 26,
    obstacleGap: [12, 18],
    twoLaneChance: 0.15,
    obstacles: ['traffic', 'cones', 'spikes'],
    spikeRowChance: 0.08,
    horizon: 'mountains',
    isNight: false,
    cloudOpacity: 0.9,
    scenery: ['roundTree', 'roundTree', 'blossomTree', 'pine', 'flowerBush'],
    sceneryDensity: 0.4,
    selfiesNeeded: 0,
    music: 'date',
    selfie: { shirt: PALETTE.blue, hasBowTie: false, prop: 'none' },
    colors: {
      skyTop: PALETTE.blue,
      skyBottom: light(PALETTE.pink, 0.8),
      sun: light(PALETTE.yellow, 0.85),
      sunGlow: light(PALETTE.yellow, 0.7),
      fog: light(PALETTE.purple, 0.85),
      mountains: light(PALETTE.purple, 0.4),
      hills: light(PALETTE.green, 0.25),
      grassLight: light(PALETTE.green, 0.15),
      grassDark: PALETTE.green,
      sand: light(PALETTE.yellow, 0.65),
    },
    outfit: { style: 'blouse', color: light(PALETTE.purple, 0.5), shade: light(PALETTE.purple, 0.3) },
    drawDestination: drawIceCreamShop,
  },
  {
    name: 'Salida de noche',
    arrivalText: 'Llegaron al cine',
    distance: 800,
    startingSpeed: 16,
    maxSpeed: 30,
    obstacleGap: [10, 16],
    twoLaneChance: 0.3,
    obstacles: ['traffic', 'traffic', 'barrier', 'cones', 'spikes'],
    spikeRowChance: 0.12,
    horizon: 'city',
    isNight: true,
    cloudOpacity: 0.18,
    scenery: ['building', 'building', 'lamp'],
    sceneryDensity: 0.7,
    selfiesNeeded: 1,
    music: 'night',
    selfie: { shirt: dark(PALETTE.purple, 0.3), hasBowTie: false, prop: 'popcorn' },
    colors: {
      skyTop: dark(PALETTE.purple, 0.75),
      skyBottom: dark(PALETTE.purple, 0.2),
      sun: light(PALETTE.yellow, 0.85),
      sunGlow: light(PALETTE.orange, 0.6),
      fog: dark(PALETTE.purple, 0.45),
      mountains: dark(PALETTE.purple, 0.6),
      hills: dark(PALETTE.purple, 0.4),
      grassLight: light(PALETTE.ink, 0.5),
      grassDark: light(PALETTE.ink, 0.46),
      sand: light(PALETTE.ink, 0.4),
    },
    outfit: { style: 'party', color: dark(PALETTE.blue, 0.6), shade: dark(PALETTE.blue, 0.75) },
    drawDestination: drawCinema,
  },
  {
    name: 'Boda',
    arrivalText: 'Llegaron a la boda',
    distance: 1000,
    startingSpeed: 18,
    maxSpeed: 33,
    obstacleGap: [9, 14],
    twoLaneChance: 0.4,
    obstacles: ['traffic', 'barrier', 'cones', 'spikes'],
    spikeRowChance: 0.15,
    horizon: 'mountains',
    isNight: false,
    cloudOpacity: 0.9,
    scenery: ['blossomTree', 'blossomTree', 'roundTree', 'flowerBush'],
    sceneryDensity: 0.5,
    selfiesNeeded: 2,
    music: 'wedding',
    selfie: { shirt: dark(PALETTE.purple, 0.65), hasBowTie: true, prop: 'confetti' },
    colors: {
      skyTop: light(PALETTE.pink, 0.45),
      skyBottom: light(PALETTE.yellow, 0.75),
      sun: light(PALETTE.yellow, 0.85),
      sunGlow: light(PALETTE.orange, 0.55),
      fog: light(PALETTE.pink, 0.85),
      mountains: light(PALETTE.purple, 0.5),
      hills: light(PALETTE.green, 0.4),
      grassLight: light(PALETTE.green, 0.3),
      grassDark: light(PALETTE.green, 0.2),
      sand: light(PALETTE.pink, 0.9),
    },
    outfit: { style: 'bride', color: light(PALETTE.pink, 0.97), shade: light(PALETTE.purple, 0.8) },
    drawDestination: drawChapel,
  },
  {
    name: 'Wawa',
    arrivalText: 'Llegaron a casa con la wawa',
    distance: 1200,
    startingSpeed: 20,
    maxSpeed: 36,
    obstacleGap: [8, 12],
    twoLaneChance: 0.5,
    obstacles: ['traffic', 'traffic', 'barrier', 'cones', 'spikes'],
    spikeRowChance: 0.2,
    horizon: 'lake',
    isNight: false,
    cloudOpacity: 0.12,
    scenery: ['fire', 'fire', 'skull', 'bones'],
    sceneryDensity: 0.45,
    selfiesNeeded: 3,
    music: 'metal',
    selfie: { shirt: PALETTE.blue, hasBowTie: false, prop: 'baby', isExhausted: true },
    hasCryingBaby: true,
    colors: {
      skyTop: dark(PALETTE.red, 0.8),
      skyBottom: dark(PALETTE.orange, 0.25),
      sun: light(PALETTE.yellow, 0.4),
      sunGlow: PALETTE.orange,
      fog: dark(PALETTE.red, 0.45),
      mountains: dark(PALETTE.red, 0.65),
      hills: PALETTE.orange,
      grassLight: dark(PALETTE.red, 0.6),
      grassDark: dark(PALETTE.red, 0.65),
      sand: dark(PALETTE.red, 0.8),
    },
    outfit: { style: 'hoodie', color: light(PALETTE.mint, 0.25), shade: PALETTE.mint },
    drawDestination: drawHomeWithBaby,
  },
];

const SCENERY_DRAWERS = {
  roundTree: (graphics, x, groundY, size, fogged) => drawRoundTree(graphics, x, groundY, size, fogged, false),
  blossomTree: (graphics, x, groundY, size, fogged) => drawRoundTree(graphics, x, groundY, size, fogged, true),
  pine: drawPine,
  flowerBush: drawFlowerBush,
  building: drawBuilding,
  lamp: drawLamp,
  fire: drawFire,
  skull: drawSkull,
  bones: drawBones,
};

let currentLevel = LEVELS[0];
const ALL_LEVELS_UNLOCKED = true;
let unlockedLevelCount = ALL_LEVELS_UNLOCKED ? LEVELS.length : 1;
let hasLoadedProgress = false;

new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-root',
  backgroundColor: css(COLORS.background),
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  scene: { create, update },
});

function create(data) {
  const scene = this;
  const options = data || {};
  scene.levelIndex = options.levelIndex || 0;
  currentLevel = LEVELS[scene.levelIndex];
  createControls(scene);

  scene.cameras.main.setViewport(0, 0, PANEL_WIDTH, GAME_HEIGHT);
  scene.makeupCamera = scene.cameras.add(PANEL_WIDTH, 0, PANEL_WIDTH, GAME_HEIGHT).setScroll(MAKEUP_PANEL_WORLD_X, 0);
  scene.overlayCamera = scene.cameras.add(0, 0, GAME_WIDTH, GAME_HEIGHT).setScroll(OVERLAY_WORLD_X, 0);

  scene.race = {
    distance: 0,
    speed: 0,
    cameraX: 0,
    lane: 0,
    carX: 0,
    crashes: 0,
    recoveringUntil: 0,
    jumpStartedAt: -JUMP_DURATION_MS,
    obstacles: [],
    nextObstaclePosition: FIRST_OBSTACLE_POSITION,
  };
  createSky(scene);
  scene.roadGraphics = scene.add.graphics();
  scene.roadSlices = [];
  scene.obstacleGraphics = scene.add.graphics();
  createCar(scene);
  createHud(scene);
  createMakeupPanel(scene);
  createTitleScreen(scene);
  createLevelSelectScreen(scene);
  loadProgress(scene);

  if (options.startLevel) startLevel(scene);
  else if (options.showLevelSelect) showLevelSelect(scene, options.selectedLevel);
  else showTitle(scene);
}

function update(time, delta) {
  const scene = this;
  const seconds = Math.min(delta, 50) / 1000;
  const startPressed = START_BUTTONS.some((button) => wasPressed(scene, button));
  if (scene.phase === 'title' && startPressed) showLevelSelect(scene, unlockedLevelCount - 1);
  else if (scene.phase === 'select') updateLevelSelect(scene, startPressed);
  else if (scene.phase === 'intro' && startPressed) beginDriving(scene);
  else if (scene.phase === 'results') updateResultsMenu(scene, startPressed);

  if (scene.phase === 'playing' || scene.phase === 'arriving') driveRace(scene, time, seconds);
  if (scene.phase === 'playing') updateMakeup(scene);
  updateSky(scene, seconds);
  drawRoad(scene);
  drawObstacles(scene);
  updateCar(scene, time);
  updateHud(scene);
  updateEngineSound(scene);
  updateMusic(scene, time);
  scene.controls.pressed = Object.create(null);
}

function startLevel(scene) {
  playMusic(scene, currentLevel.music);
  scene.controls.pressed = Object.create(null);
  if (currentLevel.selfiesNeeded > 0) showSelfieIntro(scene);
  else beginDriving(scene);
}

function beginDriving(scene) {
  scene.phase = 'playing';
  if (scene.selfieIntro) scene.selfieIntro.setVisible(false);
  scene.race.speed = currentLevel.startingSpeed;
  scene.overlayCamera.setVisible(false);
  scene.controls.pressed = Object.create(null);
  playSound(scene, 'paint');
}

function showSelfieIntro(scene) {
  scene.phase = 'intro';
  const centerX = OVERLAY_WORLD_X + GAME_WIDTH / 2;
  const needed = currentLevel.selfiesNeeded;
  const dimmer = scene.add.rectangle(centerX, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, UI.shadow, 0.45);
  const panel = scene.add.graphics();
  drawPanel(panel, centerX, 300, 440, 300, { isSelected: true, fill: UI.surfaceSoft });
  const title = scene.add.text(centerX, 200, '\u00a1Hora de selfies!', { ...TEXT_STYLES.display, fontSize: FONT_SIZES.heading }).setOrigin(0.5);
  const camera = scene.add.graphics({ x: centerX - 70, y: 292 }).setScale(2.6);
  drawCameraIcon(camera, 0, 0, PALETTE.purple);
  const dots = scene.add.graphics();
  for (let selfie = 0; selfie < needed; selfie++) {
    dots.fillStyle(PALETTE.pink, 1);
    dots.fillCircle(centerX + 40 + (selfie - (needed - 1) / 2) * 30, 296, 11);
  }
  const howTo = scene.add.text(centerX, 378, 'J2 \u00b7 Bot\u00f3n 2', { ...TEXT_STYLES.onLight, fontSize: FONT_SIZES.large, color: css(PALETTE.purple) }).setOrigin(0.5);
  scene.selfieIntro = scene.add.container(0, 0, [dimmer, panel, title, camera, dots, howTo]);
  scene.titleLayer.setVisible(false);
  scene.levelSelectLayer.setVisible(false);
  scene.overlayCamera.setVisible(true);
  scene.time.delayedCall(3500, () => {
    if (scene.phase === 'intro') beginDriving(scene);
  });
}

function showTitle(scene) {
  scene.phase = 'title';
  playMusic(scene, 'menu');
  scene.titleLayer.setVisible(true);
  scene.levelSelectLayer.setVisible(false);
  scene.overlayCamera.setVisible(true);
}

function showLevelSelect(scene, selectedLevel) {
  scene.phase = 'select';
  playMusic(scene, 'menu');
  scene.selectedLevel = Phaser.Math.Clamp(selectedLevel || 0, 0, LEVELS.length - 1);
  scene.titleLayer.setVisible(false);
  scene.levelSelectLayer.setVisible(true);
  scene.overlayCamera.setVisible(true);
  scene.controls.pressed = Object.create(null);
  refreshLevelSelect(scene);
}

function updateLevelSelect(scene, startPressed) {
  const step = ['P1_R', 'P2_R'].some((button) => wasPressed(scene, button)) ? 1 : ['P1_L', 'P2_L'].some((button) => wasPressed(scene, button)) ? -1 : 0;
  if (step !== 0) {
    scene.selectedLevel = Phaser.Math.Clamp(scene.selectedLevel + step, 0, LEVELS.length - 1);
    playSound(scene, 'select');
    refreshLevelSelect(scene);
  }
  if (!startPressed) return;
  if (scene.selectedLevel < unlockedLevelCount) scene.scene.restart({ levelIndex: scene.selectedLevel, startLevel: true });
  else playSound(scene, 'crash');
}

function driveRace(scene, time, seconds) {
  const race = scene.race;
  steerCar(scene, time, seconds);
  if (scene.phase === 'playing') {
    const progressToMaxSpeed = Math.min(1, race.distance / (currentLevel.distance * DISTANCE_SHARE_TO_REACH_MAX_SPEED));
    const cruisingSpeed = currentLevel.startingSpeed + (currentLevel.maxSpeed - currentLevel.startingSpeed) * progressToMaxSpeed;
    race.speed += (cruisingSpeed - race.speed) * Math.min(1, seconds * 0.8);
  } else {
    const stopPosition = currentLevel.distance + CAR_STOP_OFFSET;
    race.speed = Math.max(0, Math.min(race.speed, (stopPosition - race.distance) * 2.5));
  }
  race.distance += race.speed * seconds;
  spawnObstacles(race);
  if (scene.phase !== 'playing') return;
  detectCrash(scene, time);
  if (race.distance >= currentLevel.distance) arriveAtDestination(scene);
}

function arriveAtDestination(scene) {
  scene.phase = 'arriving';
  scene.time.delayedCall(RESULTS_DELAY_MS, () => showResults(scene));
}

function replaceTexture(scene, painter, key, width, height) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  painter.generateTexture(key, width, height);
}

function createFaceTexture(scene, key, look, width, height, scale, background) {
  const painter = scene.make.graphics({ x: 0, y: 0 }, false);
  painter.fillStyle(background, 1);
  painter.fillRect(0, 0, width, height);
  drawFace(painter, width / 2, height / 2 + 6, scale, look);
  replaceTexture(scene, painter, key, width, height);
  painter.destroy();
}

function drawOverlayLandscape(graphics, level) {
  graphics.clear();
  drawLandscape(graphics, level, { left: OVERLAY_WORLD_X, top: 0, width: GAME_WIDTH, horizonY: 488, bottom: GAME_HEIGHT, scale: 2, sunY: 110 });
  return graphics;
}

function addBlinkingPrompt(scene, text) {
  const prompt = scene.add
    .text(OVERLAY_WORLD_X + GAME_WIDTH / 2, 562, text, { ...TEXT_STYLES.onDark, fontSize: FONT_SIZES.large })
    .setOrigin(0.5);
  scene.tweens.add({ targets: prompt, alpha: 0.25, duration: 600, yoyo: true, repeat: -1 });
  return prompt;
}

function createTitleScreen(scene) {
  const left = OVERLAY_WORLD_X;
  const centerX = left + GAME_WIDTH / 2;
  const art = drawOverlayLandscape(scene.add.graphics(), LEVELS[0]);
  art.fillStyle(COLORS.asphaltLight, 1);
  art.fillRect(left, 560, GAME_WIDTH, 40);
  art.fillStyle(COLORS.laneLine, 1);
  for (let dashX = left + 20; dashX < left + GAME_WIDTH; dashX += 60) art.fillRect(dashX, 578, 30, 4);
  const car = scene.add.image(left + 160, 598, 'car').setOrigin(0.5, 1).setScale(0.8);

  const makeupWord = scene.add
    .text(centerX + 8, 140, 'Makeup', { ...TEXT_STYLES.display, fontSize: FONT_SIZES.hero })
    .setOrigin(1, 0.5);
  const racingWord = scene.add
    .text(centerX + 18, 160, 'Racing', { ...TEXT_STYLES.display, fontSize: FONT_SIZES.hero, fontStyle: 'italic', color: css(PALETTE.purple), stroke: css(dark(PALETTE.red, 0.6)) })
    .setOrigin(0, 0.5);
  for (const word of [makeupWord, racingWord]) word.setShadow(0, 6, css(UI.textStroke), 0, true, true);
  const titleGap = 14;
  const titleLeft = centerX - (makeupWord.width + titleGap + racingWord.width) / 2;
  makeupWord.setOrigin(0, 0.5).setX(titleLeft);
  racingWord.setX(titleLeft + makeupWord.width + titleGap);
  const subtitle = scene.add
    .text(centerX, 236, 'Llega a cada destino con el look perfecto', { ...TEXT_STYLES.onDark, fontSize: FONT_SIZES.large })
    .setOrigin(0.5);

  const playButton = scene.add.graphics();
  drawButton(playButton, 0, 0, 230, 72, true);
  const playLabel = scene.add
    .text(0, 0, 'JUGAR', { ...TEXT_STYLES.button, fontSize: FONT_SIZES.heading })
    .setOrigin(0.5);
  const button = scene.add.container(centerX, 330, [playButton, playLabel]);
  scene.tweens.add({ targets: button, scale: 1.08, duration: 500, yoyo: true, repeat: -1 });
  const controlCards = [
    [centerX - 140, '\u25c0 \u25b6  \u25b2'],
    [centerX + 140, '\u25b2 \u25bc  \u25c0 \u25b6'],
  ];
  for (const [cardX] of controlCards) drawPanel(art, cardX, 424, 230, 58);
  drawPartIcon(art, 'lips', centerX + 140 - 82, 424, PALETTE.red);
  drawCameraIcon(art, centerX + 140 + 82, 426, PALETTE.purple);
  const driverIcon = scene.add.image(centerX - 140 - 72, 444, 'car').setOrigin(0.5, 1).setScale(0.36);
  const controlTexts = controlCards.map(([cardX, arrows]) =>
    scene.add.text(cardX + (cardX > centerX ? 0 : 22), 424, arrows, { ...TEXT_STYLES.onLight, fontSize: FONT_SIZES.large, color: css(PALETTE.purple) }).setOrigin(0.5),
  );
  scene.titleLayer = scene.add.container(0, 0, [art, car, makeupWord, racingWord, subtitle, button, driverIcon, ...controlTexts]);
}

function createLevelSelectScreen(scene) {
  const centerX = OVERLAY_WORLD_X + GAME_WIDTH / 2;
  scene.levelSelectBackground = scene.add.graphics();
  const heading = scene.add.text(centerX, 74, 'Elige el destino', TEXT_STYLES.display).setOrigin(0.5);
  heading.setShadow(0, 5, css(UI.textStroke), 0, true, true);
  scene.levelCardsGraphics = scene.add.graphics();
  scene.levelNameTexts = LEVELS.map(() => scene.add.text(0, 0, '', { ...TEXT_STYLES.onLight, wordWrap: { width: 150 } }).setOrigin(0.5));
  const hint = scene.add.text(centerX, 524, '\u25c0  \u25b6', { ...TEXT_STYLES.onDark, fontSize: FONT_SIZES.heading }).setOrigin(0.5);
  scene.levelSelectLayer = scene.add.container(0, 0, [scene.levelSelectBackground, heading, scene.levelCardsGraphics, ...scene.levelNameTexts, hint]);
}

function refreshLevelSelect(scene) {
  drawOverlayLandscape(scene.levelSelectBackground, LEVELS[scene.selectedLevel]);
  const graphics = scene.levelCardsGraphics;
  graphics.clear();
  LEVELS.forEach((level, index) => {
    const isSelected = index === scene.selectedLevel;
    const isLocked = index >= unlockedLevelCount;
    const centerX = OVERLAY_WORLD_X + 105 + index * 197;
    const centerY = isSelected ? 288 : 300;
    const top = centerY - 140;
    drawPanel(graphics, centerX, top + 122, isSelected ? 182 : 170, isSelected ? 256 : 244, { isSelected });
    drawLandscape(graphics, level, { left: centerX - 72, top: top + 13, width: 144, horizonY: top + 112, bottom: top + 183, scale: 0.6, sunY: top + 42 });
    graphics.fillStyle(COLORS.asphaltLight, 1);
    graphics.fillTriangle(centerX - 12, top + 133, centerX + 12, top + 133, centerX + 40, top + 183);
    graphics.fillTriangle(centerX - 12, top + 133, centerX + 40, top + 183, centerX - 40, top + 183);
    level.drawDestination(graphics, { x: centerX, y: top + 140, scale: 64 }, (color) => color);
    if (isLocked) {
      graphics.fillStyle(UI.shadow, 0.6);
      graphics.fillRect(centerX - 72, top + 13, 144, 170);
      graphics.lineStyle(6, COLORS.bell, 1);
      graphics.beginPath();
      graphics.arc(centerX, top + 88, 14, Math.PI, 0);
      graphics.strokePath();
      graphics.fillStyle(COLORS.bell, 1);
      graphics.fillRoundedRect(centerX - 20, top + 88, 40, 32, 6);
      graphics.fillStyle(COLORS.background, 1);
      graphics.fillCircle(centerX, top + 102, 5);
    }
    scene.levelNameTexts[index]
      .setPosition(centerX, top + 212).setText(level.name).setColor(isLocked ? css(light(PALETTE.ink, 0.5)) : css(dark(PALETTE.pink, 0.3)));
  });
}

function loadProgress(scene) {
  if (ALL_LEVELS_UNLOCKED || hasLoadedProgress || !window.platanusArcadeStorage) return;
  hasLoadedProgress = true;
  window.platanusArcadeStorage
    .get(PROGRESS_STORAGE_KEY)
    .then((result) => {
      const saved = result && result.found && result.value ? result.value.unlockedLevelCount : null;
      if (!Number.isInteger(saved)) return;
      unlockedLevelCount = Phaser.Math.Clamp(saved, 1, LEVELS.length);
      if (scene.phase === 'select') refreshLevelSelect(scene);
    })
    .catch(() => {});
}

function saveProgress() {
  if (!window.platanusArcadeStorage) return;
  window.platanusArcadeStorage.set(PROGRESS_STORAGE_KEY, { unlockedLevelCount }).catch(() => {});
}

function showResults(scene) {
  scene.phase = 'results';
  const centerX = OVERLAY_WORLD_X + GAME_WIDTH / 2;
  const makeup = scene.makeup;
  const matchingCount = MAKEUP_PARTS.filter((part, index) => isPartMatching(makeup, index)).length;
  const isPerfectLook = matchingCount === MAKEUP_PARTS.length;
  const hasAllSelfies = makeup.selfiesTaken >= currentLevel.selfiesNeeded;
  const isPerfect = isPerfectLook && hasAllSelfies;
  const nextLevel = scene.levelIndex + 1;
  const hasNextLevel = nextLevel < LEVELS.length;
  const unlocksNextLevel = isPerfect && hasNextLevel && nextLevel >= unlockedLevelCount;
  if (unlocksNextLevel) {
    unlockedLevelCount = nextLevel + 1;
    saveProgress();
  }

  const dimmer = scene.add.rectangle(centerX, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, UI.shadow, 0.45);
  const panel = scene.add.graphics({ x: centerX, y: 300 });
  drawPanel(panel, 0, 0, 480, 400, { isSelected: true, fill: UI.surfaceSoft });
  const title = scene.add
    .text(centerX, 152, isPerfect ? '\u00a1Felicidades, ganaron!' : '\u00a1Vuelvan a intentarlo!', {
      ...TEXT_STYLES.display,
      fontSize: FONT_SIZES.heading,
      color: isPerfect ? css(PALETTE.pink) : css(PALETTE.purple),
    })
    .setOrigin(0.5);
  const summary = scene.add
    .text(centerX, 198, [
        `Look ${matchingCount}/${MAKEUP_PARTS.length}`,
        currentLevel.selfiesNeeded ? `Selfies ${makeup.selfiesTaken}/${currentLevel.selfiesNeeded}` : '',
        `${scene.race.crashes} ${scene.race.crashes === 1 ? 'choque' : 'choques'}`,
      ]
        .filter(Boolean)
        .join('   \u00b7   '), { ...TEXT_STYLES.onLight, fontSize: FONT_SIZES.large })
    .setOrigin(0.5);
  const unlockNotice = scene.add
    .text(centerX, 226, unlocksNextLevel ? `Desbloquearon: ${LEVELS[nextLevel].name}` : '', { ...TEXT_STYLES.onLight, color: css(PALETTE.purple) })
    .setOrigin(0.5);

  const retryOption = ['Reintentar', { levelIndex: scene.levelIndex, startLevel: true }];
  const nextOption = ['Siguiente nivel', { levelIndex: nextLevel, startLevel: true }];
  scene.resultOptions = [
    isPerfect && hasNextLevel ? nextOption : retryOption,
    ['Elegir nivel', { levelIndex: scene.levelIndex, showLevelSelect: true, selectedLevel: isPerfect && hasNextLevel ? nextLevel : scene.levelIndex }],
    ['Men\u00fa principal', { levelIndex: scene.levelIndex }],
  ].map(([label, restartOptions], index) => {
    const y = 286 + index * 66;
    const button = scene.add.graphics({ x: centerX, y });
    const text = scene.add
      .text(centerX, y, label, TEXT_STYLES.button)
      .setOrigin(0.5);
    return { button, text, restartOptions };
  });
  scene.selectedResultOption = 0;
  refreshResultsMenu(scene);
  scene.add.container(0, 0, [dimmer, panel, title, summary, unlockNotice, ...scene.resultOptions.flatMap((option) => [option.button, option.text])]);
  scene.titleLayer.setVisible(false);
  scene.levelSelectLayer.setVisible(false);
  scene.overlayCamera.setVisible(true);
  playMusic(scene, null);
  playMelody(scene, isPerfect ? [523, 659, 784, 1047] : [392, 330, 262]);
}

function refreshResultsMenu(scene) {
  scene.resultOptions.forEach((option, index) => {
    const isSelected = index === scene.selectedResultOption;
    option.button.clear();
    drawButton(option.button, 0, 0, 300, 54, isSelected);
    option.text.setColor(isSelected ? css(PALETTE.white) : css(dark(PALETTE.purple, 0.45)));
  });
}

function updateResultsMenu(scene, startPressed) {
  const step = ['P1_D', 'P2_D'].some((button) => wasPressed(scene, button)) ? 1 : ['P1_U', 'P2_U'].some((button) => wasPressed(scene, button)) ? -1 : 0;
  if (step !== 0) {
    const optionCount = scene.resultOptions.length;
    scene.selectedResultOption = (scene.selectedResultOption + step + optionCount) % optionCount;
    playSound(scene, 'select');
    refreshResultsMenu(scene);
  }
  if (startPressed) scene.scene.restart(scene.resultOptions[scene.selectedResultOption].restartOptions);
}

function drawIceCream(graphics, x, bottomY, height, fogged = (color) => color) {
  const coneTopY = bottomY - height * 0.55;
  graphics.fillStyle(fogged(COLORS.iceCreamCone), 1);
  graphics.fillTriangle(x - height * 0.2, coneTopY, x + height * 0.2, coneTopY, x, bottomY);
  graphics.lineStyle(Math.max(1, height * 0.015), fogged(COLORS.coneLines), 1);
  graphics.lineBetween(x - height * 0.12, coneTopY, x + height * 0.06, bottomY - height * 0.18);
  graphics.lineBetween(x + height * 0.12, coneTopY, x - height * 0.06, bottomY - height * 0.18);
  graphics.fillStyle(fogged(COLORS.scoopStrawberry), 1);
  graphics.fillCircle(x - height * 0.1, coneTopY - height * 0.06, height * 0.16);
  graphics.fillStyle(fogged(COLORS.scoopMint), 1);
  graphics.fillCircle(x + height * 0.1, coneTopY - height * 0.06, height * 0.16);
  graphics.fillStyle(fogged(COLORS.scoopVanilla), 1);
  graphics.fillCircle(x, coneTopY - height * 0.24, height * 0.16);
  graphics.fillStyle(fogged(COLORS.cherry), 1);
  graphics.fillCircle(x, coneTopY - height * 0.42, height * 0.05);
}

function currentSliceIndex(race) {
  return Math.floor(race.distance / ROAD_SLICE_LENGTH);
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function seededRandom(sliceIndex, salt) {
  const value = Math.sin(sliceIndex * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function blendColor(from, to, amount) {
  const channel = (shift) => {
    const start = (from >> shift) & 255;
    return (start + (((to >> shift) & 255) - start) * amount) | 0;
  };
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

function fillTrapezoid(graphics, color, near, far, offsetInRoadWidths, halfWidthInRoadWidths) {
  const nearX = near.x + offsetInRoadWidths * near.halfWidth;
  const farX = far.x + offsetInRoadWidths * far.halfWidth;
  const nearHalf = halfWidthInRoadWidths * near.halfWidth;
  const farHalf = halfWidthInRoadWidths * far.halfWidth;
  graphics.fillStyle(color, 1);
  graphics.fillTriangle(nearX - nearHalf, near.y, nearX + nearHalf, near.y, farX + farHalf, far.y);
  graphics.fillTriangle(nearX - nearHalf, near.y, farX + farHalf, far.y, farX - farHalf, far.y);
}

function projectRoadSlices(scene) {
  const race = scene.race;
  const firstSlice = currentSliceIndex(race);
  const progressIntoSlice = race.distance / ROAD_SLICE_LENGTH - firstSlice;
  const sliceCount = Math.ceil((FARTHEST_VISIBLE_DEPTH - NEAREST_VISIBLE_DEPTH) / ROAD_SLICE_LENGTH);

  for (let index = 0; index <= sliceCount; index++) {
    const depth = NEAREST_VISIBLE_DEPTH + (index - progressIntoSlice) * ROAD_SLICE_LENGTH;
    const scale = PERSPECTIVE_SCALE / depth;
    const slice = scene.roadSlices[index] || (scene.roadSlices[index] = {});
    slice.x = ROAD_CENTER_X - race.cameraX * scale;
    slice.y = HORIZON_Y + PERSPECTIVE_HEIGHT / depth;
    slice.halfWidth = ROAD_HALF_WIDTH * scale;
    slice.scale = scale;
    slice.depth = depth;
    slice.index = firstSlice + index;
  }
  return sliceCount;
}

function drawRoad(scene) {
  const graphics = scene.roadGraphics;
  const slices = scene.roadSlices;
  const sliceCount = projectRoadSlices(scene);
  graphics.clear();
  graphics.fillStyle(blendColor(currentLevel.colors.grassLight, currentLevel.colors.fog, 0.85), 1);
  graphics.fillRect(0, HORIZON_Y + 8, PANEL_WIDTH, GAME_HEIGHT);

  for (let index = sliceCount - 1; index >= 0; index--) {
    const near = slices[index];
    const far = slices[index + 1];
    const distanceRatio = (near.depth - NEAREST_VISIBLE_DEPTH) / (FARTHEST_VISIBLE_DEPTH - NEAREST_VISIBLE_DEPTH);
    const fogAmount = Math.pow(Phaser.Math.Clamp(distanceRatio, 0, 1), 0.7) * 0.9;
    const fogged = (color) => blendColor(color, currentLevel.colors.fog, fogAmount);
    const isStripe = ((near.index >> 1) & 1) === 1;

    graphics.fillStyle(fogged(isStripe ? currentLevel.colors.grassLight : currentLevel.colors.grassDark), 1);
    graphics.fillRect(0, far.y, PANEL_WIDTH, near.y - far.y + 1);
    for (const side of [-1, 1]) {
      fillTrapezoid(graphics, fogged(currentLevel.colors.sand), near, far, side * 1.2, 0.12);
      fillTrapezoid(graphics, fogged(isStripe ? COLORS.curbPink : COLORS.curbWhite), near, far, side * 1.05, 0.06);
    }
    fillTrapezoid(graphics, fogged(isStripe ? COLORS.asphaltLight : COLORS.asphaltDark), near, far, 0, 1);
    if (isStripe) {
      for (const side of [-1, 1]) {
        fillTrapezoid(graphics, fogged(COLORS.laneLine), near, far, side / 3, 0.025);
      }
    }
    drawRoadsideScenery(graphics, near, fogAmount);
  }
}

function drawRoadsideScenery(graphics, slice, fogAmount) {
  const size = slice.scale;
  if (size < 8) return;
  const fogged = (color) => blendColor(color, currentLevel.colors.fog, fogAmount);

  for (const side of [-1, 1]) {
    const salt = side > 0 ? 1 : 0;
    if (seededRandom(slice.index, salt) > currentLevel.sceneryDensity) continue;
    const x = slice.x + side * (slice.halfWidth * 1.5 + size * (0.25 + seededRandom(slice.index, salt + 5) * 1.6));
    if (x < -size || x > PANEL_WIDTH + size) continue;
    const kind = currentLevel.scenery[Math.floor(seededRandom(slice.index, salt + 9) * currentLevel.scenery.length)];
    graphics.fillStyle(COLORS.shadow, 0.25 * (1 - fogAmount));
    graphics.fillEllipse(x, slice.y, size * 0.45, size * 0.08);
    SCENERY_DRAWERS[kind](graphics, x, slice.y, size, fogged, seededRandom(slice.index, salt + 13));
  }
}

function drawRoundTree(graphics, x, groundY, size, fogged, isBlossom) {
  graphics.fillStyle(fogged(COLORS.trunk), 1);
  graphics.fillRect(x - size * 0.03, groundY - size * 0.42, size * 0.06, size * 0.42);
  graphics.fillStyle(fogged(isBlossom ? COLORS.blossom : COLORS.leaves), 1);
  graphics.fillCircle(x, groundY - size * 0.62, size * 0.22);
  graphics.fillCircle(x - size * 0.16, groundY - size * 0.46, size * 0.16);
  graphics.fillCircle(x + size * 0.16, groundY - size * 0.46, size * 0.16);
  graphics.fillStyle(fogged(isBlossom ? COLORS.blossomHighlight : COLORS.leavesHighlight), 1);
  graphics.fillCircle(x - size * 0.07, groundY - size * 0.7, size * 0.1);
}

function drawPine(graphics, x, groundY, size, fogged) {
  graphics.fillStyle(fogged(COLORS.pineTrunk), 1);
  graphics.fillRect(x - size * 0.025, groundY - size * 0.15, size * 0.05, size * 0.15);
  graphics.fillStyle(fogged(COLORS.pineDark), 1);
  graphics.fillTriangle(x - size * 0.2, groundY - size * 0.12, x + size * 0.2, groundY - size * 0.12, x, groundY - size * 0.55);
  graphics.fillStyle(fogged(COLORS.pineLight), 1);
  graphics.fillTriangle(x - size * 0.15, groundY - size * 0.4, x + size * 0.15, groundY - size * 0.4, x, groundY - size * 0.8);
}

function drawFlowerBush(graphics, x, groundY, size, fogged) {
  graphics.fillStyle(fogged(COLORS.bush), 1);
  graphics.fillEllipse(x, groundY - size * 0.08, size * 0.4, size * 0.2);
  graphics.fillEllipse(x - size * 0.1, groundY - size * 0.15, size * 0.2, size * 0.16);
  graphics.fillStyle(fogged(COLORS.flowerPink), 1);
  graphics.fillCircle(x - size * 0.08, groundY - size * 0.15, size * 0.03);
  graphics.fillCircle(x + size * 0.08, groundY - size * 0.1, size * 0.03);
  graphics.fillStyle(fogged(COLORS.flowerYellow), 1);
  graphics.fillCircle(x + size * 0.01, groundY - size * 0.17, size * 0.025);
}

function createSky(scene) {
  const sky = scene.add.graphics();
  drawLandscape(sky, currentLevel, { left: 0, top: 0, width: PANEL_WIDTH, horizonY: HORIZON_Y, bottom: HORIZON_Y + 20, scale: 1, sunY: 105 });
  scene.clouds = [];
  for (let index = 0; index < 5; index++) {
    const cloud = scene.add.graphics();
    cloud.fillStyle(COLORS.cloud, currentLevel.cloudOpacity);
    cloud.fillEllipse(0, 0, 70, 22);
    cloud.fillEllipse(-18, -8, 34, 24);
    cloud.fillEllipse(12, -12, 40, 30);
    cloud.setPosition(index * 95, 30 + seededRandom(index, 1) * 110);
    cloud.setScale(0.6 + seededRandom(index, 2) * 0.6);
    scene.clouds.push(cloud);
  }
}

function drawLandscape(graphics, level, area) {
  const { left, top, width, horizonY, bottom, scale, sunY } = area;
  const colors = level.colors;
  const groundY = horizonY + 12 * scale;
  const sunX = left + width * 0.75;
  graphics.fillGradientStyle(colors.skyTop, colors.skyTop, colors.skyBottom, colors.skyBottom, 1);
  graphics.fillRect(left, top, width, groundY - top);
  graphics.fillStyle(colors.grassLight, 1);
  graphics.fillRect(left, groundY, width, bottom - groundY);
  if (level.isNight) {
    for (let index = 0; index < 40; index++) {
      graphics.fillStyle(COLORS.cloud, 0.3 + seededRandom(index, 7) * 0.6);
      graphics.fillCircle(left + seededRandom(index, 8) * width, top + seededRandom(index, 9) * (horizonY - top - 30 * scale), (0.8 + seededRandom(index, 10) * 1.4) * Math.min(scale, 1.5));
    }
  }
  graphics.fillStyle(colors.sunGlow, 0.35);
  graphics.fillCircle(sunX, sunY, 48 * scale);
  graphics.fillStyle(colors.sun, 1);
  graphics.fillCircle(sunX, sunY, 30 * scale);
  if (level.isNight) {
    graphics.fillStyle(blendColor(colors.skyTop, colors.skyBottom, (sunY - top) / (groundY - top)), 1);
    graphics.fillCircle(sunX + 14 * scale, sunY - 9 * scale, 25 * scale);
  }

  const farColor = blendColor(colors.mountains, colors.fog, 0.35);
  if (level.horizon === 'city') {
    drawSkyline(graphics, area, farColor, 90, 1);
    drawSkyline(graphics, area, blendColor(colors.hills, colors.fog, 0.15), 50, 2);
    return;
  }
  drawRidge(graphics, area, farColor, level.horizon === 'lake' ? 40 : 75, 1);
  if (level.horizon !== 'lake') {
    drawRidge(graphics, area, blendColor(colors.hills, colors.fog, 0.2), 26, 4);
    return;
  }
  graphics.fillStyle(colors.hills, 1);
  graphics.fillRect(left, horizonY - 14 * scale, width, 30 * scale);
  graphics.fillStyle(COLORS.cloud, 0.5);
  for (let index = 0; index < 14; index++) {
    graphics.fillRect(left + seededRandom(index, 11) * width, horizonY + (seededRandom(index, 12) * 16 - 10) * scale, 14 * scale, 2 * scale);
  }
}

function drawRidge(graphics, area, color, peakHeight, phase) {
  const { left, width, horizonY, scale } = area;
  const baseY = horizonY + 12 * scale;
  const outline = [{ x: left, y: baseY + 4 * scale }];
  for (let x = 0; x <= width; x += 8) {
    const angle = (x / width) * Math.PI * 2;
    const height = 0.55 + 0.3 * Math.sin(angle * 2 + phase) + 0.15 * Math.sin(angle * 5 + phase * 3);
    outline.push({ x: left + x, y: baseY - peakHeight * scale * height });
  }
  outline.push({ x: left + width, y: baseY + 4 * scale });
  graphics.fillStyle(color, 1);
  graphics.fillPoints(outline, true);
}

function drawSkyline(graphics, area, color, tallestBuilding, salt) {
  const { left, width, horizonY, scale } = area;
  const baseY = horizonY + 12 * scale;
  let x = left - 10 * scale;
  for (let index = 0; x < left + width; index++) {
    const buildingWidth = Math.min((18 + seededRandom(index, salt) * 26) * scale, left + width - x);
    const height = tallestBuilding * scale * (0.35 + seededRandom(index, salt + 3) * 0.65);
    graphics.fillStyle(color, 1);
    graphics.fillRect(Math.max(x, left), baseY - height, buildingWidth - 3 * scale - Math.max(0, left - x), height);
    graphics.fillStyle(COLORS.windowLight, 0.45);
    for (let windowY = baseY - height + 6 * scale; windowY < baseY - 6 * scale; windowY += 10 * scale) {
      if (x + 4 * scale > left) graphics.fillRect(x + 4 * scale, windowY, 3 * scale, 4 * scale);
    }
    x += buildingWidth;
  }
}

function updateSky(scene, seconds) {
  const race = scene.race;
  for (const cloud of scene.clouds) {
    cloud.x -= seconds * (6 + race.speed * 0.1);
    if (cloud.x < -60) cloud.x += PANEL_WIDTH + 120;
  }
}

const FACE_CENTER_X = MAKEUP_PANEL_WORLD_X + 238;
const FACE_CENTER_Y = 322;
const FACE_SCALE = 0.85;
const REFERENCE_PHOTO_SIZE = 134;
const TILE_CENTER_X = MAKEUP_PANEL_WORLD_X + 44;
const FIRST_TILE_Y = 118;
const TILE_SPACING = 62;
const TILE_SIZE = 50;
const SWATCH_Y = 550;
const NATURAL_LIPS = light(PALETTE.red, 0.45);
const NATURAL_BROWS = dark(PALETTE.brown, 0.15);
const NATURAL_LASHES = dark(PALETTE.brown, 0.6);

const MAKEUP_PARTS = [
  { key: 'brows', name: 'CEJAS', colors: [dark(PALETTE.brown, 0.4), PALETTE.ink, dark(PALETTE.yellow, 0.2), PALETTE.pink] },
  { key: 'shadow', name: 'SOMBRA', colors: [light(PALETTE.purple, 0.3), PALETTE.blue, light(PALETTE.orange, 0.2), PALETTE.mint, light(PALETTE.pink, 0.2)] },
  { key: 'mascara', name: 'R\u00cdMEL', colors: [PALETTE.ink, dark(PALETTE.blue, 0.3), PALETTE.purple, dark(PALETTE.brown, 0.3)] },
  { key: 'blush', name: 'RUBOR', colors: [light(PALETTE.pink, 0.3), light(PALETTE.orange, 0.35), light(PALETTE.purple, 0.45)] },
  { key: 'earrings', name: 'AROS', colors: [PALETTE.yellow, light(PALETTE.ink, 0.85), PALETTE.pink, PALETTE.mint] },
  { key: 'lips', name: 'LABIOS', colors: [PALETTE.red, light(PALETTE.pink, 0.1), dark(PALETTE.purple, 0.1), light(PALETTE.orange, 0.15)] },
];

function createMakeupPanel(scene) {
  const left = MAKEUP_PANEL_WORLD_X;
  scene.makeup = {
    selectedPart: 0,
    colorIndexes: MAKEUP_PARTS.map(() => -1),
    targetIndexes: MAKEUP_PARTS.map((part) => Phaser.Math.Between(0, part.colors.length - 1)),
    selfiesTaken: 0,
    selfieVisibleUntil: 0,
  };

  const backdrop = scene.add.graphics();
  backdrop.fillGradientStyle(COLORS.makeupTop, COLORS.makeupTop, COLORS.makeupBottom, COLORS.makeupBottom, 1);
  backdrop.fillRect(left, 0, PANEL_WIDTH, GAME_HEIGHT);
  backdrop.fillStyle(COLORS.cloud, 0.35);
  backdrop.fillCircle(FACE_CENTER_X, FACE_CENTER_Y - 10, 160);
  backdrop.fillStyle(COLORS.cloud, 0.3);
  backdrop.fillCircle(FACE_CENTER_X, FACE_CENTER_Y - 10, 128);

  scene.faceGraphics = scene.add.graphics();
  scene.tileGraphics = scene.add.graphics();
  createReferencePhoto(scene);
  createMakeupToolbar(scene);
  scene.selfieBadge = scene.add.graphics();

  const panelDivider = scene.add.graphics();
  panelDivider.fillStyle(COLORS.background, 1);
  panelDivider.fillRect(left, 0, 6, GAME_HEIGHT);

  refreshMakeup(scene);
  drawSelfieBadge(scene);
}

function createReferencePhoto(scene) {
  const half = REFERENCE_PHOTO_SIZE / 2;
  createFaceTexture(scene, 'reference-look', lookFrom(scene.makeup.targetIndexes), REFERENCE_PHOTO_SIZE, REFERENCE_PHOTO_SIZE, 0.44, COLORS.makeupBottom);

  const card = scene.add.graphics();
  card.fillStyle(UI.shadow, 0.3);
  card.fillRoundedRect(-half - 4, -half - 4, REFERENCE_PHOTO_SIZE + 16, REFERENCE_PHOTO_SIZE + 46, 6);
  card.fillStyle(COLORS.cloud, 1);
  card.fillRoundedRect(-half - 8, -half - 8, REFERENCE_PHOTO_SIZE + 16, REFERENCE_PHOTO_SIZE + 46, 6);
  const photo = scene.add.image(0, 0, 'reference-look');
  const tape = scene.add.rectangle(0, -half - 8, 44, 16, COLORS.curbPink, 0.75);
  const caption = scene.add
    .text(0, half + 18, 'META', TEXT_STYLES.onLight)
    .setOrigin(0.5);
  scene.add.container(MAKEUP_PANEL_WORLD_X + 312, 104, [card, photo, tape, caption]).setAngle(5);
}

function createMakeupToolbar(scene) {
  const left = MAKEUP_PANEL_WORLD_X;
  const toolbar = scene.add.graphics();
  drawPanel(toolbar, left + PANEL_WIDTH / 2 + 3, SWATCH_Y, PANEL_WIDTH - 30, 66);
  scene.swatchGraphics = scene.add.graphics();
}

function lookFrom(colorIndexes) {
  const look = {};
  MAKEUP_PARTS.forEach((part, index) => {
    look[part.key] = colorIndexes[index] >= 0 ? part.colors[colorIndexes[index]] : null;
  });
  return look;
}

function updateMakeup(scene) {
  const makeup = scene.makeup;
  const partCount = MAKEUP_PARTS.length;
  let changed = false;
  if (wasPressed(scene, 'P2_U')) {
    makeup.selectedPart = (makeup.selectedPart + partCount - 1) % partCount;
    changed = true;
  }
  if (wasPressed(scene, 'P2_D')) {
    makeup.selectedPart = (makeup.selectedPart + 1) % partCount;
    changed = true;
  }
  if (changed) playSound(scene, 'select');

  const colorStep = wasPressed(scene, 'P2_1') || wasPressed(scene, 'P2_R') ? 1 : wasPressed(scene, 'P2_L') ? -1 : 0;
  if (colorStep !== 0) {
    const part = MAKEUP_PARTS[makeup.selectedPart];
    const current = makeup.colorIndexes[makeup.selectedPart];
    const start = current < 0 && colorStep < 0 ? 0 : current;
    makeup.colorIndexes[makeup.selectedPart] = (start + colorStep + part.colors.length) % part.colors.length;
    playSound(scene, 'paint');
    changed = true;
  }
  if (changed) refreshMakeup(scene);
  if (wasPressed(scene, 'P2_2')) takeSelfie(scene);
}

function takeSelfie(scene) {
  const makeup = scene.makeup;
  const now = scene.time.now;
  if (makeup.selfiesTaken >= currentLevel.selfiesNeeded || now < makeup.selfieVisibleUntil) return;
  makeup.selfiesTaken += 1;
  makeup.selfieVisibleUntil = now + SELFIE_DURATION_MS;
  drawSelfieBadge(scene);
  playSound(scene, 'shutter');
  scene.cameras.main.flash(200, 255, 255, 255);
  scene.makeupCamera.flash(200, 255, 255, 255);

  const painter = scene.make.graphics({ x: 0, y: 0 }, false);
  drawLandscape(painter, currentLevel, { left: 0, top: 0, width: SELFIE_PHOTO_WIDTH, horizonY: 140, bottom: SELFIE_PHOTO_HEIGHT, scale: 0.7, sunY: 42 });
  drawFace(painter, 176, 112, 0.46, lookFrom(makeup.colorIndexes));
  drawBoyfriend(painter, 84, 120, 0.5, currentLevel.selfie);
  if (currentLevel.selfie.isExhausted) {
    painter.fillStyle(light(PALETTE.purple, 0.45), 0.6);
    for (const side of [-1, 1]) painter.fillEllipse(176 + side * 18, 130, 16, 5);
  }
  SELFIE_PROPS[currentLevel.selfie.prop](painter);
  replaceTexture(scene, painter, 'selfie', SELFIE_PHOTO_WIDTH, SELFIE_PHOTO_HEIGHT);
  painter.destroy();

  const frame = scene.add.graphics();
  drawPanel(frame, 0, 18, SELFIE_PHOTO_WIDTH + 24, SELFIE_PHOTO_HEIGHT + 60);
  frame.fillStyle(PALETTE.pink, 1);
  frame.fillCircle(-7, SELFIE_PHOTO_HEIGHT / 2 + 26, 7);
  frame.fillCircle(7, SELFIE_PHOTO_HEIGHT / 2 + 26, 7);
  frame.fillTriangle(-14, SELFIE_PHOTO_HEIGHT / 2 + 28, 14, SELFIE_PHOTO_HEIGHT / 2 + 28, 0, SELFIE_PHOTO_HEIGHT / 2 + 42);
  const photo = scene.add.image(0, 0, 'selfie');
  const selfie = scene.add.container(PANEL_WIDTH / 2, 300, [frame, photo]).setAngle(-4).setScale(0.6).setDepth(10);
  scene.tweens.add({ targets: selfie, scale: 1.25, duration: 220, ease: 'Back.Out' });
  scene.time.delayedCall(SELFIE_DURATION_MS, () => {
    scene.tweens.add({ targets: selfie, alpha: 0, scale: 0.8, duration: 200, onComplete: () => selfie.destroy() });
  });
}

function drawSelfieBadge(scene) {
  const graphics = scene.selfieBadge;
  const needed = currentLevel.selfiesNeeded;
  graphics.clear();
  if (needed === 0) return;
  const centerX = TILE_CENTER_X + 40 + needed * 9;
  const width = 58 + needed * 18;
  drawPanel(graphics, centerX, 40, width, 44);
  drawCameraIcon(graphics, centerX - width / 2 + 24, 40, PALETTE.purple);
  for (let selfie = 0; selfie < needed; selfie++) {
    const dotX = centerX - width / 2 + 52 + selfie * 18;
    graphics.fillStyle(selfie < scene.makeup.selfiesTaken ? PALETTE.pink : UI.idle, 1);
    graphics.fillCircle(dotX, 40, 6);
  }
}

function drawCameraIcon(graphics, x, y, color) {
  graphics.fillStyle(color, 1);
  graphics.fillRoundedRect(x - 15, y - 9, 30, 21, 5);
  graphics.fillRect(x - 6, y - 13, 12, 5);
  graphics.fillStyle(PALETTE.white, 1);
  graphics.fillCircle(x, y + 1, 7);
  graphics.fillStyle(color, 1);
  graphics.fillCircle(x, y + 1, 4);
}

function drawBoyfriend(graphics, centerX, centerY, scale, outfit) {
  const at = (offsetX, offsetY) => [centerX + offsetX * scale, centerY + offsetY * scale];
  const ellipse = (color, offsetX, offsetY, width, height) => {
    graphics.fillStyle(color, 1);
    graphics.fillEllipse(...at(offsetX, offsetY), width * scale, height * scale);
  };
  ellipse(outfit.shirt, 0, 190, 250, 150);
  if (outfit.hasBowTie) {
    graphics.fillStyle(PALETTE.white, 1);
    graphics.fillTriangle(...at(-34, 124), ...at(34, 124), ...at(0, 190));
  }
  ellipse(COLORS.skinShade, 0, 100, 56, 70);
  ellipse(COLORS.outline, 0, 0, 178, 208);
  ellipse(PALETTE.skin, -88, 6, 30, 40);
  ellipse(PALETTE.skin, 88, 6, 30, 40);
  ellipse(PALETTE.skin, 0, 0, 170, 200);
  ellipse(COLORS.driverHair, 0, -78, 190, 96);
  ellipse(COLORS.driverHair, -60, -50, 70, 60);
  ellipse(COLORS.driverHair, 50, -56, 90, 50);
  for (const side of [-1, 1]) {
    ellipse(COLORS.driverHair, side * 36, -26, 40, 9);
    ellipse(COLORS.driverHair, side * 34, 8, 18, 26);
    ellipse(PALETTE.white, side * 34 - 3, 2, 6, 7);
    ellipse(light(PALETTE.pink, 0.4), side * 56, 40, 32, 16);
  }
  if (outfit.isExhausted) for (const side of [-1, 1]) ellipse(light(PALETTE.purple, 0.45), side * 34, 28, 30, 9);
  graphics.lineStyle(5 * scale, COLORS.outline, 1);
  graphics.beginPath();
  if (outfit.isExhausted) {
    graphics.arc(...at(0, 64), 18 * scale, Math.PI + 0.5, -0.5);
  } else {
    graphics.arc(...at(0, 44), 22 * scale, 0.2, Math.PI - 0.2);
  }
  graphics.strokePath();
  if (outfit.hasBowTie) {
    graphics.fillStyle(PALETTE.pink, 1);
    graphics.fillTriangle(...at(0, 132), ...at(-22, 120), ...at(-22, 144));
    graphics.fillTriangle(...at(0, 132), ...at(22, 120), ...at(22, 144));
  }
}

const SELFIE_PROPS = {
  none: () => {},
  popcorn: drawPopcorn,
  confetti: drawConfetti,
  baby: (graphics) => drawBaby(graphics, 130, 162, 0.44),
};

function drawPopcorn(graphics) {
  const left = 18;
  const top = 140;
  for (let kernel = 0; kernel < 9; kernel++) {
    graphics.fillStyle(kernel % 3 ? light(PALETTE.yellow, 0.75) : light(PALETTE.yellow, 0.4), 1);
    graphics.fillCircle(left + 6 + (kernel % 5) * 9, top - 4 - Math.floor(kernel / 5) * 7, 7);
  }
  for (let stripe = 0; stripe < 5; stripe++) {
    graphics.fillStyle(stripe % 2 ? PALETTE.white : PALETTE.red, 1);
    graphics.fillRect(left + stripe * 10, top, 10, 52);
  }
}

function drawConfetti(graphics) {
  const confettiColors = [PALETTE.pink, PALETTE.yellow, PALETTE.mint, PALETTE.purple];
  for (let piece = 0; piece < 26; piece++) {
    graphics.fillStyle(confettiColors[piece % confettiColors.length], 1);
    graphics.fillRect(seededRandom(piece, 41) * SELFIE_PHOTO_WIDTH, seededRandom(piece, 42) * 90, 6, 4);
  }
  for (const [heartX, heartY] of [[30, 30], [228, 46]]) {
    graphics.fillStyle(PALETTE.pink, 1);
    graphics.fillCircle(heartX - 6, heartY, 7);
    graphics.fillCircle(heartX + 6, heartY, 7);
    graphics.fillTriangle(heartX - 13, heartY + 2, heartX + 13, heartY + 2, heartX, heartY + 17);
  }
}

function drawBaby(graphics, centerX, centerY, scale) {
  const at = (offsetX, offsetY) => [centerX + offsetX * scale, centerY + offsetY * scale];
  const circle = (color, offsetX, offsetY, radius) => {
    graphics.fillStyle(color, 1);
    graphics.fillCircle(...at(offsetX, offsetY), radius * scale);
  };
  graphics.fillStyle(light(PALETTE.yellow, 0.55), 1);
  graphics.fillEllipse(...at(0, 70), 170 * scale, 110 * scale);
  circle(COLORS.outline, 0, 0, 64);
  circle(PALETTE.skin, 0, 0, 60);
  graphics.lineStyle(7 * scale, COLORS.hair, 1);
  graphics.beginPath();
  graphics.arc(...at(6, -56), 14 * scale, Math.PI, Math.PI * 2.4);
  graphics.strokePath();
  circle(light(PALETTE.red, 0.6), 0, 6, 46);
  graphics.lineStyle(5 * scale, COLORS.outline, 1);
  for (const side of [-1, 1]) {
    graphics.beginPath();
    graphics.moveTo(...at(side * 26, -12));
    graphics.lineTo(...at(side * 12, -4));
    graphics.lineTo(...at(side * 26, 4));
    graphics.strokePath();
    graphics.fillStyle(light(PALETTE.blue, 0.3), 0.85);
    graphics.fillEllipse(...at(side * 30, 30), 10 * scale, 44 * scale);
  }
  graphics.fillStyle(COLORS.outline, 1);
  graphics.fillEllipse(...at(0, 30), 34 * scale, 30 * scale);
  graphics.fillStyle(PALETTE.pink, 1);
  graphics.fillEllipse(...at(0, 38), 18 * scale, 10 * scale);
}

function isPartMatching(makeup, partIndex) {
  return makeup.colorIndexes[partIndex] === makeup.targetIndexes[partIndex];
}

function refreshMakeup(scene) {
  const makeup = scene.makeup;
  const look = lookFrom(makeup.colorIndexes);
  scene.faceGraphics.clear();
  drawFace(scene.faceGraphics, FACE_CENTER_X, FACE_CENTER_Y, FACE_SCALE, look);

  const part = MAKEUP_PARTS[makeup.selectedPart];
  drawCategoryTiles(scene, look);
  drawSwatches(scene, part);
}

function drawCategoryTiles(scene, look) {
  const graphics = scene.tileGraphics;
  graphics.clear();
  MAKEUP_PARTS.forEach((part, index) => {
    const x = TILE_CENTER_X;
    const y = FIRST_TILE_Y + index * TILE_SPACING;
    const isSelected = index === scene.makeup.selectedPart;
    const size = isSelected ? TILE_SIZE + 8 : TILE_SIZE;
    drawPanel(graphics, x, y, size, size, { isSelected });
    drawPartIcon(graphics, part.key, x, y, look[part.key] || part.colors[0]);
  });
}

function fillRotatedRect(graphics, color, centerX, centerY, length, thickness, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([along, across]) => ({
    x: centerX + (along * length * cos) / 2 - (across * thickness * sin) / 2,
    y: centerY + (along * length * sin) / 2 + (across * thickness * cos) / 2,
  }));
  graphics.fillStyle(color, 1);
  graphics.fillPoints(corners, true);
}

function drawPartIcon(graphics, key, x, y, color) {
  const diagonal = -Math.PI / 4;
  const alongDiagonal = (distance, sideways = 0) => [
    x + distance * Math.cos(diagonal) - sideways * Math.sin(diagonal),
    y + distance * Math.sin(diagonal) + sideways * Math.cos(diagonal),
  ];
  const caseColor = COLORS.cinemaTrim;
  if (key === 'brows') {
    fillRotatedRect(graphics, color, ...alongDiagonal(-14), 4, 7, diagonal);
    fillRotatedRect(graphics, COLORS.iceCreamCone, ...alongDiagonal(-3), 18, 7, diagonal);
    graphics.fillStyle(COLORS.skin, 1);
    graphics.fillTriangle(...alongDiagonal(6, -3.5), ...alongDiagonal(6, 3.5), ...alongDiagonal(15));
    graphics.fillStyle(color, 1);
    graphics.fillTriangle(...alongDiagonal(11, -1.6), ...alongDiagonal(11, 1.6), ...alongDiagonal(15));
  } else if (key === 'shadow') {
    graphics.fillStyle(caseColor, 1);
    graphics.fillRoundedRect(x - 16, y - 14, 32, 28, 6);
    const pans = [color, blendColor(color, COLORS.cloud, 0.45), blendColor(color, COLORS.background, 0.3), COLORS.flowerPink];
    pans.forEach((panColor, index) => {
      const panX = x + (index % 2 ? 7 : -7);
      const panY = y + (index < 2 ? -6 : 6);
      graphics.fillStyle(panColor, 1);
      graphics.fillCircle(panX, panY, 5.5);
      graphics.fillStyle(COLORS.cloud, 0.6);
      graphics.fillCircle(panX - 2, panY - 2, 1.5);
    });
  } else if (key === 'mascara') {
    fillRotatedRect(graphics, caseColor, ...alongDiagonal(-7), 18, 9, diagonal);
    fillRotatedRect(graphics, COLORS.bell, ...alongDiagonal(3), 3, 9, diagonal);
    fillRotatedRect(graphics, COLORS.lampPost, ...alongDiagonal(8), 8, 2, diagonal);
    fillRotatedRect(graphics, color, ...alongDiagonal(14), 10, 6, diagonal);
  } else if (key === 'blush') {
    graphics.fillStyle(caseColor, 1);
    graphics.fillCircle(x, y, 15);
    graphics.fillStyle(color, 1);
    graphics.fillCircle(x, y, 11);
    graphics.fillStyle(COLORS.cloud, 0.45);
    graphics.fillEllipse(x - 4, y - 4, 9, 5);
  } else if (key === 'earrings') {
    graphics.lineStyle(2, COLORS.bell, 1);
    graphics.beginPath();
    graphics.arc(x, y - 12, 4, Math.PI, 0);
    graphics.strokePath();
    graphics.lineStyle(3, color, 1);
    graphics.strokeCircle(x, y - 1, 8);
    graphics.fillStyle(color, 1);
    graphics.fillPoints([{ x, y: y + 6 }, { x: x + 5, y: y + 11 }, { x, y: y + 17 }, { x: x - 5, y: y + 11 }], true);
    graphics.fillStyle(COLORS.cloud, 0.7);
    graphics.fillCircle(x - 1.5, y + 10, 1.5);
  } else {
    graphics.fillStyle(COLORS.bell, 1);
    graphics.fillRect(x - 7, y + 3, 14, 12);
    graphics.fillStyle(caseColor, 1);
    graphics.fillRect(x - 6, y - 4, 12, 8);
    graphics.fillStyle(color, 1);
    graphics.fillPoints([{ x: x - 5, y: y - 4 }, { x: x + 5, y: y - 4 }, { x: x + 5, y: y - 13 }, { x: x - 5, y: y - 18 }], true);
    graphics.fillStyle(COLORS.cloud, 0.5);
    graphics.fillRect(x - 3, y - 14, 2, 9);
  }
}

function drawSwatches(scene, part) {
  const graphics = scene.swatchGraphics;
  const spacing = 46;
  const firstX = MAKEUP_PANEL_WORLD_X + PANEL_WIDTH / 2 + 3 - ((part.colors.length - 1) * spacing) / 2;
  const currentIndex = scene.makeup.colorIndexes[scene.makeup.selectedPart];
  graphics.clear();
  part.colors.forEach((color, index) => {
    const x = firstX + index * spacing;
    const isCurrent = index === currentIndex;
    const radius = isCurrent ? 17 : 14;
    if (isCurrent) {
      graphics.fillStyle(UI.accent, 1);
      graphics.fillCircle(x, SWATCH_Y, radius + 5);
    }
    graphics.fillStyle(COLORS.cloud, 1);
    graphics.fillCircle(x, SWATCH_Y, radius + 2);
    graphics.fillStyle(color, 1);
    graphics.fillCircle(x, SWATCH_Y, radius);
    graphics.fillStyle(COLORS.cloud, 0.55);
    graphics.fillEllipse(x - radius * 0.35, SWATCH_Y - radius * 0.4, radius * 0.7, radius * 0.4);
  });
}

function ruinMakeup(scene) {
  const makeup = scene.makeup;
  const paintedParts = MAKEUP_PARTS.map((part, index) => index).filter((index) => makeup.colorIndexes[index] >= 0);
  if (paintedParts.length === 0) return;
  const partIndex = randomItem(paintedParts);
  const part = MAKEUP_PARTS[partIndex];
  const otherColors = part.colors.map((color, index) => index).filter((index) => index !== makeup.colorIndexes[partIndex]);
  makeup.colorIndexes[partIndex] = randomItem(otherColors);
  refreshMakeup(scene);

  scene.makeupCamera.shake(300, 0.012);
  const flashSize = TILE_SIZE + 14;
  const flash = scene.add.graphics();
  flash.fillStyle(PALETTE.red, 0.6);
  flash.fillRoundedRect(TILE_CENTER_X - flashSize / 2, FIRST_TILE_Y + partIndex * TILE_SPACING - flashSize / 2, flashSize, flashSize, UI.radius);
  scene.tweens.add({ targets: flash, alpha: 0, duration: 250, yoyo: true, repeat: 2, onComplete: () => flash.destroy() });
}

function drawFace(graphics, centerX, centerY, scale, look) {
  const pointAt = (offsetX, offsetY) => [centerX + offsetX * scale, centerY + offsetY * scale];
  const ellipse = (color, offsetX, offsetY, width, height, alpha = 1) => {
    graphics.fillStyle(color, alpha);
    graphics.fillEllipse(...pointAt(offsetX, offsetY), width * scale, height * scale);
  };
  const circle = (color, offsetX, offsetY, radius, alpha = 1) => {
    graphics.fillStyle(color, alpha);
    graphics.fillCircle(...pointAt(offsetX, offsetY), radius * scale);
  };
  const triangle = (color, points) => {
    graphics.fillStyle(color, 1);
    graphics.fillTriangle(...pointAt(...points[0]), ...pointAt(...points[1]), ...pointAt(...points[2]));
  };
  const stroke = (color, width, points, alpha = 1) => {
    graphics.lineStyle(width * scale, color, alpha);
    graphics.beginPath();
    points.forEach((point, index) => {
      if (index === 0) graphics.moveTo(...pointAt(...point));
      else graphics.lineTo(...pointAt(...point));
    });
    graphics.strokePath();
  };

  const smoothShape = (color, points, alpha = 1) => {
    const outline = new Phaser.Curves.Spline(points.concat([points[0]]).map((point) => new Phaser.Math.Vector2(...pointAt(...point))));
    graphics.fillStyle(color, alpha);
    graphics.fillPoints(outline.getPoints(points.length * 8), true);
  };
  const mirrored = (rightHalf) => rightHalf.concat(rightHalf.slice(1).reverse().map(([x, y]) => [-x, y]));

  const outfit = currentLevel.outfit;
  if (outfit.style === 'bride') {
    smoothShape(COLORS.cloud, mirrored([[0, -168], [96, -156], [166, -60], [180, 80], [176, 230], [0, 230]]), 0.55);
  }
  smoothShape(COLORS.hairDark, mirrored([[0, -150], [70, -142], [122, -102], [140, -34], [132, 36], [146, 96], [130, 150], [104, 140], [90, 168], [60, 150]]));

  graphics.fillStyle(COLORS.skinShade, 1);
  graphics.fillRect(...pointAt(-20, 80), 40 * scale, 60 * scale);
  const shoulders = (grow) => mirrored([[0, 128 - grow], [46, 130 - grow], [96 + grow, 140 - grow], [132 + grow, 168 - grow], [146 + grow, 230], [144 + grow, 300]]);
  const isOffShoulder = outfit.style === 'party' || outfit.style === 'bride';
  if (outfit.style === 'hoodie') ellipse(outfit.shade, 0, 140, 176, 84);
  smoothShape(COLORS.outline, shoulders(4));
  smoothShape(isOffShoulder ? COLORS.skin : outfit.color, shoulders(0));

  if (outfit.style === 'blouse') {
    for (const side of [-1, 1]) {
      ellipse(outfit.shade, side * 120, 190, 66, 76);
      ellipse(outfit.color, side * 117, 185, 60, 68);
      stroke(outfit.shade, 2, [[side * 102, 160], [side * 108, 204]], 0.7);
      stroke(outfit.shade, 2, [[side * 124, 156], [side * 130, 200]], 0.7);
    }
    for (const [dotX, dotY] of [[-70, 216], [-40, 190], [-12, 228], [24, 196], [56, 222], [84, 192], [-92, 236]]) {
      circle(COLORS.cloud, dotX, dotY, 4, 0.6);
    }
    ellipse(COLORS.skin, 0, 128, 46, 26);
    for (const side of [-1, 1]) {
      ellipse(COLORS.flowerPink, side * 21, 143, 48, 32);
      ellipse(COLORS.cloud, side * 21, 141, 43, 27);
    }
    triangle(COLORS.curbPink, [[0, 150], [-15, 141], [-15, 159]]);
    triangle(COLORS.curbPink, [[0, 150], [15, 141], [15, 159]]);
    circle(COLORS.flowerPink, 0, 150, 4.5);
  }

  if (isOffShoulder) {
    const dress = (grow) => mirrored([[0, 152 - grow], [62, 148 - grow], [118 + grow, 158 - grow], [148 + grow, 226], [146 + grow, 300]]);
    smoothShape(COLORS.outline, dress(3));
    smoothShape(outfit.color, dress(0));
    if (outfit.style === 'party') {
      for (let sequin = 0; sequin < 16; sequin++) circle(COLORS.cloud, -110 + seededRandom(sequin, 31) * 220, 166 + seededRandom(sequin, 32) * 70, 2.5, 0.75);
      for (let pearl = -4; pearl <= 4; pearl++) circle(COLORS.scoopVanilla, pearl * 8, 124 + pearl * pearl * 0.9, 3.5);
    } else {
      for (let scallop = -6; scallop <= 6; scallop++) circle(COLORS.cloud, scallop * 18, 152 + Math.abs(scallop) * 0.4, 8);
      for (let dot = -5; dot <= 5; dot++) circle(outfit.shade, dot * 18 + 9, 168, 2.5);
    }
  }

  if (outfit.style === 'hoodie') {
    ellipse(COLORS.skin, 0, 128, 46, 26);
    stroke(outfit.shade, 10, [[-52, 136], [-26, 158], [0, 164], [26, 158], [52, 136]]);
    for (const side of [-1, 1]) {
      stroke(COLORS.cloud, 3, [[side * 14, 160], [side * 17, 208]]);
      circle(COLORS.cloud, side * 17, 210, 4);
    }
  }

  circle(COLORS.outline, 0, -12, 99);
  ellipse(COLORS.outline, 0, 38, 158, 140);
  circle(COLORS.skin, 0, -12, 95);
  ellipse(COLORS.skin, 0, 38, 150, 132);

  if (look.blush) {
    for (const side of [-1, 1]) {
      ellipse(look.blush, side * 60, 40, 42, 22, 0.55);
      for (const step of [-7, 0, 7]) {
        stroke(blendColor(look.blush, COLORS.outline, 0.25), 1.8, [[side * 60 + step - 3, 45], [side * 60 + step + 3, 35]], 0.8);
      }
    }
  }

  for (const side of [-1, 1]) {
    const eyeX = side * 40;
    const eyeY = 10;
    if (look.shadow) {
      ellipse(look.shadow, eyeX + side * 2, eyeY - 18, 62, 34, 0.5);
      ellipse(look.shadow, eyeX + side * 4, eyeY - 14, 52, 24, 0.6);
    }
    ellipse(COLORS.cloud, eyeX, eyeY, 40, 44);
    ellipse(COLORS.iris, eyeX, eyeY + 3, 30, 38);
    ellipse(COLORS.irisDark, eyeX, eyeY - 4, 30, 24, 0.55);
    ellipse(COLORS.outline, eyeX, eyeY + 4, 14, 20);
    ellipse(COLORS.irisLight, eyeX, eyeY + 14, 18, 8, 0.7);
    circle(COLORS.cloud, eyeX - side * 6, eyeY - 6, 6);
    circle(COLORS.cloud, eyeX + side * 6, eyeY + 11, 3);

    const lashColor = look.mascara || NATURAL_LASHES;
    const thickness = look.mascara ? 6 : 3.5;
    const fromEye = (alongX, alongY) => [eyeX + side * alongX, eyeY + alongY];
    smoothShape(lashColor, [
      fromEye(-22, -4), fromEye(-12, -18 - thickness * 0.3), fromEye(6, -22 - thickness * 0.5),
      fromEye(22, -13 - thickness * 0.6), fromEye(28, -14 - thickness), fromEye(20, -9),
      fromEye(6, -17), fromEye(-10, -14), fromEye(-20, -2),
    ]);
    stroke(lashColor, 1.5, [fromEye(6, 22), fromEye(12, 20), fromEye(17, 15)]);
    if (look.mascara) {
      for (const [baseX, baseY, tipX, tipY] of [[12, -24, 17, -31], [19, -21, 26, -27], [25, -17, 32, -20]]) {
        triangle(lashColor, [fromEye(baseX - 3, baseY + 1), fromEye(baseX + 3, baseY + 3), fromEye(tipX, tipY)]);
      }
    }
  }

  ellipse(COLORS.skinShade, 1, 47, 13, 7, 0.9);
  ellipse(COLORS.noseTip, 0, 46, 9, 5);
  circle(COLORS.cloud, -2, 44, 1.6, 0.9);
  const lipColor = look.lips || NATURAL_LIPS;
  ellipse(lipColor, -6, 66, 18, 9);
  ellipse(lipColor, 6, 66, 18, 9);
  ellipse(lipColor, 0, 71, 24, 11);
  stroke(blendColor(lipColor, COLORS.outline, 0.4), 1.5, [[-11, 68], [0, 69], [11, 68]]);
  ellipse(COLORS.cloud, 5, 72, 8, 3, look.lips ? 0.7 : 0.4);

  smoothShape(COLORS.hair, [
    [100, -30], [112, -84], [80, -124], [20, -138], [-50, -130], [-102, -96], [-114, -40], [-106, 12],
    [-96, 62], [-88, 100], [-80, 60], [-84, 10], [-78, -36], [-60, -54], [-44, -64], [-10, -56],
    [30, -48], [66, -40], [96, -24],
  ]);
  smoothShape(COLORS.hair, [[94, -52], [110, 0], [108, 60], [98, 106], [88, 92], [90, 40], [86, -10]]);
  stroke(COLORS.hairDark, 2, [[-44, -64], [-40, -94], [-30, -128]], 0.5);
  stroke(COLORS.hairDark, 2, [[-24, -84], [20, -70], [62, -54]], 0.4);
  stroke(COLORS.hairShine, 6, [[-74, -100], [-34, -120], [8, -126]], 0.6);
  stroke(COLORS.hairShine, 5, [[38, -122], [62, -112]], 0.6);
  if (outfit.style === 'bride') {
    [[-66, -116], [-36, -132], [0, -138], [36, -132], [66, -116]].forEach(([flowerX, flowerY], index) => {
      circle(COLORS.cloud, flowerX, flowerY, 11);
      circle(index % 2 ? COLORS.flowerPink : COLORS.flowerYellow, flowerX, flowerY, 4.5);
    });
  } else {
    triangle(COLORS.curbPink, [[72, -114], [50, -128], [52, -98]]);
    triangle(COLORS.curbPink, [[72, -114], [94, -128], [92, -98]]);
    circle(COLORS.flowerPink, 72, -114, 6);
  }

  for (const side of [-1, 1]) {
    const browWidth = look.brows ? 7 : 5;
    smoothShape(look.brows || NATURAL_BROWS, [
      [side * 20, -31], [side * 18, -31 - browWidth], [side * 36, -43 - browWidth * 0.6], [side * 60, -38], [side * 37, -40],
    ]);
  }

  if (look.earrings) {
    for (const side of [-1, 1]) {
      const x = side * 94;
      stroke(look.earrings, 2, [[x, 48], [x, 60]]);
      circle(look.earrings, x, 48, 3.5);
      triangle(look.earrings, [[x - 8, 64], [x + 8, 64], [x, 80]]);
      circle(look.earrings, x - 4, 63, 4.5);
      circle(look.earrings, x + 4, 63, 4.5);
      circle(COLORS.cloud, x - 3, 62, 1.8, 0.8);
    }
  }
}

function createControls(scene) {
  scene.controls = { held: Object.create(null), pressed: Object.create(null) };
  const listenerFor = (isDown) => (event) => {
    const arcadeCode = KEYBOARD_TO_ARCADE[normalizeIncomingKey(event.key)];
    if (!arcadeCode) return;
    if (isDown && !scene.controls.held[arcadeCode]) scene.controls.pressed[arcadeCode] = true;
    scene.controls.held[arcadeCode] = isDown;
  };
  const onKeyDown = listenerFor(true);
  const onKeyUp = listenerFor(false);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  scene.events.once('shutdown', () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  });
}

function isHeld(scene, arcadeCode) {
  return scene.controls.held[arcadeCode] === true;
}

function wasPressed(scene, arcadeCode) {
  return scene.controls.pressed[arcadeCode] === true;
}

function normalizeIncomingKey(key) {
  if (typeof key !== 'string' || key.length === 0) return '';
  if (key === ' ') return 'space';
  return key.toLowerCase();
}

function screenPositionAt(scene, depth, worldX) {
  const scale = PERSPECTIVE_SCALE / depth;
  return {
    x: ROAD_CENTER_X + (worldX - scene.race.cameraX) * scale,
    y: HORIZON_Y + PERSPECTIVE_HEIGHT / depth,
    scale,
  };
}

function createCar(scene) {
  const painter = scene.make.graphics({ x: 0, y: 0 }, false);
  painter.fillStyle(COLORS.windshield, 0.45);
  painter.fillRoundedRect(18, 8, 84, 32, 8);
  painter.fillStyle(COLORS.driverHair, 1);
  painter.fillCircle(40, 30, 13);
  painter.fillStyle(COLORS.passengerHair, 1);
  painter.fillCircle(80, 30, 13);
  painter.fillCircle(80, 14, 7);
  painter.fillStyle(COLORS.bow, 1);
  painter.fillTriangle(80, 20, 70, 15, 70, 25);
  painter.fillTriangle(80, 20, 90, 15, 90, 25);
  painter.fillStyle(COLORS.tire, 1);
  painter.fillRoundedRect(8, 62, 22, 24, 5);
  painter.fillRoundedRect(90, 62, 22, 24, 5);
  painter.fillStyle(COLORS.carBody, 1);
  painter.fillRoundedRect(4, 36, 112, 36, 12);
  painter.fillStyle(COLORS.carHighlight, 1);
  painter.fillRoundedRect(12, 37, 96, 8, 4);
  painter.fillStyle(COLORS.carShade, 1);
  painter.fillRoundedRect(4, 60, 112, 12, { tl: 0, tr: 0, bl: 12, br: 12 });
  painter.fillStyle(COLORS.bumper, 1);
  painter.fillRoundedRect(22, 64, 76, 9, 4);
  painter.fillStyle(COLORS.tailLight, 1);
  painter.fillRoundedRect(10, 46, 24, 10, 4);
  painter.fillRoundedRect(86, 46, 24, 10, 4);
  painter.fillStyle(COLORS.tailLightGlow, 1);
  painter.fillRoundedRect(13, 48, 10, 5, 2);
  painter.fillRoundedRect(89, 48, 10, 5, 2);
  painter.fillStyle(COLORS.plate, 1);
  painter.fillRoundedRect(47, 50, 26, 11, 2);
  painter.fillStyle(COLORS.background, 1);
  painter.fillRect(51, 54, 18, 3);
  replaceTexture(scene, painter, 'car', 120, 90);
  painter.clear();
  painter.fillStyle(COLORS.cloud, 1);
  painter.fillCircle(8, 8, 8);
  replaceTexture(scene, painter, 'puff', 16, 16);
  painter.destroy();

  scene.carShadow = scene.add.ellipse(0, CAR_SCREEN_Y - 4, 110, 18, COLORS.background, 0.3);
  scene.exhaust = scene.add.particles(0, 0, 'puff', {
    lifespan: 450,
    speedX: { min: -15, max: 15 },
    speedY: { min: 30, max: 70 },
    scale: { start: 0.4, end: 1.3 },
    alpha: { start: 0.45, end: 0 },
    frequency: 70,
  });
  scene.car = scene.add.image(ROAD_CENTER_X, CAR_SCREEN_Y, 'car').setOrigin(0.5, 1).setScale(CAR_IMAGE_SCALE);
}

function steerCar(scene, time, seconds) {
  const race = scene.race;
  const jumpPressed = wasPressed(scene, 'P1_U') || wasPressed(scene, 'P1_1');
  if (jumpPressed && jumpHeightAt(race, time) === 0) {
    race.jumpStartedAt = time;
    playSound(scene, 'jump');
  }
  const previousLane = race.lane;
  if (wasPressed(scene, 'P1_L')) race.lane = Math.max(-1, race.lane - 1);
  if (wasPressed(scene, 'P1_R')) race.lane = Math.min(1, race.lane + 1);
  if (race.lane !== previousLane) playSound(scene, 'swoosh');
  race.carX += (race.lane * LANE_WIDTH - race.carX) * Math.min(1, seconds * 12);
  race.cameraX = race.carX * 0.5;
}

function jumpHeightAt(race, time) {
  const progress = (time - race.jumpStartedAt) / JUMP_DURATION_MS;
  return progress > 0 && progress < 1 ? Math.sin(progress * Math.PI) : 0;
}

function updateCar(scene, time) {
  const race = scene.race;
  const position = screenPositionAt(scene, CAR_DEPTH, race.carX);
  const isRecovering = time < race.recoveringUntil;
  const bounce = Math.sin(time * 0.03) * 1.2;
  const jumpHeight = jumpHeightAt(race, time);
  scene.car.setPosition(position.x, CAR_SCREEN_Y + bounce - jumpHeight * JUMP_HEIGHT_PX);
  scene.car.setScale(CAR_IMAGE_SCALE * (1 + jumpHeight * 0.08));
  scene.carShadow.setScale(1 - jumpHeight * 0.45);
  scene.car.setAngle((race.lane * LANE_WIDTH - race.carX) * 45);
  scene.car.setAlpha(isRecovering && Math.floor(time / 100) % 2 === 0 ? 0.35 : 1);
  scene.carShadow.setPosition(position.x, CAR_SCREEN_Y - 4);
  scene.exhaust.setPosition(position.x - 32, CAR_SCREEN_Y - 14);
}

function spawnObstacles(race) {
  const lastObstaclePosition = currentLevel.distance - LAST_OBSTACLE_MARGIN;
  while (race.nextObstaclePosition < Math.min(race.distance + FARTHEST_VISIBLE_DEPTH, lastObstaclePosition)) {
    const lanes = Phaser.Utils.Array.Shuffle([-1, 0, 1]);
    if (Math.random() < currentLevel.spikeRowChance) {
      for (const lane of lanes) race.obstacles.push({ lane, position: race.nextObstaclePosition, kind: 'spikes', hasHit: false });
      race.nextObstaclePosition += Phaser.Math.Between(...currentLevel.obstacleGap);
      continue;
    }
    const chanceOfTwoBlockedLanes = currentLevel.twoLaneChance * Math.min(1, race.distance / (currentLevel.distance * 0.5));
    const blockedLanes = Math.random() < chanceOfTwoBlockedLanes ? 2 : 1;
    for (let index = 0; index < blockedLanes; index++) {
      race.obstacles.push({
        lane: lanes[index],
        position: race.nextObstaclePosition,
        kind: randomItem(currentLevel.obstacles),
        color: randomItem(COLORS.trafficBodies),
        hasHit: false,
      });
    }
    race.nextObstaclePosition += Phaser.Math.Between(...currentLevel.obstacleGap);
  }
  race.obstacles = race.obstacles.filter((obstacle) => depthOf(race, obstacle) > 1.5);
}

function depthOf(race, obstacle) {
  return obstacle.position - race.distance + CAR_DEPTH;
}

function detectCrash(scene, time) {
  const race = scene.race;
  if (time < race.recoveringUntil) return;
  for (const obstacle of race.obstacles) {
    const depthFromCar = depthOf(race, obstacle) - CAR_DEPTH;
    const isAlongside = depthFromCar > -0.15 && depthFromCar < 0.3;
    const isSameLane = Math.abs(obstacle.lane * LANE_WIDTH - race.carX) < LANE_WIDTH * 0.6;
    const isJumpingOverSpikes = obstacle.kind === 'spikes' && jumpHeightAt(race, time) > JUMP_HEIGHT_TO_CLEAR_SPIKES;
    if (obstacle.hasHit || !isAlongside || !isSameLane || isJumpingOverSpikes) continue;
    obstacle.hasHit = true;
    race.crashes += 1;
    race.speed *= 0.35;
    race.recoveringUntil = time + CRASH_RECOVERY_MS;
    scene.cameras.main.shake(250, 0.012);
    scene.cameras.main.flash(180, (COLORS.crashFlash >> 16) & 255, (COLORS.crashFlash >> 8) & 255, COLORS.crashFlash & 255);
    playSound(scene, 'crash');
    ruinMakeup(scene);
    return;
  }
}

function foggedAtDepth(depth) {
  const distanceRatio = (depth - NEAREST_VISIBLE_DEPTH) / (FARTHEST_VISIBLE_DEPTH - NEAREST_VISIBLE_DEPTH);
  const fogAmount = Math.pow(Phaser.Math.Clamp(distanceRatio, 0, 1), 0.7) * 0.9;
  return (color) => blendColor(color, currentLevel.colors.fog, fogAmount);
}

function isVisibleDepth(depth) {
  return depth < FARTHEST_VISIBLE_DEPTH && depth > NEAREST_VISIBLE_DEPTH - 1;
}

function drawObstacles(scene) {
  const race = scene.race;
  const graphics = scene.obstacleGraphics;
  graphics.clear();
  const destinationDepth = currentLevel.distance + DESTINATION_OFFSET - race.distance + CAR_DEPTH;
  if (isVisibleDepth(destinationDepth)) {
    currentLevel.drawDestination(graphics, screenPositionAt(scene, destinationDepth, 0), foggedAtDepth(destinationDepth));
  }
  const finishDepth = currentLevel.distance - race.distance + CAR_DEPTH;
  if (isVisibleDepth(finishDepth)) drawFinishLine(scene, graphics, finishDepth);

  for (let index = race.obstacles.length - 1; index >= 0; index--) {
    const obstacle = race.obstacles[index];
    const depth = depthOf(race, obstacle);
    if (!isVisibleDepth(depth)) continue;
    const position = screenPositionAt(scene, depth, obstacle.lane * LANE_WIDTH);
    const fogged = foggedAtDepth(depth);
    const draw = { traffic: drawTrafficCar, barrier: drawBarrier, cones: drawCones, spikes: drawSpikes }[obstacle.kind];
    draw(graphics, position.x, position.y, position.scale, fogged, obstacle.color);
  }
}

function drawFinishLine(scene, graphics, depth) {
  const rows = 2;
  const columns = 10;
  const rowLength = 0.35;
  const fogged = foggedAtDepth(depth);
  for (let row = 0; row < rows; row++) {
    const near = screenPositionAt(scene, depth + row * rowLength, 0);
    const far = screenPositionAt(scene, depth + (row + 1) * rowLength, 0);
    for (let column = 0; column < columns; column++) {
      const fromX = -ROAD_HALF_WIDTH + (column * ROAD_HALF_WIDTH * 2) / columns;
      const toX = fromX + (ROAD_HALF_WIDTH * 2) / columns;
      graphics.fillStyle(fogged((row + column) % 2 ? COLORS.curbPink : COLORS.cloud), 1);
      graphics.fillPoints(
        [
          { x: near.x + fromX * near.scale, y: near.y },
          { x: near.x + toX * near.scale, y: near.y },
          { x: far.x + toX * far.scale, y: far.y },
          { x: far.x + fromX * far.scale, y: far.y },
        ],
        true,
      );
    }
  }
}

function drawIceCreamShop(graphics, position, fogged) {
  const { x, y: groundY, scale: size } = position;
  const width = size * 1.3;
  const wallHeight = size * 0.62;
  const wallTop = groundY - wallHeight;
  graphics.fillStyle(COLORS.background, 0.2);
  graphics.fillEllipse(x, groundY, width * 1.15, size * 0.08);
  graphics.fillStyle(fogged(COLORS.shopWall), 1);
  graphics.fillRect(x - width / 2, wallTop, width, wallHeight);
  graphics.fillStyle(fogged(COLORS.shopTrim), 1);
  graphics.fillRect(x - width / 2, groundY - size * 0.07, width, size * 0.07);
  graphics.fillStyle(fogged(COLORS.windshield), 1);
  graphics.fillRect(x - size * 0.56, groundY - size * 0.38, size * 0.32, size * 0.2);
  graphics.fillRect(x + size * 0.24, groundY - size * 0.38, size * 0.32, size * 0.2);
  graphics.fillStyle(fogged(COLORS.flowerPink), 1);
  graphics.fillRoundedRect(x - size * 0.13, groundY - size * 0.42, size * 0.26, size * 0.42, { tl: size * 0.12, tr: size * 0.12, bl: 0, br: 0 });

  const stripes = 10;
  const awningWidth = width + size * 0.12;
  const stripeWidth = awningWidth / stripes;
  const awningTop = wallTop + size * 0.04;
  for (let stripe = 0; stripe < stripes; stripe++) {
    const stripeX = x - awningWidth / 2 + stripe * stripeWidth;
    graphics.fillStyle(fogged(stripe % 2 ? COLORS.cloud : COLORS.curbPink), 1);
    graphics.fillRect(stripeX, awningTop, stripeWidth, size * 0.1);
    graphics.fillCircle(stripeX + stripeWidth / 2, awningTop + size * 0.1, stripeWidth / 2);
  }
  graphics.fillStyle(fogged(COLORS.curbPink), 1);
  graphics.fillRoundedRect(x - size * 0.42, wallTop - size * 0.2, size * 0.84, size * 0.2, size * 0.05);
  graphics.fillStyle(fogged(COLORS.cloud), 1);
  for (let dot = 0; dot < 5; dot++) graphics.fillCircle(x - size * 0.3 + dot * size * 0.15, wallTop - size * 0.1, size * 0.025);
  drawIceCream(graphics, x, wallTop - size * 0.18, size * 0.62, fogged);
}

function drawBuilding(graphics, x, groundY, size, fogged, variety) {
  const width = size * (0.45 + variety * 0.2);
  const height = size * (0.7 + variety * 0.9);
  const wallColor = COLORS.buildingColors[Math.floor(variety * 4) % 4];
  const left = x - width / 2;
  const top = groundY - height;
  graphics.fillStyle(fogged(wallColor), 1);
  graphics.fillRect(left, top, width, height);
  graphics.fillStyle(fogged(blendColor(wallColor, COLORS.background, 0.25)), 1);
  graphics.fillRect(left - size * 0.02, top, width + size * 0.04, size * 0.05);
  graphics.fillStyle(fogged(COLORS.windowLight), 1);
  for (let windowY = top + size * 0.12; windowY < groundY - size * 0.25; windowY += size * 0.2) {
    graphics.fillRect(left + width * 0.18, windowY, width * 0.22, size * 0.1);
    graphics.fillRect(left + width * 0.6, windowY, width * 0.22, size * 0.1);
  }
  graphics.fillStyle(fogged(blendColor(wallColor, COLORS.background, 0.4)), 1);
  graphics.fillRect(x - size * 0.06, groundY - size * 0.18, size * 0.12, size * 0.18);
}

function drawLamp(graphics, x, groundY, size, fogged) {
  graphics.fillStyle(fogged(COLORS.lampPost), 1);
  graphics.fillRect(x - size * 0.012, groundY - size * 0.78, size * 0.024, size * 0.78);
  graphics.fillStyle(currentLevel.colors.sunGlow, currentLevel.isNight ? 0.45 : 0.2);
  graphics.fillCircle(x, groundY - size * 0.8, size * 0.12);
  graphics.fillStyle(fogged(COLORS.lampBulb), 1);
  graphics.fillCircle(x, groundY - size * 0.8, size * 0.045);
}

function drawStar(graphics, x, y, radius, color) {
  const points = [];
  for (let point = 0; point < 10; point++) {
    const angle = -Math.PI / 2 + (point * Math.PI) / 5;
    const distance = point % 2 ? radius * 0.45 : radius;
    points.push({ x: x + Math.cos(angle) * distance, y: y + Math.sin(angle) * distance });
  }
  graphics.fillStyle(color, 1);
  graphics.fillPoints(points, true);
}

function drawFire(graphics, x, groundY, size, fogged, variety) {
  const height = size * (0.45 + variety * 0.35);
  const layers = [
    [COLORS.flameRed, 0.28, 1],
    [COLORS.flameOrange, 0.19, 0.78],
    [COLORS.flameYellow, 0.1, 0.5],
  ];
  for (const [color, width, heightShare] of layers) {
    const flameHeight = height * heightShare;
    graphics.fillStyle(fogged(color), 1);
    graphics.fillEllipse(x, groundY - flameHeight * 0.32, size * width, flameHeight * 0.64);
    graphics.fillTriangle(x - size * width * 0.42, groundY - flameHeight * 0.4, x + size * width * 0.42, groundY - flameHeight * 0.4, x, groundY - flameHeight);
  }
}

function drawSkull(graphics, x, groundY, size, fogged) {
  graphics.fillStyle(fogged(COLORS.bone), 1);
  graphics.fillCircle(x, groundY - size * 0.17, size * 0.12);
  graphics.fillRoundedRect(x - size * 0.07, groundY - size * 0.09, size * 0.14, size * 0.08, size * 0.02);
  graphics.fillStyle(fogged(COLORS.background), 1);
  graphics.fillCircle(x - size * 0.045, groundY - size * 0.17, size * 0.032);
  graphics.fillCircle(x + size * 0.045, groundY - size * 0.17, size * 0.032);
  graphics.fillTriangle(x - size * 0.015, groundY - size * 0.1, x + size * 0.015, groundY - size * 0.1, x, groundY - size * 0.13);
}

function drawBones(graphics, x, groundY, size, fogged) {
  graphics.fillStyle(fogged(COLORS.bone), 1);
  for (const [offsetX, offsetY] of [[0, 0.05], [0.06, 0.12]]) {
    const centerX = x + offsetX * size;
    const centerY = groundY - offsetY * size;
    graphics.fillRect(centerX - size * 0.16, centerY - size * 0.02, size * 0.32, size * 0.04);
    for (const end of [-1, 1]) {
      graphics.fillCircle(centerX + end * size * 0.16, centerY - size * 0.025, size * 0.03);
      graphics.fillCircle(centerX + end * size * 0.16, centerY + size * 0.025, size * 0.03);
    }
  }
}

function drawHomeWithBaby(graphics, position, fogged) {
  const { x, y: groundY, scale: size } = position;
  const wallTop = groundY - size * 0.6;
  graphics.fillStyle(COLORS.background, 0.25);
  graphics.fillEllipse(x, groundY, size * 1.4, size * 0.08);
  graphics.fillStyle(fogged(COLORS.shopWall), 1);
  graphics.fillRect(x - size * 0.55, wallTop, size * 1.1, size * 0.6);
  graphics.fillStyle(fogged(COLORS.roofRed), 1);
  graphics.fillTriangle(x - size * 0.7, wallTop + size * 0.02, x + size * 0.7, wallTop + size * 0.02, x, wallTop - size * 0.42);
  graphics.fillStyle(fogged(COLORS.deck), 1);
  graphics.fillRect(x - size * 0.12, groundY - size * 0.34, size * 0.24, size * 0.34);
  graphics.fillStyle(fogged(COLORS.lampBulb), 1);
  graphics.fillRect(x - size * 0.45, groundY - size * 0.44, size * 0.22, size * 0.18);
  graphics.fillRect(x + size * 0.23, groundY - size * 0.44, size * 0.22, size * 0.18);

  const bottleBottom = wallTop - size * 0.3;
  graphics.fillStyle(fogged(COLORS.bottleMilk), 1);
  graphics.fillRoundedRect(x - size * 0.13, bottleBottom - size * 0.42, size * 0.26, size * 0.42, size * 0.06);
  graphics.fillStyle(fogged(COLORS.scoopVanilla), 1);
  graphics.fillRoundedRect(x - size * 0.13, bottleBottom - size * 0.24, size * 0.26, size * 0.24, size * 0.06);
  graphics.fillStyle(fogged(COLORS.bottleRing), 1);
  graphics.fillRect(x - size * 0.15, bottleBottom - size * 0.5, size * 0.3, size * 0.09);
  graphics.fillStyle(fogged(COLORS.nipple), 1);
  graphics.fillEllipse(x, bottleBottom - size * 0.56, size * 0.14, size * 0.14);
  graphics.fillCircle(x, bottleBottom - size * 0.64, size * 0.035);
}

function drawCinema(graphics, position, fogged) {
  const { x, y: groundY, scale: size } = position;
  const width = size * 1.4;
  const wallTop = groundY - size * 0.78;
  graphics.fillStyle(COLORS.background, 0.2);
  graphics.fillEllipse(x, groundY, width * 1.15, size * 0.08);
  graphics.fillStyle(fogged(COLORS.cinemaWall), 1);
  graphics.fillRect(x - width / 2, wallTop, width, size * 0.78);
  graphics.fillStyle(fogged(COLORS.cinemaTrim), 1);
  graphics.fillRect(x - width / 2 - size * 0.03, wallTop, width + size * 0.06, size * 0.08);
  graphics.fillStyle(fogged(COLORS.marquee), 1);
  graphics.fillRoundedRect(x - size * 0.52, wallTop + size * 0.13, size * 1.04, size * 0.24, size * 0.04);
  graphics.fillStyle(fogged(COLORS.cinemaTrim), 1);
  graphics.fillRect(x - size * 0.43, wallTop + size * 0.18, size * 0.86, size * 0.14);
  graphics.fillStyle(fogged(COLORS.cloud), 1);
  for (let bulb = 0; bulb <= 10; bulb++) {
    const bulbX = x - size * 0.48 + bulb * size * 0.096;
    graphics.fillCircle(bulbX, wallTop + size * 0.15, size * 0.016);
    graphics.fillCircle(bulbX, wallTop + size * 0.35, size * 0.016);
  }
  graphics.fillStyle(fogged(COLORS.curtain), 1);
  graphics.fillRect(x - size * 0.25, groundY - size * 0.32, size * 0.5, size * 0.32);
  graphics.fillStyle(fogged(COLORS.cinemaTrim), 1);
  graphics.fillRect(x - size * 0.01, groundY - size * 0.32, size * 0.02, size * 0.32);
  graphics.fillStyle(fogged(COLORS.flowerPink), 1);
  graphics.fillRect(x - size * 0.62, groundY - size * 0.4, size * 0.2, size * 0.28);
  graphics.fillStyle(fogged(COLORS.scoopMint), 1);
  graphics.fillRect(x + size * 0.42, groundY - size * 0.4, size * 0.2, size * 0.28);
  drawStar(graphics, x, wallTop - size * 0.14, size * 0.16, fogged(COLORS.marquee));
}

function drawChapel(graphics, position, fogged) {
  const { x, y: groundY, scale: size } = position;
  graphics.fillStyle(COLORS.background, 0.2);
  graphics.fillEllipse(x, groundY, size * 1.3, size * 0.08);
  graphics.fillStyle(fogged(COLORS.chapelWall), 1);
  graphics.fillRect(x - size * 0.5, groundY - size * 0.6, size, size * 0.6);
  graphics.fillRect(x - size * 0.12, groundY - size * 1.12, size * 0.24, size * 0.3);
  graphics.fillStyle(fogged(COLORS.chapelRoof), 1);
  graphics.fillTriangle(x - size * 0.6, groundY - size * 0.58, x + size * 0.6, groundY - size * 0.58, x, groundY - size * 0.98);
  graphics.fillTriangle(x - size * 0.18, groundY - size * 1.1, x + size * 0.18, groundY - size * 1.1, x, groundY - size * 1.42);
  graphics.fillStyle(fogged(COLORS.bell), 1);
  graphics.fillCircle(x, groundY - size * 0.98, size * 0.05);
  graphics.fillStyle(fogged(COLORS.curbPink), 1);
  graphics.fillCircle(x - size * 0.04, groundY - size * 0.75, size * 0.05);
  graphics.fillCircle(x + size * 0.04, groundY - size * 0.75, size * 0.05);
  graphics.fillTriangle(x - size * 0.09, groundY - size * 0.74, x + size * 0.09, groundY - size * 0.74, x, groundY - size * 0.63);
  graphics.fillStyle(fogged(COLORS.deck), 1);
  graphics.fillRoundedRect(x - size * 0.13, groundY - size * 0.36, size * 0.26, size * 0.36, { tl: size * 0.13, tr: size * 0.13, bl: 0, br: 0 });
  graphics.fillStyle(fogged(COLORS.windshield), 1);
  graphics.fillRoundedRect(x - size * 0.38, groundY - size * 0.42, size * 0.14, size * 0.2, { tl: size * 0.07, tr: size * 0.07, bl: 0, br: 0 });
  graphics.fillRoundedRect(x + size * 0.24, groundY - size * 0.42, size * 0.14, size * 0.2, { tl: size * 0.07, tr: size * 0.07, bl: 0, br: 0 });
  for (const side of [-1, 1]) {
    graphics.fillStyle(fogged(COLORS.bush), 1);
    graphics.fillCircle(x + side * size * 0.45, groundY - size * 0.05, size * 0.09);
    graphics.fillStyle(fogged(COLORS.flowerPink), 1);
    graphics.fillCircle(x + side * size * 0.42, groundY - size * 0.09, size * 0.025);
    graphics.fillCircle(x + side * size * 0.5, groundY - size * 0.04, size * 0.025);
  }
}

function drawTrafficCar(graphics, x, groundY, size, fogged, bodyColor) {
  const width = size * 0.26;
  graphics.fillStyle(COLORS.background, 0.25);
  graphics.fillEllipse(x, groundY, width * 1.1, size * 0.04);
  graphics.fillStyle(fogged(COLORS.tire), 1);
  graphics.fillRect(x - width * 0.45, groundY - size * 0.05, width * 0.18, size * 0.05);
  graphics.fillRect(x + width * 0.27, groundY - size * 0.05, width * 0.18, size * 0.05);
  graphics.fillStyle(fogged(bodyColor), 1);
  graphics.fillRoundedRect(x - width * 0.4, groundY - size * 0.26, width * 0.8, size * 0.14, size * 0.03);
  graphics.fillRoundedRect(x - width / 2, groundY - size * 0.15, width, size * 0.12, size * 0.02);
  graphics.fillStyle(fogged(COLORS.trafficGlass), 1);
  graphics.fillRoundedRect(x - width * 0.32, groundY - size * 0.24, width * 0.64, size * 0.08, size * 0.02);
  graphics.fillStyle(fogged(COLORS.tailLight), 1);
  graphics.fillRect(x - width * 0.46, groundY - size * 0.12, width * 0.16, size * 0.03);
  graphics.fillRect(x + width * 0.3, groundY - size * 0.12, width * 0.16, size * 0.03);
  graphics.fillStyle(fogged(COLORS.plate), 1);
  graphics.fillRect(x - width * 0.1, groundY - size * 0.09, width * 0.2, size * 0.035);
}

function drawBarrier(graphics, x, groundY, size, fogged) {
  const width = size * 0.28;
  const boardHeight = size * 0.06;
  const boardTop = groundY - size * 0.13;
  graphics.fillStyle(fogged(COLORS.barrierLeg), 1);
  graphics.fillRect(x - width * 0.4, boardTop, size * 0.015, size * 0.13);
  graphics.fillRect(x + width * 0.4 - size * 0.015, boardTop, size * 0.015, size * 0.13);
  graphics.fillStyle(fogged(COLORS.curbWhite), 1);
  graphics.fillRect(x - width / 2, boardTop, width, boardHeight);
  graphics.fillStyle(fogged(COLORS.barrierStripe), 1);
  for (let stripe = 0; stripe < 4; stripe++) {
    const left = x - width / 2 + (stripe * width) / 4;
    graphics.fillTriangle(left, boardTop + boardHeight, left + width / 8, boardTop, left + width / 4, boardTop);
    graphics.fillTriangle(left, boardTop + boardHeight, left + width / 4, boardTop, left + width / 8, boardTop + boardHeight);
  }
}

function drawSpikes(graphics, x, groundY, size, fogged) {
  const width = size * 0.3;
  const spikeCount = 5;
  const spikeWidth = width / spikeCount;
  const baseHeight = size * 0.03;
  const spikeTop = groundY - size * 0.14;
  graphics.fillStyle(fogged(COLORS.marquee), 1);
  graphics.fillRect(x - width / 2, groundY - baseHeight, width, baseHeight);
  for (let spike = 0; spike < spikeCount; spike++) {
    const left = x - width / 2 + spike * spikeWidth;
    graphics.fillStyle(fogged(COLORS.spikeMetal), 1);
    graphics.fillTriangle(left, groundY - baseHeight, left + spikeWidth, groundY - baseHeight, left + spikeWidth / 2, spikeTop);
    graphics.fillStyle(fogged(COLORS.spikeShade), 1);
    graphics.fillTriangle(left + spikeWidth / 2, groundY - baseHeight, left + spikeWidth, groundY - baseHeight, left + spikeWidth / 2, spikeTop);
  }
}

function drawCones(graphics, x, groundY, size, fogged) {
  for (const offset of [-0.08, 0, 0.08]) {
    const coneX = x + offset * size;
    graphics.fillStyle(fogged(COLORS.cone), 1);
    graphics.fillTriangle(coneX - size * 0.035, groundY, coneX + size * 0.035, groundY, coneX, groundY - size * 0.12);
    graphics.fillStyle(fogged(COLORS.curbWhite), 1);
    graphics.fillRect(coneX - size * 0.018, groundY - size * 0.07, size * 0.036, size * 0.015);
    graphics.fillStyle(fogged(COLORS.cone), 1);
    graphics.fillRect(coneX - size * 0.05, groundY - size * 0.01, size * 0.1, size * 0.012);
  }
}

function createHud(scene) {
  scene.progressGraphics = scene.add.graphics();
  const finishIcon = scene.add.graphics();
  currentLevel.drawDestination(finishIcon, { x: PROGRESS_BAR_X + PROGRESS_BAR_WIDTH + 28, y: 40, scale: 26 }, (color) => color);
}

function updateHud(scene) {
  const race = scene.race;
  const progress = Phaser.Math.Clamp(race.distance / currentLevel.distance, 0, 1);
  const markerX = PROGRESS_BAR_X + PROGRESS_BAR_WIDTH * progress;
  const graphics = scene.progressGraphics;
  graphics.clear();
  graphics.fillStyle(UI.shadow, 0.35);
  graphics.fillRoundedRect(PROGRESS_BAR_X, 12, PROGRESS_BAR_WIDTH, 14, 7);
  graphics.fillStyle(PALETTE.pink, 1);
  graphics.fillRoundedRect(PROGRESS_BAR_X, 12, Math.max(14, PROGRESS_BAR_WIDTH * progress), 14, 7);
  graphics.fillStyle(COLORS.cloud, 1);
  graphics.fillCircle(markerX, 19, 11);
  graphics.fillStyle(COLORS.carBody, 1);
  graphics.fillCircle(markerX, 19, 8);
}

function audioContextOf(scene) {
  const context = scene.sound && scene.sound.context;
  return context && context.state === 'running' ? context : null;
}

function updateEngineSound(scene) {
  const context = audioContextOf(scene);
  if (!context) return;
  if (!scene.engine) {
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const volume = context.createGain();
    oscillator.type = 'sawtooth';
    filter.type = 'lowpass';
    filter.frequency.value = 380;
    volume.gain.value = 0;
    oscillator.connect(filter);
    filter.connect(volume);
    volume.connect(context.destination);
    oscillator.start();
    scene.engine = oscillator;
    scene.engineVolume = volume;
  }
  const isDriving = scene.race.speed > 1;
  scene.engineVolume.gain.setTargetAtTime(isDriving ? 0.02 : 0, context.currentTime, 0.2);
  scene.engine.frequency.setTargetAtTime(40 + scene.race.speed * 3, context.currentTime, 0.1);
}

function playSound(scene, kind) {
  const context = audioContextOf(scene);
  if (!context) return;
  const oscillator = context.createOscillator();
  const volume = context.createGain();
  const now = context.currentTime;
  const sounds = {
    select: { wave: 'square', from: 700, to: 1000, gain: 0.05, length: 0.06 },
    paint: { wave: 'triangle', from: 500, to: 950, gain: 0.08, length: 0.1 },
    jump: { wave: 'square', from: 300, to: 760, gain: 0.07, length: 0.16 },
    shutter: { wave: 'square', from: 1800, to: 400, gain: 0.09, length: 0.09 },
    swoosh: { wave: 'triangle', from: 260, to: 620, gain: 0.08, length: 0.12 },
    crash: { wave: 'sawtooth', from: 220, to: 50, gain: 0.25, length: 0.4 },
  };
  const sound = sounds[kind];
  oscillator.type = sound.wave;
  oscillator.frequency.setValueAtTime(sound.from, now);
  oscillator.frequency.exponentialRampToValueAtTime(sound.to, now + sound.length);
  volume.gain.setValueAtTime(sound.gain, now);
  volume.gain.exponentialRampToValueAtTime(0.001, now + sound.length);
  oscillator.connect(volume);
  volume.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + sound.length);
}

function playMelody(scene, frequencies) {
  const context = audioContextOf(scene);
  if (!context) return;
  frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    const start = context.currentTime + index * 0.16;
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, start);
    volume.gain.setValueAtTime(0.12, start);
    volume.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
    oscillator.connect(volume);
    volume.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.3);
  });
}

const MUSIC_TRACKS = {
  menu: {
    tempo: 110,
    voices: [
      { wave: 'triangle', volume: 0.07, notes: 'E5 G5 A5 G5 E5 - C5 - D5 E5 G5 E5 D5 . . -' },
      { wave: 'sine', volume: 0.1, notes: 'C3 - G3 - A2 - E3 - F2 - C3 - G2 - G2 -' },
    ],
    drums: 'k-h-s-h-',
  },
  date: {
    tempo: 132,
    voices: [
      { wave: 'triangle', volume: 0.07, notes: 'C5 E5 G5 E5 F5 A5 G5 - E5 G5 C6 B5 A5 G5 E5 -' },
      { wave: 'sine', volume: 0.1, notes: 'C3 - C3 - F2 - F2 - A2 - A2 - G2 - G2 -' },
    ],
    drums: 'k-h-s-h-k-h-s-hh',
  },
  night: {
    tempo: 118,
    voices: [
      { wave: 'square', volume: 0.035, notes: 'A4 C5 E5 A5 E5 C5 A4 C5 F4 A4 C5 F5 G4 B4 D5 G5' },
      { wave: 'sawtooth', volume: 0.04, notes: 'A2 . A2 . A2 . A2 . F2 . F2 . G2 . G2 .' },
    ],
    drums: 'k-hhs-hhk-hhs-hh',
  },
  wedding: {
    tempo: 96,
    voices: [
      { wave: 'triangle', volume: 0.09, notes: 'G4 . C5 . C5 C5 C5 . . . G4 . D5 B4 C5 . . . G4 . C5 F5 F5 . E5 D5 C5 B4 C5 D5 C5 . . .' },
      { wave: 'sine', volume: 0.08, notes: 'C3 . . . . . . . G2 . . . C3 . . . F2 . . . . . . . G2 . . . C3 . . .' },
      { wave: 'sine', volume: 0.05, notes: 'E4 . . . . . . . D4 . . . E4 . . . A4 . . . . . . . B3 . . . E4 . . .' },
    ],
  },
  metal: {
    tempo: 170,
    voices: [
      { wave: 'sawtooth', volume: 0.035, distorted: true, notes: 'E2 E2 E2 G2 E2 E2 A2 G2 E2 E2 E2 Bb2 A2 G2 F#2 G2' },
      { wave: 'sawtooth', volume: 0.028, distorted: true, notes: 'B2 B2 B2 D3 B2 B2 E3 D3 B2 B2 B2 F3 E3 D3 C#3 D3' },
    ],
    drums: 'kks-kks-kkskkks-',
  },
};

const NOTE_SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function noteFrequency(note) {
  const accidental = note[1] === '#' ? 1 : note[1] === 'b' ? -1 : 0;
  const octave = Number(note[note.length - 1]);
  const semitonesFromA4 = NOTE_SEMITONES[note[0]] + accidental + (octave - 4) * 12 - 9;
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

function playMusic(scene, trackName) {
  const track = MUSIC_TRACKS[trackName];
  scene.music = { track, step: 0, nextStepTime: 0, nextCryAt: scene.time.now + 3000 };
}

function updateMusic(scene, time) {
  const context = audioContextOf(scene);
  const music = scene.music;
  if (!context || !music || !music.track) return;
  const stepSeconds = 60 / music.track.tempo / 2;
  if (music.nextStepTime < context.currentTime) music.nextStepTime = context.currentTime + 0.05;
  while (music.nextStepTime < context.currentTime + 0.2) {
    for (const voice of music.track.voices) playVoiceStep(context, voice, music.step, music.nextStepTime, stepSeconds);
    if (music.track.drums) playDrum(context, music.track.drums[music.step % music.track.drums.length], music.nextStepTime);
    music.step += 1;
    music.nextStepTime += stepSeconds;
  }
  if (currentLevel.hasCryingBaby && scene.phase === 'playing' && time > music.nextCryAt) {
    playBabyCry(context);
    music.nextCryAt = time + Phaser.Math.Between(2500, 4000);
  }
}

function playVoiceStep(context, voice, step, startTime, stepSeconds) {
  const notes = voice.tokens || (voice.tokens = voice.notes.split(' '));
  const note = notes[step % notes.length];
  if (note === '-' || note === '.') return;
  let length = 1;
  while (notes[(step + length) % notes.length] === '.') length += 1;
  const duration = length * stepSeconds * 0.95;
  const oscillator = context.createOscillator();
  const volume = context.createGain();
  oscillator.type = voice.wave;
  oscillator.frequency.value = noteFrequency(note);
  volume.gain.setValueAtTime(voice.volume, startTime);
  volume.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  if (voice.distorted) {
    const distortion = context.createWaveShaper();
    distortion.curve = distortionCurve();
    oscillator.connect(distortion);
    distortion.connect(volume);
  } else {
    oscillator.connect(volume);
  }
  volume.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

let sharedDistortionCurve = null;

function distortionCurve() {
  if (sharedDistortionCurve) return sharedDistortionCurve;
  sharedDistortionCurve = new Float32Array(256);
  for (let index = 0; index < 256; index++) {
    const x = (index / 128) - 1;
    sharedDistortionCurve[index] = Math.tanh(x * 6);
  }
  return sharedDistortionCurve;
}

let sharedNoiseBuffer = null;

function noiseBuffer(context) {
  if (sharedNoiseBuffer) return sharedNoiseBuffer;
  sharedNoiseBuffer = context.createBuffer(1, context.sampleRate * 0.2, context.sampleRate);
  const samples = sharedNoiseBuffer.getChannelData(0);
  for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;
  return sharedNoiseBuffer;
}

function playDrum(context, hit, startTime) {
  if (hit === 'k') {
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    oscillator.frequency.setValueAtTime(140, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(45, startTime + 0.12);
    volume.gain.setValueAtTime(0.35, startTime);
    volume.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
    oscillator.connect(volume);
    volume.connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.15);
    return;
  }
  if (hit !== 's' && hit !== 'h') return;
  const isSnare = hit === 's';
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const volume = context.createGain();
  source.buffer = noiseBuffer(context);
  filter.type = 'highpass';
  filter.frequency.value = isSnare ? 1200 : 6000;
  volume.gain.setValueAtTime(isSnare ? 0.18 : 0.06, startTime);
  volume.gain.exponentialRampToValueAtTime(0.001, startTime + (isSnare ? 0.14 : 0.05));
  source.connect(filter);
  filter.connect(volume);
  volume.connect(context.destination);
  source.start(startTime);
  source.stop(startTime + 0.2);
}

function playBabyCry(context) {
  const start = context.currentTime;
  for (const [offset, length] of [[0, 0.3], [0.38, 0.3], [0.76, 1]]) {
    const oscillator = context.createOscillator();
    const wobble = context.createOscillator();
    const wobbleDepth = context.createGain();
    const vowel = context.createBiquadFilter();
    const volume = context.createGain();
    const begin = start + offset;
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(520, begin);
    oscillator.frequency.linearRampToValueAtTime(880, begin + length * 0.3);
    oscillator.frequency.linearRampToValueAtTime(480, begin + length);
    wobble.frequency.value = 9;
    wobbleDepth.gain.value = 40;
    vowel.type = 'bandpass';
    vowel.frequency.value = 1300;
    vowel.Q.value = 2;
    wobble.connect(wobbleDepth);
    wobbleDepth.connect(oscillator.frequency);
    volume.gain.setValueAtTime(0.001, begin);
    volume.gain.linearRampToValueAtTime(0.3, begin + 0.05);
    volume.gain.exponentialRampToValueAtTime(0.001, begin + length);
    oscillator.connect(vowel);
    vowel.connect(volume);
    volume.connect(context.destination);
    for (const node of [oscillator, wobble]) {
      node.start(begin);
      node.stop(begin + length);
    }
  }
}
})();

