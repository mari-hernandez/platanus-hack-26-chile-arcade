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
  makeupTop: 0xffd6ea,
  makeupBottom: 0xf3b2d8,
  mirrorFrame: 0xd4a24c,
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
  scene.cameras.add(PANEL_WIDTH, 0, PANEL_WIDTH, GAME_HEIGHT).setScroll(MAKEUP_PANEL_WORLD_X, 0);

  scene.race = { distance: 0, speed: 18, cameraX: 0 };
  createSky(scene);
  scene.roadGraphics = scene.add.graphics();
  scene.roadSlices = [];
  createMakeupPanel(scene);
}

function update(time, delta) {
  const scene = this;
  const seconds = Math.min(delta, 50) / 1000;
  const race = scene.race;
  race.distance += race.speed * seconds;
  updateSky(scene, seconds);
  drawRoad(scene);
  scene.controls.pressed = Object.create(null);
}

function currentSliceIndex(race) {
  return Math.floor(race.distance / ROAD_SLICE_LENGTH);
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

function createMakeupPanel(scene) {
  const left = MAKEUP_PANEL_WORLD_X;
  const centerX = left + PANEL_WIDTH / 2;
  const centerY = GAME_HEIGHT / 2 - 20;
  const panel = scene.add.graphics();
  panel.fillGradientStyle(COLORS.makeupTop, COLORS.makeupTop, COLORS.makeupBottom, COLORS.makeupBottom, 1);
  panel.fillRect(left, 0, PANEL_WIDTH, GAME_HEIGHT);
  panel.fillStyle(COLORS.cloud, 0.5);
  panel.fillEllipse(centerX, centerY, 250, 330);
  panel.lineStyle(10, COLORS.mirrorFrame, 1);
  panel.strokeEllipse(centerX, centerY, 250, 330);
  panel.fillStyle(COLORS.background, 1);
  panel.fillRect(left, 0, 6, GAME_HEIGHT);
  scene.add
    .text(centerX, centerY, 'MAQUILLAJE\n\npr\u00f3ximamente', {
      fontFamily: 'Trebuchet MS, Arial',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#b03a7a',
      align: 'center',
    })
    .setOrigin(0.5);
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
