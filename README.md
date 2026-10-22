# Meadow Dash: Coin Collector

A colorful, self-contained 2D coin collecting game built with HTML, CSS, Canvas, and vanilla JavaScript. There are no build steps, packages, backend services, or external image assets.

## Play locally

1. Open this folder in Visual Studio Code.
2. Install the **Live Server** extension if it is not already installed.
3. Right-click `index.html` and choose **Open with Live Server**. The game opens in your browser.
4. You can also open `index.html` directly in a browser; Live Server is recommended while editing.

Move with **WASD** or the **arrow keys**. Press **Escape** or the pause button to pause. On touch screens, use the directional pad below the board. Collect coins for 10 points each, dodge the slimes, and beat your saved personal best. Sound can be toggled from the game bar.

## Deploy to GitHub Pages

1. Create a GitHub repository and add `index.html`, `style.css`, `script.js`, and this README at the repository root.
2. Push the files to GitHub.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**, choose your publishing branch (usually `main`) and the `/(root)` folder, then save.
5. Wait for the Pages deployment to finish. Open the published URL shown in the Pages settings.

All game files use relative paths, so the same root files work locally and on GitHub Pages. The personal best is stored in the visitor's browser using `localStorage`.
