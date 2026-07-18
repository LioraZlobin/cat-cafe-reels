import { PAYLINES } from "./Paylines";
import { PAYTABLE } from "./Paytable";
import { getSymbolById } from "./Symbols";

import type {
  GridPosition,
  MatchCount,
  ScatterWin,
  SymbolDefinition,
  SymbolId,
  WinningLine,
} from "./types";

type RegularSymbolId = Exclude<
  SymbolId,
  "wild" | "scatter"
>;

const NUMBER_OF_PAYLINES =
  PAYLINES.length;

/*
 * Scatter משלם לפי כמות הסמלים בכל המסך.
 * הערך הוא מכפיל של Bet Per Line.
 */
const SCATTER_PAYTABLE: Record<
  MatchCount,
  number
> = {
  3: 5,
  4: 20,
  5: 100,
};

export function calculateWins(
  grid: SymbolDefinition[][],
  totalBet: number,
): WinningLine[] {
  const winningLines: WinningLine[] = [];

  const betPerLine =
    totalBet / NUMBER_OF_PAYLINES;

  PAYLINES.forEach(
    (payline, paylineIndex) => {
      const symbolsOnLine =
        payline.map(
          (row, column) =>
            grid[row][column],
        );

      const result =
        evaluatePayline(
          symbolsOnLine,
        );

      if (!result) {
        return;
      }

      const multiplier =
        PAYTABLE[
          result.symbolId
        ][result.matchCount];

      if (!multiplier) {
        return;
      }

      const payout =
        betPerLine * multiplier;

      const positions: GridPosition[] =
        [];

      for (
        let column = 0;
        column < result.matchCount;
        column++
      ) {
        positions.push({
          row: payline[column],
          column,
        });
      }

      const symbol =
        getSymbolById(
          result.symbolId,
        );

      winningLines.push({
        paylineIndex,
        symbolId: result.symbolId,
        symbolName: symbol.name,
        matchCount:
          result.matchCount,
        payout,
        positions,
      });
    },
  );

  return winningLines;
}

/*
 * בודק זכיית Scatter בכל הלוח,
 * ללא קשר ל-Paylines.
 */
export function calculateScatterWin(
  grid: SymbolDefinition[][],
  totalBet: number,
): ScatterWin | null {
  const positions: GridPosition[] = [];

  grid.forEach(
    (rowSymbols, row) => {
      rowSymbols.forEach(
        (symbol, column) => {
          if (
            symbol.id === "scatter"
          ) {
            positions.push({
              row,
              column,
            });
          }
        },
      );
    },
  );

  if (positions.length < 3) {
    return null;
  }

  /*
   * כרגע הלוח מכיל 5 עמודות,
   * ולכן מגבילים את החישוב ל-5.
   */
  const cappedCount = Math.min(
    positions.length,
    5,
  ) as MatchCount;

  const betPerLine =
    totalBet / NUMBER_OF_PAYLINES;

  const payout =
    betPerLine *
    SCATTER_PAYTABLE[cappedCount];

  return {
    symbolId: "scatter",
    symbolName: "Scatter",
    matchCount: cappedCount,
    payout,
    positions,
  };
}

/*
 * בודק קו זכייה משמאל לימין.
 *
 * Wild מחליף סמל רגיל.
 * Scatter לא משתתף בזכיית Payline.
 */
function evaluatePayline(
  symbols: SymbolDefinition[],
): {
  symbolId: RegularSymbolId;
  matchCount: MatchCount;
} | null {
  let targetSymbolId:
    RegularSymbolId | null = null;

  let matchCount = 0;

  for (
    let column = 0;
    column < symbols.length;
    column++
  ) {
    const currentSymbol =
      symbols[column];

    /*
     * Scatter עוצר את רצף הקו.
     */
    if (
      currentSymbol.id ===
      "scatter"
    ) {
      break;
    }

    /*
     * Wild מתאים לכל סמל רגיל.
     */
    if (
      currentSymbol.id === "wild"
    ) {
      matchCount++;
      continue;
    }

    /*
     * הסמל הרגיל הראשון קובע
     * איזה סמל אנחנו מחפשים בקו.
     */
    if (!targetSymbolId) {
      targetSymbolId =
        currentSymbol.id;

      matchCount++;
      continue;
    }

    if (
      currentSymbol.id !==
      targetSymbolId
    ) {
      break;
    }

    matchCount++;
  }

  /*
   * אין כרגע תשלום על רצף של Wild בלבד.
   */
  if (!targetSymbolId) {
    return null;
  }

  if (matchCount < 3) {
    return null;
  }

  const validMatchCount =
    Math.min(
      matchCount,
      5,
    ) as MatchCount;

  return {
    symbolId: targetSymbolId,
    matchCount:
      validMatchCount,
  };
}