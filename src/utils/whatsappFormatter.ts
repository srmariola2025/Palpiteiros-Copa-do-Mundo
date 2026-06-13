import { Match, UserPrediction } from "../types";
import { getTeamFlag } from "../data/mockSoccerData";

/**
 * Sanitizes and formats the predictions list into a rich-text format compliant with WhatsApp native markdown.
 */
export function formatWhatsAppMessage({
  fullName,
  round,
  competition,
  matches,
  predictions,
  emissionDate,
  ticketCode,
  secondRoundMatches = [],
  simulatedDateStr,
  groupPredictions,
  finalistPredictions,
  activeStage
}: {
  fullName: string;
  round: string;
  competition: string;
  matches: Match[];
  predictions: UserPrediction[];
  emissionDate: string;
  ticketCode: string;
  secondRoundMatches?: Match[];
  simulatedDateStr?: string;
  groupPredictions?: Record<string, { first: string; second: string }>;
  finalistPredictions?: { first: string; second: string; third: string; fourth: string };
  activeStage?: string;
}): string {
  // Line break constants
  const divider = "------------------------------------------";
  const fancyDivider = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
  const now = simulatedDateStr ? new Date(simulatedDateStr) : new Date();
  
  // Format Competition name dynamically
  let compName = competition;
  if (compName.includes("Mundial FIFA 2026")) {
    compName = "COPA DO MUNDO 2026";
  } else if (compName.toLowerCase().includes("brasileirão") || compName.toLowerCase().includes("brasileirao")) {
    compName = "BRASILEIRÃO 2026";
  } else {
    compName = "COPA DO MUNDO 2026";
  }

  // Clean Round name (omit bracketed part if present)
  let cleanRound = round;
  if (cleanRound.includes(" [")) {
    cleanRound = cleanRound.split(" [")[0];
  }

  // Generate display ticket code
  const displayTicketCode = ticketCode.replace("LOTO-", "SER-2026-F");

  // Beautiful Header as per template
  let text = `🎫 PALPITEIROS COPA 2026\n`;
  text += `📋 SÉRIE: ${displayTicketCode}\n`;
  text += `👤 Nome: ${fullName}\n`;
  text += `📅 Data: ${emissionDate}\n\n`;

  // Check if we are in group stage or elimination stage baseado na data real ou simulada
  const r32StartTime = new Date("2026-06-28T14:00:00-03:00");
  const isInitialPhaseRealDate = now < r32StartTime;

  if (!isInitialPhaseRealDate) {
    if (finalistPredictions) {
      const hasAnyFinalist = finalistPredictions.first || finalistPredictions.second || finalistPredictions.third || finalistPredictions.fourth;
      
      if (hasAnyFinalist) {
        text += `🏆 FINALISTAS DA COPA:\n`;
        text += `${fancyDivider}\n`;
        if (finalistPredictions.first) text += `🥇 1º (Campeão): ${finalistPredictions.first}\n`;
        if (finalistPredictions.second) text += `🥈 2º (Vice): ${finalistPredictions.second}\n`;
        if (finalistPredictions.third) text += `🥉 3º: ${finalistPredictions.third}\n`;
        if (finalistPredictions.fourth) text += `4º: ${finalistPredictions.fourth}\n`;
        text += `${fancyDivider}\n\n`;
      }
    }
  }

  // Header for Matches
  text += `⚽ JOGOS - ${cleanRound.toUpperCase()}:\n`;
  text += `${divider}\n`;

  // Filter main round matches to keep only open ones that have predictions
  const openMatches: { match: Match; index: number }[] = [];

  matches.forEach((match, idx) => {
    const matchTimeBRT = new Date(`${match.date}T${match.time}:00-03:00`);
    const isStarted = now >= matchTimeBRT;
    
    if (!isStarted) {
      const prediction = predictions.find(p => p.matchId === match.id);
      const hasPred = prediction && prediction.score1 !== "" && prediction.score2 !== "";
      if (hasPred) {
        openMatches.push({ match, index: idx + 1 });
      }
    }
  });

  // Render Open/Active Matches with predictions
  openMatches.forEach(({ match, index }) => {
    const [year, month, day] = match.date.split("-");
    const formattedDate = `${day}/${month}`;
    const gameNum = String(index).padStart(2, '0');
    
    // Get predictions
    const prediction = predictions.find(p => p.matchId === match.id);
    const score1 = prediction?.score1 !== undefined && prediction.score1 !== "" ? prediction.score1 : "0";
    const score2 = prediction?.score2 !== undefined && prediction.score2 !== "" ? prediction.score2 : "0";
    const stadiumStr = match.stadium ? ` (${match.stadium})` : "";
    const groupNameStr = match.group ? ` [${match.group}]` : "";
    
    text += `🔹${gameNum}${groupNameStr} • ${match.team1} ${getTeamFlag(match.team1)} ${score1} x ${score2} ${getTeamFlag(match.team2)} ${match.team2}\n`;
    text += `     • ${formattedDate} ${match.time}h${stadiumStr}\n`;
  });

  // Render 2ª RODADA / NEXT ROUND PREVIEWS if present
  const predictedSecondRoundMatches = secondRoundMatches.filter((match) => {
    const prediction = predictions.find(p => p.matchId === match.id);
    return prediction && prediction.score1 !== "" && prediction.score2 !== "";
  });

  if (predictedSecondRoundMatches.length > 0) {
    text += `${divider}\n`;
    text += `🔮 PRÉVIAS DA PRÓXIMA RODADA (OPCIONAIS)\n`;
    text += `${divider}\n`;
    
    predictedSecondRoundMatches.forEach((match) => {
      const [year, month, day] = match.date.split("-");
      const formattedDate = `${day}/${month}`;
      
      const prediction = predictions.find(p => p.matchId === match.id);
      const score1 = prediction?.score1 !== undefined && prediction.score1 !== "" ? prediction.score1 : "0";
      const score2 = prediction?.score2 !== undefined && prediction.score2 !== "" ? prediction.score2 : "0";
      const stadiumStr = match.stadium ? ` (${match.stadium})` : "";
      const groupNameStr = match.group ? ` [${match.group}]` : "";
      
      text += `🔹${groupNameStr} • ${match.team1} ${getTeamFlag(match.team1)} ${score1} x ${score2} ${getTeamFlag(match.team2)} ${match.team2}\n`;
      text += `     • ${formattedDate} ${match.time}h${stadiumStr}\n`;
    });
  }

  text += `${divider}\n`;
  text += `🗝️ Código de Segurança: ${displayTicketCode}\n`;
  text += `${divider}`;

  return text;
}

/**
 * Generates a unique 6-character vintage receipt hash based on user details and predictions as signature.
 */
export function generateTicketCode(fullName: string, predictions: UserPrediction[]): string {
  let nameLengthSum = 0;
  for (let i = 0; i < fullName.length; i++) {
    nameLengthSum += fullName.charCodeAt(i);
  }
  let sum = 0;
  predictions.forEach(p => {
    sum += Number(p.score1 || 0) + Number(p.score2 || 0) * 3;
  });
  
  // Custom hash combination
  const seed = (nameLengthSum || 1234) + sum;
  const hashVal = (seed * 16807) % 2147483647;
  const hexPart = hashVal.toString(16).toUpperCase().substring(0, 4);
  const randomSuffix = Math.floor(Math.random() * 90 + 10);
  
  return `LOTO-${hexPart}-${randomSuffix}`;
}
