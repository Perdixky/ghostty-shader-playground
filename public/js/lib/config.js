class Configuration {
  canvas = ["cursor_blaze.glsl", "debug_cursor_static.glsl"];
  cursorColor = [1, 0, 0, 1];
  magia = [1];

  constructor() {
    let memory = JSON.parse(localStorage.getItem("config"));
    if (memory) {
      Object.assign(this, memory);
    }
  }

  save() {
    const config = {};
    for (const [key, value] of Object.entries(this)) {
      if (typeof value !== "function") {
        config[key] = value;
      }
    }
    localStorage.setItem("config", JSON.stringify(config));
  }
}

export { Configuration };
