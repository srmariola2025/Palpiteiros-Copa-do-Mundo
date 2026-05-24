export interface Match {
  id: string;
  date: string; // Dynamic format like "DD/MM/YYYY" or "YYYY-MM-DD"
  time: string; // "HH:MM"
  team1: string; // Home team name
  team2: string; // Away team name
  group?: string; // Optional group name like "Grupo A"
  stadium?: string; // Optional stadium name
  stage?: string; // Optional stage like "Fase de Grupos", "Oitavas", "Quartas", "Semifinal", "Final"
}

export interface CompetitionData {
  competition: string;
  round: string;
  matches: Match[];
}

export interface UserPrediction {
  matchId: string;
  score1: string; // score team 1 (string because input values might be empty or string initially)
  score2: string; // score team 2
}

export interface BetSlipSubmission {
  fullName: string;
  phone: string;
  predictions: UserPrediction[];
  submittedAt: string;
  roundCode: string;
}
