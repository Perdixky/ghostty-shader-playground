import { global } from "./global.js";
class PlayerUI {
  element;
  onRemove;
  onShaderChange;
  onPip;
  onTexture;
  constructor(index, onRemove, onShaderChange, onPip, onTexture) {
    this.onRemove = onRemove;
    this.onShaderChange = onShaderChange;
    this.onPip = onPip;
    this.onTexture = onTexture;

    this.element = this._createWrapperElement();
    let cb = this._createShowBackgroundCheckbox();
    this.element.appendChild(cb);

    let selectMenu = this._createShaderListSelect();
    selectMenu.value =
      global.config.canvas[index] ?? "debug_cursor_static.glsl";
    this.element.appendChild(selectMenu);
    selectMenu.dispatchEvent(new Event("change"));

    if (global.video.requestPictureInPicture) {
      let pipButtonEl = this._createPiPButton();
      this.element.appendChild(pipButtonEl);
    }

    let removeButtonEl = this._createRemoveButton(onRemove);
    this.element.appendChild(removeButtonEl);
  }

  _createShowBackgroundCheckbox() {
    const label = document.createElement("label");
    label.classList.add("_checkbox-label");
    label.classList.add("noselect");
    label.innerText = "Load texture";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    label.appendChild(cb);
    cb.addEventListener("change", (event) => {
      this.onTexture(event.target.checked);
    });
    return label;
  }
  _createWrapperElement() {
    const div = document.createElement("div");
    div.classList.add("_toolbox");
    return div;
  }

  _createShaderListSelect() {
    const selectMenu = document.createElement("select");
    global.shaderList.forEach((shader) => {
      const option = document.createElement("option");
      option.value = shader;
      option.textContent = shader;
      selectMenu.appendChild(option);
    });

    selectMenu.addEventListener("change", (event) => {
      this.onShaderChange(event.target.value);
    });
    return selectMenu;
  }
  _createPiPButton() {
    const button = document.createElement("button");
    button.classList.add("_button");
    button.setAttribute("data-tooltip", "Picture in Picture");
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#333"><path d="M80-520v-80h144L52-772l56-56 172 172v-144h80v280H80Zm80 360q-33 0-56.5-23.5T80-240v-200h80v200h320v80H160Zm640-280v-280H440v-80h360q33 0 56.5 23.5T880-720v280h-80ZM560-160v-200h320v200H560Z"/></svg>`;
    button.addEventListener("click", this.onPip);

    return button;
  }

  _createRemoveButton(onRemove) {
    const button = document.createElement("button");
    button.classList.add("_button");
    button.setAttribute("data-tooltip", "Remove player");
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ff0000"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>`;
    button.addEventListener("click", onRemove);
    return button;
  }
}
export { PlayerUI };
