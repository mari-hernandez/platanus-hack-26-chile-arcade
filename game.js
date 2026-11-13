const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PANEL_WIDTH = GAME_WIDTH / 2;
const MAKEUP_PANEL_WORLD_X = 1000;

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
const STARTING_SPEED = 16;
const MAX_SPEED = 34;
const SPEED_GAIN_PER_METER = 0.004;
const FIRST_OBSTACLE_POSITION = 60;
const CRASH_RECOVERY_MS = 1500;
const KMH_PER_SPEED_UNIT = 6;

const COLORS = {
  background: 0x1d1230,
  fog: 0xe3e3f7,
  skyTop: 0x5bb8ff,
  skyBottom: 0xffdcee,
  sunGlow: 0xfff6c8,
  sun: 0xfffbe6,
  cloud: 0xffffff,
  mountains: 0x9d8fd8,
  hills: 0x8fcf8a,
  grassLight: 0x86d06f,
  grassDark: 0x78c262,
  sand: 0xf6dfae,
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
  makeupTop: 0xffd6ea,
  makeupBottom: 0xf3b2d8,
};

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

function create() {
  const scene = this;
  createControls(scene);

  scene.cameras.main.setViewport(0, 0, PANEL_WIDTH, GAME_HEIGHT);
  scene.makeupCamera = scene.cameras.add(PANEL_WIDTH, 0, PANEL_WIDTH, GAME_HEIGHT).setScroll(MAKEUP_PANEL_WORLD_X, 0);

  scene.race = {
    distance: 0,
    speed: STARTING_SPEED,
    cameraX: 0,
    lane: 0,
    carX: 0,
    crashes: 0,
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
}

function update(time, delta) {
  const scene = this;
  const seconds = Math.min(delta, 50) / 1000;
  const race = scene.race;
  steerCar(scene, seconds);
  const cruisingSpeed = Math.min(MAX_SPEED, STARTING_SPEED + race.distance * SPEED_GAIN_PER_METER);
  race.speed += (cruisingSpeed - race.speed) * Math.min(1, seconds * 0.8);
  race.distance += race.speed * seconds;
  spawnObstacles(race);
  detectCrash(scene, time);
  updateSky(scene, seconds);
  drawRoad(scene);
  drawObstacles(scene);
  updateCar(scene, time);
  updateHud(scene);
  updateEngineSound(scene);
  updateMakeup(scene);
  scene.controls.pressed = Object.create(null);
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
  graphics.fillStyle(blendColor(COLORS.grassLight, COLORS.fog, 0.85), 1);
  graphics.fillRect(0, HORIZON_Y + 8, PANEL_WIDTH, GAME_HEIGHT);

  for (let index = sliceCount - 1; index >= 0; index--) {
    const near = slices[index];
    const far = slices[index + 1];
    const distanceRatio = (near.depth - NEAREST_VISIBLE_DEPTH) / (FARTHEST_VISIBLE_DEPTH - NEAREST_VISIBLE_DEPTH);
    const fogAmount = Math.pow(Phaser.Math.Clamp(distanceRatio, 0, 1), 0.7) * 0.9;
    const fogged = (color) => blendColor(color, COLORS.fog, fogAmount);
    const isStripe = ((near.index >> 1) & 1) === 1;

    graphics.fillStyle(fogged(isStripe ? COLORS.grassLight : COLORS.grassDark), 1);
    graphics.fillRect(0, far.y, PANEL_WIDTH, near.y - far.y + 1);
    for (const side of [-1, 1]) {
      fillTrapezoid(graphics, fogged(COLORS.sand), near, far, side * 1.2, 0.12);
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
  const fogged = (color) => blendColor(color, COLORS.fog, fogAmount);

  for (const side of [-1, 1]) {
    const salt = side > 0 ? 1 : 0;
    if (seededRandom(slice.index, salt) > 0.4) continue;
    const x = slice.x + side * (slice.halfWidth * 1.5 + size * (0.25 + seededRandom(slice.index, salt + 5) * 1.6));
    if (x < -size || x > PANEL_WIDTH + size) continue;
    const kind = seededRandom(slice.index, salt + 9);

    graphics.fillStyle(COLORS.shadow, 0.25 * (1 - fogAmount));
    graphics.fillEllipse(x, slice.y, size * 0.45, size * 0.08);
    if (kind < 0.6) {
      drawRoundTree(graphics, x, slice.y, size, fogged, kind < 0.2);
    } else if (kind < 0.8) {
      drawPine(graphics, x, slice.y, size, fogged);
    } else {
      drawFlowerBush(graphics, x, slice.y, size, fogged);
    }
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
  sky.fillGradientStyle(COLORS.skyTop, COLORS.skyTop, COLORS.skyBottom, COLORS.skyBottom, 1);
  sky.fillRect(0, 0, PANEL_WIDTH, HORIZON_Y + 20);
  sky.fillStyle(COLORS.sunGlow, 0.35);
  sky.fillCircle(300, 105, 48);
  sky.fillStyle(COLORS.sun, 1);
  sky.fillCircle(300, 105, 30);

  scene.clouds = [];
  for (let index = 0; index < 5; index++) {
    const cloud = scene.add.graphics();
    cloud.fillStyle(COLORS.cloud, 0.9);
    cloud.fillEllipse(0, 0, 70, 22);
    cloud.fillEllipse(-18, -8, 34, 24);
    cloud.fillEllipse(12, -12, 40, 30);
    cloud.setPosition(index * 95, 30 + seededRandom(index, 1) * 110);
    cloud.setScale(0.6 + seededRandom(index, 2) * 0.6);
    scene.clouds.push(cloud);
  }

  createRidge(scene, blendColor(COLORS.mountains, COLORS.fog, 0.35), 75, 1);
  createRidge(scene, blendColor(COLORS.hills, COLORS.fog, 0.2), 26, 4);
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
  const painter = scene.make.graphics({ x: 0, y: 0 }, false);
  painter.fillStyle(COLORS.makeupBottom, 1);
  painter.fillRect(0, 0, REFERENCE_PHOTO_SIZE, REFERENCE_PHOTO_SIZE);
  drawFace(painter, half, half + 6, 0.44, lookFrom(scene.makeup.targetIndexes));
  painter.generateTexture('reference-look', REFERENCE_PHOTO_SIZE, REFERENCE_PHOTO_SIZE);
  painter.destroy();

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
  painter.generateTexture('car', 120, 90);
  painter.clear();
  painter.fillStyle(COLORS.cloud, 1);
  painter.fillCircle(8, 8, 8);
  painter.generateTexture('puff', 16, 16);
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
  while (race.nextObstaclePosition < race.distance + FARTHEST_VISIBLE_DEPTH) {
    const lanes = Phaser.Utils.Array.Shuffle([-1, 0, 1]);
    const chanceOfTwoBlockedLanes = Math.min(0.5, race.distance / 4000);
    const blockedLanes = Math.random() < chanceOfTwoBlockedLanes ? 2 : 1;
    for (let index = 0; index < blockedLanes; index++) {
      race.obstacles.push({
        lane: lanes[index],
        position: race.nextObstaclePosition,
        kind: randomItem(['traffic', 'traffic', 'barrier', 'cones']),
        color: randomItem(COLORS.trafficBodies),
        hasHit: false,
      });
    }
    race.nextObstaclePosition += Phaser.Math.Between(9, 16);
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

function drawObstacles(scene) {
  const race = scene.race;
  const graphics = scene.obstacleGraphics;
  graphics.clear();
  for (let index = race.obstacles.length - 1; index >= 0; index--) {
    const obstacle = race.obstacles[index];
    const depth = depthOf(race, obstacle);
    if (depth > FARTHEST_VISIBLE_DEPTH || depth < NEAREST_VISIBLE_DEPTH - 1) continue;
    const position = screenPositionAt(scene, depth, obstacle.lane * LANE_WIDTH);
    const distanceRatio = (depth - NEAREST_VISIBLE_DEPTH) / (FARTHEST_VISIBLE_DEPTH - NEAREST_VISIBLE_DEPTH);
    const fogAmount = Math.pow(Phaser.Math.Clamp(distanceRatio, 0, 1), 0.7) * 0.9;
    const fogged = (color) => blendColor(color, COLORS.fog, fogAmount);
    const draw = { traffic: drawTrafficCar, barrier: drawBarrier, cones: drawCones }[obstacle.kind];
    draw(graphics, position.x, position.y, position.scale, fogged, obstacle.color);
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
    fontSize: '20px',
    fontStyle: 'bold',
    color: '#ffffff',
    stroke: '#1d1230',
    strokeThickness: 5,
  };
  scene.distanceText = scene.add.text(14, 10, '', style);
  scene.speedText = scene.add.text(PANEL_WIDTH - 14, 10, '', style).setOrigin(1, 0);
  scene.crashText = scene.add.text(14, 36, '', { ...style, fontSize: '16px', color: '#ffb3d1' });
}

function updateHud(scene) {
  const race = scene.race;
  scene.distanceText.setText(`${Math.floor(race.distance)} m`);
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
    volume.gain.value = 0.035;
    oscillator.connect(filter);
    filter.connect(volume);
    volume.connect(context.destination);
    oscillator.start();
    scene.engine = oscillator;
  }
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
