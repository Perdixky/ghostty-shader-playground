import { Configuration } from "./config.js";

export const store = {
  shaderList: [],
  wrapper: "",
  video: document.createElement("video"),
  config: new Configuration(),
};
