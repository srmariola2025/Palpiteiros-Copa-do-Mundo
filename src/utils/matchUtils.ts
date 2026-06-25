import { Match } from "../types";

/**
 * Calculates the official, real sequential FIFA 2026 World Cup match number (1 to 104)
 * based on the match ID, or falls back to an index-based fallback.
 */
export function getMatchOfficialNumber(matchId: string, fallbackIdx: number = 0): number {
  if (!matchId) return fallbackIdx + 1;

  // 1. Group Stage Round 1: wc2026-g[A-L]-[1-2] -> Matches 1 to 24
  if (matchId.startsWith("wc2026-g") && !matchId.includes("2r") && !matchId.includes("3r")) {
    const parts = matchId.split("-");
    if (parts.length >= 3) {
      const groupChar = parts[1].slice(1); // e.g. "A", "B", ... "L"
      const matchNum = parseInt(parts[2], 10);
      const groupIdx = groupChar.charCodeAt(0) - 65; // A = 0, B = 1, ... L = 11
      if (groupIdx >= 0 && groupIdx < 12 && !isNaN(matchNum)) {
        return groupIdx * 2 + matchNum;
      }
    }
  }

  // 2. Group Stage Round 2: wc2026-g[A-L]-2r[1-2] -> Matches 25 to 48
  if (matchId.startsWith("wc2026-g") && matchId.includes("2r")) {
    const parts = matchId.split("-");
    if (parts.length >= 3) {
      const groupChar = parts[1].slice(1);
      const matchSub = parts[2].replace("2r", "");
      const matchNum = parseInt(matchSub, 10);
      const groupIdx = groupChar.charCodeAt(0) - 65;
      if (groupIdx >= 0 && groupIdx < 12 && !isNaN(matchNum)) {
        return 24 + groupIdx * 2 + matchNum;
      }
    }
  }

  // 3. Group Stage Round 3: wc2026-g[A-L]-3r[1-2] -> Matches 49 to 72
  if (matchId.startsWith("wc2026-g") && matchId.includes("3r")) {
    const parts = matchId.split("-");
    if (parts.length >= 3) {
      const groupChar = parts[1].slice(1);
      const matchSub = parts[2].replace("3r", "");
      const matchNum = parseInt(matchSub, 10);
      const groupIdx = groupChar.charCodeAt(0) - 65;
      if (groupIdx >= 0 && groupIdx < 12 && !isNaN(matchNum)) {
        return 48 + groupIdx * 2 + matchNum;
      }
    }
  }

  // 4. Round of 32 (16 de final): wc2026-r32-[1-16] -> Matches 73 to 88
  if (matchId.startsWith("wc2026-r32-")) {
    const num = parseInt(matchId.replace("wc2026-r32-", ""), 10);
    if (!isNaN(num)) return 72 + num;
  }

  // 5. Round of 16 (Oitavas de final): wc2026-o[1-8] -> Matches 89 to 96
  if (matchId.startsWith("wc2026-o")) {
    const num = parseInt(matchId.replace("wc2026-o", ""), 10);
    if (!isNaN(num)) return 88 + num;
  }

  // 6. Quarter-finals (Quartas de final): wc2026-q[1-4] -> Matches 97 to 100
  if (matchId.startsWith("wc2026-q")) {
    const num = parseInt(matchId.replace("wc2026-q", ""), 10);
    if (!isNaN(num)) return 96 + num;
  }

  // 7. Semi-finals: wc2026-s1 -> Match 101, wc2026-s2 -> Match 102
  if (matchId === "wc2026-s1") return 101;
  if (matchId === "wc2026-s2") return 102;

  // 8. Third-place play-off: wc2026-t3 -> Match 103
  if (matchId === "wc2026-t3") return 103;

  // 9. Final: wc2026-f1 -> Match 104
  if (matchId === "wc2026-f1") return 104;

  return fallbackIdx + 1;
}
