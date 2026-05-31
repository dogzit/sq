import {
  CoinFlipState,
  GameState,
  GameTypeStr,
  RPSMove,
  RPSState,
  Side,
  TTTState,
} from "./types";

export * from "./types";

// ─── INIT ───
export function initState(type: GameTypeStr, hostId: string): GameState {
  if (type === "RPS") return { type: "RPS", moves: {}, done: false, winnerId: null, draw: false };
  if (type === "TTT") {
    return {
      type: "TTT",
      board: Array(9).fill(null),
      turn: hostId,
      done: false,
      winnerId: null,
      draw: false,
    };
  }
  return {
    type: "COIN_FLIP",
    hostPick: null,
    result: null,
    done: false,
    winnerId: null,
    draw: false,
  };
}

// ─── RPS ───
function applyRPS(
  state: RPSState,
  playerId: string,
  move: RPSMove,
  hostId: string,
  guestId: string
): RPSState | null {
  if (state.done) return null;
  if (playerId !== hostId && playerId !== guestId) return null;
  if (state.moves[playerId] && state.moves[playerId] !== "HIDDEN") return null;

  const next: RPSState = { ...state, moves: { ...state.moves, [playerId]: move } };
  const a = next.moves[hostId];
  const b = next.moves[guestId];
  if (a && b && a !== "HIDDEN" && b !== "HIDDEN") {
    next.done = true;
    if (a === b) {
      next.draw = true;
    } else if (
      (a === "ROCK" && b === "SCISSORS") ||
      (a === "PAPER" && b === "ROCK") ||
      (a === "SCISSORS" && b === "PAPER")
    ) {
      next.winnerId = hostId;
    } else {
      next.winnerId = guestId;
    }
  }
  return next;
}

// ─── TTT ───
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];
function checkTTTWin(board: (null | "X" | "O")[]): "X" | "O" | null {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a] as "X" | "O";
    }
  }
  return null;
}
function applyTTT(
  state: TTTState,
  playerId: string,
  cell: number,
  hostId: string,
  guestId: string
): TTTState | null {
  if (state.done) return null;
  if (state.turn !== playerId) return null;
  if (cell < 0 || cell > 8 || state.board[cell] !== null) return null;

  const symbol: "X" | "O" = playerId === hostId ? "X" : "O";
  const board = [...state.board];
  board[cell] = symbol;
  const winSymbol = checkTTTWin(board);
  let done = false;
  let winnerId: string | null = null;
  let draw = false;
  if (winSymbol) {
    done = true;
    winnerId = winSymbol === "X" ? hostId : guestId;
  } else if (board.every((c) => c !== null)) {
    done = true;
    draw = true;
  }
  return {
    ...state,
    board,
    turn: playerId === hostId ? guestId : hostId,
    done,
    winnerId,
    draw,
  };
}

// ─── Coin Flip ───
function applyCoinFlip(
  state: CoinFlipState,
  playerId: string,
  pick: Side,
  hostId: string,
  guestId: string
): CoinFlipState | null {
  if (state.done) return null;
  if (playerId !== hostId) return null;
  if (state.hostPick) return null;
  const result: Side = Math.random() < 0.5 ? "HEADS" : "TAILS";
  return {
    ...state,
    hostPick: pick,
    result,
    done: true,
    winnerId: result === pick ? hostId : guestId,
    draw: false,
  };
}

// ─── Public apply ───
export function applyMove(
  state: GameState,
  playerId: string,
  move: unknown,
  hostId: string,
  guestId: string
): GameState | null {
  if (state.type === "RPS") {
    const m = move as RPSMove;
    if (!["ROCK", "PAPER", "SCISSORS"].includes(m)) return null;
    return applyRPS(state, playerId, m, hostId, guestId);
  }
  if (state.type === "TTT") {
    const cell = typeof move === "number" ? move : Number(move);
    if (!Number.isFinite(cell)) return null;
    return applyTTT(state, playerId, cell, hostId, guestId);
  }
  if (state.type === "COIN_FLIP") {
    const s = move as Side;
    if (!["HEADS", "TAILS"].includes(s)) return null;
    return applyCoinFlip(state, playerId, s, hostId, guestId);
  }
  return null;
}

/** Hide opponent's move in RPS until both have submitted. */
export function viewForPlayer(state: GameState, playerId: string): GameState {
  if (state.type !== "RPS") return state;
  if (state.done) return state;
  const moves: Record<string, RPSMove | "HIDDEN"> = {};
  for (const k of Object.keys(state.moves)) {
    moves[k] = k === playerId ? state.moves[k] : "HIDDEN";
  }
  return { ...state, moves };
}
