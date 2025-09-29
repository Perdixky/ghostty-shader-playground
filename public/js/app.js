import { ShaderPlayer } from "./lib/player.js";
import { Bus } from "./lib/bus.js";
import { store } from "./lib/store.js";
import { getShaderList, getGhosttyWrapper } from "./lib/service.js";

let intervalId = undefined;
let players = [];

function setTickRate(interval) {
  if (intervalId) {
    clearInterval(intervalId);
  }
  intervalId = setInterval(() => {
    tick();
  }, interval);
}

function tick() {
  players.forEach((p) => p.tick());
}
setTickRate(500);
const eventBus = new Bus();

window.changeCursorType = (width, height) => {
  eventBus.emit({ type: "changeCursor", data: { width, height } });
};
window.addPlayer = () => {
  addPlayer(players.length);
};

window.changeMode = (mode) => {
  eventBus.emit({ type: "changeMode", data: mode });
};
window.addEventListener("resize", function () {
  setGrid();
});
window.addEventListener("keydown", function (event) {
  if (event.key) {
    let move = "right";
    switch (event.key) {
      case "Enter":
      case "ArrowDown":
        move = "down";
        break;
      case "ArrowLeft":
      case "Backspace":
        move = "left";
        break;
      case "ArrowUp":
        move = "up";
        break;
      default:
        move = "right";
        break;
    }
    eventBus.emit({ type: "keyboard", data: move });
  }
});

let tickRateInput = document.getElementById("tickRate");
tickRateInput.value = store.config.tickRate;
tickRateInput.addEventListener("input", (event) => {
  setTickRate(event.target.value);
  store.config.tickRate = event.target.value ?? 50;
  store.config.save();
});

let cursorColorInput = document.getElementById("cursorColor");
cursorColorInput.value = store.config.cursorColor;
cursorColorInput.addEventListener("input", (event) => {
  eventBus.emit({ type: "cursorColor", data: event.target.value });
});

let backgroundColorInput = document.getElementById("backgroundColor");
backgroundColorInput.value = store.config.backgroundColor;
backgroundColorInput.addEventListener("input", (event) => {
  eventBus.emit({ type: "backgroundColor", data: event.target.value });
});

const playground = document.getElementById("playground");
Promise.all([getGhosttyWrapper(), getShaderList()]).then(
  ([ghosttyWrapper, list]) => {
    store.wrapper = ghosttyWrapper;
    store.shaderList = list;
    store.config.canvas.forEach((shader, index) => {
      addPlayer(index);
    });
  },
);

function addPlayer(index) {
  var player = new ShaderPlayer(index, playground, eventBus, removePlayer);
  players.push(player);
  setGrid();
}

function removePlayer(player) {
  player.wrapper.remove();
  let index = players.findIndex((p) => p === player);
  store.config.canvas.splice(index, 1);
  store.config.save();
  players = players.filter((p) => p !== player);
  setGrid();
}

function setGrid() {
  let gridValue = players.reduce((a, b) => a + " 1fr", "");
  const isVertical = window.innerHeight > window.innerWidth;
  if (isVertical) {
    playground.style.gridTemplateColumns = "unset";
    playground.style.gridTemplateRows = gridValue;
  } else {
    playground.style.gridTemplateColumns = gridValue;
    playground.style.gridTemplateRows = "unset";
  }
}
