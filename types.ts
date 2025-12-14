export enum GameType {
  GOMOKU = 'GOMOKU',
  GO = 'GO',
  MEMORY = 'MEMORY',
  FREEDRAW = 'FREEDRAW',
  SNAKE = 'SNAKE',
}

export enum Player {
  NONE = 0,
  USER = 1, // Usually Black pieces
  AI = 2,   // Usually White pieces
}

export enum GameMode {
  SINGLE_PLAYER = 'SINGLE_PLAYER',
  LOCAL_MULTI = 'LOCAL_MULTI',
  ONLINE_MULTI = 'ONLINE_MULTI',
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export type Language = 'en' | 'zh';

export interface BoardState {
  grid: number[][];
  winner: Player | null;
  isDraw: boolean;
  currentPlayer: Player;
}

export interface Move {
  row: number;
  col: number;
}

export interface MemoryCard {
  id: number;
  val: string; // Emoji or Icon name
  isFlipped: boolean;
  isMatched: boolean;
}