export type GameStatus = 'Jugando' | 'Terminado' | 'Platinado' | 'Abandonado';

export interface Game {
  id?: number;
  title: string;
  status: GameStatus;
  platform: string;
  score: number;
  review?: string;
  coverUrl?: string;
  dateCompleted?: string;
}