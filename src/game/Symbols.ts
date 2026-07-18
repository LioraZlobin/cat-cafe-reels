import type {
  SymbolDefinition,
  SymbolId,
} from "./types";

export const SYMBOLS: SymbolDefinition[] = [
  {
    id: "cat",
    name: "Cat",
    textureKey: "symbol-cat",
    displayScale: 1.2,
    offsetX: 0,
    offsetY: 0,
  },
  {
    id: "coffee",
    name: "Coffee",
    textureKey: "symbol-coffee",
    displayScale: 1.2,
    offsetX: 0,
    offsetY: 0,
  },
  {
    id: "cupcake",
    name: "Cupcake",
    textureKey: "symbol-cupcake",
    displayScale: 1,
    offsetX: 0,
    offsetY: 0,
  },
  {
    id: "yarn",
    name: "Yarn",
    textureKey: "symbol-yarn",
    displayScale: 1,
    offsetX: 0,
    offsetY: 0,
  },
  {
    id: "milk",
    name: "Milk",
    textureKey: "symbol-milk",
    displayScale: 1,
    offsetX: 0,
    offsetY: 0,
  },
  {
    id: "fish",
    name: "Fish",
    textureKey: "symbol-fish",
    displayScale: 1,
    offsetX: 0,
    offsetY: 0,
  },
  {
    id: "wild",
    name: "Wild",
    textureKey: "symbol-wild",
    displayScale: 1,
    offsetX: 0,
    offsetY: 0,
  },
  {
    id: "scatter",
    name: "Scatter",
    textureKey: "symbol-scatter",
    displayScale: 1,
    offsetX: 0,
    offsetY: 0,
  },
];

export function getSymbolById(
  symbolId: SymbolId,
): SymbolDefinition {
  const symbol = SYMBOLS.find(
    (currentSymbol) =>
      currentSymbol.id === symbolId,
  );

  if (!symbol) {
    throw new Error(
      `Unknown symbol id: ${symbolId}`,
    );
  }

  return symbol;
}