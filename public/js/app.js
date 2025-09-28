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
setTickRate(1000);
const eventBus = new Bus();

window.changeCursorType = (width, height) => {
  eventBus.emit({ type: "changeCursor", data: { width, height } });
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

document.getElementById("cursorColor").addEventListener("input", (event) => {
  eventBus.emit({ type: "cursorColor", data: event.target.value });
});

const playground = document.getElementById("playground");
Promise.all([getGhosttyWrapper(), getShaderList()]).then(
  ([ghosttyWrapper, list]) => {
    store.wrapper = ghosttyWrapper;
    store.shaderList = list;
    store.config.canvas.forEach((shader, index) => {
      var player = new ShaderPlayer(index, playground, eventBus);
      players.push(player);
    });
    setGrid();
  },
);

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
