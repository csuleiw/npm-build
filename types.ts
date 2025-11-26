export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED'
}

export interface GameResult {
  id: string;
  date: string;
  timeSeconds: number;
  mistakes: number;
}

export interface GridCellData {
  value: number;
  id: number;
  color: string;
}

export interface AIAnalysisResponse {
  feedback: string;
  rating: 'Excellent' | 'Good' | 'Average' | 'Needs Improvement';
  tips: string[];
}