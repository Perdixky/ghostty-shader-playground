export function hexToRgbNormalized(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b, 1];
}

export class $ {
  /**
   * Safely create an element from a CSS-like selector (e.g. "div#app.main.container")
   * @param {string} selector
   * @returns {HTMLElement}
   */
  static createElement(selector) {
    // letters, numbers, dash, underscore only
    const safePattern =
      /^[a-zA-Z][a-zA-Z0-9-]*(#[a-zA-Z0-9_-]+)?(\.[a-zA-Z0-9_-]+)*$/;

    if (selector === undefined || !safePattern.test(selector)) {
      throw new Error(`Invalid selector: "${selector}"`);
    }

    const [tagAndId, ...classes] = selector.split(".");
    const [tag, id] = tagAndId.split("#");

    const el = document.createElement(tag || "div");

    if (id) el.id = id;
    if (classes.length) el.classList.add(...classes);

    return el;
  }
}
