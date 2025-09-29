import { CanvasGLSL } from "./canvas-glsl.js";
import { Bus } from "./bus.js";
import { store } from "./store.js";
import { getShader } from "./service.js";
import { hexToRgbNormalized } from "./utils.js";

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
  canvas2;
  clickListener;
  bus;
  cursor = { x: 0, y: 0, w: 10, h: 20 };
  cursorColor = [0, 0, 1, 1];
  presetPosition = 0;
  index = -1;
  file = "debug_cursor_static.glsl";
  tickFunction = () => {
    this.changePresetPosition(1);
  };
  /**
   * @param {HTMLElement} playground
   * @param {Bus} bus
   */
  constructor(index, playground, bus, removeFn) {
    console.log(index);
    this.index = index;
    this.wrapper = document.createElement("div");
    this.wrapper.className = "_canvas-wrapper";

    //CREATE TOOLBOX
    let toolboxEl = this._createButtonWrapper();
    this.wrapper.appendChild(toolboxEl);
    //SELECT MENU
    let selectMenu = this._createShaderListSelect();
    toolboxEl.appendChild(selectMenu);
    selectMenu.value = store.config.canvas[index] ?? "debug_cursor_static.glsl";
    selectMenu.dispatchEvent(new Event("change"));
    //PIP BUTTON
    if (store.video.requestPictureInPicture) {
      let pipButton = this._createPiPButton();
      toolboxEl.appendChild(pipButton);
    }
    //REMOVE BUTTON
    let removeButton = this._createRemoveButton(removeFn);
    toolboxEl.appendChild(removeButton);

    this.cursorColor = hexToRgbNormalized(store.config.cursorColor);
    this.canvas = document.createElement("canvas");
    this.canvas.style.background = "purple";
    this.wrapper.appendChild(this.canvas);

    this.canvas2 = document.createElement("canvas");
    this.canvas2.style.zIndex = "-1";
    this.canvas2.style.background = "pink";
    this.wrapper.appendChild(this.canvas2);

    const resizeObserver = new ResizeObserver(() => {
      this.canvas2.width = this.wrapper.clientWidth;
      this.canvas2.height = this.wrapper.clientHeight;
      this._drawBackround(store.config.backgroundColor);
    });
    resizeObserver.observe(this.wrapper);

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
      if (event.type == "cursorColor") {
        this.updateCursorColor(hexToRgbNormalized(event.data));
        store.config.cursorColor = event.data;
        store.config.save();
      }
      if (event.type == "backgroundColor") {
        this._drawBackround(event.data);
        store.config.backgroundColor = event.data;
        store.config.save();
      }
      if (event.type == "keyboard") {
        switch (event.data) {
          case "up":
            this.updateCursor(this.cursor.x, this.cursor.y + 20);
            break;
          case "down":
            this.updateCursor(this.cursor.x, this.cursor.y - 20);
            break;
          case "left":
            this.updateCursor(this.cursor.x - 10, this.cursor.y);
            break;
          case "right":
            this.updateCursor(this.cursor.x + 10, this.cursor.y);
            break;
        }
      }
      if (event.type == "changeCursor") {
        this.updateCursor(null, null, event.data.width, event.data.height);
      }
      if (event.type == "click") {
        if (this.tickFunction) {
          this.tickFunction();
        } else {
          console.log(event.data.x, event.data.y);
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

  _drawBackround(color) {
    const ctx = this.canvas2.getContext("2d");
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, this.canvas2.width, this.canvas2.height);
    if (this.renderer) {
      let texture = this.renderer.createTexture(this.canvas2);
      this.renderer.setUniform("iChannel0", texture);
    }
  }
  _createButtonWrapper() {
    const div = document.createElement("div");
    div.classList.add("_toolbox");
    return div;
  }
  _createPiPButton() {
    const button = document.createElement("button");
    button.classList.add("_button");
    button.setAttribute("data-tooltip", "Picture in Picture");
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#333"><path d="M80-520v-80h144L52-772l56-56 172 172v-144h80v280H80Zm80 360q-33 0-56.5-23.5T80-240v-200h80v200h320v80H160Zm640-280v-280H440v-80h360q33 0 56.5 23.5T880-720v280h-80ZM560-160v-200h320v200H560Z"/></svg>`;
    button.addEventListener("click", async () => {
      try {
        const stream = this.canvas.captureStream(30); // 30 fps
        store.video.srcObject = stream;
        // ensure video is playing before PiP
        await store.video.play();
        // enter picture-in-picture
        await store.video.requestPictureInPicture();
      } catch (err) {
        console.error("Failed to enter PiP:", err);
      }
    });

    return button;
  }
  _createRemoveButton(removeFn) {
    const button = document.createElement("button");
    button.classList.add("_button");
    button.setAttribute("data-tooltip", "Remove player");
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ff0000"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>`;
    button.addEventListener("click", () => {
      removeFn(this);
    });
    return button;
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
      this.file = event.target.value;
      this.load();
    });
    return selectMenu;
  }

  load() {
    let wrapShader = (shader) => store.wrapper.replace("//$REPLACE$", shader);
    getShader(this.file).then((shaderCode) => {
      store.config.canvas[this.index] = this.file;
      store.config.save();
      var fragment = wrapShader(shaderCode);
      this.play(fragment);
    });
  }

  /**
   * @param {string} fragmentShadder
   */
  play(fragmentShadder) {
    this.renderer.stop();
    this.renderer.loadShader(this.vertex, fragmentShadder);
    this.renderer.start();
    this.updateCursorColor(this.cursorColor);
  }

  tick() {
    if (this.tickFunction) {
      this.tickFunction();
    }
  }

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
    //NOTE: i dont like this.
    let now = this.renderer.uniforms["iTime"].value[0][0];
    this.renderer.setUniform("iTimeCursorChange", now);
  }

  updateCursorColor(color) {
    this.renderer.setUniform("iCurrentCursorColor", ...color);
  }
}

export { ShaderPlayer };
