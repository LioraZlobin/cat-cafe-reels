import Phaser from "phaser";
import "./style.css";

import { GameScene } from "./game/GameScene";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 840;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,

  width: GAME_WIDTH,
  height: GAME_HEIGHT,

  parent: "game-container",

  backgroundColor: "#160f20",

  scene: [GameScene],

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,

    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },

  render: {
    antialias: true,
    antialiasGL: true,
    pixelArt: false,
    roundPixels: false,
    transparent: false,
    powerPreference: "high-performance",
  },
};

const game = new Phaser.Game(config);

/*
 * אחרי שינוי גודל המסך או מעבר למצב טלפון,
 * Phaser מחשב מחדש את המיקום האמיתי של הקנבס.
 * כך אזורי הלחיצה נשארים בדיוק מעל הכפתורים.
 */
const refreshGameScale = (): void => {
  window.requestAnimationFrame(() => {
    game.scale.refresh();
  });
};

window.addEventListener(
  "resize",
  refreshGameScale,
);

window.addEventListener(
  "orientationchange",
  refreshGameScale,
);

window.visualViewport?.addEventListener(
  "resize",
  refreshGameScale,
);

/*
 * רענון נוסף לאחר שהעמוד סיים להיטען.
 */
window.addEventListener("load", () => {
  refreshGameScale();

  window.setTimeout(
    refreshGameScale,
    150,
  );
});