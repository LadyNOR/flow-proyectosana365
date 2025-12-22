
export type EnergyLevel = 'baja' | 'media' | 'alta' | null;

export interface Track {
  id: string;
  title: string;
  type: 'audio' | 'song';
  src: string;
  lyrics?: string;
  isLocked: boolean;
  intent: string;
}

export interface HistoryEntry {
  id: string;
  date: string;
  mission: string;
  energy: EnergyLevel;
  completedBlocks: number;
}

export interface Reward {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface SOSOption {
  icon: string;
  title: string;
  subtitle: string;
  steps: string[];
}

export interface Badge {
  days: number;
  title: string;
  icon: string;
  desc: string;
}

export interface AppState {
  username: string | null;
  isAuthenticated: boolean;
  energy: EnergyLevel;
  missionAlpha: string;
  blocks: { id: number; text: string; isCompleted: boolean }[];
  rewards: Reward[];
  history: HistoryEntry[];
  totalDays: number;
}
