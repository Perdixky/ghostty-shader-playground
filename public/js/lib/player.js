import { CanvasGLSL } from "./utils/canvas-glsl.js";
import { Bus } from "./bus.js";
import { store } from "./store.js";

/**
 * @class ShaderPlayer
 * @property {string} vertex
 * @property {CanvasGLSL} renderer
 * @property {HTMLDivElement} wrapper
 * @property {HTMLCanvasElement} canvas
 * @property {Bus} bus
 */
class ShaderPlayer {
  vertex = `#version 300 es
    in vec2 position;
    void main() {
        gl_Position = vec4(position, 0.0, 1.0);
    }`;
  renderer;
  wrapper;
  canvas;
  clickListener;
  bus;
  cursor = { x: 0, y: 0, w: 10, h: 20 };
  presetPosition = 0;
  tickFunction = () => {
    this.changePresetPosition(1);
  };
  /**
   * @param {HTMLElement} playground
   * @param {Bus} bus
   */
  constructor(playground, bus) {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "_canvas-wrapper";

    this.wrapper.appendChild(this._createShaderListSelect());

    this.canvas = document.createElement("canvas");
    this.canvas.width = this.wrapper.clientWidth;
    this.canvas.height = this.wrapper.clientHeight;
    this.wrapper.appendChild(this.canvas);
    playground.appendChild(this.wrapper);
    this.renderer = new CanvasGLSL(this.canvas);
    this.bus = bus;
    this.clickListener = this.canvas.addEventListener("click", (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = this.canvas.height - (event.clientY - rect.top);
      this.bus.emit({ type: "click", data: { x, y } });
    });
    var eventBus = this.bus.subscribe((event) => {
      if (event.type == "changeCursor") {
        this.updateCursor(null, null, event.data.width, event.data.height);
      }
      if (event.type == "click") {
        if (this.tickFunction) {
          this.tickFunction();
        } else {
          this.updateCursor(event.data.x, event.data.y);
        }
      }
      if (event.type == "changeMode") {
        switch (event.data) {
          case "auto":
            this.tickFunction = () => {
              this.changePresetPosition(1);
            };
            break;
          case "click":
            this.tickFunction = null;
            break;
          case "rnd":
            this.tickFunction = this.randomCursor;
        }
      }
    });
  }

  _createShaderListSelect() {
    const selectMenu = document.createElement("select");

    store.shaderList.forEach((shader) => {
      const option = document.createElement("option");
      option.value = shader;
      option.textContent = shader;
      selectMenu.appendChild(option);
    });

    selectMenu.addEventListener("change", (event) => {
      const selectedShader = event.target.value;
      let wrapShader = (shader) => store.wrapper.replace("//$REPLACE$", shader);
      fetch(`shaders/${selectedShader}`)
        .then((response) => {
          return response.text();
        })
        .then((shaderCode) => {
          var fragment = wrapShader(shaderCode);
          this.play(fragment);
        });
    });
    return selectMenu;
    // selectMenu.value = shader;
    // selectMenu.dispatchEvent(new Event("change"));
  }

  /**
   * @param {string} fragmentShadder
   */
  play(fragmentShadder) {
    this.renderer.stop();
    this.renderer.loadShader(this.vertex, fragmentShadder);
    this.renderer.start();
    this.renderer.setUniform("iCurrentCursorColor", 0, 0, 255, 1);
  }
  tick() {
    this.tickFunction();
    // this.changePresetPosition(1);
  }

  onClick() {}

  randomCursor() {
    if (!this.canvas) {
      return;
    }
    const x = Math.random() * this.canvas.width;
    const y = Math.random() * this.canvas.height;
    this.updateCursor(x, y);
  }

  changePresetPosition(increment) {
    let bottom = this.canvas.height * 0.1;
    let top = this.canvas.height * 0.9;
    let left = this.canvas.width * 0.1;
    let right = this.canvas.width * 0.9;

    this.presetPosition = (this.presetPosition + increment) % 7;
    switch (this.presetPosition) {
      case 0:
        this.updateCursor(left, top);
        break;
      case 1:
        this.updateCursor(right, bottom);
        break;
      case 2:
        this.updateCursor(right, top);
        break;
      case 3:
        this.updateCursor(left, top);
        break;
      case 4:
        this.updateCursor(left, bottom);
        break;
      case 5:
        this.updateCursor(right, bottom);
        break;
      case 6:
        this.updateCursor(right, top);
        this.updateCursor(left, bottom);
        break;
    }
  }

  updateCursor(x, y, w, h) {
    this.renderer.setUniform(
      "iPreviousCursor",
      this.cursor.x,
      this.cursor.y,
      this.cursor.w,
      this.cursor.h,
    );
    this.cursor.x = x !== undefined ? x : this.cursor.x;
    this.cursor.y = y !== undefined ? y : this.cursor.y;
    this.cursor.w = w !== undefined ? w : this.cursor.w;
    this.cursor.h = h !== undefined ? h : this.cursor.h;
    this.renderer.setUniform(
      "iCurrentCursor",
      this.cursor.x,
      this.cursor.y,
      this.cursor.w,
      this.cursor.h,
    );
    let now = performance.now() / 1000;
    this.renderer.setUniform("iTimeCursorChange", now);
  }
}

export { ShaderPlayer };
