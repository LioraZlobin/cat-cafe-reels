export type SymbolId =
  | "cat"
  | "coffee"
  | "cupcake"
  | "yarn"
  | "milk"
  | "fish"
  | "wild"
  | "scatter";

export type MatchCount = 3 | 4 | 5;

export type GridPosition = {
  row: number;
  column: number;
};

export type SymbolDefinition = {
  id: SymbolId;
  name: string;
  textureKey: string;

  displayScale: number;
  offsetX?: number;
  offsetY?: number;
};

export type WinningLine = {
  paylineIndex: number;
  symbolId: SymbolId;
  symbolName: string;
  matchCount: MatchCount;
  payout: number;
  positions: GridPosition[];
};

export type ScatterWin = {
  symbolId: "scatter";
  symbolName: string;
  matchCount: MatchCount;
  payout: number;
  positions: GridPosition[];
};