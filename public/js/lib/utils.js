export function hexToRgbNormalized(hex) {
  let r = parseInt(hex.substr(1, 2), 16) / 255;
  let g = parseInt(hex.substr(3, 2), 16) / 255;
  let b = parseInt(hex.substr(5, 2), 16) / 255;
  return [r, g, b, 1];
}
