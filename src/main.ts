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

new Phaser.Game(config);