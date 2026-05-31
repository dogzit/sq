export type GameTypeStr = "RPS" | "TTT" | "COIN_FLIP";

export type RPSMove = "ROCK" | "PAPER" | "SCISSORS";
export type Side = "HEADS" | "TAILS";

export interface RPSState {
  type: "RPS";
  moves: Record<string, RPSMove | "HIDDEN">;
  done: boolean;
  winnerId: string | null;
  draw: boolean;
}

export interface TTTState {
  type: "TTT";
  board: (null | "X" | "O")[];
  turn: string;
  done: boolean;
  winnerId: string | null;
  draw: boolean;
}

export interface CoinFlipState {
  type: "COIN_FLIP";
  hostPick: Side | null;
  result: Side | null;
  done: boolean;
  winnerId: string | null;
  draw: boolean;
}

export type GameState = RPSState | TTTState | CoinFlipState;
