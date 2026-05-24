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
  simulatedDateStr
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
}): string {
  // Line break constants
  const divider = "------------------------------------------";
  const now = simulatedDateStr ? new Date(simulatedDateStr) : new Date();
  
  let text = `⚽ *PALPITE COPA 2026* ⚽\n`;
  text += `${divider}\n`;
  text += `🏆 *Torneio:* Mundial FIFA 2026 (EUA, Canadá & México)\n`;
  text += `👤 *Palpite de:* ${fullName.trim()}\n`;
  text += `📅 *Fase:* ${round}\n`;
  text += `${divider}\n\n`;

  // Render 1.ª RODADA / Main Matches
  const hasSecondRound = secondRoundMatches.length > 0;
  if (hasSecondRound) {
    text += `🔥 *1.ª RODADA:*\n\n`;
  } else {
    text += `🔥 *Meus Palpites:*\n\n`;
  }

  matches.forEach((match, idx) => {
    const prediction = predictions.find(p => p.matchId === match.id);
    
    const matchTimeBRT = new Date(`${match.date}T${match.time}:00-03:00`);
    const isStarted = now >= matchTimeBRT;

    const score1 = prediction?.score1 !== undefined && prediction.score1 !== "" ? prediction.score1 : "";
    const score2 = prediction?.score2 !== undefined && prediction.score2 !== "" ? prediction.score2 : "";

    const flag1 = getTeamFlag(match.team1);
    const flag2 = getTeamFlag(match.team2);
    
    const gameNum = String(idx + 1).padStart(2, '0');
    text += `🔹 *JOGO ${gameNum}* • _${match.date}_ _${match.time} BR_\n`;
    if (isStarted) {
      text += `   ${flag1} ${match.team1} (🚫Palpite já processado🚫) ${match.team2} ${flag2}\n\n`;
    } else {
      const displayScore1 = score1 !== "" ? score1 : "0";
      const displayScore2 = score2 !== "" ? score2 : "0";
      text += `   ${flag1} ${match.team1} *${displayScore1}* x *${displayScore2}* ${match.team2} ${flag2}\n\n`;
    }
  });

  // Render 2.ª RODADA if present
  if (hasSecondRound) {
    text += `⚡ *2.ª RODADA:*\n\n`;
    secondRoundMatches.forEach((match, idx) => {
      const prediction = predictions.find(p => p.matchId === match.id);
      
      const matchTimeBRT = new Date(`${match.date}T${match.time}:00-03:00`);
      const isStarted = now >= matchTimeBRT;

      const score1 = prediction?.score1 !== undefined && prediction.score1 !== "" ? prediction.score1 : "";
      const score2 = prediction?.score2 !== undefined && prediction.score2 !== "" ? prediction.score2 : "";

      const flag1 = getTeamFlag(match.team1);
      const flag2 = getTeamFlag(match.team2);
      
      const gameNum = String(idx + 1).padStart(2, '0');
      text += `🔸 *JOGO ${gameNum}* • _${match.date}_ _${match.time} BR_\n`;
      if (isStarted) {
        text += `   ${flag1} ${match.team1} (🚫Palpite já processado🚫) ${match.team2} ${flag2}\n\n`;
      } else {
        const displayScore1 = score1 !== "" ? score1 : "0";
        const displayScore2 = score2 !== "" ? score2 : "0";
        text += `   ${flag1} ${match.team1} *${displayScore1}* x *${displayScore2}* ${match.team2} ${flag2}\n\n`;
      }
    });
  }

  text += `${divider}\n`;
  text += `🔐 *CÓDIGO DE SEGURANÇA:* \`${ticketCode}\``;

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
