import Phaser from "phaser";

import { getSymbolById } from "./Symbols";

import type {
  SymbolDefinition,
  SymbolId,
} from "./types";

export class SlotReel {
  private readonly scene: Phaser.Scene;
  private readonly reelStrip: SymbolId[];

  private readonly container: Phaser.GameObjects.Container;
  private readonly symbolImages: Phaser.GameObjects.Image[] = [];

  private readonly boardY: number;
  private readonly cellWidth: number;
  private readonly cellHeight: number;
  private readonly rows: number;

  private currentTopIndex = 0;
  private isSpinning = false;

  private readonly maskShape: Phaser.GameObjects.Graphics;
  private readonly reelMask: Phaser.Display.Masks.GeometryMask;

  constructor(
    scene: Phaser.Scene,
    centerX: number,
    boardY: number,
    cellWidth: number,
    cellHeight: number,
    rows: number,
    reelStrip: SymbolId[],
  ) {
    this.scene = scene;
    this.reelStrip = reelStrip;

    this.boardY = boardY;
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
    this.rows = rows;

    this.container = this.scene.add.container(
      centerX,
      boardY,
    );

    this.container.setDepth(1);

    /*
     * מסכה בגודל המדויק של עמודת הריל.
     * היא מונעת זליגה לצדדים, למעלה ולמטה.
     */
    this.maskShape = this.scene.make.graphics({
  x: 0,
  y: 0,
} as Phaser.Types.GameObjects.Graphics.Options);

this.maskShape.setVisible(false);

    this.maskShape.fillStyle(0xffffff, 1);

    this.maskShape.fillRect(
      centerX - cellWidth / 2,
      boardY,
      cellWidth,
      cellHeight * rows,
    );

    this.reelMask = this.maskShape.createGeometryMask();

    this.container.setMask(this.reelMask);

    /*
     * חמישה סמלים:
     * אחד מעל האזור הגלוי,
     * שלושה בתוך הלוח,
     * ואחד מתחת לאזור הגלוי.
     */
    for (
      let index = 0;
      index < rows + 2;
      index++
    ) {
      const localY =
        (index - 0.5) * cellHeight;

      const symbolImage = this.scene.add
        .image(
          0,
          localY,
          "symbol-cat",
        )
        .setOrigin(0.5);

      this.container.add(symbolImage);
      this.symbolImages.push(symbolImage);
    }

    this.currentTopIndex = Phaser.Math.Between(
      0,
      this.reelStrip.length - 1,
    );

    this.resetDisplay();
  }

  /*
   * מפעיל סיבוב מלא:
   * האצה -> מהירות קבועה -> האטה -> עצירה.
   */
  async spin(
    finalStopIndex: number,
    totalDuration: number,
  ): Promise<SymbolDefinition[]> {
    if (this.isSpinning) {
      return this.getVisibleSymbols();
    }

    this.isSpinning = true;

    await this.playStartEffect();

    let elapsedTime = 0;

    while (elapsedTime < totalDuration) {
      const progress = Math.min(
        elapsedTime / totalDuration,
        1,
      );

      const stepDuration =
        this.calculateStepDuration(progress);

      await this.moveOnePosition(stepDuration);

      elapsedTime += stepDuration;
    }

    /*
     * בסוף האנימציה מציבים את הריל
     * בדיוק בנקודת העצירה שנבחרה.
     */
    this.currentTopIndex =
      this.normalizeIndex(finalStopIndex);

    this.resetDisplay();

    await this.playStopEffect();

    this.isSpinning = false;

    return this.getVisibleSymbols();
  }

  getVisibleSymbols(): SymbolDefinition[] {
    const result: SymbolDefinition[] = [];

    for (
      let row = 0;
      row < this.rows;
      row++
    ) {
      const symbolIndex =
        this.normalizeIndex(
          this.currentTopIndex + row,
        );

      const symbolId =
        this.reelStrip[symbolIndex];

      result.push(
        getSymbolById(symbolId),
      );
    }

    return result;
  }

  getImageForRow(
    row: number,
  ): Phaser.GameObjects.Image {
    /*
     * אינדקס 0 הוא הסמל שמעל הלוח.
     * לכן השורות הגלויות נמצאות באינדקסים 1–3.
     */
    const imageIndex = row + 1;

    const symbolImage =
      this.symbolImages[imageIndex];

    if (!symbolImage) {
      throw new Error(
        `Invalid reel row: ${row}`,
      );
    }

    return symbolImage;
  }

  getVisibleImages(): Phaser.GameObjects.Image[] {
  const visibleImages: Phaser.GameObjects.Image[] = [];

  for (
    let row = 0;
    row < this.rows;
    row++
  ) {
    visibleImages.push(
      this.getImageForRow(row),
    );
  }

  return visibleImages;
}

resetVisualState(): void {
  this.getVisibleImages().forEach(
    (image) => {
      this.scene.tweens.killTweensOf(
        image,
      );

      image.clearTint();
      image.setAlpha(1);
      image.setAngle(0);
    },
  );

  this.resetVisibleImageSizes();
}

  resetVisibleImageSizes(): void {
    for (
      let row = 0;
      row < this.rows;
      row++
    ) {
      const image =
        this.getImageForRow(row);

      const symbolIndex =
        this.normalizeIndex(
          this.currentTopIndex + row,
        );

      const symbolId =
        this.reelStrip[symbolIndex];

      const symbol =
        getSymbolById(symbolId);

      this.positionAndSizeImage(
        image,
        symbol,
        row + 1,
      );
    }
  }

  /*
   * בתחילת הסיבוב הריל נעשה מעט שקוף.
   * זה נותן תחושת מהירות בלי לפגוע בתמונות.
   */
  private playStartEffect(): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.container,

        alpha: 0.82,

        duration: 100,

        ease: "Sine.In",

        onComplete: () => {
          resolve();
        },
      });
    });
  }

  /*
   * קובע את מהירות כל צעד לפי שלב הסיבוב.
   *
   * ערך קטן יותר = ריל מהיר יותר.
   */
  private calculateStepDuration(
    progress: number,
  ): number {
    /*
     * 0%–18%: האצה.
     */
    if (progress < 0.18) {
      const accelerationProgress =
        progress / 0.18;

      return Phaser.Math.Linear(
        105,
        42,
        accelerationProgress,
      );
    }

    /*
     * 18%–72%: מהירות גבוהה וקבועה.
     */
    if (progress < 0.72) {
      return 42;
    }

    /*
     * 72%–100%: האטה הדרגתית.
     */
    const slowdownProgress =
      (progress - 0.72) / 0.28;

    return Phaser.Math.Linear(
      42,
      125,
      slowdownProgress,
    );
  }

  private moveOnePosition(
    duration: number,
  ): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.symbolImages,

        y: `-=${this.cellHeight}`,

        duration,

        ease: "Linear",

        onComplete: () => {
          this.currentTopIndex =
            this.normalizeIndex(
              this.currentTopIndex + 1,
            );

          this.resetDisplay();

          resolve();
        },
      });
    });
  }

  private resetDisplay(): void {
    this.symbolImages.forEach(
      (
        symbolImage,
        index,
      ) => {
        const stripOffset =
          index - 1;

        const symbolIndex =
          this.normalizeIndex(
            this.currentTopIndex +
              stripOffset,
          );

        const symbolId =
          this.reelStrip[symbolIndex];

        const symbol =
          getSymbolById(symbolId);

        symbolImage.setTexture(
          symbol.textureKey,
        );

        this.positionAndSizeImage(
          symbolImage,
          symbol,
          index,
        );
      },
    );
  }

  /*
   * ממקם כל סמל במרכז התא
   * ומתאים את הגודל לפי ההגדרות שלו.
   */
  private positionAndSizeImage(
    image: Phaser.GameObjects.Image,
    symbol: SymbolDefinition,
    imageIndex: number,
  ): void {
    const centerY =
      (imageIndex - 0.5) *
      this.cellHeight;

    image.setPosition(
      symbol.offsetX ?? 0,
      centerY +
        (symbol.offsetY ?? 0),
    );

    this.fitImageInsideCell(
      image,
      symbol,
    );
  }

  private fitImageInsideCell(
  image: Phaser.GameObjects.Image,
  symbol: SymbolDefinition,
): void {
  /*
   * קובצי ה-PNG הם בגודל 256×256,
   * אבל הציור תופס רק חלק מהקנבס השקוף.
   * לכן מאפשרים לקנבס להיות גדול יותר מהתא.
   * המסכה מונעת זליגה לעמודות סמוכות.
   */
  const maximumWidth =
    this.cellWidth * 1.42;

  const maximumHeight =
    this.cellHeight * 1.42;

  image.setScale(1);

  const widthScale =
    maximumWidth / image.width;

  const heightScale =
    maximumHeight / image.height;

  const baseScale =
    Math.min(
      widthScale,
      heightScale,
    );

  const finalScale =
    baseScale *
    symbol.displayScale;

  image.setScale(finalScale);
}

  /*
   * עצירה עם קפיצה קטנה:
   * הריל יורד מעט וחוזר למקומו.
   */
  private playStopEffect(): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.container,

        y: this.boardY + 14,
        alpha: 1,

        duration: 85,

        ease: "Quad.Out",

        yoyo: true,

        onComplete: () => {
          this.container.y =
            this.boardY;

          this.container.alpha = 1;

          resolve();
        },
      });
    });
  }

  private normalizeIndex(
    index: number,
  ): number {
    return (
      (
        index %
        this.reelStrip.length
      ) +
      this.reelStrip.length
    ) %
      this.reelStrip.length;
  }
}