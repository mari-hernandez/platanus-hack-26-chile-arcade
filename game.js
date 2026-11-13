// Glam Rush: cooperative split screen.
// P1 drives a car on a 3 lane road (left), P2 does makeup (right).

const W = 800;
const H = 600;
const PW = 400; // width of each panel
const MAKEUP_X = 1000; // world x where the makeup panel lives

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

new Phaser.Game({
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: 'game-root',
  backgroundColor: '#1d1230',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: W,
    height: H,
  },
  scene: { create, update },
});

function create() {
  const s = this;
  createControls(s);

  // Each panel is its own camera looking at a separate region of the world,
  // so whatever is drawn in one panel can never bleed into the other.
  s.cameras.main.setViewport(0, 0, PW, H);
  s.makeupCam = s.cameras.add(PW, 0, PW, H).setScroll(MAKEUP_X, 0);

  createMakeupPanel(s);
}

function update(time, delta) {
  this.controls.pressed = Object.create(null);
}

// ---------- Makeup panel (placeholder) ----------

function createMakeupPanel(s) {
  const g = s.add.graphics();
  g.fillGradientStyle(0xffd6ea, 0xffd6ea, 0xf3b2d8, 0xf3b2d8, 1);
  g.fillRect(MAKEUP_X, 0, PW, H);
  g.fillStyle(0xffffff, 0.5);
  g.fillEllipse(MAKEUP_X + PW / 2, H / 2 - 20, 250, 330);
  g.lineStyle(10, 0xd4a24c, 1);
  g.strokeEllipse(MAKEUP_X + PW / 2, H / 2 - 20, 250, 330);
  // divider between both panels
  g.fillStyle(0x1d1230, 1);
  g.fillRect(MAKEUP_X, 0, 6, H);
  s.add
    .text(MAKEUP_X + PW / 2, H / 2 - 20, 'MAQUILLAJE\n\npróximamente', {
      fontFamily: 'Trebuchet MS, Arial',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#b03a7a',
      align: 'center',
    })
    .setOrigin(0.5);
}

// ---------- Input ----------

function createControls(s) {
  s.controls = { held: Object.create(null), pressed: Object.create(null) };
  const onKey = (down) => (e) => {
    const code = KEYBOARD_TO_ARCADE[normalizeIncomingKey(e.key)];
    if (!code) return;
    if (down && !s.controls.held[code]) s.controls.pressed[code] = true;
    s.controls.held[code] = down;
  };
  const kd = onKey(true);
  const ku = onKey(false);
  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  s.events.once('shutdown', () => {
    window.removeEventListener('keydown', kd);
    window.removeEventListener('keyup', ku);
  });
}

function held(s, code) {
  return s.controls.held[code] === true;
}

function pressed(s, code) {
  return s.controls.pressed[code] === true;
}

function normalizeIncomingKey(key) {
  if (typeof key !== 'string' || key.length === 0) return '';
  if (key === ' ') return 'space';
  return key.toLowerCase();
}
