import { CompetitionData, Match } from "../types";
import { openFootballMockData } from "../data/mockSoccerData";

/**
 * Determines stage group from round/group names
 */
function determineStage(roundName: string, groupName?: string): string {
  const norm = ((roundName || "") + " " + (groupName || "")).toLowerCase();
  if (
    norm.includes("terceiro") || 
    norm.includes("third") || 
    norm.includes("3º") || 
    norm.includes("3o") || 
    norm.includes("3rd") || 
    norm.includes("bronze")
  ) {
    return "Disputa de 3º Lugar";
  }
  if (norm.includes("final") && !norm.includes("semi") && !norm.includes("quar") && !norm.includes("oitov") && !norm.includes("oitav") && !norm.includes("32") && !norm.includes("16 de final") && !norm.includes("16-avos") && !norm.includes("1/16") && !norm.includes("dezesseis")) {
    return "Final";
  }
  if (norm.includes("semi")) {
    return "Semifinais";
  }
  if (norm.includes("quarta") || norm.includes("quarter")) {
    return "Quartas de Final";
  }
  if (
    norm.includes("round of 32") ||
    norm.includes("r32") ||
    norm.includes("1/16") ||
    norm.includes("16-avos") ||
    norm.includes("16 de final") ||
    norm.includes("dezesseis") ||
    (norm.includes("32") && !norm.includes("16") && !norm.includes("oitav"))
  ) {
    return "16 de Final";
  }
  if (
    norm.includes("oitava") || 
    norm.includes("last 16") || 
    norm.includes("round of 16") || 
    norm.includes("r16") ||
    norm.includes("1/8") ||
    norm.includes("oitavas") ||
    norm.includes("dezasseis") ||
    norm.includes("16")
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
 * Sanitize GitHub URL to get the raw content URL if it represents a blob page
 */
export function sanitizeGithubUrl(url: string): string {
  let clean = url.trim();
  if (clean.includes("github.com") && clean.includes("/blob/")) {
    clean = clean.replace("github.com", "raw.githubusercontent.com");
    clean = clean.replace("/blob/", "/");
  }
  return clean;
}

/**
 * Check if the team string is a dynamic placeholder
 */
export function isPlaceholder(team: string): boolean {
  if (!team) return true;
  const t = team.trim().toUpperCase();
  if (/^[123][A-L]$/.test(t)) return true;
  if (/^3[A-L\/]+$/.test(t)) return true;
  if (/^[WL]\d+$/.test(t)) return true;
  if (t.includes("A DEFINIR")) return true;
  if (t.includes("A/B/C")) return true;
  return false;
}

/**
 * Parses cup_finals.txt style text for the World Cup 2026
 */
export function parseCupFinalsText(text: string): Record<string, { team1: string; team2: string }> {
  const lines = text.split(/\r?\n/);
  const matchMap: Record<string, { team1: string; team2: string }> = {};

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Pattern for match number like (73)
    const matchMatch = line.match(/\((\d+)\)/);
    if (matchMatch) {
      const matchNum = matchMatch[1];
      
      let afterParentheses = line.replace(/\([^)]+\)/, "").trim();

      const atIndex = afterParentheses.indexOf("@");
      if (atIndex !== -1) {
        afterParentheses = afterParentheses.substring(0, atIndex).trim();
      }

      // Looking for " v " or " vs "
      const vIndex = afterParentheses.search(/\s+(?:v|vs)\s+/i);
      if (vIndex !== -1) {
        const leftPart = afterParentheses.substring(0, vIndex).trim();
        const rightPart = afterParentheses.substring(vIndex + 3).trim();

        let team1 = leftPart;
        const timeMatch = leftPart.match(/^(?:\d{1,2}:\d{2}(?:\s+UTC[+-]\d+)?\s*)/i);
        if (timeMatch) {
          team1 = leftPart.substring(timeMatch[0].length).trim();
        } else {
          const parts = leftPart.split(/\s{2,}/);
          if (parts.length > 1) {
            team1 = parts[parts.length - 1].trim();
          }
        }

        const team2 = rightPart.trim();
        matchMap[matchNum] = { team1, team2 };
      }
    }
  }

  return matchMap;
}

/**
 * Mapping between TXT match numbers and internal app match IDs
 */
export const cupFinalsMatchMapping: Record<string, string> = {
  "73": "wc2026-r32-1",
  "74": "wc2026-r32-7",
  "75": "wc2026-r32-5",
  "76": "wc2026-r32-4",
  "77": "wc2026-r32-8",
  "78": "wc2026-r32-6",
  "79": "wc2026-r32-2",
  "80": "wc2026-r32-16",
  "81": "wc2026-r32-13",
  "82": "wc2026-r32-10",
  "83": "wc2026-r32-14",
  "84": "wc2026-r32-11",
  "85": "wc2026-r32-3",
  "86": "wc2026-r32-12",
  "87": "wc2026-r32-15",
  "88": "wc2026-r32-9",
  "89": "wc2026-o1",
  "90": "wc2026-o2",
  "91": "wc2026-o3",
  "92": "wc2026-o4",
  "93": "wc2026-o5",
  "94": "wc2026-o6",
  "95": "wc2026-o7",
  "96": "wc2026-o8",
  "97": "wc2026-q1",
  "98": "wc2026-q2",
  "99": "wc2026-q3",
  "100": "wc2026-q4",
  "101": "wc2026-s1",
  "102": "wc2026-s2",
  "103": "wc2026-t3",
  "104": "wc2026-f1"
};

/**
 * Merges parsed cup final teams into current competition data match list
 */
export function mergeCupFinalsIntoCompetitionData(
  currentData: CompetitionData,
  txtContent: string
): CompetitionData {
  const matchMap = parseCupFinalsText(txtContent);
  const updatedMatches = currentData.matches.map(m => {
    const matchNum = Object.keys(cupFinalsMatchMapping).find(
      key => cupFinalsMatchMapping[key] === m.id
    );

    if (matchNum && matchMap[matchNum]) {
      const parsed = matchMap[matchNum];
      const newM = { ...m };
      if (!isPlaceholder(parsed.team1)) {
        newM.team1 = parsed.team1;
      }
      if (!isPlaceholder(parsed.team2)) {
        newM.team2 = parsed.team2;
      }
      return newM;
    }
    return m;
  });

  return {
    ...currentData,
    matches: updatedMatches
  };
}

/**
 * Parses a simple CSV line, respecting optional double quotes
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map(s => s.replace(/^"|"$/g, "").trim());
}

/**
 * Parses Google Sheets exported CSV content for the knockouts (Match 73 to 104)
 */
export function parseGoogleSheetCSV(text: string): Record<string, { team1: string; team2: string }> {
  const lines = text.split(/\r?\n/);
  const matchMap: Record<string, { team1: string; team2: string }> = {};

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    const row = parseCSVLine(line);
    // Find if any cell corresponds to a match index (73-104)
    let mIdx = -1;
    let matchNum = "";
    
    for (let i = 0; i < row.length; i++) {
      const cell = row[i];
      // Search for standalone number between 73 and 104, or containing "Jogo X"
      const match = cell.match(/\b(7[3-9]|8[0-9]|9[0-9]|10[0-4])\b/);
      if (match) {
        matchNum = match[1];
        mIdx = i;
        break;
      }
    }

    if (matchNum && mIdx !== -1) {
      // Find Team 1 and Team 2 in subsequent columns
      let team1 = "";
      let team2 = "";

      if (row[mIdx + 1] !== undefined) {
        team1 = row[mIdx + 1];
      }
      if (row[mIdx + 2] !== undefined) {
        team2 = row[mIdx + 2];
      }

      // If columns adjacent are empty or not the team names, fallback to remaining non-empty and non-numeric columns
      const remainingNonNumeric = row.filter((val, idx) => {
        if (idx === mIdx) return false;
        if (!val) return false;
        if (/^\d+$/.test(val)) return false;
        if (val.toLowerCase().includes("jogo")) return false;
        return true;
      });

      if (!team1 && remainingNonNumeric.length > 0) {
        team1 = remainingNonNumeric[0];
      }
      if (!team2 && remainingNonNumeric.length > 1) {
        team2 = remainingNonNumeric[1];
      }

      if (team1 || team2) {
        matchMap[matchNum] = { team1, team2 };
      }
    }
  }

  return matchMap;
}

/**
 * Merges Google Sheets CSV teams into current competition data match list
 */
export function mergeGoogleSheetCSVIntoCompetitionData(
  currentData: CompetitionData,
  csvContent: string
): CompetitionData {
  const matchMap = parseGoogleSheetCSV(csvContent);
  const updatedMatches = currentData.matches.map(m => {
    const matchNum = Object.keys(cupFinalsMatchMapping).find(
      key => cupFinalsMatchMapping[key] === m.id
    );

    if (matchNum && matchMap[matchNum]) {
      const parsed = matchMap[matchNum];
      const newM = { ...m };
      if (parsed.team1 && !isPlaceholder(parsed.team1)) {
        newM.team1 = parsed.team1;
      }
      if (parsed.team2 && !isPlaceholder(parsed.team2)) {
        newM.team2 = parsed.team2;
      }
      return newM;
    }
    return m;
  });

  return {
    ...currentData,
    matches: updatedMatches
  };
}

/**
 * Fetch and load real OpenFootball data from a direct URL (handles JSON, CSV & TXT)
 */
export async function loadOpenFootballDataFromURL(url: string): Promise<CompetitionData> {
  const sanitized = sanitizeGithubUrl(url);
  const response = await fetch(sanitized);
  
  if (!response.ok) {
    throw new Error(`Erro na rede ao tentar carregar o arquivo (${response.status})`);
  }

  const text = await response.text();
  
  // Try parsing as JSON first
  try {
    const trimmed = text.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      const rawJSON = JSON.parse(text);
      return parseOpenFootballJSON(rawJSON);
    }
  } catch (e) {
    // If JSON parsing fails, transition to other options
  }

  const isCSV = url.includes("csv") || url.includes("output=csv") || text.split("\n")[0].includes(",");

  if (isCSV) {
    return {
      competition: "Copa do Mundo FIFA 2026",
      round: "Finais da Copa de 2026",
      matches: [],
      isCsvGoogleSheet: true,
      csvContent: text
    };
  }

  // Treat as plain text (.txt) cup_finals format
  return {
    competition: "Copa do Mundo FIFA 2026",
    round: "Finais da Copa de 2026",
    matches: [],
    isTxtCupFinals: true,
    txtContent: text
  };
}
