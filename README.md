# Shader Playground

A web-based playground for creating and testing cursor shaders for the Ghostty terminal.

## Getting Started

### Prerequisites
- Node.js (for running the development server)

### Installation
1. Clone or download this repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running
1. Start the development server and open your browser automatically:
   ```bash
   npm start
   ```
   
   Or manually:
   ```bash
   node server.js
   ```
   Then open `http://localhost:3000` in your browser.

The server provides:
- Static file serving for HTML, JS, and GLSL files
- `/shaders-list` endpoint that returns available shader files
- WebSocket server for live reload functionality
- File watching that automatically reloads the page when shaders or other files change

## Usage

- Use the toolbar at the bottom to:
  - Change cursor type (block, vertical bar, horizontal bar)
  - Switch between AUTO, RND, and CLICK cursor movement modes
  - Pick a cursor color (maped to uniform iCurrentCursorColor)
- Click on a canvas (in CLICK mode) to move the cursor.
- Use the dropdown on each canvas to switch shaders.
- Use keyboard arrows, Enter, and Backspace to move the cursor.

## Developing Shaders

- Add your own shaders to the `shaders/` directory - they will automatically appear in the dropdown menus.
- The server automatically watches for file changes and reloads the page when you modify shaders or other files.

## License

MIT License. See LICENSE file for details.
