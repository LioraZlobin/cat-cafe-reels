import Phaser from "phaser";

import { REEL_STRIPS } from "./ReelStrips";
import { SlotReel } from "./SlotReel";
import {
  calculateScatterWin,
  calculateWins,
} from "./WinCalculator";
import { SoundManager } from "./SoundManager";

import type {
  GridPosition,
  SymbolDefinition,
  WinningLine,
} from "./types";

export class GameScene extends Phaser.Scene {
  private readonly rows = 3;
  private readonly columns = 5;

  private readonly boardX = 245;
private readonly boardY = 240;

private readonly boardWidth = 790;
private readonly boardHeight = 390;

  private readonly soundManager =
  new SoundManager();

  private readonly reels: SlotReel[] = [];
  private currentGrid: SymbolDefinition[][] = [];

  private readonly betOptions = [
    1,
    2,
    5,
    10,
    20,
    50,
    100,
  ];

  private currentBetIndex = 3;

  private balance = 1000;
  private bet =
    this.betOptions[this.currentBetIndex];
    private displayedWin = 0;
private winCounterTween?: Phaser.Tweens.Tween;
private winResetTimer?: Phaser.Time.TimerEvent;

  private win = 0;
  private isSpinning = false;

  private balanceText!: Phaser.GameObjects.Text;
  private betText!: Phaser.GameObjects.Text;
  private winText!: Phaser.GameObjects.Text;

  private balanceLabelText!: Phaser.GameObjects.Text;
private betLabelText!: Phaser.GameObjects.Text;
private winLabelText!: Phaser.GameObjects.Text;
private hudPanelImage!: Phaser.GameObjects.Image;
private hudMaskGraphics!: Phaser.GameObjects.Graphics;



private decreaseBetButtonText!: Phaser.GameObjects.Text;
private increaseBetButtonText!: Phaser.GameObjects.Text;

  private spinButton!: Phaser.GameObjects.Arc;
  private spinButtonText!: Phaser.GameObjects.Text;
  private spinButtonShadow!: Phaser.GameObjects.Arc;

  private spinButtonTween?: Phaser.Tweens.Tween;
private spinHoldTimer?: Phaser.Time.TimerEvent;
private spinPointerIsDown = false;
private spinLongPressTriggered = false;
private readonly spinLongPressDuration = 650;
private spinButtonBaseScaleX = 1;
private spinButtonBaseScaleY = 1;

  private paytableButton!: Phaser.GameObjects.Rectangle;
private paytableButtonText!: Phaser.GameObjects.Text;

private paytableContainer?: Phaser.GameObjects.Container;

  private decreaseBetButton!: Phaser.GameObjects.Rectangle;
  private increaseBetButton!: Phaser.GameObjects.Rectangle;

  private autoSpinButton!: Phaser.GameObjects.Rectangle;
private autoSpinButtonText!: Phaser.GameObjects.Text;

private autoSpinMenu?: Phaser.GameObjects.Container;

private isAutoSpinActive = false;
private autoSpinsRemaining = 0;

private autoSpinTimer?: Phaser.Time.TimerEvent;

private isFreeSpinsMode = false;
private currentSpinIsFree = false;

private freeSpinsRemaining = 0;
private totalFreeSpinsAwarded = 0;
private freeSpinsTotalWin = 0;

private freeSpinsLabel!: Phaser.GameObjects.Text;
private freeSpinsWinText!: Phaser.GameObjects.Text;

private freeSpinTimer?: Phaser.Time.TimerEvent;

  private decreaseBetText!: Phaser.GameObjects.Text;
  private increaseBetText!: Phaser.GameObjects.Text;

  private bigWinOverlay?: Phaser.GameObjects.Rectangle;
private bigWinTitle?: Phaser.GameObjects.Text;
private bigWinAmountText?: Phaser.GameObjects.Text;

private bigWinCounterTween?: Phaser.Tweens.Tween;

  private winningLinesGraphics!: Phaser.GameObjects.Graphics;
  private readonly activePaylineGraphics:
  Phaser.GameObjects.Graphics[] = [];

private readonly activePaylineTweens:
  Phaser.Tweens.Tween[] = [];
  private winGlowGraphics!: Phaser.GameObjects.Graphics;
  private boardWinGlowGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super("GameScene");
  }

preload(): void {
    /*
     * Theme assets. These files should exist under:
     * public/assets/theme/
     */
    this.load.image(
      "theme-background",
      "/assets/theme/cafe-background.png",
    );

    this.load.image(
      "theme-logo",
      "/assets/theme/game-logo.png",
    );

    this.load.image(
      "theme-reel-frame",
      "/assets/theme/reel-frame.png",
    );

     this.load.image(
       "decor-cat-right",
       "/assets/decor/cat-right.png",
     );

    this.load.image(
      "theme-hud-panel",
      "/assets/theme/hud-panel.png",
    );

    this.load.image(
      "theme-spin-button",
      "/assets/theme/spin-button.png",
    );

    this.load.image(
      "symbol-cat",
      "/assets/symbols/cat.png",
    );

    this.load.image(
      "symbol-coffee",
      "/assets/symbols/coffee.png",
    );

    this.load.image(
      "symbol-cupcake",
      "/assets/symbols/cupcake.png",
    );

    this.load.image(
      "symbol-yarn",
      "/assets/symbols/yarn.png",
    );

    this.load.image(
      "symbol-milk",
      "/assets/symbols/milk.png",
    );

    this.load.image(
      "symbol-fish",
      "/assets/symbols/fish.png",
    );

    this.load.image(
      "symbol-wild",
      "/assets/symbols/wild.png",
    );

    this.load.image(
      "symbol-scatter",
      "/assets/symbols/scatter.png",
    );
  }

create(): void {
    /*
     * Zoom the entire game out while keeping it centered.
     * This makes the complete interface substantially smaller inside the page
     * and prevents the logo or HUD from being clipped by the browser viewport.
     */
    this.cameras.main.setBackgroundColor(
      "#120b1c",
    );

    this.cameras.main.setZoom(1);

    this.cameras.main.setScroll(
      0,
      0,
    );

    this.cameras.main.setRoundPixels(
      false,
    );

    /*
     * Visual layer order:
     * background -> logo -> wooden machine -> reels -> effects -> HUD.
     */
    this.createBackground();
    this.createTitle(
      this.cameras.main.centerX,
    );

    this.createBoard();
    this.createReels();
    this.createReelCovers();
    this.createGoodLuckSign();
    this.createDecorativeCat();

    this.createBoardWinGlowGraphics();
    this.createWinGlowGraphics();
    this.createWinningLinesGraphics();

    this.createProfessionalHud();
    this.createFreeSpinsPanel();
    this.createSpinButton();
    this.createAutoSpinButton();
    this.createPaytableButton();
  }

  private createBackground(): void {
  const background =
    this.add
      .image(
        640,
        420,
        "theme-background",
      )
      .setOrigin(0.5)
      .setDepth(0);

  const texture =
    this.textures.get(
      "theme-background",
    );

  const source =
    texture.getSourceImage() as HTMLImageElement;

  /*
   * ממלא את כל הקנבס בלי לעוות את התמונה.
   * ייתכן חיתוך קטן מאוד בצדדים, אבל לא תהיה מתיחה.
   */
  const scale = Math.max(
    1280 / source.width,
    840 / source.height,
  );

  background.setScale(scale);
}



private createTitle(
  _centerX: number,
): void {
  const titleX = 640;
  const titleY = 150;

  if (
    this.textures.exists(
      "theme-logo",
    )
  ) {
    this.add
      .image(
        titleX,
        titleY,
        "theme-logo",
      )
      .setOrigin(0.5)
      .setScale(0.38)
      .setDepth(10);

    return;
  }

  this.add
    .text(
      titleX,
      titleY,
      "CAT CAFÉ\nREELS",
      {
        fontFamily:
          "Arial Black, Arial",

        fontSize: "48px",
        fontStyle: "bold",

        color: "#ffc341",

        stroke: "#4a210d",
        strokeThickness: 8,

        align: "center",
        lineSpacing: -8,
      },
    )
    .setOrigin(0.5)
    .setDepth(10);
}

private createBoard(): void {
  /*
   * Deep shadow behind the cabinet.
   */
  const shadow =
    this.add.graphics();

  shadow.setDepth(-3);

  shadow.fillStyle(
    0x180a03,
    0.58,
  );

  shadow.fillRoundedRect(
    this.boardX - 30,
    this.boardY - 26,
    this.boardWidth + 60,
    this.boardHeight + 72,
    30,
  );

  /*
   * Wooden cabinet:
   * dark outer wood, warm middle wood and gold trim.
   */
  const cabinet =
    this.add.graphics();

  cabinet.setDepth(-1);

  cabinet.fillStyle(
    0x5a270f,
    1,
  );

  cabinet.fillRoundedRect(
    this.boardX - 30,
    this.boardY - 26,
    this.boardWidth + 60,
    this.boardHeight + 66,
    30,
  );

  cabinet.fillStyle(
    0x9a4f1e,
    1,
  );

  cabinet.fillRoundedRect(
    this.boardX - 23,
    this.boardY - 19,
    this.boardWidth + 46,
    this.boardHeight + 52,
    26,
  );

  cabinet.fillStyle(
    0xc97a2d,
    1,
  );

  cabinet.fillRoundedRect(
    this.boardX - 15,
    this.boardY - 11,
    this.boardWidth + 30,
    this.boardHeight + 36,
    22,
  );

  /*
   * Outer golden trim.
   */
  cabinet.lineStyle(
    5,
    0xffd06a,
    1,
  );

  cabinet.strokeRoundedRect(
    this.boardX - 30,
    this.boardY - 26,
    this.boardWidth + 60,
    this.boardHeight + 66,
    30,
  );

  /*
   * Inner dark trim.
   */
  cabinet.lineStyle(
    4,
    0x4d210d,
    1,
  );

  cabinet.strokeRoundedRect(
    this.boardX - 13,
    this.boardY - 10,
    this.boardWidth + 26,
    this.boardHeight + 32,
    20,
  );

  /*
   * Reel window.
   */
  const board =
    this.add.graphics();

  board.setDepth(0);

  board.fillStyle(
    0x2a0d20,
    0.99,
  );

  board.fillRoundedRect(
    this.boardX,
    this.boardY,
    this.boardWidth,
    this.boardHeight,
    17,
  );

  board.lineStyle(
    2,
    0xb66e32,
    0.95,
  );

  board.strokeRoundedRect(
    this.boardX,
    this.boardY,
    this.boardWidth,
    this.boardHeight,
    17,
  );

  /*
   * Soft highlight at the top of the reel area.
   */
  board.fillStyle(
    0xffffff,
    0.03,
  );

  board.fillRoundedRect(
    this.boardX + 5,
    this.boardY + 5,
    this.boardWidth - 10,
    68,
    13,
  );

  /*
   * Transparent reel-frame artwork.
   * The image is centered exactly on the board.
   */
 if (
  this.textures.exists(
    "theme-reel-frame",
  )
) {
  const frameCenterX =
    this.boardX +
    this.boardWidth / 2;

 const frameCenterY =
    this.boardY +
    this.boardHeight / 2 - 40;

  this.add
    .image(
      frameCenterX,
      frameCenterY,
      "theme-reel-frame",
    )
    .setOrigin(0.5)
    .setDisplaySize(
      this.boardWidth + 125,
      this.boardHeight + 145,
    )
    .setAlpha(1)
    .setDepth(1);
}

  this.createGridLines();
}

 private createDecorativeCat(): void {
  const cat =
    this.add
      .image(
        1085,
        650,
        "decor-cat-right",
      )
      .setOrigin(
        0.5,
        1,
      )
      .setScale(0.18)
      .setDepth(9);

  const baseY =
    cat.y;

  const baseScaleX =
    cat.scaleX;

  const baseScaleY =
    cat.scaleY;

  this.tweens.add({
    targets: cat,

    y: baseY - 2,

    scaleX:
      baseScaleX * 1.008,

    scaleY:
      baseScaleY * 1.012,

    duration: 1500,

    yoyo: true,
    repeat: -1,

    ease: "Sine.InOut",
  });
}

private createGridLines(): void {
    const grid =
      this.add.graphics();

    grid.setDepth(2);
    grid.lineStyle(
      2,
      0xc58a4d,
      0.62,
    );

    const cellWidth =
      this.boardWidth /
      this.columns;

    const cellHeight =
      this.boardHeight /
      this.rows;

    for (
      let column = 1;
      column < this.columns;
      column++
    ) {
      const x =
        this.boardX +
        column * cellWidth;

      grid.lineBetween(
        x,
        this.boardY - 13,
        x,
        this.boardY +
          this.boardHeight -
          5,
      );
    }

    for (
      let row = 1;
      row < this.rows;
      row++
    ) {
      const y =
    this.boardY -
    18 +
    row * cellHeight;

      grid.lineBetween(
        this.boardX + 5,
        y,
        this.boardX +
          this.boardWidth -
          5,
        y,
      );
    }
  }


  private createReels(): void {
    const cellWidth =
      this.boardWidth /
      this.columns;

    const cellHeight =
      this.boardHeight /
      this.rows;

    this.currentGrid =
      Array.from(
        {
          length: this.rows,
        },
        () =>
          Array<SymbolDefinition>(
            this.columns,
          ),
      );

    for (
      let column = 0;
      column < this.columns;
      column++
    ) {
      const centerX =
        this.boardX +
        column * cellWidth +
        cellWidth / 2;

      const reel =
  new SlotReel(
    this,
    centerX,
    this.boardY - 18,
    cellWidth,
    cellHeight,
    this.rows,
    REEL_STRIPS[column],
  );

      this.reels.push(reel);

      const visibleSymbols =
        reel.getVisibleSymbols();

      for (
        let row = 0;
        row < this.rows;
        row++
      ) {
        this.currentGrid[
          row
        ][column] =
          visibleSymbols[row];
      }
    }
  }

private createReelCovers(): void {
    /*
     * The reel-frame PNG is now responsible for covering the reel edges.
     * Do not draw the previous large brown rectangles because they hide
     * the logo and a large part of the game.
     */
  }

  private createGoodLuckSign(): void {
    const x =
      this.cameras.main.centerX;

    const y =
      this.boardY +
      this.boardHeight +
      18;

    const shadow =
      this.add
        .rectangle(
          x + 4,
          y + 6,
          235,
          36,
          0x1a0a03,
          0.65,
        )
        .setDepth(7);

    // const sign =
    //   this.add
    //     .rectangle(
    //       x,
    //       y,
    //       235,
    //       36,
    //       0x6f3214,
    //       1,
    //     )
    //     .setStrokeStyle(
    //       4,
    //       0xf1b94f,
    //       1,
    //     )
    //     .setDepth(8);

    // this.add
    //   .text(
    //     x,
    //     y,
    //     "🐾  GOOD LUCK!  🐾",
    //     {
    //       fontFamily:
    //         "Arial Black, Arial",
    //       fontSize: "18px",
    //       fontStyle: "bold",
    //       color: "#ffd96b",
    //       stroke: "#341408",
    //       strokeThickness: 3,
    //     },
    //   )
    //   .setOrigin(0.5)
    //   .setDepth(9);

    shadow.setVisible(true);
    // sign.setVisible(true);
  }




  private createBoardWinGlowGraphics(): void {
  this.boardWinGlowGraphics =
    this.add.graphics();

  this.boardWinGlowGraphics
    .setDepth(8)
    .setAlpha(0);
}

  private createWinGlowGraphics(): void {
  this.winGlowGraphics = this.add.graphics();

  this.winGlowGraphics.setDepth(15);
}

  private createWinningLinesGraphics(): void {
    this.winningLinesGraphics =
      this.add.graphics();

    this.winningLinesGraphics.setDepth(
      20,
    );
  }

  private createGameInfo(): void {
    const textStyle: Phaser.Types.GameObjects.Text.TextStyle =
      {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#fff4d6",
        fontStyle: "bold",
      };

    this.balanceText =
      this.add
        .text(
          250,
          590,
          "",
          textStyle,
        )
        .setDepth(10);

    this.betText =
      this.add
        .text(
          725,
          590,
          "",
          textStyle,
        )
        .setOrigin(
          0.5,
          0,
        )
        .setDepth(10);

    this.winText =
      this.add
        .text(
          940,
          590,
          "",
          textStyle,
        )
        .setDepth(10);

    this.updateGameInfo();
  }

private createFreeSpinsPanel(): void {
  /*
   * מונה ה-Free Spins בפינה העליונה של הרילים.
   */
  this.freeSpinsLabel =
    this.add
      .text(
        this.boardX +
          this.boardWidth -
          10,
        this.boardY - 38,
        "",
        {
          fontFamily:
            "Arial Black, Arial",
          fontSize: "19px",
          fontStyle: "bold",
          color: "#ffe072",
          stroke: "#4c2110",
          strokeThickness: 4,
          align: "right",
        },
      )
      .setOrigin(1, 0.5)
      .setDepth(40)
      .setVisible(false);

  /*
   * סכום הזכייה של הבונוס מוצג בין הרילים ל-HUD,
   * מעל הפאנל ולא על כפתור ה-Spin.
   */
  const freeSpinsWinY =
    this.boardY +
    this.boardHeight +
    20;

  this.freeSpinsWinText =
    this.add
      .text(
        this.cameras.main.centerX,
        freeSpinsWinY,
        "",
        {
          fontFamily:
            "Arial Black, Arial",
          fontSize: "16px",
          fontStyle: "bold",
          color: "#ffe072",
          stroke: "#4c2110",
          strokeThickness: 4,
          align: "center",

          backgroundColor:
            "rgba(53, 25, 10, 0.88)",

          padding: {
            x: 14,
            y: 5,
          },
        },
      )
      .setOrigin(0.5)
      .setDepth(40)
      .setVisible(false);
}


private getFreeSpinsAward(
  scatterCount: number,
): number {
  if (scatterCount >= 5) {
    return 20;
  }

  if (scatterCount === 4) {
    return 12;
  }

  if (scatterCount === 3) {
    return 8;
  }

  return 0;
}


private startFreeSpins(
  numberOfSpins: number,
): void {
  if (numberOfSpins <= 0) {
    return;
  }

  this.freeSpinTimer?.remove(false);
  this.freeSpinTimer = undefined;

  this.isFreeSpinsMode = true;
  this.freeSpinsRemaining = numberOfSpins;
  this.totalFreeSpinsAwarded = numberOfSpins;
  this.freeSpinsTotalWin = 0;

  this.updateFreeSpinsPanel();
  this.updateBetControls();

  this.setSpinButtonEnabled(false);

  this.showFreeSpinsIntro(
    numberOfSpins,
  );
}

private showFreeSpinsIntro(
  numberOfSpins: number,
): void {
  const centerX =
    this.cameras.main.centerX;

  const centerY =
    this.cameras.main.centerY;

  const overlay = this.add
    .rectangle(
      centerX,
      centerY,
      this.cameras.main.width,
      this.cameras.main.height,
      0x160b22,
      0.82,
    )
    .setDepth(100)
    .setAlpha(0);

  const title = this.add
    .text(
      centerX,
      centerY - 55,
      "FREE SPINS",
      {
        fontFamily: "Arial",
        fontSize: "70px",
        fontStyle: "bold",
        color: "#ffe071",
        stroke: "#713a21",
        strokeThickness: 8,
      },
    )
    .setOrigin(0.5)
    .setDepth(101)
    .setScale(0.2)
    .setAlpha(0);

  const amountText = this.add
    .text(
      centerX,
      centerY + 45,
      `${numberOfSpins} FREE SPINS`,
      {
        fontFamily: "Arial",
        fontSize: "38px",
        fontStyle: "bold",
        color: "#fff4d6",
        stroke: "#402154",
        strokeThickness: 6,
      },
    )
    .setOrigin(0.5)
    .setDepth(101)
    .setAlpha(0);

  this.tweens.add({
    targets: overlay,
    alpha: 1,
    duration: 250,
  });

  this.tweens.add({
    targets: title,
    alpha: 1,
    scaleX: 1,
    scaleY: 1,
    duration: 450,
    ease: "Back.Out",
  });

  this.tweens.add({
    targets: amountText,
    alpha: 1,
    duration: 300,
    delay: 250,
  });

  this.time.delayedCall(
    2000,
    () => {
      this.tweens.add({
        targets: [
          overlay,
          title,
          amountText,
        ],

        alpha: 0,
        duration: 300,

        onComplete: () => {
  overlay.destroy();
  title.destroy();
  amountText.destroy();

  /*
   * הבונוס מוכן, אבל הסיבוב הראשון
   * יתחיל רק כאשר המשתמש ילחץ Spin.
   */
  this.setSpinButtonEnabled(true);
  this.updateBetControls();

  this.showTemporaryMessage(
    "Press SPIN to play your Free Spin",
  );
},
      });
    },
  );
}

private runNextFreeSpin(): void {
  if (
    !this.isFreeSpinsMode ||
    this.isSpinning ||
    this.bigWinOverlay
  ) {
    return;
  }

  if (this.freeSpinsRemaining <= 0) {
    this.endFreeSpins();
    return;
  }

  /*
   * מורידים סיבוב רק ברגע שהמשתמש
   * לחץ בפועל על כפתור הספין.
   */
  this.freeSpinsRemaining--;

  this.updateFreeSpinsPanel();

  this.setSpinButtonEnabled(false);
  this.updateBetControls();

  void this.spin(true);
}

private scheduleNextFreeSpin(
  delay: number,
): void {
  this.freeSpinTimer?.remove(false);

  this.freeSpinTimer =
    this.time.delayedCall(
      delay,
      () => {
        this.freeSpinTimer =
          undefined;

        if (
          this.isFreeSpinsMode &&
          !this.isSpinning &&
          !this.bigWinOverlay
        ) {
          this.runNextFreeSpin();
        }
      },
    );
}

private updateFreeSpinsPanel(): void {
  const shouldShow =
    this.isFreeSpinsMode;

  this.freeSpinsLabel
    .setVisible(shouldShow)
    .setText(
      `FREE SPINS: ${this.freeSpinsRemaining} / ${this.totalFreeSpinsAwarded}`,
    );

  this.freeSpinsWinText
    .setVisible(shouldShow)
    .setText(
      `FREE SPINS WIN: ${this.formatNumber(
        this.freeSpinsTotalWin,
      )}`,
    );
}


private endFreeSpins(): void {
  const totalBonusWin =
    this.freeSpinsTotalWin;

  this.isFreeSpinsMode = false;
  this.currentSpinIsFree = false;
  this.freeSpinsRemaining = 0;

  this.freeSpinTimer?.remove(false);
  this.freeSpinTimer = undefined;

  this.updateFreeSpinsPanel();
  this.updateBetControls();
  this.setSpinButtonEnabled(true);

  this.showFreeSpinsOutro(
    totalBonusWin,
  );
}

private showFreeSpinsOutro(
  totalBonusWin: number,
): void {
  const centerX =
    this.cameras.main.centerX;

  const centerY =
    this.cameras.main.centerY;

  const overlay = this.add
    .rectangle(
      centerX,
      centerY,
      this.cameras.main.width,
      this.cameras.main.height,
      0x160b22,
      0.82,
    )
    .setDepth(100)
    .setAlpha(0);

  const title = this.add
    .text(
      centerX,
      centerY - 65,
      "FREE SPINS COMPLETE",
      {
        fontFamily: "Arial",
        fontSize: "54px",
        fontStyle: "bold",
        color: "#ffe071",
        stroke: "#713a21",
        strokeThickness: 7,
      },
    )
    .setOrigin(0.5)
    .setDepth(101)
    .setAlpha(0);

  const winText = this.add
    .text(
      centerX,
      centerY + 45,
      `TOTAL WIN: ${this.formatNumber(
        totalBonusWin,
      )}`,
      {
        fontFamily: "Arial",
        fontSize: "42px",
        fontStyle: "bold",
        color: "#fff4d6",
        stroke: "#402154",
        strokeThickness: 6,
      },
    )
    .setOrigin(0.5)
    .setDepth(101)
    .setAlpha(0);

  this.tweens.add({
    targets: [
      overlay,
      title,
      winText,
    ],
    alpha: 1,
    duration: 350,
  });

  this.time.delayedCall(
    2500,
    () => {
      this.tweens.add({
        targets: [
          overlay,
          title,
          winText,
        ],

        alpha: 0,
        duration: 300,

        onComplete: () => {
          overlay.destroy();
          title.destroy();
          winText.destroy();

          if (
            this.isAutoSpinActive &&
            this.autoSpinsRemaining > 0
          ) {
            this.scheduleNextAutoSpin(
              600,
            );
          }
        },
      });
    },
  );
}

  private createBetControls(): void {
    this.decreaseBetButton =
      this.add
        .rectangle(
          625,
          605,
          48,
          42,
          0x6c4f7d,
        )
        .setInteractive({
          useHandCursor: true,
        })
        .setDepth(10);

    this.decreaseBetButton.setStrokeStyle(
      2,
      0xf5d48b,
    );

    this.decreaseBetText =
      this.add
        .text(
          625,
          603,
          "−",
          {
            fontFamily:
              "Arial",

            fontSize:
              "32px",

            fontStyle:
              "bold",

            color:
              "#fff4d6",
          },
        )
        .setOrigin(0.5)
        .setDepth(11);

    this.increaseBetButton =
      this.add
        .rectangle(
          825,
          605,
          48,
          42,
          0x6c4f7d,
        )
        .setInteractive({
          useHandCursor: true,
        })
        .setDepth(10);

    this.increaseBetButton.setStrokeStyle(
      2,
      0xf5d48b,
    );

    this.increaseBetText =
      this.add
        .text(
          825,
          603,
          "+",
          {
            fontFamily:
              "Arial",

            fontSize:
              "30px",

            fontStyle:
              "bold",

            color:
              "#fff4d6",
          },
        )
        .setOrigin(0.5)
        .setDepth(11);

    this.decreaseBetButton.on(
  "pointerdown",
  () => {
    if (this.isSpinning) {
      return;
    }

    this.soundManager.playButtonClick();
    this.changeBet(-1);
  },
);

    this.increaseBetButton.on(
  "pointerdown",
  () => {
    if (this.isSpinning) {
      return;
    }

    this.soundManager.playButtonClick();
    this.changeBet(1);
  },
);

    this.addBetButtonHover(
      this.decreaseBetButton,
      this.decreaseBetText,
    );

    this.addBetButtonHover(
      this.increaseBetButton,
      this.increaseBetText,
    );

    this.updateBetControls();
  }

private createProfessionalHud(): void {
  const sourceCropX = 0;
  const sourceCropY = 335;
  const sourceCropWidth = 1529;
  const sourceCropHeight = 309;

  /*
   * גודל ומיקום ה-HUD.
   */
  const hudScale = 0.56;
  const hudCenterX = 640;

  /*
   * מיקום החלק העליון של ה-HUD.
   */
  const hudTop = 630;

  const hudCenterY =
    hudTop +
    (sourceCropHeight * hudScale) /
      2;

  const hudLeft =
    hudCenterX -
    (sourceCropWidth * hudScale) /
      2;

  /*
   * המרת קואורדינטות מתוך קובץ התמונה
   * לקואורדינטות בפועל בתוך המשחק.
   */
  const mapX = (
    sourceX: number,
  ): number =>
    hudLeft +
    (sourceX - sourceCropX) *
      hudScale;

  const mapY = (
    sourceY: number,
  ): number =>
    hudTop +
    (sourceY - sourceCropY) *
      hudScale;

  /*
   * תיקון אנכי לכל הכפתורים השקופים.
   */
  const controlsOffsetY = -8;

  /*
   * תיקון אופקי לכפתור סימן הקריאה.
   * קודם אזור הלחיצה הופיע משמאל לכפתור,
   * לכן מזיזים אותו 60 פיקסלים ימינה.
   */
  const infoButtonOffsetX = 60;

  /*
   * תמונת ה-HUD.
   */
  this.hudPanelImage =
    this.add
      .image(
        hudCenterX,
        hudCenterY,
        "theme-hud-panel",
      )
      .setCrop(
        sourceCropX,
        sourceCropY,
        sourceCropWidth,
        sourceCropHeight,
      )
      .setScale(hudScale)
      .setDepth(20);

  /*
   * התוויות קיימות לצורך תאימות לקוד,
   * אך הטקסט שלהן כבר נמצא בתמונת ה-HUD.
   */
  this.balanceLabelText =
    this.add
      .text(0, 0, "")
      .setVisible(false);

  this.betLabelText =
    this.add
      .text(0, 0, "")
      .setVisible(false);

  this.winLabelText =
    this.add
      .text(0, 0, "")
      .setVisible(false);

  /*
   * עיצוב הערכים:
   * Balance, Bet ו-Win.
   */
  const valueStyle:
    Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily:
        "Arial Black, Arial",
      fontSize: "19px",
      fontStyle: "bold",
      color: "#ffe8a8",
      stroke: "#2b1208",
      strokeThickness: 3,
      align: "center",
    };

  /*
   * Balance.
   */
  this.balanceText =
    this.add
      .text(
        mapX(270),
        mapY(500),
        "",
        valueStyle,
      )
      .setOrigin(0.5)
      .setDepth(30);

  /*
   * Bet.
   */
  this.betText =
    this.add
      .text(
        mapX(535),
        mapY(500),
        "",
        valueStyle,
      )
      .setOrigin(0.5)
      .setDepth(30);

  /*
   * Win.
   */
  this.winText =
    this.add
      .text(
        mapX(1165),
        mapY(500),
        "",
        valueStyle,
      )
      .setOrigin(0.5)
      .setDepth(30);

  /*
   * כפתור מינוס שקוף מעל כפתור המינוס שבתמונה.
   */
  const decreaseBetOffsetX = 24;

this.decreaseBetButton =
  this.add
    .rectangle(
      mapX(434) +
        decreaseBetOffsetX,
      mapY(510) +
        controlsOffsetY,
      58 * hudScale,
      70 * hudScale,
      0x000000,
      0,
    )
    .setInteractive({
      useHandCursor: true,
    })
    .setDepth(55);

  /*
   * כפתור פלוס שקוף מעל כפתור הפלוס שבתמונה.
   */
  this.increaseBetButton =
    this.add
      .rectangle(
        mapX(629),
        mapY(510) +
          controlsOffsetY,
        58 * hudScale,
        70 * hudScale,
        0x000000,
        0,
      )
      .setInteractive({
        useHandCursor: true,
      })
      .setDepth(55);

  /*
   * הטקסט של כפתורי הפלוס והמינוס כבר מופיע בתמונה.
   */
  this.decreaseBetButtonText =
    this.add
      .text(0, 0, "")
      .setVisible(false);

  this.increaseBetButtonText =
    this.add
      .text(0, 0, "")
      .setVisible(false);

  /*
   * לחיצה על מינוס.
   */
  this.decreaseBetButton.on(
    "pointerdown",
    () => {
      if (
        this.isSpinning ||
        this.isAutoSpinActive ||
        this.isFreeSpinsMode
      ) {
        return;
      }

      this.soundManager.playButtonClick();
      this.changeBet(-1);
    },
  );

  /*
   * לחיצה על פלוס.
   */
  this.increaseBetButton.on(
    "pointerdown",
    () => {
      if (
        this.isSpinning ||
        this.isAutoSpinActive ||
        this.isFreeSpinsMode
      ) {
        return;
      }

      this.soundManager.playButtonClick();
      this.changeBet(1);
    },
  );

  /*
   * שמירת מיקומי כפתורי ה-HUD.
   *
   * מחלקות אחרות משתמשות בערכים האלה
   * כדי ליצור את אזורי הלחיצה השקופים.
   */
  const autoPlayOffsetX = -38;
  this.registry.set(
    "hud-control-layout",
    {
      /*
       * כפתור Spin.
       */
      spinX: mapX(800),

      spinY:
        mapY(505) +
        controlsOffsetY,

      spinRadius:
        112 * hudScale,

      /*
       * כפתור סימן הקריאה.
       *
       * הוספת 60 מזיזה את אזור הלחיצה ימינה
       * כך שיהיה בדיוק מעל הכפתור שבתמונה.
       */
      infoX:
        mapX(83) +
        infoButtonOffsetX,

      infoY:
        mapY(510) +
        controlsOffsetY,

      infoWidth:
        82 * hudScale,

      infoHeight:
        100 * hudScale,

      /*
       * כפתור Auto Play.
       */
      autoX:
      mapX(1435) +
      autoPlayOffsetX,

    autoY:
      mapY(510) +
      controlsOffsetY,

    autoWidth:
      105 * hudScale,

    autoHeight:
      100 * hudScale,
    },
  );

  /*
   * עדכון הערכים והכפתורים.
   */
  this.updateGameInfo();
  this.updateBetControls();
}

private createSpinButton(): void {
    const layout =
      this.registry.get(
        "hud-control-layout",
      ) as {
        spinX: number;
        spinY: number;
        spinRadius: number;
      };

    const buttonX = layout.spinX;
    const buttonY = layout.spinY;
    const hitRadius =
      layout.spinRadius;

    this.spinButtonShadow =
      this.add
        .circle(
          buttonX,
          buttonY,
          hitRadius,
          0x000000,
          0,
        )
        .setVisible(false);

    /*
     * Invisible interactive circle directly over the Spin artwork.
     *
     * Short click:
     * - starts one regular spin.
     *
     * Long press:
     * - opens the Auto Spins selector.
     *
     * While Auto Play is active:
     * - pressing Spin stops Auto Play immediately.
     */
    this.spinButton =
      this.add
        .circle(
          buttonX,
          buttonY,
          hitRadius,
          0x000000,
          0,
        )
        .setInteractive({
          useHandCursor: true,
        })
        .setDepth(60);

    this.spinButtonText =
      this.add
        .text(0, 0, "")
        .setVisible(false);

    this.spinButton.on(
      "pointerdown",
      () => {
        if (this.bigWinOverlay) {
          return;
        }

        /*
         * Pressing Spin while Auto Play is active stops it.
         */
        if (
          this.isAutoSpinActive &&
          !this.isFreeSpinsMode
        ) {
          this.soundManager.playButtonClick();
          this.stopAutoSpin();

          this.showTemporaryMessage(
            "Auto Play stopped",
          );

          return;
        }

        if (this.isSpinning) {
          return;
        }

        this.spinPointerIsDown = true;
        this.spinLongPressTriggered = false;

        this.spinHoldTimer?.remove(false);

        /*
         * Free Spins use a normal click only.
         * Long press is available for regular gameplay.
         */
        if (!this.isFreeSpinsMode) {
          this.spinHoldTimer =
            this.time.delayedCall(
              this.spinLongPressDuration,
              () => {
                this.spinHoldTimer =
                  undefined;

                if (
                  !this.spinPointerIsDown ||
                  this.isSpinning ||
                  this.isFreeSpinsMode ||
                  this.bigWinOverlay
                ) {
                  return;
                }

                this.spinLongPressTriggered =
                  true;

                this.soundManager.playButtonClick();

                /*
                 * Open the existing themed Auto Spins menu.
                 */
                if (!this.autoSpinMenu) {
                  this.toggleAutoSpinMenu();
                }

                this.showTemporaryMessage(
                  "Choose the number of Auto Spins",
                );
              },
            );
        }
      },
    );

    this.spinButton.on(
      "pointerup",
      () => {
        if (!this.spinPointerIsDown) {
          return;
        }

        this.spinPointerIsDown = false;

        this.spinHoldTimer?.remove(false);
        this.spinHoldTimer = undefined;

        /*
         * Do not also trigger a normal spin after a completed long press.
         */
        if (this.spinLongPressTriggered) {
          this.spinLongPressTriggered =
            false;

          return;
        }

        if (
          this.isSpinning ||
          this.bigWinOverlay
        ) {
          return;
        }

        this.soundManager.playButtonClick();

        if (this.isFreeSpinsMode) {
          this.runNextFreeSpin();

          return;
        }

        void this.spin();
      },
    );

    this.spinButton.on(
      "pointerout",
      () => {
        /*
         * Leaving the Spin area before releasing cancels the hold.
         */
        this.cancelSpinLongPress();
      },
    );

    /*
     * Handles releasing the mouse outside the Spin area.
     */
    this.input.on(
      "pointerup",
      () => {
        if (this.spinPointerIsDown) {
          this.cancelSpinLongPress();
        }
      },
    );
  }

private cancelSpinLongPress(): void {
  this.spinPointerIsDown = false;
  this.spinLongPressTriggered = false;

  this.spinHoldTimer?.remove(false);
  this.spinHoldTimer = undefined;
}


private createAutoSpinButton(): void {
    const layout =
      this.registry.get(
        "hud-control-layout",
      ) as {
        autoX: number;
        autoY: number;
        autoWidth: number;
        autoHeight: number;
      };

    this.autoSpinButton =
      this.add
        .rectangle(
          layout.autoX,
          layout.autoY,
          layout.autoWidth,
          layout.autoHeight,
          0x000000,
          0,
        )
        .setInteractive({
          useHandCursor: true,
        })
        .setDepth(60);

    this.autoSpinButtonText =
      this.add
        .text(0, 0, "")
        .setVisible(false);

    this.autoSpinButton.on(
      "pointerdown",
      () => {
        if (this.isFreeSpinsMode) {
          return;
        }

        this.soundManager.playButtonClick();

        if (this.isAutoSpinActive) {
          this.stopAutoSpin();
          return;
        }

        if (this.isSpinning) {
          return;
        }

        this.toggleAutoSpinMenu();
      },
    );
  }

private createPaytableButton(): void {
    const layout =
      this.registry.get(
        "hud-control-layout",
      ) as {
        infoX: number;
        infoY: number;
        infoWidth: number;
        infoHeight: number;
      };

    this.paytableButton =
      this.add
        .rectangle(
          layout.infoX,
          layout.infoY,
          layout.infoWidth,
          layout.infoHeight,
          0x000000,
          0,
        )
        .setInteractive({
          useHandCursor: true,
        })
        .setDepth(60);

    this.paytableButtonText =
      this.add
        .text(0, 0, "")
        .setVisible(false);

    this.paytableButton.on(
      "pointerdown",
      () => {
        if (
          this.isSpinning ||
          this.bigWinOverlay ||
          this.isFreeSpinsMode
        ) {
          return;
        }

        this.soundManager.playButtonClick();
        this.showPaytable();
      },
    );
  }


private showPaytable(): void {
  this.togglePaytable();
}

private togglePaytable(): void {
  /*
   * אם ה-Paytable כבר פתוח — סוגרים אותו.
   */
  if (this.paytableContainer) {
    this.closePaytable();
    return;
  }

  /*
   * אם ה-Paytable סגור — פותחים אותו.
   */
  this.createPaytable();
}

private createPaytable(): void {
  const centerX =
    this.cameras.main.centerX;

  const centerY =
    this.cameras.main.centerY;

  const container =
    this.add.container(
      centerX,
      centerY,
    );

  container
    .setDepth(500)
    .setAlpha(0)
    .setScale(0.96);

  /*
   * שכבה כהה מעל המשחק.
   * חוסמת לחיצות על המשחק מאחור.
   */
  const screenOverlay =
    this.add
      .rectangle(
        0,
        0,
        this.cameras.main.width,
        this.cameras.main.height,
        0x12080a,
        0.82,
      )
      .setInteractive();

  /*
   * החלון הראשי.
   */
  const panel =
    this.add
      .rectangle(
        0,
        0,
        1120,
        680,
        0x241006,
        1,
      )
      .setStrokeStyle(
        6,
        0xf6c85f,
        1,
      );

  const innerBorder =
    this.add
      .rectangle(
        0,
        5,
        1092,
        648,
        0x000000,
        0,
      )
      .setStrokeStyle(
        2,
        0xb76d24,
        0.95,
      );

  /*
   * קישוטי הכפות.
   */
  const leftPaw =
    this.add
      .circle(
        -515,
        -290,
        27,
        0x8a4516,
        1,
      )
      .setStrokeStyle(
        3,
        0xffd36b,
        1,
      );

  const rightPaw =
    this.add
      .circle(
        515,
        -290,
        27,
        0x8a4516,
        1,
      )
      .setStrokeStyle(
        3,
        0xffd36b,
        1,
      );

  const leftPawText =
    this.add
      .text(
        -515,
        -290,
        "🐾",
        {
          fontSize: "26px",
        },
      )
      .setOrigin(0.5);

  const rightPawText =
    this.add
      .text(
        515,
        -290,
        "🐾",
        {
          fontSize: "26px",
        },
      )
      .setOrigin(0.5);

  /*
   * כותרת עליונה.
   */
  const header =
    this.add.rectangle(
      0,
      -290,
      1108,
      90,
      0x5a260d,
      1,
    );

  const title =
    this.add
      .text(
        0,
        -290,
        "PAYTABLE",
        {
          fontFamily:
            "Arial Black, Arial",
          fontSize: "42px",
          fontStyle: "bold",
          color: "#ffd66b",
          stroke: "#3a1607",
          strokeThickness: 5,
        },
      )
      .setOrigin(0.5);

  /*
   * כפתור X הגרפי.
   */
  const closeButtonX = 505;
  const closeButtonY = -290;

  const closeButton =
    this.add
      .rectangle(
        closeButtonX,
        closeButtonY,
        58,
        58,
        0x7a2d58,
        1,
      )
      .setStrokeStyle(
        2,
        0xffd36b,
        1,
      );

  const closeText =
    this.add
      .text(
        closeButtonX,
        closeButtonY,
        "×",
        {
          fontFamily: "Arial",
          fontSize: "42px",
          fontStyle: "bold",
          color: "#ffffff",
        },
      )
      .setOrigin(0.5);

  /*
   * אזור לחיצה שקוף.
   *
   * קיימת אצלך סטייה בפועל ימינה,
   * לכן אזור הלחיצה ממוקם 45 פיקסלים שמאלה.
   */
  const closeHitArea =
    this.add
      .zone(
        closeButtonX - 45,
        closeButtonY,
        88,
        82,
      )
      .setOrigin(0.5)
      .setInteractive({
        useHandCursor: true,
      });

  /*
   * כדי לראות זמנית את אזור הלחיצה,
   * אפשר להחליף את ה-Zone במלבן:
   *
   * const closeHitArea = this.add
   *   .rectangle(
   *     closeButtonX - 45,
   *     closeButtonY,
   *     88,
   *     82,
   *     0xff0000,
   *     0.35,
   *   )
   *   .setInteractive({
   *     useHandCursor: true,
   *   });
   */

  closeHitArea.on(
    "pointerover",
    () => {
      closeButton.setFillStyle(
        0x9a3b68,
      );

      closeButton.setScale(1.07);
      closeText.setScale(1.07);
    },
  );

  closeHitArea.on(
    "pointerout",
    () => {
      closeButton.setFillStyle(
        0x7a2d58,
      );

      closeButton.setScale(1);
      closeText.setScale(1);
    },
  );

  closeHitArea.on(
    "pointerdown",
    () => {
      this.soundManager.playButtonClick();
      this.closePaytable();
    },
  );

  /*
   * כותרות העמודות.
   */
  const columnTitleStyle:
    Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily:
        "Arial Black, Arial",
      fontSize: "19px",
      fontStyle: "bold",
      color: "#ffe0a0",
      letterSpacing: 1,
    };

  const leftColumnTitle =
    this.add
      .text(
        -270,
        -225,
        "SYMBOL PAYOUTS",
        columnTitleStyle,
      )
      .setOrigin(0.5);

  const rightColumnTitle =
    this.add
      .text(
        270,
        -225,
        "SYMBOL PAYOUTS",
        columnTitleStyle,
      )
      .setOrigin(0.5);

  /*
   * סמלים רגילים.
   */
  const paytableItems = [
    {
      texture: "symbol-cat",
      name: "CAT",
      payout:
        "3 = 15x     4 = 40x     5 = 100x",
      x: -270,
      y: -150,
      width: 84,
      height: 84,
    },
    {
      texture: "symbol-cupcake",
      name: "CUPCAKE",
      payout:
        "3 = 10x     4 = 25x     5 = 60x",
      x: -270,
      y: -20,
      width: 82,
      height: 82,
    },
    {
      texture: "symbol-fish",
      name: "FISH",
      payout:
        "3 = 8x      4 = 20x     5 = 45x",
      x: -270,
      y: 110,
      width: 112,
      height: 70,
    },
    {
      texture: "symbol-yarn",
      name: "YARN",
      payout:
        "3 = 6x      4 = 15x     5 = 35x",
      x: 270,
      y: -150,
      width: 80,
      height: 80,
    },
    {
      texture: "symbol-coffee",
      name: "COFFEE",
      payout:
        "3 = 5x      4 = 12x     5 = 25x",
      x: 270,
      y: -20,
      width: 78,
      height: 78,
    },
    {
      texture: "symbol-milk",
      name: "MILK",
      payout:
        "3 = 4x      4 = 10x     5 = 20x",
      x: 270,
      y: 110,
      width: 72,
      height: 88,
    },
  ];

  const paytableObjects:
    Phaser.GameObjects.GameObject[] = [];

  paytableItems.forEach(
    (item) => {
      const itemBackground =
        this.add
          .rectangle(
            item.x,
            item.y,
            500,
            112,
            0x35180b,
            0.98,
          )
          .setStrokeStyle(
            2,
            0xc88932,
            1,
          );

      const symbolImage =
        this.add
          .image(
            item.x - 190,
            item.y,
            item.texture,
          )
          .setDisplaySize(
            item.width,
            item.height,
          );

      const symbolName =
        this.add
          .text(
            item.x - 125,
            item.y - 22,
            item.name,
            {
              fontFamily:
                "Arial Black, Arial",
              fontSize: "22px",
              fontStyle: "bold",
              color: "#ffd66b",
              stroke: "#3a1607",
              strokeThickness: 2,
            },
          )
          .setOrigin(
            0,
            0.5,
          );

      const payoutText =
        this.add
          .text(
            item.x - 125,
            item.y + 24,
            item.payout,
            {
              fontFamily:
                "Arial Black, Arial",
              fontSize: "17px",
              fontStyle: "bold",
              color: "#fff1c9",
            },
          )
          .setOrigin(
            0,
            0.5,
          );

      paytableObjects.push(
        itemBackground,
        symbolImage,
        symbolName,
        payoutText,
      );
    },
  );

  /*
   * קו הפרדה.
   */
  const upperDivider =
    this.add.rectangle(
      0,
      180,
      1030,
      2,
      0xf5d48b,
      0.72,
    );

  /*
   * אזור Wild ו-Scatter.
   */
  const specialPanel =
    this.add
      .rectangle(
        0,
        235,
        1030,
        94,
        0x2d1409,
        0.98,
      )
      .setStrokeStyle(
        2,
        0xc88932,
        1,
      );

  const specialDivider =
    this.add.rectangle(
      0,
      235,
      2,
      72,
      0xf5d48b,
      0.65,
    );

  /*
   * Wild.
   */
  const wildImage =
    this.add
      .image(
        -445,
        235,
        "symbol-wild",
      )
      .setDisplaySize(
        92,
        82,
      );

  const wildTitle =
    this.add
      .text(
        -385,
        218,
        "WILD",
        {
          fontFamily: "Arial",
          fontSize: "23px",
          fontStyle: "bold",
          color: "#ffd66b",
          stroke: "#3a1607",
          strokeThickness: 2,
        },
      )
      .setOrigin(
        0,
        0.5,
      );

  const wildDescription =
    this.add
      .text(
        -385,
        252,
        "Substitutes for all\nregular symbols.",
        {
          fontFamily: "Arial",
          fontSize: "16px",
          fontStyle: "bold",
          color: "#fff1c9",
          lineSpacing: 3,
        },
      )
      .setOrigin(
        0,
        0.5,
      );

  /*
   * Scatter.
   */
  const scatterImage =
    this.add
      .image(
        90,
        235,
        "symbol-scatter",
      )
      .setDisplaySize(
        112,
        76,
      );

  const scatterTitle =
    this.add
      .text(
        155,
        215,
        "SCATTER / FREE SPINS",
        {
          fontFamily: "Arial",
          fontSize: "22px",
          fontStyle: "bold",
          color: "#ffd66b",
          stroke: "#3a1607",
          strokeThickness: 2,
        },
      )
      .setOrigin(
        0,
        0.5,
      );

  const scatterDescription =
    this.add
      .text(
        155,
        254,
        "3 = 8 spins     4 = 12 spins     5 = 20 spins",
        {
          fontFamily: "Arial",
          fontSize: "16px",
          fontStyle: "bold",
          color: "#fff1c9",
        },
      )
      .setOrigin(
        0,
        0.5,
      );

  /*
   * קו הפרדה תחתון.
   */
  const lowerDivider =
    this.add.rectangle(
      0,
      292,
      1010,
      2,
      0xf5d48b,
      0.68,
    );

  /*
   * חוקי המשחק.
   */
  const rulesText =
    this.add
      .text(
        0,
        316,
        "WIN RULES: Matches may follow straight or diagonal paylines.\n" +
          "Regular wins must start on reel 1 and continue across consecutive reels.\n" +
          "A minimum of 3 matching symbols is required. Scatter pays anywhere.",
        {
          fontFamily: "Arial",
          fontSize: "12px",
          fontStyle: "bold",
          color: "#ffe0a0",
          align: "center",
          lineSpacing: 1,
        },
      )
      .setOrigin(0.5);

  /*
   * הוספת כל האלמנטים ל-Container.
   */
  container.add([
    screenOverlay,
    panel,
    innerBorder,
    header,

    leftPaw,
    rightPaw,
    leftPawText,
    rightPawText,

    title,

    closeButton,
    closeText,
    closeHitArea,

    leftColumnTitle,
    rightColumnTitle,

    ...paytableObjects,

    upperDivider,

    specialPanel,
    specialDivider,

    wildImage,
    wildTitle,
    wildDescription,

    scatterImage,
    scatterTitle,
    scatterDescription,

    lowerDivider,
    rulesText,
  ]);

  this.paytableContainer =
    container;

  /*
   * אנימציית פתיחה.
   */
  this.tweens.add({
    targets: container,

    alpha: 1,

    scaleX: 1,
    scaleY: 1,

    duration: 240,
    ease: "Back.Out",
  });
}

private closePaytable(): void {
  const container =
    this.paytableContainer;

  if (!container) {
    return;
  }

  /*
   * מנקים מיד את השדה כדי למנוע
   * לחיצות כפולות בזמן אנימציית הסגירה.
   */
  this.paytableContainer =
    undefined;

  this.tweens.add({
    targets: container,

    alpha: 0,

    scaleX: 0.92,
    scaleY: 0.92,

    duration: 180,
    ease: "Sine.In",

    onComplete: () => {
      container.destroy(true);
    },
  });
}


private toggleAutoSpinMenu(): void {
  if (this.autoSpinMenu) {
    this.closeAutoSpinMenu();
    return;
  }

  /*
   * Cat Café themed Auto Play menu.
   * It opens above the Auto Play button and uses the same wood,
   * gold and purple styling as the main HUD.
   */
  const menuX = 1170;
  const menuY = 600;

  this.autoSpinMenu =
    this.add.container(
      menuX,
      menuY,
    );

  this.autoSpinMenu
    .setDepth(520)
    .setAlpha(0)
    .setScale(0.92);

  const shadow =
    this.add.rectangle(
      6,
      8,
      210,
      260,
      0x100604,
      0.65,
    );

  const background =
    this.add
      .rectangle(
        0,
        0,
        210,
        260,
        0x35170a,
        0.99,
      )
      .setStrokeStyle(
        5,
        0xf6c85f,
        1,
      );

  const innerBorder =
    this.add
      .rectangle(
        0,
        0,
        192,
        242,
        0x000000,
        0,
      )
      .setStrokeStyle(
        2,
        0xb96b27,
        1,
      );

  const header =
    this.add.rectangle(
      0,
      -101,
      190,
      48,
      0x5b260e,
      1,
    );

  const title =
    this.add
      .text(
        0,
        -102,
        "AUTO SPINS",
        {
          fontFamily:
            "Arial Black, Arial",
          fontSize: "19px",
          fontStyle: "bold",
          color: "#ffd96f",
          stroke: "#351307",
          strokeThickness: 3,
        },
      )
      .setOrigin(0.5);

  const pawLeft =
    this.add
      .text(
        -78,
        -102,
        "🐾",
        {
          fontSize: "18px",
        },
      )
      .setOrigin(0.5);

  const pawRight =
    this.add
      .text(
        78,
        -102,
        "🐾",
        {
          fontSize: "18px",
        },
      )
      .setOrigin(0.5);

  this.autoSpinMenu.add([
    shadow,
    background,
    innerBorder,
    header,
    title,
    pawLeft,
    pawRight,
  ]);

  const options = [
    10,
    25,
    50,
    100,
  ];

  options.forEach(
    (amount, index) => {
      const optionY =
        -53 + index * 48;

      const optionShadow =
        this.add.rectangle(
          3,
          optionY + 4,
          156,
          38,
          0x120705,
          0.55,
        );

      const optionButton =
        this.add
          .rectangle(
            0,
            optionY,
            156,
            38,
            0x6f2d5d,
            1,
          )
          .setStrokeStyle(
            3,
            0xf1bd50,
            1,
          )
          .setInteractive({
            useHandCursor: true,
          });

      const optionText =
        this.add
          .text(
            0,
            optionY,
            amount.toString(),
            {
              fontFamily:
                "Arial Black, Arial",
              fontSize: "18px",
              fontStyle: "bold",
              color: "#fff2cf",
              stroke: "#351307",
              strokeThickness: 2,
            },
          )
          .setOrigin(0.5);

      optionButton.on(
        "pointerover",
        () => {
          optionButton.setFillStyle(
            0x91417a,
          );

          optionButton.setScale(1.04);
          optionText.setScale(1.04);
        },
      );

      optionButton.on(
        "pointerout",
        () => {
          optionButton.setFillStyle(
            0x6f2d5d,
          );

          optionButton.setScale(1);
          optionText.setScale(1);
        },
      );

      optionButton.on(
        "pointerdown",
        () => {
          this.soundManager.playButtonClick();

          this.startAutoSpin(
            amount,
          );
        },
      );

      this.autoSpinMenu?.add([
        optionShadow,
        optionButton,
        optionText,
      ]);
    },
  );

  this.tweens.add({
    targets: this.autoSpinMenu,
    alpha: 1,
    scaleX: 1,
    scaleY: 1,
    duration: 180,
    ease: "Back.Out",
  });
}

private closeAutoSpinMenu(): void {
  const menu =
    this.autoSpinMenu;

  if (!menu) {
    return;
  }

  this.autoSpinMenu =
    undefined;

  this.tweens.add({
    targets: menu,
    alpha: 0,
    scaleX: 0.9,
    scaleY: 0.9,
    duration: 120,
    ease: "Sine.In",

    onComplete: () => {
      menu.destroy(true);
    },
  });
}

private startAutoSpin(
  numberOfSpins: number,
): void {
  if (
    this.isSpinning ||
    this.balance < this.bet
  ) {
    return;
  }

  this.closeAutoSpinMenu();

  this.isAutoSpinActive = true;
  this.autoSpinsRemaining =
    numberOfSpins;

  this.updateAutoSpinButton();
  this.updateBetControls();

  this.runNextAutoSpin();
}

private runNextAutoSpin(): void {
  if (!this.isAutoSpinActive) {
    return;
  }

  if (
    this.autoSpinsRemaining <= 0 ||
    this.balance < this.bet
  ) {
    this.stopAutoSpin();
    return;
  }

  /*
   * מורידים סיבוב אחד לפני ההפעלה.
   */
  this.autoSpinsRemaining--;

  this.updateAutoSpinButton();

  void this.spin();
}

private stopAutoSpin(): void {
  this.isAutoSpinActive = false;
  this.autoSpinsRemaining = 0;

  this.autoSpinTimer?.remove(false);
  this.autoSpinTimer = undefined;

  this.closeAutoSpinMenu();

  this.updateAutoSpinButton();
  this.updateBetControls();
}

private updateAutoSpinButton(): void {
  /*
   * The Auto Play button artwork is part of hud-panel.png.
   * Its behavior is controlled by the transparent hit zone.
   */
}


  private async spin(
  isFreeSpin = false,
): Promise<void> {
    if (
  this.isSpinning ||
  this.bigWinOverlay
) {
  return;
}

    if (
  !isFreeSpin &&
  this.balance < this.bet
) {
  this.showTemporaryMessage(
    "Not enough balance",
  );

  return;
}

    this.clearPreviousWinDisplay();

    this.isSpinning = true;
this.currentSpinIsFree = isFreeSpin;

this.soundManager.playSpinStart();

if (!isFreeSpin) {
  this.balance -= this.bet;
}

this.win = 0;
this.displayedWin = 0;

this.winCounterTween?.stop();
this.winCounterTween?.remove();
this.winCounterTween = undefined;

this.updateGameInfo();

    this.setSpinButtonEnabled(
      false,
    );

    this.updateBetControls();

    const baseDuration = 1050;
    const reelDelay = 240;

    const reelPromises =
  this.reels.map(
    async (reel, column) => {
      const strip =
        REEL_STRIPS[column];

      const finalStopIndex =
        Phaser.Math.Between(
          0,
          strip.length - 1,
        );

      const duration =
        baseDuration +
        column * reelDelay;

      const result =
        await reel.spin(
          finalStopIndex,
          duration,
        );

      /*
       * הצליל מושמע כשהעמודה הספציפית נעצרת.
       */
      this.soundManager.playReelStop(
        column,
      );

      return result;
    },
  );

    const reelResults =
      await Promise.all(
        reelPromises,
      );

      this.soundManager.stopSpinLoop();

    reelResults.forEach(
      (
        visibleSymbols,
        column,
      ) => {
        for (
          let row = 0;
          row < this.rows;
          row++
        ) {
          this.currentGrid[
            row
          ][column] =
            visibleSymbols[row];
        }
      },
    );

    this.finishSpin();
  }

  private finishSpin(): void {
  this.soundManager.stopSpinLoop();

  const completedSpinWasFree =
    this.currentSpinIsFree;

  const winningLines =
    calculateWins(
      this.currentGrid,
      this.bet,
    );

  const scatterWin =
    calculateScatterWin(
      this.currentGrid,
      this.bet,
    );

  const paylineWinAmount =
    winningLines.reduce(
      (
        total,
        winningLine,
      ) =>
        total +
        winningLine.payout,
      0,
    );

  const scatterWinAmount =
    scatterWin?.payout ?? 0;

  this.win =
    paylineWinAmount +
    scatterWinAmount;

  /*
   * חייב להיות מחוץ לכל if,
   * כדי שנוכל להשתמש בו בהמשך הפונקציה.
   */
  const awardedFreeSpins =
    scatterWin
      ? this.getFreeSpinsAward(
          scatterWin.matchCount,
        )
      : 0;

  /*
   * אם זה היה Free Spin,
   * מוסיפים את הזכייה לסכום הבונוס.
   */
  if (completedSpinWasFree) {
    this.freeSpinsTotalWin +=
      this.win;

    this.updateFreeSpinsPanel();
  }

  /*
   * רשימת זכיות שמשמשת לאנימציה.
   */
  const animationWins: WinningLine[] = [
    ...winningLines,
  ];

  if (scatterWin) {
    animationWins.push({
      paylineIndex: -1,
      symbolId:
        scatterWin.symbolId,
      symbolName:
        scatterWin.symbolName,
      matchCount:
        scatterWin.matchCount,
      payout:
        scatterWin.payout,
      positions:
        scatterWin.positions,
    });
  }

  if (this.win > 0) {
    this.balance += this.win;

    this.soundManager.playWin(
      this.win,
    );

    this.playCoinRain(
  this.win,
);

this.playBoardWinGlow(
  this.win,
);

    this.animateWinningSymbols(
      animationWins,
    );

    this.playWinningSymbolSparkles(
  animationWins,
);

    if (
      winningLines.length > 0
    ) {
      this.drawWinningLines(
        winningLines,
      );
    }

    this.animateWinCounter(
      this.win,
    );

    this.showBigWin(
      this.win,
    );

    if (!scatterWin) {
    this.showTemporaryMessage(
        `You won ${this.formatNumber(this.win)} coins!`,
    );
}
  } else {
    this.displayedWin = 0;
  }

  this.updateGameInfo();

  this.isSpinning = false;
  this.currentSpinIsFree = false;

  this.setSpinButtonEnabled(
    true,
  );

  this.updateBetControls();

  /*
   * Scatter במהלך Free Spins
   * מוסיף עוד סיבובים לבונוס.
   */
  if (
    awardedFreeSpins > 0 &&
    completedSpinWasFree
  ) {
    this.freeSpinsRemaining +=
      awardedFreeSpins;

    this.totalFreeSpinsAwarded +=
      awardedFreeSpins;

    this.updateFreeSpinsPanel();

    this.showTemporaryMessage(
    `🎉 +${awardedFreeSpins} EXTRA FREE SPINS!`,
);

   this.setSpinButtonEnabled(true);
  this.updateBetControls();

    return;
  }

  /*
   * Scatter במהלך משחק רגיל
   * מפעיל את הבונוס.
   */
  if (
    awardedFreeSpins > 0 &&
    !completedSpinWasFree
  ) {
    this.time.delayedCall(
      2400,
      () => {
        this.startFreeSpins(
          awardedFreeSpins,
        );
      },
    );

    return;
  }

  /*
   * ממשיכים לסיבוב החינמי הבא.
   */
  if (completedSpinWasFree) {
  /*
   * אם לא נשארו Free Spins,
   * מסיימים את הבונוס.
   */
  if (this.freeSpinsRemaining <= 0) {
    this.endFreeSpins();
    return;
  }

  /*
   * אחרת מחכים ללחיצה ידנית
   * על כפתור הספין.
   */
  this.setSpinButtonEnabled(true);
  this.updateBetControls();

  return;
}

  /*
   * אם Auto Spin עדיין פעיל,
   * מפעילים את הסיבוב הבא.
   */
  if (
    this.isAutoSpinActive &&
    !this.bigWinOverlay
  ) {
    const delayBeforeNextSpin =
      this.win > 0
        ? 2400
        : 900;

    this.scheduleNextAutoSpin(
      delayBeforeNextSpin,
    );
  }
}

private scheduleNextAutoSpin(
  delay: number,
): void {
  this.autoSpinTimer?.remove(false);

  this.autoSpinTimer =
    this.time.delayedCall(
      delay,
      () => {
        this.autoSpinTimer =
          undefined;

        if (
          this.isAutoSpinActive &&
          !this.isSpinning &&
          !this.bigWinOverlay
        ) {
          this.runNextAutoSpin();
        }
      },
    );
}

  private animateWinCounter(
  targetWin: number,
): void {
  /*
   * מפסיקים ספירה קודמת אם עדיין רצה.
   */
  this.winCounterTween?.stop();
  this.winCounterTween?.remove();
  this.winCounterTween = undefined;

  /*
   * מתחילים את הספירה מהמספר שמוצג כרגע.
   */
  const counterState = {
    value: this.displayedWin,
  };

  /*
   * משך הספירה משתנה לפי גודל הזכייה.
   */
  const duration = Phaser.Math.Clamp(
    650 + targetWin * 22,
    650,
    2200,
  );

  this.winCounterTween = this.tweens.add({
    targets: counterState,

    value: targetWin,

    duration,

    ease: "Cubic.Out",

    onUpdate: () => {
      this.displayedWin =
        counterState.value;

      this.winText.setText(
  this.formatNumber(this.displayedWin),
);
    },

    onComplete: () => {
      /*
       * מוודאים שהערך הסופי מדויק.
       */
      this.displayedWin =
        targetWin;

      this.winText.setText(
        `${this.formatNumber(
          this.displayedWin,
        )}`,
      );

      this.winCounterTween =
        undefined;
    },
  });
  this.tweens.add({
  targets: this.winText,

  scaleX: 1.08,
  scaleY: 1.08,

  duration: 180,

  yoyo: true,
  repeat: 2,

  ease: "Sine.InOut",
});
}

private playCoinRain(
  winAmount: number,
): void {
  const winMultiplier =
    winAmount / this.bet;

  let coinCount = 12;

  if (winMultiplier >= 10) {
    coinCount = 32;
  } else if (winMultiplier >= 5) {
    coinCount = 24;
  } else if (winMultiplier >= 2) {
    coinCount = 18;
  }

  const screenWidth =
    this.cameras.main.width;

  const screenHeight =
    this.cameras.main.height;

  for (
    let index = 0;
    index < coinCount;
    index++
  ) {
    const startX =
      Phaser.Math.Between(
        70,
        screenWidth - 70,
      );

    const startY =
      Phaser.Math.Between(
        -220,
        -60,
      );

    const coinSize =
      Phaser.Math.Between(
        42,
        58,
      );

    /*
     * כל מטבע הוא Container שמכיל:
     * צל, עיגול חיצוני, עיגול פנימי,
     * הברקה והאות C.
     */
    const coinContainer =
      this.add.container(
        startX,
        startY,
      );

    coinContainer
      .setDepth(120)
      .setAlpha(0);

    const shadow =
      this.add.circle(
        4,
        6,
        coinSize / 2,
        0x6f3b0d,
        0.55,
      );

    const outerCoin =
      this.add.circle(
        0,
        0,
        coinSize / 2,
        0xf4a928,
        1,
      );

    outerCoin.setStrokeStyle(
      Math.max(
        3,
        coinSize * 0.08,
      ),
      0xffe07a,
      1,
    );

    const innerCoin =
      this.add.circle(
        0,
        0,
        coinSize * 0.34,
        0xffcf4b,
        1,
      );

    innerCoin.setStrokeStyle(
      Math.max(
        2,
        coinSize * 0.05,
      ),
      0xc87812,
      0.9,
    );

    /*
     * הברקה לבנה קטנה בצד העליון.
     */
    const shine =
      this.add.ellipse(
        -coinSize * 0.14,
        -coinSize * 0.17,
        coinSize * 0.20,
        coinSize * 0.10,
        0xffffff,
        0.62,
      );

    const coinLetter =
      this.add
        .text(
          0,
          1,
          "C",
          {
            fontFamily: "Arial",
            fontSize:
              `${Math.round(
                coinSize * 0.42,
              )}px`,
            fontStyle: "bold",
            color: "#8f4b0b",
            stroke: "#fff0a8",
            strokeThickness:
              Math.max(
                1,
                Math.round(
                  coinSize * 0.035,
                ),
              ),
          },
        )
        .setOrigin(0.5);

    coinContainer.add([
      shadow,
      outerCoin,
      innerCoin,
      shine,
      coinLetter,
    ]);

    const targetY =
      screenHeight +
      Phaser.Math.Between(
        80,
        180,
      );

    const targetX =
      startX +
      Phaser.Math.Between(
        -130,
        130,
      );

    const duration =
      Phaser.Math.Between(
        1500,
        2400,
      );

    const delay =
      index *
      Phaser.Math.Between(
        30,
        65,
      );

    /*
     * תחושת סיבוב תלת־ממדית:
     * ה־scaleX מתכווץ ומתרחב בזמן הנפילה.
     */
    this.tweens.add({
      targets: coinContainer,

      x: targetX,
      y: targetY,

      angle:
        Phaser.Math.Between(
          540,
          1440,
        ),

      alpha: {
        from: 0,
        to: 1,
      },

      duration,
      delay,

      ease: "Quad.In",

      onComplete: () => {
        coinContainer.destroy(
          true,
        );
      },
    });

    this.tweens.add({
      targets: coinContainer,

      scaleX: {
        from: 1,
        to: 0.22,
      },

      duration:
        Phaser.Math.Between(
          160,
          240,
        ),

      delay,

      yoyo: true,
      repeat: -1,

      ease: "Sine.InOut",
    });

    this.tweens.add({
      targets: coinContainer,

      scaleY: {
        from: 0.92,
        to: 1.08,
      },

      duration:
        Phaser.Math.Between(
          220,
          320,
        ),

      delay,

      yoyo: true,
      repeat: -1,

      ease: "Sine.InOut",
    });
  }
}

private showBigWin(
  winAmount: number,
): void {
  /*
   * זכייה גדולה מוגדרת כרגע כזכייה
   * של לפחות פי 10 מההימור.
   */
  const bigWinThreshold =
    this.bet * 10;

  if (
    winAmount <
    bigWinThreshold
  ) {
    return;
  }

  /*
   * מוחקים תצוגה קודמת אם נשארה.
   */
  this.clearBigWinDisplay();

  const centerX =
    this.cameras.main.centerX;

  const centerY =
    this.cameras.main.centerY;

  this.bigWinOverlay =
    this.add
      .rectangle(
        centerX,
        centerY,
        this.cameras.main.width,
        this.cameras.main.height,
        0x12091c,
        0.78,
      )
      .setDepth(100)
      .setAlpha(0);

  this.bigWinTitle =
    this.add
      .text(
        centerX,
        centerY - 75,
        "BIG WIN",
        {
          fontFamily: "Arial",
          fontSize: "72px",
          fontStyle: "bold",
          color: "#ffe07a",
          stroke: "#6d3710",
          strokeThickness: 8,
          align: "center",
        },
      )
      .setOrigin(0.5)
      .setDepth(101)
      .setScale(0.2)
      .setAlpha(0);

  this.bigWinAmountText =
    this.add
      .text(
        centerX,
        centerY + 35,
        "0",
        {
          fontFamily: "Arial",
          fontSize: "58px",
          fontStyle: "bold",
          color: "#fff5c7",
          stroke: "#402154",
          strokeThickness: 7,
          align: "center",
        },
      )
      .setOrigin(0.5)
      .setDepth(101)
      .setAlpha(0);

  /*
   * פתיחת המסך.
   */
  this.tweens.add({
    targets:
      this.bigWinOverlay,

    alpha: 1,

    duration: 250,

    ease: "Sine.Out",
  });

  this.tweens.add({
    targets:
      this.bigWinTitle,

    alpha: 1,
    scaleX: 1,
    scaleY: 1,

    duration: 420,

    ease: "Back.Out",
  });

  this.tweens.add({
    targets:
      this.bigWinAmountText,

    alpha: 1,

    duration: 280,
    delay: 180,

    ease: "Sine.Out",
  });

  /*
   * ספירת סכום הזכייה.
   */
  const counterState = {
    value: 0,
  };

  this.bigWinCounterTween =
    this.tweens.add({
      targets:
        counterState,

      value:
        winAmount,

      duration:
        Phaser.Math.Clamp(
          1100 +
            winAmount * 12,
          1400,
          3200,
        ),

      ease:
        "Cubic.Out",

      onUpdate: () => {
        this.bigWinAmountText?.setText(
          this.formatNumber(
            counterState.value,
          ),
        );
      },

      onComplete: () => {
        this.bigWinAmountText?.setText(
          this.formatNumber(
            winAmount,
          ),
        );

        this.bigWinCounterTween =
          undefined;
      },
    });

  /*
   * Pulse של הכותרת.
   */
  this.tweens.add({
    targets:
      this.bigWinTitle,

    scaleX: 1.08,
    scaleY: 1.08,

    duration: 420,

    delay: 450,

    yoyo: true,
    repeat: 3,

    ease: "Sine.InOut",
  });

  /*
   * סגירה אוטומטית.
   */
  this.time.delayedCall(
    3600,
    () => {
      this.hideBigWin();
    },
  );
}

private hideBigWin(): void {
  if (
    !this.bigWinOverlay &&
    !this.bigWinTitle &&
    !this.bigWinAmountText
  ) {
    return;
  }

  this.bigWinCounterTween?.stop();
  this.bigWinCounterTween?.remove();
  this.bigWinCounterTween =
    undefined;

  this.tweens.add({
    targets: [
      this.bigWinOverlay,
      this.bigWinTitle,
      this.bigWinAmountText,
    ],

    alpha: 0,

    duration: 250,

    ease: "Sine.In",

    onComplete: () => {
  this.clearBigWinDisplay();
  if (
    this.isFreeSpinsMode &&
    !this.isSpinning
  ) {
    this.scheduleNextFreeSpin(
      500,
    );

    return;
  }

  /*
   * אם Big Win הופיע במהלך Auto Spin,
   * ממשיכים לסיבוב הבא רק לאחר שהמסך נסגר.
   */
  if (
    this.isAutoSpinActive &&
    !this.isSpinning &&
    this.autoSpinsRemaining > 0
  ) {
    this.scheduleNextAutoSpin(
      500,
    );
  }
},
  });
}

private clearBigWinDisplay(): void {
  this.bigWinCounterTween?.stop();
  this.bigWinCounterTween?.remove();
  this.bigWinCounterTween =
    undefined;

  this.bigWinOverlay?.destroy();
  this.bigWinTitle?.destroy();
  this.bigWinAmountText?.destroy();

  this.bigWinOverlay =
    undefined;

  this.bigWinTitle =
    undefined;

  this.bigWinAmountText =
    undefined;
}

private playBoardWinGlow(
  winAmount: number,
): void {
  this.tweens.killTweensOf(
    this.boardWinGlowGraphics,
  );

  this.boardWinGlowGraphics.clear();
  this.boardWinGlowGraphics.setAlpha(0);

  /*
   * The reel-frame image is displayed slightly larger than the reel board:
   *
   * width  = boardWidth + 58
   * height = boardHeight + 68
   *
   * Use those exact dimensions here so the win glow follows the visible
   * outer frame instead of the old hard-coded board position.
   */
  const frameWidth =
    this.boardWidth + 58;

  const frameHeight =
    this.boardHeight + 68;

  const frameX =
    this.boardX -
    (frameWidth -
      this.boardWidth) /
      2;

  const frameY =
    this.boardY -
    (frameHeight -
      this.boardHeight) /
      2;

  const cornerRadius = 28;

  const winMultiplier =
    winAmount / this.bet;

  let glowAlpha = 0.34;
  let outerWidth = 10;

  if (winMultiplier >= 10) {
    glowAlpha = 0.72;
    outerWidth = 22;
  } else if (winMultiplier >= 5) {
    glowAlpha = 0.58;
    outerWidth = 18;
  } else if (winMultiplier >= 2) {
    glowAlpha = 0.46;
    outerWidth = 14;
  }

  /*
   * Wide soft outer glow.
   */
  this.boardWinGlowGraphics.lineStyle(
    outerWidth,
    0xffc94a,
    0.16,
  );

  this.boardWinGlowGraphics.strokeRoundedRect(
    frameX - 5,
    frameY - 5,
    frameWidth + 10,
    frameHeight + 10,
    cornerRadius + 5,
  );

  /*
   * Medium golden glow.
   */
  this.boardWinGlowGraphics.lineStyle(
    Math.max(
      6,
      outerWidth - 8,
    ),
    0xffdf7a,
    0.4,
  );

  this.boardWinGlowGraphics.strokeRoundedRect(
    frameX - 2,
    frameY - 2,
    frameWidth + 4,
    frameHeight + 4,
    cornerRadius + 2,
  );

  /*
   * Bright inner outline following the visible reel frame.
   */
  this.boardWinGlowGraphics.lineStyle(
    3,
    0xffffcf,
    0.88,
  );

  this.boardWinGlowGraphics.strokeRoundedRect(
    frameX + 1,
    frameY + 1,
    frameWidth - 2,
    frameHeight - 2,
    cornerRadius,
  );

  this.tweens.add({
    targets:
      this.boardWinGlowGraphics,

    alpha: {
      from: 0,
      to: glowAlpha,
    },

    duration: 220,
    yoyo: true,
    repeat: 3,

    ease: "Sine.InOut",

    onComplete: () => {
      this.boardWinGlowGraphics.clear();
      this.boardWinGlowGraphics.setAlpha(0);
    },
  });
}

private playWinningSymbolSparkles(
  winningLines: WinningLine[],
): void {
  /*
   * אוספים את כל התאים הזוכים בלי כפילויות.
   * אם אותו תא משתתף בכמה קווים,
   * ניצור סביבו ניצוצות פעם אחת בלבד.
   */
  const uniquePositions =
    new Map<string, GridPosition>();

  winningLines.forEach(
    (winningLine) => {
      winningLine.positions.forEach(
        (position) => {
          const key =
            `${position.row}-${position.column}`;

          uniquePositions.set(
            key,
            position,
          );
        },
      );
    },
  );

  uniquePositions.forEach(
    (position) => {
      const center =
        this.getCellCenter(
          position.row,
          position.column,
        );

      const sparkleCount =
        Phaser.Math.Between(
          7,
          11,
        );

      for (
        let index = 0;
        index < sparkleCount;
        index++
      ) {
        const startX =
          center.x +
          Phaser.Math.Between(
            -42,
            42,
          );

        const startY =
          center.y +
          Phaser.Math.Between(
            -35,
            35,
          );

        const sparkleSize =
          Phaser.Math.Between(
            12,
            22,
          );

        const sparkle =
          this.add
            .text(
              startX,
              startY,
              "✦",
              {
                fontFamily: "Arial",
                fontSize:
                  `${sparkleSize}px`,
                fontStyle: "bold",
                color: "#ffe77a",
                stroke: "#c07818",
                strokeThickness: 2,
              },
            )
            .setOrigin(0.5)
            .setDepth(90)
            .setAlpha(0)
            .setScale(0.2);

        const moveX =
          Phaser.Math.Between(
            -35,
            35,
          );

        const moveY =
          Phaser.Math.Between(
            -45,
            20,
          );

        const duration =
          Phaser.Math.Between(
            650,
            1050,
          );

        const delay =
          index *
          Phaser.Math.Between(
            25,
            55,
          );

        this.tweens.add({
          targets: sparkle,

          x:
            startX +
            moveX,

          y:
            startY +
            moveY,

          angle:
            Phaser.Math.Between(
              -180,
              180,
            ),

          alpha: {
            from: 0,
            to: 1,
          },

          scaleX: {
            from: 0.2,
            to: 1.15,
          },

          scaleY: {
            from: 0.2,
            to: 1.15,
          },

          duration:
            duration * 0.45,

          delay,

          ease: "Back.Out",

          onComplete: () => {
            this.tweens.add({
              targets: sparkle,

              alpha: 0,

              scaleX: 0.1,
              scaleY: 0.1,

              y:
                sparkle.y - 18,

              duration:
                duration * 0.55,

              ease: "Sine.In",

              onComplete: () => {
                sparkle.destroy();
              },
            });
          },
        });
      }
    },
  );
}

  private animateWinningSymbols(
  winningLines: WinningLine[],
): void {
  const winningPositions = new Map<
    string,
    GridPosition
  >();

  winningLines.forEach(
    (winningLine) => {
      winningLine.positions.forEach(
        (position) => {
          const key =
            `${position.row}-${position.column}`;

          winningPositions.set(
            key,
            position,
          );
        },
      );
    },
  );

  /*
   * מחשיכים מעט את כל הסמלים שלא זכו.
   */
  this.reels.forEach(
    (reel, column) => {
      reel.getVisibleImages().forEach(
        (image, row) => {
          const key = `${row}-${column}`;

          if (
            !winningPositions.has(key)
          ) {
            image.setAlpha(0.42);
          }
        },
      );
    },
  );

  /*
   * מוסיפים זוהר ואנימציה לסמלים הזוכים.
   */
  winningPositions.forEach(
    (position) => {
      const symbolImage =
        this.reels[
          position.column
        ].getImageForRow(
          position.row,
        );

      const originalScaleX =
        symbolImage.scaleX;

      const originalScaleY =
        symbolImage.scaleY;

      const center =
        this.getCellCenter(
          position.row,
          position.column,
        );

      /*
       * מציירים עיגול Glow מאחורי הסמל.
       */
      this.winGlowGraphics.fillStyle(
        0xffd86b,
        0.18,
      );

      this.winGlowGraphics.fillCircle(
        center.x,
        center.y,
        68,
      );

      symbolImage.setTint(
        0xfff0b8,
      );

      this.tweens.add({
        targets: symbolImage,

        scaleX:
          originalScaleX * 1.18,

        scaleY:
          originalScaleY * 1.18,

        angle: {
          from: -2,
          to: 2,
        },

        duration: 180,

        ease: "Sine.InOut",

        yoyo: true,

        repeat: 4,

        onComplete: () => {
          symbolImage.setScale(
            originalScaleX,
            originalScaleY,
          );

          symbolImage.setAngle(0);
          symbolImage.clearTint();
        },
      });
    },
  );

  /*
   * הזוהר עצמו עושה Pulse.
   */
  this.tweens.add({
    targets: this.winGlowGraphics,

    alpha: {
      from: 0.3,
      to: 1,
    },

    duration: 260,

    yoyo: true,

    repeat: 3,

    ease: "Sine.InOut",
  });

  /*
   * מחזירים את כל הלוח למצב רגיל.
   */
  this.winResetTimer?.remove(false);

this.winResetTimer =
  this.time.delayedCall(
    1900,
    () => {
      this.winResetTimer = undefined;

      if (!this.isSpinning) {
        this.resetWinAnimation();
      }
    },
  );
}

private resetWinAnimation(): void {
  this.winGlowGraphics.clear();
  this.winGlowGraphics.setAlpha(1);

  this.reels.forEach(
    (reel) => {
      reel.resetVisualState();
    },
  );
}

  private drawWinningLines(
  winningLines: WinningLine[],
): void {
  this.clearAnimatedPaylines();

  const lineColors = [
    0xff4d6d,
    0x4cc9f0,
    0xffd166,
    0x80ed99,
    0xc77dff,
    0xff9f1c,
    0x00f5d4,
    0xf15bb5,
    0xfee440,
    0x9b5de5,
  ];

  winningLines.forEach(
    (winningLine, winningLineIndex) => {
      const color =
        lineColors[
          winningLine.paylineIndex %
            lineColors.length
        ];

      const points =
        winningLine.positions.map(
          (position) =>
            this.getCellCenter(
              position.row,
              position.column,
            ),
        );

      const graphics =
        this.add.graphics();

      graphics.setDepth(25);
      graphics.setAlpha(1);

      this.activePaylineGraphics.push(
        graphics,
      );

      /*
       * אובייקט עזר שה-Tween משנה מ-0 עד 1.
       * לפי progress נצייר בכל פריים חלק גדול יותר מהקו.
       */
      const animationState = {
        progress: 0,
      };

      const tween = this.tweens.add({
        targets: animationState,

        progress: 1,

        duration: 420,

        delay:
          winningLineIndex * 230,

        ease: "Sine.Out",

        onUpdate: () => {
          graphics.clear();

          /*
           * Glow / צל רחב מתחת לקו.
           */
          this.strokePartialPayline(
            graphics,
            points,
            animationState.progress,
            13,
            0x24142f,
            0.85,
          );

          /*
           * הקו הצבעוני הראשי.
           */
          this.strokePartialPayline(
            graphics,
            points,
            animationState.progress,
            6,
            color,
            1,
          );

          /*
           * הברקה דקה במרכז.
           */
          this.strokePartialPayline(
            graphics,
            points,
            animationState.progress,
            2,
            0xffffff,
            0.45,
          );
        },

        onComplete: () => {
          /*
           * Pulse עדין לאחר שהקו סיים להיצייר.
           */
          const pulseTween =
            this.tweens.add({
              targets: graphics,

              alpha: {
                from: 1,
                to: 0.55,
              },

              duration: 260,
              yoyo: true,
              repeat: 2,

              ease: "Sine.InOut",
            });

          this.activePaylineTweens.push(
            pulseTween,
          );
        },
      });

      this.activePaylineTweens.push(
        tween,
      );
    },
  );

  /*
   * מוחקים את הקווים לאחר סיום הצגת הזכייה.
   */
  const totalDisplayTime =
    2300 +
    winningLines.length * 230;

  this.time.delayedCall(
    totalDisplayTime,
    () => {
      this.clearAnimatedPaylines();
    },
  );
}

private strokePartialPayline(
  graphics: Phaser.GameObjects.Graphics,
  points: Phaser.Math.Vector2[],
  progress: number,
  lineWidth: number,
  color: number,
  alpha: number,
): void {
  if (points.length < 2) {
    return;
  }

  /*
   * מחשבים את האורך הכולל של כל מקטעי הקו.
   */
  const segmentLengths: number[] = [];
  let totalLength = 0;

  for (
    let index = 0;
    index < points.length - 1;
    index++
  ) {
    const start = points[index];
    const end = points[index + 1];

    const segmentLength =
      Phaser.Math.Distance.Between(
        start.x,
        start.y,
        end.x,
        end.y,
      );

    segmentLengths.push(
      segmentLength,
    );

    totalLength += segmentLength;
  }

  const targetLength =
    totalLength *
    Phaser.Math.Clamp(
      progress,
      0,
      1,
    );

  graphics.lineStyle(
    lineWidth,
    color,
    alpha,
  );

  graphics.beginPath();

  graphics.moveTo(
    points[0].x,
    points[0].y,
  );

  let drawnLength = 0;

  for (
    let index = 0;
    index < segmentLengths.length;
    index++
  ) {
    const start = points[index];
    const end = points[index + 1];
    const segmentLength =
      segmentLengths[index];

    const remainingLength =
      targetLength -
      drawnLength;

    if (remainingLength <= 0) {
      break;
    }

    /*
     * אם כל המקטע כבר נכנס לאורך הרצוי,
     * מציירים אותו במלואו.
     */
    if (
      remainingLength >=
      segmentLength
    ) {
      graphics.lineTo(
        end.x,
        end.y,
      );

      drawnLength +=
        segmentLength;

      continue;
    }

    /*
     * אחרת מציירים רק חלק מהמקטע האחרון.
     */
    const segmentProgress =
      remainingLength /
      segmentLength;

    const partialX =
      Phaser.Math.Linear(
        start.x,
        end.x,
        segmentProgress,
      );

    const partialY =
      Phaser.Math.Linear(
        start.y,
        end.y,
        segmentProgress,
      );

    graphics.lineTo(
      partialX,
      partialY,
    );

    break;
  }

  graphics.strokePath();
}

private clearAnimatedPaylines(): void {
  this.activePaylineTweens.forEach(
    (tween) => {
      tween.stop();
      tween.remove();
    },
  );

  this.activePaylineTweens.length = 0;

  this.activePaylineGraphics.forEach(
    (graphics) => {
      graphics.clear();
      graphics.destroy();
    },
  );

  this.activePaylineGraphics.length = 0;

  /*
   * מנקה גם את שכבת הקווים הישנה,
   * למקרה שנשאר עליה ציור מקוד קודם.
   */
  this.winningLinesGraphics.clear();
}

  private getCellCenter(
    row: number,
    column: number,
  ): Phaser.Math.Vector2 {
    const cellWidth =
      this.boardWidth /
      this.columns;

    const cellHeight =
      this.boardHeight /
      this.rows;

    const x =
      this.boardX +
      column * cellWidth +
      cellWidth / 2;

    const y =
      this.boardY +
      row * cellHeight +
      cellHeight / 2;

    return new Phaser.Math.Vector2(
      x,
      y,
    );
  }

  private changeBet(
    direction: number,
  ): void {
    if (
      this.isSpinning
    ) {
      return;
    }

    const nextIndex =
      this.currentBetIndex +
      direction;

    if (
      nextIndex < 0 ||
      nextIndex >=
        this.betOptions.length
    ) {
      return;
    }

    this.currentBetIndex =
      nextIndex;

    this.bet =
      this.betOptions[
        this.currentBetIndex
      ];

    this.win = 0;
this.displayedWin = 0;

this.winCounterTween?.stop();
this.winCounterTween?.remove();
this.winCounterTween = undefined;

    this.clearPreviousWinDisplay();
    this.updateGameInfo();
    this.updateBetControls();
  }

  private addBetButtonHover(
    button: Phaser.GameObjects.Rectangle,
    text: Phaser.GameObjects.Text,
  ): void {
    button.on(
      "pointerover",
      () => {
        if (
          this.isSpinning
        ) {
          return;
        }

        button.setScale(
          1.08,
        );

        text.setScale(
          1.08,
        );
      },
    );

    button.on(
      "pointerout",
      () => {
        button.setScale(1);
        text.setScale(1);
      },
    );
  }

  private updateBetControls(): void {
  const canDecrease =
    !this.isSpinning &&
    !this.isAutoSpinActive &&
    !this.isFreeSpinsMode &&
    this.currentBetIndex > 0;

  const canIncrease =
    !this.isSpinning &&
    !this.isAutoSpinActive &&
    !this.isFreeSpinsMode &&
    this.currentBetIndex <
      this.betOptions.length - 1;

  this.decreaseBetButton
    .setAlpha(
      canDecrease
        ? 1
        : 0.38,
    );

  this.decreaseBetButtonText
    .setAlpha(
      canDecrease
        ? 1
        : 0.38,
    );

  this.increaseBetButton
    .setAlpha(
      canIncrease
        ? 1
        : 0.38,
    );

  this.increaseBetButtonText
    .setAlpha(
      canIncrease
        ? 1
        : 0.38,
    );

  if (canDecrease) {
    this.decreaseBetButton.setInteractive({
      useHandCursor: true,
    });
  } else {
    this.decreaseBetButton.disableInteractive();
  }

  if (canIncrease) {
    this.increaseBetButton.setInteractive({
      useHandCursor: true,
    });
  } else {
    this.increaseBetButton.disableInteractive();
  }
}

  private setBetButtonState(
    button: Phaser.GameObjects.Rectangle,
    text: Phaser.GameObjects.Text,
    enabled: boolean,
  ): void {
    button.setScale(1);
    text.setScale(1);

    if (
      enabled
    ) {
      button.setFillStyle(
        0x6c4f7d,
      );

      button.setAlpha(1);
      text.setAlpha(1);

      button.setInteractive({
        useHandCursor: true,
      });
    } else {
      button.setFillStyle(
        0x4a3b52,
      );

      button.setAlpha(
        0.55,
      );

      text.setAlpha(
        0.55,
      );

      button.disableInteractive();
    }
  }

  private clearPreviousWinDisplay(): void {
    this.tweens.killTweensOf(
  this.boardWinGlowGraphics,
);

this.boardWinGlowGraphics.clear();
this.boardWinGlowGraphics.setAlpha(0);
    this.winResetTimer?.remove(false);
this.winResetTimer = undefined;
  this.clearAnimatedPaylines();
  this.winGlowGraphics.clear();

  this.tweens.killTweensOf(
    this.winGlowGraphics,
  );

  this.winGlowGraphics.setAlpha(1);

  this.reels.forEach(
    (reel) => {
      reel.resetVisualState();
    },
  );
}

  private updateGameInfo(): void {
  this.balanceText.setText(
    this.formatNumber(
      this.balance,
    ),
  );

  this.betText.setText(
    this.formatNumber(
      this.bet,
    ),
  );

  this.winText.setText(
    this.formatNumber(
      this.displayedWin,
    ),
  );
}

private setSpinButtonEnabled(
    enabled: boolean,
  ): void {
    this.cancelSpinLongPress();
    this.spinButtonTween?.stop();
    this.spinButtonTween =
      undefined;

    if (enabled) {
      this.spinButton.setInteractive({
        useHandCursor: true,
      });

      return;
    }

    this.spinButton.disableInteractive();
  }


  private showTemporaryMessage(
    message: string,
  ): void {
    const messageText =
      this.add
        .text(
          this.cameras.main
            .centerX,

          175,

          message,

          {
            fontFamily:
              "Arial",

            fontSize:
              "25px",

            fontStyle:
              "bold",

            color:
              "#ffe59b",

            backgroundColor:
              "#352344",

            padding: {
              x: 18,
              y: 8,
            },
          },
        )
        .setOrigin(0.5)
        .setAlpha(0)
        .setDepth(30);

    this.tweens.add({
      targets:
        messageText,

      alpha: 1,

      y: 165,

      duration: 200,

      hold: 1100,

      yoyo: true,

      onComplete: () => {
        messageText.destroy();
      },
    });
  }

  private formatNumber(
    value: number,
  ): string {
    return value.toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    );
  }
}
