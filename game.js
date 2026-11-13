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
  crashFlash: [255, 120, 170],
  skin: 0xffe3d3,
  skinShade: 0xf5c2ad,
  noseTip: 0xffb5b0,
  outline: 0x5e3340,
  hair: 0x9a5f3e,
  hairDark: 0x6e3f2a,
  hairShine: 0xc98e64,
  clothes: 0xb79cf0,
  clothesShade: 0x957ad9,
  iris: 0x4aa8d8,
  irisDark: 0x24508f,
  irisLight: 0xa8e6ff,
  shopWall: 0xfff4e6,
  shopTrim: 0x9ee6c9,
  cone: 0xf3b860,
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
  palmTrunk: 0xb07a4a,
  palmLeaves: 0x3fae6a,
  palmLeavesLight: 0x6fd08a,
  coconut: 0x7a4a2a,
  bamboo: 0xe0b07a,
  bambooDark: 0xb98450,
  straw: 0xf2c96b,
  strawDark: 0xd9a845,
  deck: 0xc98a55,
  chapelWall: 0xfffaf5,
  chapelRoof: 0xffb3cf,
  bell: 0xffcf4a,
  partyLights: [0xff7eb3, 0x9ee6c9, 0xffd166, 0x7cb8ff],
  makeupTop: 0xffd6ea,
  makeupBottom: 0xf3b2d8,
};

const LEVELS = [
  {
    name: 'Helader\u00eda',
    arrivalText: 'Llegaron a la helader\u00eda',
    distance: 1200,
    startingSpeed: 14,
    maxSpeed: 26,
    obstacleGap: [12, 18],
    twoLaneChance: 0.15,
    obstacles: ['traffic', 'cones'],
    horizon: 'mountains',
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
    drawDestination: drawIceCreamShop,
  },
  {
    name: 'Cine',
    arrivalText: 'Llegaron al cine',
    distance: 1600,
    startingSpeed: 16,
    maxSpeed: 30,
    obstacleGap: [10, 16],
    twoLaneChance: 0.3,
    obstacles: ['traffic', 'traffic', 'barrier', 'cones'],
    horizon: 'city',
    scenery: ['building', 'building', 'lamp'],
    sceneryDensity: 0.7,
    colors: {
      skyTop: 0x8fa8ff,
      skyBottom: 0xffd2b8,
      sun: 0xfff0d0,
      sunGlow: 0xffd6a8,
      fog: 0xf0dce8,
      mountains: 0xb3a0d6,
      hills: 0x9a8cc4,
      grassLight: 0xd8d2e0,
      grassDark: 0xcbc4d6,
      sand: 0xbdb3cc,
    },
    drawDestination: drawCinema,
  },
  {
    name: 'Fiesta en la playa',
    arrivalText: 'Llegaron a la fiesta en la playa',
    distance: 2000,
    startingSpeed: 18,
    maxSpeed: 33,
    obstacleGap: [9, 14],
    twoLaneChance: 0.4,
    obstacles: ['traffic', 'barrier', 'cones'],
    horizon: 'sea',
    scenery: ['palm', 'palm', 'umbrella'],
    sceneryDensity: 0.45,
    colors: {
      skyTop: 0xff9a8b,
      skyBottom: 0xffe0a3,
      sun: 0xfff3c4,
      sunGlow: 0xffb36b,
      fog: 0xffe2cf,
      mountains: 0xd68bb0,
      hills: 0x4fb3d9,
      grassLight: 0xf7dfa8,
      grassDark: 0xf0d398,
      sand: 0xfff0cc,
    },
    drawDestination: drawBeachParty,
  },
  {
    name: 'Boda',
    arrivalText: 'Llegaron a la boda',
    distance: 2400,
    startingSpeed: 20,
    maxSpeed: 36,
    obstacleGap: [8, 12],
    twoLaneChance: 0.5,
    obstacles: ['traffic', 'traffic', 'barrier', 'cones'],
    horizon: 'mountains',
    isNight: true,
    scenery: ['lamp', 'pine', 'blossomTree'],
    sceneryDensity: 0.45,
    colors: {
      skyTop: 0x1c1747,
      skyBottom: 0x6b4a9e,
      sun: 0xfff6dc,
      sunGlow: 0xb9a6ff,
      fog: 0x5b4a86,
      mountains: 0x3a2f6b,
      hills: 0x2f5a5a,
      grassLight: 0x3f7a5a,
      grassDark: 0x376f51,
      sand: 0x8a7aa8,
    },
    drawDestination: drawChapel,
  },
];

const SCENERY_DRAWERS = {
  roundTree: (graphics, x, groundY, size, fogged) => drawRoundTree(graphics, x, groundY, size, fogged, false),
  blossomTree: (graphics, x, groundY, size, fogged) => drawRoundTree(graphics, x, groundY, size, fogged, true),
  pine: drawPine,
  flowerBush: drawFlowerBush,
  building: drawBuilding,
  lamp: drawLamp,
  palm: drawPalm,
  umbrella: drawUmbrella,
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
  steerCar(scene, seconds);
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

const OVERLAY_TEXT_STYLE = {
  fontFamily: 'Trebuchet MS, Arial',
  fontStyle: 'bold',
  color: '#ffffff',
  stroke: '#e8458f',
  strokeThickness: 10,
  align: 'center',
};

function createOverlayBackground(scene, topColor, bottomColor) {
  const background = scene.add.graphics();
  background.fillGradientStyle(topColor, topColor, bottomColor, bottomColor, 1);
  background.fillRect(OVERLAY_WORLD_X, 0, GAME_WIDTH, GAME_HEIGHT);
  for (let bulbX = OVERLAY_WORLD_X + 30; bulbX < OVERLAY_WORLD_X + GAME_WIDTH; bulbX += 52) {
    background.fillStyle(COLORS.sunGlow, 0.5);
    background.fillCircle(bulbX, 10, 12);
    background.fillStyle(COLORS.sun, 1);
    background.fillCircle(bulbX, 10, 7);
  }
  return background;
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
  const art = createOverlayBackground(scene, COLORS.makeupTop, COLORS.clothes);
  art.fillStyle(COLORS.asphaltLight, 1);
  art.fillRoundedRect(left + 170, 300, 460, 76, 38);
  art.fillStyle(COLORS.laneLine, 1);
  for (let dashX = left + 330; dashX < left + 560; dashX += 46) art.fillRect(dashX, 335, 24, 6);
  drawIceCream(art, left + 600, 372, 130);

  const car = scene.add.image(left + 255, 372, 'car').setOrigin(0.5, 1).setScale(1.25);
  const title = scene.add
    .text(centerX, 108, 'MAKEUP RACING', { ...OVERLAY_TEXT_STYLE, fontSize: '68px', strokeThickness: 14 })
    .setOrigin(0.5);
  title.setShadow(0, 6, '#b03a7a', 0, true, true);
  const subtitle = scene.add
    .text(centerX, 188, 'Lleguen a cada destino con el look igual a la foto', { ...MAKEUP_TEXT_STYLE, fontSize: '22px' })
    .setOrigin(0.5);

  const cardTexts = [];
  const cards = [
    ['JUGADOR 1 \u00b7 MANEJA', '\u25c0 \u25b6  cambia de carril\nEsquiva el tr\u00e1fico'],
    ['JUGADOR 2 \u00b7 MAQUILLA', '\u25b2 \u25bc  elige la parte\n\u25c0 \u25b6 o Bot\u00f3n 1  cambia el color'],
  ];
  cards.forEach(([heading, body], index) => {
    const cardX = left + 60 + index * 360;
    art.fillStyle(COLORS.curbPink, 0.25);
    art.fillRoundedRect(cardX + 4, 416, 320, 106, 20);
    art.fillStyle(COLORS.cloud, 0.95);
    art.fillRoundedRect(cardX, 410, 320, 106, 20);
    cardTexts.push(scene.add.text(cardX + 160, 436, heading, { ...MAKEUP_TEXT_STYLE, fontSize: '19px' }).setOrigin(0.5));
    cardTexts.push(
      scene.add
        .text(cardX + 160, 482, body, { ...MAKEUP_TEXT_STYLE, fontSize: '16px', color: '#8a5a7a', align: 'center' })
        .setOrigin(0.5),
    );
  });
  const prompt = addBlinkingPrompt(scene, 'Presiona START para jugar');
  scene.titleLayer = scene.add.container(0, 0, [art, car, title, subtitle, ...cardTexts, prompt]);
}

function createLevelSelectScreen(scene) {
  const centerX = OVERLAY_WORLD_X + GAME_WIDTH / 2;
  const background = createOverlayBackground(scene, COLORS.makeupTop, COLORS.clothes);
  const heading = scene.add
    .text(centerX, 74, 'ELIGE EL DESTINO', { ...OVERLAY_TEXT_STYLE, fontSize: '48px', strokeThickness: 12 })
    .setOrigin(0.5);
  scene.levelCardsGraphics = scene.add.graphics();
  scene.levelCardTexts = LEVELS.map(() => [
    scene.add.text(0, 0, '', { ...MAKEUP_TEXT_STYLE, fontSize: '15px' }).setOrigin(0.5),
    scene.add.text(0, 0, '', { ...MAKEUP_TEXT_STYLE, fontSize: '18px', align: 'center', wordWrap: { width: 150 } }).setOrigin(0.5),
  ]);
  const hint = scene.add
    .text(centerX, 522, '\u25c0 \u25b6  elegir      START  jugar', { ...MAKEUP_TEXT_STYLE, fontSize: '22px' })
    .setOrigin(0.5);
  scene.levelSelectLayer = scene.add.container(0, 0, [background, heading, scene.levelCardsGraphics, ...scene.levelCardTexts.flat(), hint]);
}

function refreshLevelSelect(scene) {
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
      graphics.fillStyle(COLORS.curbPink, 1);
      graphics.fillRoundedRect(centerX - 91, top - 7, 182, 294, 22);
    }
    graphics.fillStyle(COLORS.cloud, 1);
    graphics.fillRoundedRect(centerX - 85, top, 170, 280, 18);
    graphics.fillGradientStyle(level.colors.skyTop, level.colors.skyTop, level.colors.skyBottom, level.colors.skyBottom, 1);
    graphics.fillRect(centerX - 72, top + 13, 144, 120);
    graphics.fillStyle(level.colors.grassLight, 1);
    graphics.fillRect(centerX - 72, top + 133, 144, 50);
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

  const art = createOverlayBackground(scene, isPerfect ? COLORS.scoopMint : COLORS.makeupTop, isPerfect ? COLORS.makeupTop : COLORS.clothes);
  scene.add
    .text(centerX, 70, isPerfect ? '\u00a1LOOK PERFECTO!' : '\u00a1OH NO!', { ...OVERLAY_TEXT_STYLE, fontSize: '54px', strokeThickness: 12 })
    .setOrigin(0.5);
  scene.add
    .text(centerX, 128, unlocksNextLevel ? `\u00a1Desbloquearon: ${LEVELS[nextLevel].name}!` : isPerfect ? `${currentLevel.arrivalText} regias` : `${currentLevel.arrivalText}, pero el look no estaba listo`, {
      ...MAKEUP_TEXT_STYLE,
      fontSize: '20px',
    })
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
      ...MAKEUP_TEXT_STYLE,
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#c2457f',
      strokeThickness: 6,
    })
    .setOrigin(0.5);
  addBlinkingPrompt(scene, 'START para continuar');
  scene.overlayCamera.setVisible(true);
  playMelody(scene, isPerfect ? [523, 659, 784, 1047] : [392, 330, 262]);
}

function drawIceCream(graphics, x, bottomY, height, fogged = (color) => color) {
  const coneTopY = bottomY - height * 0.55;
  graphics.fillStyle(fogged(COLORS.cone), 1);
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
  const colors = currentLevel.colors;
  const sky = scene.add.graphics();
  const skyHeight = HORIZON_Y + 20;
  sky.fillGradientStyle(colors.skyTop, colors.skyTop, colors.skyBottom, colors.skyBottom, 1);
  sky.fillRect(0, 0, PANEL_WIDTH, skyHeight);
  if (currentLevel.isNight) {
    for (let index = 0; index < 40; index++) {
      sky.fillStyle(COLORS.cloud, 0.3 + seededRandom(index, 7) * 0.6);
      sky.fillCircle(seededRandom(index, 8) * PANEL_WIDTH, seededRandom(index, 9) * (HORIZON_Y - 30), 0.8 + seededRandom(index, 10) * 1.4);
    }
  }
  sky.fillStyle(colors.sunGlow, 0.35);
  sky.fillCircle(300, 105, 48);
  sky.fillStyle(colors.sun, 1);
  sky.fillCircle(300, 105, 30);
  if (currentLevel.isNight) {
    sky.fillStyle(blendColor(colors.skyTop, colors.skyBottom, 95 / skyHeight), 1);
    sky.fillCircle(314, 96, 25);
  }

  scene.clouds = [];
  for (let index = 0; index < 5; index++) {
    const cloud = scene.add.graphics();
    cloud.fillStyle(COLORS.cloud, currentLevel.isNight ? 0.18 : 0.9);
    cloud.fillEllipse(0, 0, 70, 22);
    cloud.fillEllipse(-18, -8, 34, 24);
    cloud.fillEllipse(12, -12, 40, 30);
    cloud.setPosition(index * 95, 30 + seededRandom(index, 1) * 110);
    cloud.setScale(0.6 + seededRandom(index, 2) * 0.6);
    scene.clouds.push(cloud);
  }

  if (currentLevel.horizon === 'city') {
    createSkyline(scene, blendColor(colors.mountains, colors.fog, 0.35), 90, 1);
    createSkyline(scene, blendColor(colors.hills, colors.fog, 0.15), 50, 2);
  } else {
    createRidge(scene, blendColor(colors.mountains, colors.fog, 0.35), currentLevel.horizon === 'sea' ? 40 : 75, 1);
    if (currentLevel.horizon === 'sea') createSea(scene, colors.hills);
    else createRidge(scene, blendColor(colors.hills, colors.fog, 0.2), 26, 4);
  }
}

function createSkyline(scene, color, tallestBuilding, salt) {
  const skyline = scene.add.graphics();
  const baseY = HORIZON_Y + 12;
  let x = -10;
  for (let index = 0; x < PANEL_WIDTH; index++) {
    const width = 18 + seededRandom(index, salt) * 26;
    const height = tallestBuilding * (0.35 + seededRandom(index, salt + 3) * 0.65);
    skyline.fillStyle(color, 1);
    skyline.fillRect(x, baseY - height, width - 3, height);
    skyline.fillStyle(COLORS.windowLight, 0.45);
    for (let windowY = baseY - height + 6; windowY < baseY - 6; windowY += 10) {
      skyline.fillRect(x + 4, windowY, 3, 4);
      if (width > 26) skyline.fillRect(x + width - 10, windowY, 3, 4);
    }
    x += width;
  }
}

function createSea(scene, seaColor) {
  const sea = scene.add.graphics();
  sea.fillStyle(seaColor, 1);
  sea.fillRect(0, HORIZON_Y - 14, PANEL_WIDTH, 30);
  sea.fillStyle(COLORS.cloud, 0.5);
  for (let index = 0; index < 14; index++) {
    sea.fillRect(seededRandom(index, 11) * PANEL_WIDTH, HORIZON_Y - 10 + seededRandom(index, 12) * 16, 14, 2);
  }
}

function createRidge(scene, color, peakHeight, phase) {
  const ridge = scene.add.graphics();
  const baseY = HORIZON_Y + 12;
  const outline = [{ x: 0, y: baseY + 4 }];
  for (let x = 0; x <= PANEL_WIDTH; x += 8) {
    const angle = (x / PANEL_WIDTH) * Math.PI * 2;
    const height = 0.55 + 0.3 * Math.sin(angle * 2 + phase) + 0.15 * Math.sin(angle * 5 + phase * 3);
    outline.push({ x, y: baseY - peakHeight * height });
  }
  outline.push({ x: PANEL_WIDTH, y: baseY + 4 });
  ridge.fillStyle(color, 1);
  ridge.fillPoints(outline, true);
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

  scene.lookText = scene.add.text(left + 18, 16, '', {
    ...MAKEUP_TEXT_STYLE,
    fontSize: '20px',
    color: '#ffffff',
    stroke: '#c2457f',
    strokeThickness: 6,
  });
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

  const matchingCount = MAKEUP_PARTS.filter((part, index) => isPartMatching(makeup, index)).length;
  scene.lookText.setText(`Look ${matchingCount}/${MAKEUP_PARTS.length}`);
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

function drawPartIcon(graphics, key, x, y, color) {
  graphics.fillStyle(color, 1);
  graphics.lineStyle(5, color, 1);
  if (key === 'brows') {
    graphics.beginPath();
    graphics.moveTo(x - 14, y + 5);
    graphics.lineTo(x - 2, y - 5);
    graphics.lineTo(x + 14, y - 1);
    graphics.strokePath();
  } else if (key === 'shadow') {
    graphics.fillStyle(COLORS.cloud, 1);
    graphics.fillRoundedRect(x - 15, y - 11, 30, 22, 5);
    graphics.fillStyle(color, 1);
    graphics.fillCircle(x - 7, y - 3, 5);
    graphics.fillStyle(blendColor(color, COLORS.cloud, 0.45), 1);
    graphics.fillCircle(x + 7, y - 3, 5);
    graphics.fillStyle(blendColor(color, COLORS.background, 0.3), 1);
    graphics.fillCircle(x, y + 5, 4);
  } else if (key === 'mascara') {
    graphics.lineStyle(4, COLORS.bumper, 1);
    graphics.lineBetween(x - 12, y + 12, x + 4, y - 4);
    graphics.fillEllipse(x + 8, y - 8, 10, 16);
  } else if (key === 'blush') {
    graphics.fillCircle(x, y, 12);
    graphics.lineStyle(2, COLORS.cloud, 0.9);
    for (const offset of [-5, 0, 5]) graphics.lineBetween(x + offset - 2, y + 4, x + offset + 2, y - 4);
  } else if (key === 'earrings') {
    graphics.lineStyle(2, color, 1);
    graphics.lineBetween(x, y - 14, x, y - 4);
    graphics.fillCircle(x, y - 14, 3);
    graphics.fillTriangle(x - 8, y - 2, x + 8, y - 2, x, y + 14);
    graphics.fillCircle(x - 4, y - 2, 4);
    graphics.fillCircle(x + 4, y - 2, 4);
  } else {
    graphics.fillEllipse(x - 5, y - 2, 16, 9);
    graphics.fillEllipse(x + 5, y - 2, 16, 9);
    graphics.fillEllipse(x, y + 4, 22, 10);
    graphics.fillStyle(COLORS.cloud, 0.6);
    graphics.fillEllipse(x + 4, y + 5, 7, 3);
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

  const smoothShape = (color, points) => {
    const outline = new Phaser.Curves.Spline(points.concat([points[0]]).map((point) => new Phaser.Math.Vector2(...pointAt(...point))));
    graphics.fillStyle(color, 1);
    graphics.fillPoints(outline.getPoints(points.length * 8), true);
  };
  const mirrored = (rightHalf) => rightHalf.concat(rightHalf.slice(1).reverse().map(([x, y]) => [-x, y]));

  smoothShape(COLORS.hairDark, mirrored([[0, -150], [70, -142], [122, -102], [140, -34], [132, 36], [146, 96], [130, 150], [104, 140], [90, 168], [60, 150]]));

  graphics.fillStyle(COLORS.skinShade, 1);
  graphics.fillRect(...pointAt(-20, 80), 40 * scale, 60 * scale);
  const shoulders = (grow) => mirrored([[0, 128 - grow], [46, 130 - grow], [96 + grow, 140 - grow], [132 + grow, 168 - grow], [146 + grow, 230], [144 + grow, 300]]);
  smoothShape(COLORS.outline, shoulders(4));
  smoothShape(COLORS.clothes, shoulders(0));
  for (const side of [-1, 1]) {
    ellipse(COLORS.clothesShade, side * 120, 190, 66, 76);
    ellipse(COLORS.clothes, side * 117, 185, 60, 68);
    stroke(COLORS.clothesShade, 2, [[side * 102, 160], [side * 108, 204]], 0.7);
    stroke(COLORS.clothesShade, 2, [[side * 124, 156], [side * 130, 200]], 0.7);
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
  triangle(COLORS.curbPink, [[72, -114], [50, -128], [52, -98]]);
  triangle(COLORS.curbPink, [[72, -114], [94, -128], [92, -98]]);
  circle(COLORS.flowerPink, 72, -114, 6);

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

function steerCar(scene, seconds) {
  const race = scene.race;
  const previousLane = race.lane;
  if (wasPressed(scene, 'P1_L')) race.lane = Math.max(-1, race.lane - 1);
  if (wasPressed(scene, 'P1_R')) race.lane = Math.min(1, race.lane + 1);
  if (race.lane !== previousLane) playSound(scene, 'swoosh');
  race.carX += (race.lane * LANE_WIDTH - race.carX) * Math.min(1, seconds * 12);
  race.cameraX = race.carX * 0.5;
}

function updateCar(scene, time) {
  const race = scene.race;
  const position = screenPositionAt(scene, CAR_DEPTH, race.carX);
  const isRecovering = time < race.recoveringUntil;
  const bounce = Math.sin(time * 0.03) * 1.2;
  scene.car.setPosition(position.x, CAR_SCREEN_Y + bounce);
  scene.car.setAngle((race.lane * LANE_WIDTH - race.carX) * 45);
  scene.car.setAlpha(isRecovering && Math.floor(time / 100) % 2 === 0 ? 0.35 : 1);
  scene.carShadow.setPosition(position.x, CAR_SCREEN_Y - 4);
  scene.exhaust.setPosition(position.x - 32, CAR_SCREEN_Y - 14);
}

function spawnObstacles(race) {
  const lastObstaclePosition = currentLevel.distance - LAST_OBSTACLE_MARGIN;
  while (race.nextObstaclePosition < Math.min(race.distance + FARTHEST_VISIBLE_DEPTH, lastObstaclePosition)) {
    const lanes = Phaser.Utils.Array.Shuffle([-1, 0, 1]);
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
    if (obstacle.hasHit || !isAlongside || !isSameLane) continue;
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
    const draw = { traffic: drawTrafficCar, barrier: drawBarrier, cones: drawCones }[obstacle.kind];
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

function drawPalm(graphics, x, groundY, size, fogged, variety) {
  const lean = variety > 0.5 ? 1 : -1;
  const segments = 7;
  let topX = x;
  let topY = groundY;
  for (let segment = 0; segment <= segments; segment++) {
    const progress = segment / segments;
    topX = x + Math.sin(progress * 1.4) * size * 0.14 * lean;
    topY = groundY - progress * size * 0.8;
    graphics.fillStyle(fogged(segment % 2 ? COLORS.palmTrunk : blendColor(COLORS.palmTrunk, COLORS.cloud, 0.2)), 1);
    graphics.fillCircle(topX, topY, size * 0.032);
  }
  [-2.8, -2.2, -1.6, -1.0, -0.4, 0.2].forEach((angle, index) => {
    const tipX = topX + Math.cos(angle) * size * 0.32;
    const tipY = topY + Math.sin(angle) * size * 0.2 + size * 0.1;
    const sideX = Math.sin(angle) * size * 0.04;
    const sideY = -Math.cos(angle) * size * 0.04;
    graphics.fillStyle(fogged(index % 2 ? COLORS.palmLeaves : COLORS.palmLeavesLight), 1);
    graphics.fillTriangle(topX + sideX, topY + sideY, topX - sideX, topY - sideY, tipX, tipY);
  });
  graphics.fillStyle(fogged(COLORS.coconut), 1);
  graphics.fillCircle(topX - size * 0.025, topY + size * 0.03, size * 0.025);
  graphics.fillCircle(topX + size * 0.025, topY + size * 0.035, size * 0.025);
}

function drawUmbrella(graphics, x, groundY, size, fogged, variety) {
  const canopyY = groundY - size * 0.5;
  const radius = size * 0.26;
  const accent = COLORS.partyLights[Math.floor(variety * 4) % 4];
  graphics.fillStyle(fogged(COLORS.cloud), 1);
  graphics.fillRect(x - size * 0.01, canopyY, size * 0.02, size * 0.5);
  for (let panel = 0; panel < 6; panel++) {
    const start = Math.PI + (panel * Math.PI) / 6;
    graphics.fillStyle(fogged(panel % 2 ? COLORS.cloud : accent), 1);
    graphics.slice(x, canopyY, radius, start, start + Math.PI / 6, false);
    graphics.fillPath();
  }
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

function drawBeachParty(graphics, position, fogged) {
  const { x, y: groundY, scale: size } = position;
  graphics.fillStyle(COLORS.background, 0.2);
  graphics.fillEllipse(x, groundY, size * 1.6, size * 0.08);
  graphics.fillStyle(fogged(COLORS.deck), 1);
  graphics.fillRect(x - size * 0.68, groundY - size * 0.08, size * 1.36, size * 0.08);
  graphics.fillStyle(fogged(COLORS.bamboo), 1);
  graphics.fillRect(x - size * 0.52, groundY - size * 0.52, size * 1.04, size * 0.44);
  graphics.fillStyle(fogged(COLORS.bambooDark), 1);
  for (let stick = 0; stick <= 10; stick++) graphics.fillRect(x - size * 0.52 + stick * size * 0.1, groundY - size * 0.52, size * 0.012, size * 0.44);
  graphics.fillStyle(fogged(COLORS.coconut), 1);
  graphics.fillRect(x - size * 0.22, groundY - size * 0.4, size * 0.44, size * 0.26);
  graphics.fillStyle(fogged(COLORS.straw), 1);
  graphics.fillTriangle(x - size * 0.8, groundY - size * 0.5, x + size * 0.8, groundY - size * 0.5, x, groundY - size * 1.0);
  graphics.fillStyle(fogged(COLORS.strawDark), 1);
  for (let fringe = 0; fringe < 16; fringe++) {
    const fringeX = x - size * 0.8 + fringe * size * 0.1;
    graphics.fillTriangle(fringeX, groundY - size * 0.5, fringeX + size * 0.1, groundY - size * 0.5, fringeX + size * 0.05, groundY - size * 0.42);
  }
  for (let bulb = 0; bulb < 9; bulb++) {
    const progress = bulb / 8;
    const bulbX = x - size * 0.75 + progress * size * 1.5;
    const bulbY = groundY - size * 0.6 + Math.sin(progress * Math.PI) * size * 0.08;
    graphics.fillStyle(fogged(COLORS.partyLights[bulb % 4]), 1);
    graphics.fillCircle(bulbX, bulbY, size * 0.03);
  }
  graphics.fillStyle(fogged(COLORS.flowerPink), 1);
  graphics.fillCircle(x - size * 0.2, groundY - size * 1.12, size * 0.08);
  graphics.fillStyle(fogged(COLORS.scoopMint), 1);
  graphics.fillCircle(x + size * 0.18, groundY - size * 1.16, size * 0.08);
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
