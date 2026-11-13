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
const JUMP_DURATION_MS = 650;
const JUMP_HEIGHT_PX = 70;
const JUMP_HEIGHT_TO_CLEAR_SPIKES = 0.3;
const KMH_PER_SPEED_UNIT = 6;
const LAST_OBSTACLE_MARGIN = 30;
const CAR_STOP_OFFSET = 4;
const DESTINATION_OFFSET = 11;
const DISTANCE_SHARE_TO_REACH_MAX_SPEED = 0.8;
const PROGRESS_STORAGE_KEY = 'makeup-racing:progress';
const RESULTS_DELAY_MS = 1800;
const PROGRESS_BAR_X = 16;
const PROGRESS_BAR_WIDTH = 318;
const START_BUTTONS = ['START1', 'START2', 'P1_1', 'P2_1'];

const COLORS = {
  background: 0x1d1230,
  sunGlow: 0xfff6c8,
  sun: 0xfffbe6,
  cloud: 0xffffff,
  curbPink: 0xff5f9e,
  curbWhite: 0xfff4fa,
  asphaltLight: 0x5d6178,
  asphaltDark: 0x585c72,
  laneLine: 0xfffbea,
  shadow: 0x2f5e2c,
  trunk: 0x8a5a3b,
  leaves: 0x4fa84a,
  leavesHighlight: 0x7ccd5f,
  blossom: 0xf48fb8,
  blossomHighlight: 0xffc4dc,
  pineTrunk: 0x7a4f33,
  pineDark: 0x2f8a5a,
  pineLight: 0x3ca56c,
  bush: 0x5cb850,
  flowerPink: 0xff7eb3,
  flowerYellow: 0xfff07a,
  windshield: 0xbfe8ff,
  driverHair: 0x3a2a2a,
  passengerHair: 0x8b5a3c,
  bow: 0xff5f9e,
  carBody: 0xffc93c,
  carHighlight: 0xffe27a,
  carShade: 0xe0a520,
  tire: 0x26232e,
  bumper: 0x4a4458,
  tailLight: 0xe8384f,
  tailLightGlow: 0xff9aa8,
  plate: 0xffffff,
  trafficBodies: [0x7fd6c2, 0xb69cf0, 0x7cb8ff, 0xff9f7a],
  trafficGlass: 0x2c3550,
  barrierStripe: 0xff5f9e,
  barrierLeg: 0x6b6478,
  cone: 0xff8a3d,
  spikeMetal: 0xd7dcec,
  spikeShade: 0x8a90a8,
  crashFlash: [255, 120, 170],
  skin: 0xffe3d3,
  skinShade: 0xf5c2ad,
  noseTip: 0xffb5b0,
  outline: 0x5e3340,
  hair: 0x9a5f3e,
  hairDark: 0x6e3f2a,
  hairShine: 0xc98e64,
  iris: 0x4aa8d8,
  irisDark: 0x24508f,
  irisLight: 0xa8e6ff,
  shopWall: 0xfff4e6,
  shopTrim: 0x9ee6c9,
  iceCreamCone: 0xf3b860,
  coneLines: 0xd9963f,
  scoopStrawberry: 0xff9ec7,
  scoopMint: 0x9ee6c9,
  scoopVanilla: 0xfff1d6,
  cherry: 0xe8384f,
  windowLight: 0xfff8e1,
  lampPost: 0x4a4458,
  lampBulb: 0xfff3b0,
  buildingColors: [0xf7b2c4, 0xb9d7f2, 0xf6d6a8, 0xc9b8f0],
  cinemaWall: 0x6b4fa8,
  cinemaTrim: 0x4a3580,
  marquee: 0xffd166,
  curtain: 0xd6336c,
  deck: 0xc98a55,
  chapelWall: 0xfffaf5,
  chapelRoof: 0xffb3cf,
  bell: 0xffcf4a,
  bone: 0xf3ead8,
  flameRed: 0xe8452a,
  flameOrange: 0xff9a3a,
  flameYellow: 0xffe27a,
  roofRed: 0xb83a3a,
  bottleMilk: 0xfffdf5,
  bottleRing: 0x7cb8ff,
  nipple: 0xffb3a7,
  buttonPurple: 0x7a3fe8,
  buttonPurpleLight: 0x9c6bff,
  makeupTop: 0xffd6ea,
  makeupBottom: 0xf3b2d8,
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
    colors: {
      skyTop: 0x5bb8ff,
      skyBottom: 0xffdcee,
      sun: 0xfffbe6,
      sunGlow: 0xfff6c8,
      fog: 0xe3e3f7,
      mountains: 0x9d8fd8,
      hills: 0x8fcf8a,
      grassLight: 0x86d06f,
      grassDark: 0x78c262,
      sand: 0xf6dfae,
    },
    outfit: { style: 'blouse', color: 0xb79cf0, shade: 0x957ad9 },
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
    colors: {
      skyTop: 0x1f1b4d,
      skyBottom: 0x8a5aa8,
      sun: 0xfff6dc,
      sunGlow: 0xffd6a8,
      fog: 0x6a5590,
      mountains: 0x3d3470,
      hills: 0x56478a,
      grassLight: 0x8a84a0,
      grassDark: 0x7f7996,
      sand: 0x6b6585,
    },
    outfit: { style: 'party', color: 0x2e3a7a, shade: 0x1f285a },
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
    colors: {
      skyTop: 0xffa6c1,
      skyBottom: 0xffe8c8,
      sun: 0xfff3dc,
      sunGlow: 0xffc7a0,
      fog: 0xffe6ee,
      mountains: 0xc9a0dc,
      hills: 0x9ed69a,
      grassLight: 0x9bd67e,
      grassDark: 0x8fcb72,
      sand: 0xfff0e0,
    },
    outfit: { style: 'bride', color: 0xfffaf5, shade: 0xe6dbe6 },
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
    colors: {
      skyTop: 0x2a0a12,
      skyBottom: 0xc8452a,
      sun: 0xffd27a,
      sunGlow: 0xff7a3a,
      fog: 0x7a2a2a,
      mountains: 0x4a1520,
      hills: 0xff7a2a,
      grassLight: 0x5a1a1a,
      grassDark: 0x4a1414,
      sand: 0x2a0f12,
    },
    outfit: { style: 'hoodie', color: 0x9ee6c9, shade: 0x6fc9a8 },
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
let unlockedLevelCount = 1;
let hasLoadedProgress = false;

new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-root',
  backgroundColor: COLORS.background,
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
    elapsedSeconds: 0,
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
  else if (scene.phase === 'results' && startPressed) {
    scene.scene.restart({ levelIndex: scene.levelIndex, showLevelSelect: true, selectedLevel: scene.nextSelectedLevel });
  }

  if (scene.phase === 'playing' || scene.phase === 'arriving') driveRace(scene, time, seconds);
  if (scene.phase === 'playing') updateMakeup(scene);
  updateSky(scene, seconds);
  drawRoad(scene);
  drawObstacles(scene);
  updateCar(scene, time);
  updateHud(scene);
  updateEngineSound(scene);
  scene.controls.pressed = Object.create(null);
}

function startLevel(scene) {
  scene.phase = 'playing';
  scene.race.speed = currentLevel.startingSpeed;
  scene.overlayCamera.setVisible(false);
  scene.controls.pressed = Object.create(null);
  playSound(scene, 'paint');
}

function showTitle(scene) {
  scene.phase = 'title';
  scene.titleLayer.setVisible(true);
  scene.levelSelectLayer.setVisible(false);
  scene.overlayCamera.setVisible(true);
}

function showLevelSelect(scene, selectedLevel) {
  scene.phase = 'select';
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
    race.elapsedSeconds += seconds;
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

const HEADING_STYLE = {
  fontFamily: 'Arial Black, Impact, sans-serif',
  color: '#ff00d1',
  stroke: '#1d1230',
  strokeThickness: 10,
};

const OVERLAY_TEXT_STYLE = {
  fontFamily: 'Trebuchet MS, Arial',
  fontStyle: 'bold',
  color: '#ffffff',
  stroke: '#1d1230',
  strokeThickness: 10,
  align: 'center',
};

function drawOverlayLandscape(graphics, level) {
  graphics.clear();
  drawLandscape(graphics, level, { left: OVERLAY_WORLD_X, top: 0, width: GAME_WIDTH, horizonY: 488, bottom: GAME_HEIGHT, scale: 2, sunY: 110 });
  return graphics;
}

function addBlinkingPrompt(scene, text) {
  const prompt = scene.add
    .text(OVERLAY_WORLD_X + GAME_WIDTH / 2, 562, text, { ...OVERLAY_TEXT_STYLE, fontSize: '26px', strokeThickness: 7 })
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
    .text(centerX + 8, 140, 'Makeup', { fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '78px', color: '#ff00d1', stroke: '#1d1230', strokeThickness: 12 })
    .setOrigin(1, 0.5);
  const racingWord = scene.add
    .text(centerX + 18, 160, 'Racing', { fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '72px', fontStyle: 'italic', color: '#5000ff', stroke: '#6e0404', strokeThickness: 10 })
    .setOrigin(0, 0.5);
  for (const word of [makeupWord, racingWord]) word.setShadow(0, 6, '#1d1230', 0, true, true);
  const titleGap = 14;
  const titleLeft = centerX - (makeupWord.width + titleGap + racingWord.width) / 2;
  makeupWord.setOrigin(0, 0.5).setX(titleLeft);
  racingWord.setX(titleLeft + makeupWord.width + titleGap);
  const subtitle = scene.add
    .text(centerX, 236, 'Llega a cada destino con el look perfecto', { ...OVERLAY_TEXT_STYLE, fontSize: '20px', strokeThickness: 6 })
    .setOrigin(0.5);

  const playButton = scene.add.graphics();
  drawPixelButton(playButton, 230, 72);
  const playLabel = scene.add
    .text(0, 0, 'JUGAR', { fontFamily: 'Courier New, monospace', fontStyle: 'bold', fontSize: '40px', color: '#ffffff', stroke: '#1d1230', strokeThickness: 6 })
    .setOrigin(0.5);
  const button = scene.add.container(centerX, 330, [playButton, playLabel]);
  scene.tweens.add({ targets: button, scale: 1.08, duration: 500, yoyo: true, repeat: -1 });
  const startHint = scene.add
    .text(centerX, 388, 'Presiona START', { ...OVERLAY_TEXT_STYLE, fontSize: '18px', strokeThickness: 5 })
    .setOrigin(0.5);
  const controls = scene.add
    .text(centerX, 430, 'J1 maneja  \u25c0 \u25b6  salta \u25b2      J2 maquilla  \u25b2 \u25bc \u25c0 \u25b6  Bot\u00f3n 1', {
      ...OVERLAY_TEXT_STYLE,
      fontSize: '17px',
      strokeThickness: 5,
    })
    .setOrigin(0.5);
  scene.titleLayer = scene.add.container(0, 0, [art, car, makeupWord, racingWord, subtitle, button, startHint, controls]);
}

function drawPixelButton(graphics, width, height) {
  const notch = 8;
  const layers = [
    [COLORS.background, 0],
    [COLORS.buttonPurple, 5],
  ];
  for (const [color, inset] of layers) {
    const halfWidth = width / 2 - inset;
    const halfHeight = height / 2 - inset;
    graphics.fillStyle(color, 1);
    graphics.fillRect(-halfWidth + notch, -halfHeight, halfWidth * 2 - notch * 2, halfHeight * 2);
    graphics.fillRect(-halfWidth, -halfHeight + notch, halfWidth * 2, halfHeight * 2 - notch * 2);
  }
  graphics.fillStyle(COLORS.buttonPurpleLight, 1);
  graphics.fillRect(-width / 2 + 5 + notch, -height / 2 + 5, width - 10 - notch * 2, height / 2 - 8);
}

function createLevelSelectScreen(scene) {
  const centerX = OVERLAY_WORLD_X + GAME_WIDTH / 2;
  scene.levelSelectBackground = scene.add.graphics();
  const heading = scene.add.text(centerX, 74, 'Elige el destino', { ...HEADING_STYLE, fontSize: '52px' }).setOrigin(0.5);
  heading.setShadow(0, 5, '#1d1230', 0, true, true);
  scene.levelCardsGraphics = scene.add.graphics();
  scene.levelCardTexts = LEVELS.map(() => [
    scene.add.text(0, 0, '', { ...MAKEUP_TEXT_STYLE, fontSize: '15px', color: '#7a3fe8' }).setOrigin(0.5),
    scene.add.text(0, 0, '', { ...MAKEUP_TEXT_STYLE, fontSize: '18px', align: 'center', wordWrap: { width: 150 } }).setOrigin(0.5),
  ]);
  const hint = scene.add
    .text(centerX, 524, '\u25c0 \u25b6  elegir      START  jugar', { ...OVERLAY_TEXT_STYLE, fontSize: '22px', strokeThickness: 6 })
    .setOrigin(0.5);
  scene.levelSelectLayer = scene.add.container(0, 0, [scene.levelSelectBackground, heading, scene.levelCardsGraphics, ...scene.levelCardTexts.flat(), hint]);
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
    graphics.fillStyle(COLORS.background, 0.18);
    graphics.fillRoundedRect(centerX - 80, top + 8, 170, 280, 18);
    if (isSelected) {
      graphics.fillStyle(COLORS.buttonPurple, 1);
      graphics.fillRoundedRect(centerX - 92, top - 7, 184, 294, 22);
    }
    graphics.fillStyle(COLORS.cloud, 1);
    graphics.fillRoundedRect(centerX - 85, top, 170, 280, 18);
    drawLandscape(graphics, level, { left: centerX - 72, top: top + 13, width: 144, horizonY: top + 112, bottom: top + 183, scale: 0.6, sunY: top + 42 });
    graphics.fillStyle(COLORS.asphaltLight, 1);
    graphics.fillTriangle(centerX - 12, top + 133, centerX + 12, top + 133, centerX + 40, top + 183);
    graphics.fillTriangle(centerX - 12, top + 133, centerX + 40, top + 183, centerX - 40, top + 183);
    level.drawDestination(graphics, { x: centerX, y: top + 140, scale: 64 }, (color) => color);
    if (isLocked) {
      graphics.fillStyle(COLORS.background, 0.55);
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
    const [numberText, nameText] = scene.levelCardTexts[index];
    numberText.setPosition(centerX, top + 206).setText(`NIVEL ${index + 1}`);
    nameText.setPosition(centerX, top + 238).setText(level.name).setColor(isLocked ? '#9a8aa6' : '#c2457f');
  });
}

function loadProgress(scene) {
  if (hasLoadedProgress || !window.platanusArcadeStorage) return;
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
  const left = OVERLAY_WORLD_X;
  const centerX = left + GAME_WIDTH / 2;
  const makeup = scene.makeup;
  const race = scene.race;
  const matchingCount = MAKEUP_PARTS.filter((part, index) => isPartMatching(makeup, index)).length;
  const isPerfect = matchingCount === MAKEUP_PARTS.length;
  const nextLevel = scene.levelIndex + 1;
  const unlocksNextLevel = isPerfect && nextLevel < LEVELS.length && nextLevel >= unlockedLevelCount;
  if (unlocksNextLevel) {
    unlockedLevelCount = nextLevel + 1;
    saveProgress();
  }
  scene.nextSelectedLevel = isPerfect ? Math.min(nextLevel, LEVELS.length - 1) : scene.levelIndex;

  const art = drawOverlayLandscape(scene.add.graphics(), currentLevel);
  scene.add
    .text(centerX, 70, isPerfect ? '\u00a1Look perfecto!' : '\u00a1Oh no!', { ...HEADING_STYLE, fontSize: '54px', color: isPerfect ? '#ff00d1' : '#5000ff' })
    .setOrigin(0.5)
    .setShadow(0, 5, '#1d1230', 0, true, true);
  scene.add
    .text(centerX, 128, unlocksNextLevel ? `\u00a1Desbloquearon: ${LEVELS[nextLevel].name}!` : isPerfect ? `${currentLevel.arrivalText} regias` : `${currentLevel.arrivalText}, pero el look no estaba listo`, { ...OVERLAY_TEXT_STYLE, fontSize: '20px', strokeThickness: 6 })
    .setOrigin(0.5);

  const photos = [
    ['result-current', 'ELLA', lookFrom(makeup.colorIndexes)],
    ['result-target', 'META', lookFrom(makeup.targetIndexes)],
  ];
  photos.forEach(([key, label, look], index) => {
    const photoX = centerX + (index === 0 ? -130 : 130);
    createFaceTexture(scene, key, look, 200, 220, 0.66, COLORS.makeupBottom);
    art.fillStyle(COLORS.background, 0.18);
    art.fillRoundedRect(photoX - 108, 166, 224, 290, 8);
    art.fillStyle(COLORS.cloud, 1);
    art.fillRoundedRect(photoX - 112, 160, 224, 290, 8);
    scene.add.image(photoX, 280, key);
    scene.add.text(photoX, 420, label, { ...MAKEUP_TEXT_STYLE, fontSize: '22px' }).setOrigin(0.5);
  });

  const minutes = Math.floor(race.elapsedSeconds / 60);
  const seconds = String(Math.floor(race.elapsedSeconds % 60)).padStart(2, '0');
  scene.add
    .text(centerX, 492, `Look ${matchingCount}/${MAKEUP_PARTS.length}     Choques ${race.crashes}     Tiempo ${minutes}:${seconds}`, {
      ...OVERLAY_TEXT_STYLE,
      fontSize: '22px',
      strokeThickness: 6,
    })
    .setOrigin(0.5);
  addBlinkingPrompt(scene, 'START para continuar');
  scene.overlayCamera.setVisible(true);
  playMelody(scene, isPerfect ? [523, 659, 784, 1047] : [392, 330, 262]);
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
const NATURAL_LIPS = 0xf09a9a;
const NATURAL_BROWS = 0x7a4a34;
const NATURAL_LASHES = 0x3a2328;

const MAKEUP_PARTS = [
  { key: 'brows', name: 'CEJAS', colors: [0x4a2e22, 0x1f1a1c, 0xd8a85f, 0xe0609a] },
  { key: 'shadow', name: 'SOMBRA', colors: [0xc77dff, 0x5fb3ff, 0xffb347, 0x6fd6a0, 0xff7eb3] },
  { key: 'mascara', name: 'R\u00cdMEL', colors: [0x1f1a1c, 0x3d6bff, 0x8a3fd1, 0x5a3a2a] },
  { key: 'blush', name: 'RUBOR', colors: [0xff8fab, 0xffa07a, 0xd98cd9] },
  { key: 'earrings', name: 'AROS', colors: [0xffcf4a, 0xd9dde8, 0xff7eb3, 0x45d6c4] },
  { key: 'lips', name: 'LABIOS', colors: [0xe23d5b, 0xff6fa5, 0x9b3dbd, 0xff8566] },
];

const MAKEUP_TEXT_STYLE = {
  fontFamily: 'Trebuchet MS, Arial',
  fontStyle: 'bold',
  color: '#c2457f',
};

function createMakeupPanel(scene) {
  const left = MAKEUP_PANEL_WORLD_X;
  scene.makeup = {
    selectedPart: 0,
    colorIndexes: MAKEUP_PARTS.map(() => -1),
    targetIndexes: MAKEUP_PARTS.map((part) => Phaser.Math.Between(0, part.colors.length - 1)),
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

  const panelDivider = scene.add.graphics();
  panelDivider.fillStyle(COLORS.background, 1);
  panelDivider.fillRect(left, 0, 6, GAME_HEIGHT);

  refreshMakeup(scene);
}

function createReferencePhoto(scene) {
  const half = REFERENCE_PHOTO_SIZE / 2;
  createFaceTexture(scene, 'reference-look', lookFrom(scene.makeup.targetIndexes), REFERENCE_PHOTO_SIZE, REFERENCE_PHOTO_SIZE, 0.44, COLORS.makeupBottom);

  const card = scene.add.graphics();
  card.fillStyle(COLORS.background, 0.18);
  card.fillRoundedRect(-half - 4, -half - 4, REFERENCE_PHOTO_SIZE + 16, REFERENCE_PHOTO_SIZE + 46, 6);
  card.fillStyle(COLORS.cloud, 1);
  card.fillRoundedRect(-half - 8, -half - 8, REFERENCE_PHOTO_SIZE + 16, REFERENCE_PHOTO_SIZE + 46, 6);
  const photo = scene.add.image(0, 0, 'reference-look');
  const tape = scene.add.rectangle(0, -half - 8, 44, 16, COLORS.curbPink, 0.75);
  const caption = scene.add
    .text(0, half + 18, 'META', { ...MAKEUP_TEXT_STYLE, fontSize: '18px' })
    .setOrigin(0.5);
  scene.add.container(MAKEUP_PANEL_WORLD_X + 312, 104, [card, photo, tape, caption]).setAngle(5);
}

function createMakeupToolbar(scene) {
  const left = MAKEUP_PANEL_WORLD_X;
  const toolbar = scene.add.graphics();
  toolbar.fillStyle(COLORS.curbPink, 0.25);
  toolbar.fillRoundedRect(left + 16, 500, PANEL_WIDTH - 26, 94, 22);
  toolbar.fillStyle(COLORS.cloud, 0.95);
  toolbar.fillRoundedRect(left + 16, 494, PANEL_WIDTH - 26, 94, 22);
  scene.swatchGraphics = scene.add.graphics();
  scene.partNameText = scene.add
    .text(left + PANEL_WIDTH / 2 + 3, 513, '', { ...MAKEUP_TEXT_STYLE, fontSize: '19px' })
    .setOrigin(0.5);
  scene.add
    .text(left + PANEL_WIDTH / 2 + 3, 578, '\u25b2\u25bc parte    \u25c0\u25b6 o Bot\u00f3n 1: color', {
      ...MAKEUP_TEXT_STYLE,
      fontSize: '11px',
      color: '#b98aa6',
    })
    .setOrigin(0.5);
  scene.crashNoticeText = scene.add
    .text(FACE_CENTER_X, 140, '', {
      ...MAKEUP_TEXT_STYLE,
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#e8384f',
      strokeThickness: 6,
      align: 'center',
    })
    .setOrigin(0.5)
    .setAlpha(0);
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
  scene.partNameText.setText(`${part.name}${isPartMatching(makeup, makeup.selectedPart) ? '  \u2713' : ''}`);
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
    graphics.fillStyle(COLORS.curbPink, isSelected ? 0.35 : 0.18);
    graphics.fillRoundedRect(x - size / 2 + 2, y - size / 2 + 4, size, size, 16);
    graphics.fillStyle(isSelected ? COLORS.curbPink : COLORS.cloud, 1);
    graphics.fillRoundedRect(x - size / 2, y - size / 2, size, size, 16);
    graphics.fillStyle(isSelected ? COLORS.flowerPink : COLORS.makeupTop, 1);
    graphics.fillRoundedRect(x - size / 2 + 4, y - size / 2 + 4, size - 8, size - 8, 12);
    drawPartIcon(graphics, part.key, x, y, look[part.key] || part.colors[0]);
    if (isPartMatching(scene.makeup, index)) {
      graphics.fillStyle(COLORS.pineLight, 1);
      graphics.fillCircle(x + size / 2 - 4, y - size / 2 + 4, 9);
      graphics.lineStyle(3, COLORS.cloud, 1);
      graphics.beginPath();
      graphics.moveTo(x + size / 2 - 9, y - size / 2 + 4);
      graphics.lineTo(x + size / 2 - 5, y - size / 2 + 8);
      graphics.lineTo(x + size / 2 + 1, y - size / 2);
      graphics.strokePath();
    }
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
      graphics.fillStyle(COLORS.curbPink, 1);
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
  const notice = scene.crashNoticeText;
  scene.tweens.killTweensOf(notice);
  notice.setText(`\u00a1Choque!\nCambi\u00f3: ${part.name}`).setAlpha(1).setY(230);
  scene.tweens.add({ targets: notice, y: 200, alpha: 0, delay: 900, duration: 600 });
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
    scene.cameras.main.flash(180, ...COLORS.crashFlash);
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
  const style = {
    fontFamily: 'Trebuchet MS, Arial',
    fontSize: '16px',
    fontStyle: 'bold',
    color: '#ffffff',
    stroke: '#1d1230',
    strokeThickness: 5,
  };
  scene.progressGraphics = scene.add.graphics();
  const finishIcon = scene.add.graphics();
  currentLevel.drawDestination(finishIcon, { x: PROGRESS_BAR_X + PROGRESS_BAR_WIDTH + 28, y: 40, scale: 26 }, (color) => color);
  scene.remainingText = scene.add.text(PROGRESS_BAR_X, 34, '', style);
  scene.speedText = scene.add.text(PROGRESS_BAR_X + PROGRESS_BAR_WIDTH, 34, '', style).setOrigin(1, 0);
  scene.crashText = scene.add.text(PROGRESS_BAR_X, 56, '', { ...style, color: '#ffb3d1' });
}

function updateHud(scene) {
  const race = scene.race;
  const progress = Phaser.Math.Clamp(race.distance / currentLevel.distance, 0, 1);
  const markerX = PROGRESS_BAR_X + PROGRESS_BAR_WIDTH * progress;
  const graphics = scene.progressGraphics;
  graphics.clear();
  graphics.fillStyle(COLORS.background, 0.35);
  graphics.fillRoundedRect(PROGRESS_BAR_X, 12, PROGRESS_BAR_WIDTH, 14, 7);
  graphics.fillStyle(COLORS.curbPink, 1);
  graphics.fillRoundedRect(PROGRESS_BAR_X, 12, Math.max(14, PROGRESS_BAR_WIDTH * progress), 14, 7);
  graphics.fillStyle(COLORS.cloud, 1);
  graphics.fillCircle(markerX, 19, 11);
  graphics.fillStyle(COLORS.carBody, 1);
  graphics.fillCircle(markerX, 19, 8);

  scene.remainingText.setText(`Faltan ${Math.ceil(Math.max(0, currentLevel.distance - race.distance))} m`);
  scene.speedText.setText(`${Math.round(race.speed * KMH_PER_SPEED_UNIT)} km/h`);
  scene.crashText.setText(race.crashes ? `Choques: ${race.crashes}` : '');
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
  scene.engineVolume.gain.setTargetAtTime(isDriving ? 0.035 : 0, context.currentTime, 0.2);
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
})();
