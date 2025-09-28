import { Configuration } from "./lib/config.js";
import { ShaderPlayer } from "./lib/player.js";
import { Bus } from "./lib/bus.js";
import { store } from "./lib/store.js";

//PIT OF SHAME:
let intervalId = undefined;
let players = [];
//END

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

var eventBus = new Bus();

window.changeCursorType = (width, height) => {
  eventBus.emit({ type: "changeCursor", data: { width, height } });
};

window.changeMode = (mode) => {
  eventBus.emit({ type: "changeMode", data: mode });
};

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
    // setGrid();
  },
);

async function getShader(name) {
  const response = await fetch(`shaders/${name}`);
  return await response.text();
}
async function getShaderList() {
  const response = await fetch("/shaders-list");
  return await response.json();
}
async function getGhosttyWrapper() {
  const response = await fetch("misc/ghostty_wrapper.glsl");
  return await response.text();
}
