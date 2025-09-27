import { Configuration } from "./lib/config.js";
import { ShaderPlayer } from "./lib/player.js";
import { Bus } from "./lib/bus.js";
import { store } from "./lib/store.js";
const rainbow = {
  vertex: `#version 300 es
    in vec2 position;

    void main() {
        gl_Position = vec4(position, 0.0, 1.0);
    }
                `,
  fragment: `      
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 a = fragCoord.xy;
    vec2 b = iResolution.xy;
    vec2 uv = a / b;
    vec2 p = uv * 2.0 - 1.0;

    float v1 = sin(p.x * 10.0 + iTime);
    float v2 = sin(p.y * 10.0 + iTime * 4.5);
    float v3 = sin((p.x + p.y) * 10.0 + iTime * 0.5);
    float v4 = sin(length(p) * 10.0 + iTime * 2.0);

    float plasma = (v1 + v2 + v3 + v4) / 4.0;
    vec3 color = vec3(
        0.5 + 0.5 * sin(plasma * 6.28 + 0.0),
        0.5 + 0.5 * sin(plasma * 6.28 + 2.09),
        0.5 + 0.5 * sin(plasma * 6.28 + 4.18)
    );

    fragColor = vec4(color, 1.0);
}
                `,
};

//PIT OF SHAME:
let intervalId = undefined;
let players = [];
//END
//

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

var configuration = new Configuration();
configuration.save();

const playground = document.getElementById("playground");
var shaderList = [];
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
