import { CompetitionData, Match } from "../types";
import { openFootballMockData } from "../data/mockSoccerData";

/**
 * Determines stage group from round/group names
 */
function determineStage(roundName: string, groupName?: string): string {
  const norm = ((roundName || "") + " " + (groupName || "")).toLowerCase();
  if (norm.includes("final") && !norm.includes("semi") && !norm.includes("quar") && !norm.includes("oitov") && !norm.includes("oitav")) {
    return "Final";
  }
  if (norm.includes("semi")) {
    return "Semifinais";
  }
  if (norm.includes("quarta") || norm.includes("quarter")) {
    return "Quartas de Final";
  }
  if (
    norm.includes("oitava") || 
    norm.includes("last 16") || 
    norm.includes("round of 16") || 
    norm.includes("round of 32") || 
    norm.includes("32") || 
    norm.includes("dezasseis") || 
    norm.includes("1/16") ||
    norm.includes("1/8")
  ) {
    return "Oitavas de Final";
  }
  return "Fase de Grupos";
}

/**
 * Helper to map and sanitize individual match items
 */
function mapSingleMatch(m: any, idx: number, defaultStage: string): Match {
  // Determine teams
  let team1 = "Inexistente";
  let team2 = "Inexistente";

  if (typeof m.team1 === "string") {
    team1 = m.team1;
  } else if (m.team1 && typeof m.team1.name === "string") {
    team1 = m.team1.name;
  } else if (m.team1 && typeof m.team1.title === "string") {
    team1 = m.team1.title;
  }

  if (typeof m.team2 === "string") {
    team2 = m.team2;
  } else if (m.team2 && typeof m.team2.name === "string") {
    team2 = m.team2.name;
  } else if (m.team2 && typeof m.team2.title === "string") {
    team2 = m.team2.title;
  }

  const grp = m.group || undefined;
  const calculatedStage = determineStage(m.round || "", grp) || defaultStage;

  return {
    id: m.id || `fetched-game-${idx + 1}`,
    date: m.date || new Date().toISOString().split("T")[0],
    time: m.time || "15:00",
    team1: team1,
    team2: team2,
    group: grp,
    stadium: m.stadium || undefined,
    stage: calculatedStage
  };
}

/**
 * Parses and maps highly variable raw OpenFootball structures to our standardized model
 */
export function parseOpenFootballJSON(raw: any): CompetitionData {
  if (!raw) {
    throw new Error("Dados de entrada vazios ou inválidos");
  }

  // Determine competition name
  const competitionName = raw.competition || raw.name || "Copa do Mundo FIFA 2026";
  
  let roundName = "Fase de Grupos - Geral";
  let matchesList: Match[] = [];

  // Route 1: Nested rounds structure: { name: "Competition", rounds: [ { name: "Round 1", matches: [...] } ] }
  if (Array.isArray(raw.rounds) && raw.rounds.length > 0) {
    raw.rounds.forEach((rnd: any) => {
      const currentRoundName = rnd.name || "Fase de Grupos";
      if (Array.isArray(rnd.matches)) {
        rnd.matches.forEach((m: any, idx: number) => {
          // Add round field if absent so mapSingleMatch can inspect it
          const matchWithRoundObj = { ...m, round: m.round || currentRoundName };
          const stageVal = determineStage(currentRoundName, m.group);
          const mapped = mapSingleMatch(matchWithRoundObj, matchesList.length, stageVal);
          
          // Fallback group name for clean rendering in tabs
          if (!mapped.group) {
            mapped.group = stageVal === "Fase de Grupos" ? (m.group || "Fase de Grupos") : stageVal;
          }
          matchesList.push(mapped);
        });
      }
    });
    
    // Choose a friendly round description
    roundName = raw.rounds[0].name || "Fase de Grupos";
  } 
  // Route 2: Flat matches structure: { name: "Competition", matches: [...] }
  else if (Array.isArray(raw.matches)) {
    raw.matches.forEach((m: any, idx: number) => {
      const matchWithRoundObj = { ...m, round: m.round || raw.round || "Fase de Grupos" };
      const stageVal = m.stage || determineStage(m.round || raw.round || "", m.group);
      const mapped = mapSingleMatch(matchWithRoundObj, idx, stageVal);
      
      if (!mapped.group) {
        mapped.group = stageVal === "Fase de Grupos" ? (m.group || "Fase de Grupos") : stageVal;
      }
      matchesList.push(mapped);
    });
    
    if (raw.round) {
      roundName = raw.round;
    }
  } else {
    throw new Error("Não foi possível encontrar a lista de partidas ('matches' ou 'rounds') no formato OpenFootball.");
  }

  if (matchesList.length === 0) {
    throw new Error("A lista de partidas carregada está vazia.");
  }

  return {
    competition: competitionName,
    round: roundName,
    matches: matchesList
  };
}

/**
 * Fetch and load real OpenFootball data from a direct URL
 */
export async function loadOpenFootballDataFromURL(url: string): Promise<CompetitionData> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erro na rede ao tentar carregar o arquivo (${response.status})`);
  }
  const rawJSON = await response.json();
  return parseOpenFootballJSON(rawJSON);
}
