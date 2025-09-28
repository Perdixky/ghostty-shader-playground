import { Configuration } from "./lib/config.js";
import { ShaderPlayer } from "./lib/player.js";
import { Bus } from "./lib/bus.js";
import { store } from "./lib/store.js";
import { getShaderList, getGhosttyWrapper, getShader } from "./lib/service.js";

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
  players[0].tick();
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

var configuration = new Configuration();
configuration.save();

const playground = document.getElementById("playground");
Promise.all([getGhosttyWrapper(), getShaderList()]).then(
  ([ghosttyWrapper, list]) => {
    store.wrapper = ghosttyWrapper;
    store.shaderList = list;
    let wrapShader = (shader) => ghosttyWrapper.replace("//$REPLACE$", shader);
    configuration.canvas.forEach((shader, index) => {
      var player = new ShaderPlayer(playground, eventBus);
      players.push(player);
      getShader(shader).then((shaderContent) => {
        var fragment = wrapShader(shaderContent);
        player.play(fragment);
      });
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
