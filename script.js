const gameContainer = document.getElementById('game');
const coinInfo = document.getElementById('coin-count');
const levelInfo = document.getElementById('current-level');
const resetBtn = document.getElementById('reset-btn');
const hintBtn = document.getElementById('hint-btn');
const levelMenu = document.getElementById('level-menu');
const levelMenuBtn = document.getElementById('level-menu-btn');

const coinSound = document.getElementById('coin-sound');
const fillSound = document.getElementById('fill-sound');
const winSound = document.getElementById('win-sound');

const BOTTLE_CAPACITY = 4;
const MAX_COLORS = 8;
const MAX_LEVELS = 100;

let level = parseInt(localStorage.getItem('level') || '1');
let coins = parseInt(localStorage.getItem('coins') || '0');
let bottles = [];
let selected = null;
let hintActive = false;

function saveProgress() {
  localStorage.setItem('coins', coins);
  localStorage.setItem('level', level);
}

function getLevelConfig(level) {
  const colorCount = Math.min(2 + Math.floor(level / 2), MAX_COLORS);
  return { colors: colorCount, bottles: colorCount + 2 };
}

function generateLevel(level) {
  const { colors, bottles: totalBottles } = getLevelConfig(level);
  const colorPool = [];

  for (let i = 0; i < colors; i++) {
    for (let j = 0; j < BOTTLE_CAPACITY; j++) {
      colorPool.push(i);
    }
  }

  colorPool.sort(() => Math.random() - 0.5);

  const levelData = [];
  for (let i = 0; i < totalBottles; i++) {
    levelData.push(i < totalBottles - 2 ? colorPool.splice(0, BOTTLE_CAPACITY) : []);
  }

  return levelData;
}

function render() {
  gameContainer.innerHTML = '';
  bottles.forEach((bottle, index) => {
    const el = document.createElement('div');
    el.className = 'bottle';
    if (selected === index) el.classList.add('selected');

    bottle.forEach((color, i) => {
      const layer = document.createElement('div');
      layer.className = `layer color-${color}`;
      layer.style.bottom = `${i * 25}%`;
      el.appendChild(layer);
    });

    el.addEventListener('click', () => handleClick(index));
    gameContainer.appendChild(el);
  });
}

function handleClick(index) {
  if (selected === null) {
    selected = index;
  } else if (selected === index) {
    selected = null;
  } else {
    if (canPour(selected, index)) {
      animatePour(selected, index).then(() => {
        pour(selected, index);
        selected = null;
        checkWin();
        render();
      });
    } else {
      selected = index;
    }
  }
  render();
}

function canPour(from, to) {
  const fromBottle = bottles[from];
  const toBottle = bottles[to];
  if (!fromBottle.length || toBottle.length >= BOTTLE_CAPACITY) return false;
  const topColor = fromBottle[fromBottle.length - 1];
  if (!toBottle.length) return true;
  return toBottle[toBottle.length - 1] === topColor;
}

function pour(from, to) {
  const fromBottle = bottles[from];
  const toBottle = bottles[to];
  const color = fromBottle[fromBottle.length - 1];

  while (
    fromBottle.length &&
    fromBottle[fromBottle.length - 1] === color &&
    toBottle.length < BOTTLE_CAPACITY
  ) {
    toBottle.push(fromBottle.pop());
  }

  fillSound.currentTime = 0;
  fillSound.play();
}

function animatePour(fromIdx, toIdx) {
  return new Promise(resolve => {
    const fromEl = gameContainer.children[fromIdx];
    const toEl = gameContainer.children[toIdx];
    const clone = fromEl.cloneNode(true);
    const rectFrom = fromEl.getBoundingClientRect();
    const rectTo = toEl.getBoundingClientRect();

    clone.style.position = 'absolute';
    clone.style.left = `${rectFrom.left + rectFrom.width / 2 - 30}px`;
    clone.style.top = `${rectFrom.top}px`;
    clone.style.zIndex = 1000;
    clone.style.transition = 'all 0.5s ease-in-out';
    document.body.appendChild(clone);

    requestAnimationFrame(() => {
      clone.style.left = `${rectTo.left + rectTo.width / 2 - 30}px`;
      clone.style.top = `${rectTo.top}px`;
      clone.style.transform = 'rotate(-25deg)';
    });

    setTimeout(() => {
      document.body.removeChild(clone);
      resolve();
    }, 600);
  });
}

function checkWin() {
  const won = bottles.every(
    b => b.length === 0 || (b.length === BOTTLE_CAPACITY && b.every(c => c === b[0]))
  );
  if (won) {
    winSound.play();
    coins += 100;
    coinSound.play();
    level = Math.min(level + 1, MAX_LEVELS);
    saveProgress();
    updateUI();
    init();
  } else {
    updateUI();
  }
}

function updateUI() {
  coinInfo.textContent = coins;
  levelInfo.textContent = level;
}

function init() {
  bottles = generateLevel(level);
  selected = null;
  updateUI();
  render();
}

hintBtn.addEventListener('click', () => {
  if (hintActive) return;

  if (coins < 50) {
    alert("Not enough coins to use a hint! You need 50 coins.");
    return;
  }

  coins -= 50;
  saveProgress();
  updateUI();
  showHint();
});

function showHint() {
  hintActive = true;
  for (let i = 0; i < bottles.length; i++) {
    for (let j = 0; j < bottles.length; j++) {
      if (i !== j && canPour(i, j)) {
        selected = i;
        render();
        setTimeout(() => {
          selected = null;
          hintActive = false;
          render();
        }, 2000);
        return;
      }
    }
  }
  alert("No valid moves available!");
  hintActive = false;
}

resetBtn.addEventListener('click', init);

levelMenuBtn.addEventListener('click', () => {
  levelMenu.classList.toggle('hidden');
  renderLevelMenu();
});

function renderLevelMenu() {
  levelMenu.innerHTML = '';
  for (let i = 1; i <= MAX_LEVELS; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i <= level) {
      btn.classList.add('unlocked');
      btn.addEventListener('click', () => {
        level = i;
        saveProgress();
        levelMenu.classList.add('hidden');
        init();
      });
    } else {
      btn.classList.add('locked');
      btn.disabled = true;
    }
    levelMenu.appendChild(btn);
  }
}

init();
