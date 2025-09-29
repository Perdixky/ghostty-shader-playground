class Configuration {
  canvas = ["cursor_smear.glsl", "debug_cursor_static.glsl"];
  backgroundColor = "#0b0e14";
  cursorColor = "#fedf16";
  tickRate = 500;

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
