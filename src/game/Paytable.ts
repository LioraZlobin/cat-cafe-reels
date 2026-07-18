import type { MatchCount, SymbolId } from "./types";

type SymbolPayouts = Record<MatchCount, number>;

export const PAYTABLE: Record<SymbolId, SymbolPayouts> = {
  cat: {
    3: 15,
    4: 40,
    5: 100,
  },

  cupcake: {
    3: 10,
    4: 25,
    5: 60,
  },

  fish: {
    3: 8,
    4: 20,
    5: 45,
  },

  yarn: {
    3: 6,
    4: 15,
    5: 35,
  },

  coffee: {
    3: 5,
    4: 12,
    5: 25,
  },

  milk: {
    3: 4,
    4: 10,
    5: 20,
  },

  wild: {
  3: 0,
  4: 0,
  5: 0,
},

scatter: {
  3: 0,
  4: 0,
  5: 0,
},
};