/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, 
  User, 
  Phone, 
  Settings, 
  Sparkles, 
  FileText, 
  Send, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Link2, 
  Check, 
  Calendar, 
  Clock, 
  Share2,
  Trash2,
  Info,
  X
} from "lucide-react";

import { openFootballMockData, getTeamFlag, groupStageSecondRoundMatches } from "./data/mockSoccerData";
import { CompetitionData, UserPrediction } from "./types";
import { formatWhatsAppMessage, generateTicketCode } from "./utils/whatsappFormatter";
import { loadOpenFootballDataFromURL } from "./utils/openFootballLoader";

import Barcode from "./components/Barcode";
import InfoModal from "./components/InfoModal";
import TeamCardModal from "./components/TeamCardModal";
import TeamFlag from "./components/TeamFlag";

export default function App() {
  // 1. Core State
  const [competitionData, setCompetitionData] = useState<CompetitionData>(openFootballMockData);
  
  const [showSimulator, setShowSimulator] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.has("test") || params.has("debug")) return true;
      try {
        return localStorage.getItem("loto_debug_active") === "true";
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  const [debugClicks, setDebugClicks] = useState(0);

  // Dynamic Simulated or Live current date in Brasília Time (UTC-3)
  const [simulatedDate, setSimulatedDate] = useState<Date>(() => {
    try {
      const stored = localStorage.getItem("loto_simulated_date_brt");
      if (stored) return new Date(stored);
    } catch (e) {
      // ignore
    }
    
    // Default to sample date if in test mode, otherwise the real live date (which is before the initial games)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      let isTestActive = params.has("test") || params.has("debug");
      try {
        if (localStorage.getItem("loto_debug_active") === "true") {
          isTestActive = true;
        }
      } catch (e) {}
      if (isTestActive) {
        return new Date("2026-06-11T16:00:00-03:00");
      }
    }
    return new Date();
  });

  const handleTrophyClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const nextClicks = debugClicks + 1;
    if (nextClicks >= 5) {
      setDebugClicks(0);
      const nextShow = !showSimulator;
      setShowSimulator(nextShow);
      try {
        if (nextShow) {
          localStorage.setItem("loto_debug_active", "true");
        } else {
          localStorage.removeItem("loto_debug_active");
          localStorage.removeItem("loto_simulated_date_brt");
        }
      } catch (err) {
        console.warn("Storage inacessível:", err);
      }
    } else {
      setDebugClicks(nextClicks);
    }
  };

  // Ticking effect for live clock
  useEffect(() => {
    let hasStoredOverride = false;
    try {
      hasStoredOverride = localStorage.getItem("loto_simulated_date_brt") !== null;
    } catch (e) {}
    
    if (!showSimulator && !hasStoredOverride) {
      const interval = setInterval(() => {
        setSimulatedDate(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showSimulator]);

  const [fullName, setFullName] = useState("");
  const [predictions, setPredictions] = useState<Record<string, { score1: string; score2: string }>>({});
  const [ticketCode, setTicketCode] = useState("LOTO-INIT-26");

  // 2. Integration / Settings State
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);
  const [customJsonUrl, setCustomJsonUrl] = useState("");
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [apiSuccessMsg, setApiSuccessMsg] = useState<string | null>(null);
  const [apiErrorMsg, setApiErrorMsg] = useState<string | null>(null);

  // 3. Modals and Triggers Design State
  const [clearClicks, setClearClicks] = useState(0);
  const [isSurpresinhaPromoOpen, setIsSurpresinhaPromoOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMsg, setModalMsg] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [whatsappDestinationUrl, setWhatsappDestinationUrl] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedTradingCardTeam, setSelectedTradingCardTeam] = useState<string | null>(null);

  // 4. Local History tracking so user enjoys client autonomy
  const [registeredKeysHistory, setRegisteredKeysHistory] = useState<string[]>([]);
  const [emissionDate, setEmissionDate] = useState("");

  // Initialize dates and lists on mount
  useEffect(() => {
    // Generate styled date: DD/MM/AAAA
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    setEmissionDate(`${dd}/${mm}/${yyyy}`);

    // Read previous records history
    loadTicketHistory();
  }, []);

  // Update dynamic ticket code as predictions change
  useEffect(() => {
    const listPredictions: UserPrediction[] = Object.keys(predictions).map(id => ({
      matchId: id,
      score1: predictions[id]?.score1 || "0",
      score2: predictions[id]?.score2 || "0"
    }));
    
    if (fullName || listPredictions.length > 0) {
      const code = generateTicketCode(fullName || "Apostador", listPredictions);
      setTicketCode(code);
    }
  }, [predictions, fullName]);

  const loadTicketHistory = () => {
    try {
      const history: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("loto_wc26_prediction_")) {
          history.push(key);
        }
      }
      setRegisteredKeysHistory(history);
    } catch (e) {
      console.warn("Storage inacessível:", e);
    }
  };

  // Find all unique stages present in the matches, in a friendly order
  const allAvailableStages: string[] = Array.from(
    new Set(competitionData.matches.map(m => String(m.stage || "Fase de Grupos")))
  );
  
  // Sort stages
  const stagePriority = ["Fase de Grupos", "Oitavas de Final", "Quartas de Final", "Semifinais", "Final"];
  allAvailableStages.sort((a: string, b: string) => {
    const idxA = stagePriority.indexOf(a);
    const idxB = stagePriority.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  // Calculate cutoffs dynamically
  const getCutoffForStage = (stageName: string): Date => {
    const stageMatches = competitionData.matches.filter(m => String(m.stage || "Fase de Grupos") === stageName);
    if (stageMatches.length === 0) return new Date(0);
    const sorted = [...stageMatches].sort((a, b) => {
      const timeStrA = `${a.date}T${a.time}:00-03:00`;
      const timeStrB = `${b.date}T${b.time}:00-03:00`;
      const timeA = new Date(timeStrA).getTime();
      const timeB = new Date(timeStrB).getTime();
      return timeA - timeB;
    });
    const lastMatch = sorted[sorted.length - 1];
    return new Date(`${lastMatch.date}T${lastMatch.time}:00-03:00`);
  };

  // Determine active stage automatically
  const getActiveStageAutomatically = (now: Date): string => {
    const groupCutoff = getCutoffForStage("Fase de Grupos");
    const oitavasCutoff = getCutoffForStage("Oitavas de Final");
    const quartasCutoff = getCutoffForStage("Quartas de Final");
    const semicutoff = getCutoffForStage("Semifinais");

    if (now >= semicutoff) return "Final";
    if (now >= quartasCutoff) return "Semifinais";
    if (now >= oitavasCutoff) return "Quartas de Final";
    if (now >= groupCutoff) return "Oitavas de Final";
    return "Fase de Grupos";
  };

  const selectedStageTab = getActiveStageAutomatically(simulatedDate);

  const isMatchStarted = (match: any, now: Date): boolean => {
    const matchTimeBRT = new Date(`${match.date}T${match.time}:00-03:00`);
    return now >= matchTimeBRT;
  };

  // Filter matches of the active stage
  const activeMatches = competitionData.matches.filter(m => {
    const stage = m.stage || "Fase de Grupos";
    return stage === selectedStageTab;
  });

  // Find dynamic 2nd round matches if any of the active matches have started
  const startedMatchesInActive = activeMatches.filter(m => isMatchStarted(m, simulatedDate));
  const startedTeamsSet = new Set<string>();
  startedMatchesInActive.forEach(m => {
    startedTeamsSet.add(m.team1);
    startedTeamsSet.add(m.team2);
  });

  const secondRoundMatchesToShow = groupStageSecondRoundMatches.filter(m => {
    if (selectedStageTab !== "Fase de Grupos") return false;
    return startedTeamsSet.has(m.team1) || startedTeamsSet.has(m.team2);
  });

  // Pre-fill fields or trigger random results "Surpresinha" for active matches
  const handleSurpresinha = () => {
    const newPredictions = { ...predictions };
    const allMatchesToFill = [...activeMatches, ...secondRoundMatchesToShow];
    
    allMatchesToFill.forEach(match => {
      if (isMatchStarted(match, simulatedDate)) return; // Skip started matches

      const rollScore = () => {
        const rand = Math.random();
        if (rand < 0.3) return "0";
        if (rand < 0.6) return "1";
        if (rand < 0.8) return "2";
        if (rand < 0.92) return "3";
        return String(Math.floor(Math.random() * 3) + 4); 
      };
      newPredictions[match.id] = {
        score1: rollScore(),
        score2: rollScore()
      };
    });
    setPredictions(newPredictions);
  };

  // Reset current card selections for active matches
  const handleClearForm = () => {
    const nextClicks = clearClicks + 1;
    if (nextClicks >= 10) {
      setIsSurpresinhaPromoOpen(true);
      setClearClicks(0);
    } else {
      setClearClicks(nextClicks);
    }

    setFullName("");
    const newPredictions = { ...predictions };
    const allMatchesToClear = [...activeMatches, ...secondRoundMatchesToShow];
    allMatchesToClear.forEach(m => {
      if (!isMatchStarted(m, simulatedDate)) {
        delete newPredictions[m.id];
      }
    });
    setPredictions(newPredictions);
    setApiErrorMsg(null);
    setApiSuccessMsg(null);
    setValidationError(null);
  };

  // Handle manual input of score lines
  const handleScoreChange = (matchId: string, teamNum: 1 | 2, value: string) => {
    // Keep it empty or positive numbers
    const cleanVal = value === "" ? "" : String(Math.max(0, parseInt(value) || 0));
    setPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [`score${teamNum}`]: cleanVal
      }
    }));
    setValidationError(null);
  };

  // Handle submission logic & validation criteria
  const handleEnviarPalpites = (e: React.FormEvent) => {
    e.preventDefault();

    // Verification 1: Mandatory fields Check
    if (!fullName.trim()) {
      setValidationError("Por favor, preencha o seu Nome Completo para assinar o bilhete.");
      return;
    }

    // Checking if all matches that are NOT started have predictions
    const editableMatches = [
      ...activeMatches.filter(m => !isMatchStarted(m, simulatedDate)),
      ...secondRoundMatchesToShow.filter(m => !isMatchStarted(m, simulatedDate))
    ];

    const missingPreds = editableMatches.filter(
      match => !predictions[match.id] || 
              predictions[match.id].score1 === "" || 
              predictions[match.id].score2 === ""
    );

    if (missingPreds.length > 0) {
      setValidationError(`Preencha todos os resultados! Ainda faltam definir os placares para ${missingPreds.length} jogo(s).`);
      return;
    }

    setValidationError(null);

    // Combine predictions for active round and second round
    const listPredictions: UserPrediction[] = [
      ...activeMatches,
      ...secondRoundMatchesToShow
    ].map(m => {
      const pred = predictions[m.id] || { score1: "", score2: "" };
      return {
        matchId: m.id,
        score1: pred.score1 !== "" ? pred.score1 : "0",
        score2: pred.score2 !== "" ? pred.score2 : "0"
      };
    });

    const ticketValue = {
      fullName,
      predictions: listPredictions,
      submittedAt: new Date().toISOString(),
      roundCode: `${competitionData.round} - ${selectedStageTab}`,
      ticketCode
    };

    // Save submission key locally to count history without duplicate blockers
    const uniqueValidationKey = `loto_wc26_prediction_sub_${Date.now()}`;
    try {
      localStorage.setItem(uniqueValidationKey, JSON.stringify(ticketValue));
      loadTicketHistory();
    } catch (saveErr) {
      console.error("Não foi possível salvar na cache do telemóvel:", saveErr);
    }

    // Build the beautiful Pre-formatted WhatsApp text payload with second round support
    const formattedMsg = formatWhatsAppMessage({
      fullName,
      round: `${competitionData.round} [${selectedStageTab.toUpperCase()}]`,
      competition: competitionData.competition,
      matches: activeMatches,
      predictions: listPredictions,
      emissionDate,
      ticketCode,
      secondRoundMatches: secondRoundMatchesToShow,
      simulatedDateStr: simulatedDate.toISOString()
    });

    const encodedText = encodeURIComponent(formattedMsg);
    // WhatsApp redirect link WITHOUT hardcoded phone parameter, forces user selection list!
    const finalWhatsAppUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    setWhatsappDestinationUrl(finalWhatsAppUrl);

    // Open directly in a new window/tab without ever modifying current window location inside the iframe
    window.open(finalWhatsAppUrl, "_blank", "noopener,noreferrer");
  };

  // Fetch OpenFootball JSON URL
  const handleFetchExternalJson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customJsonUrl.trim()) {
      setApiErrorMsg("Indique um endereço URL válido");
      return;
    }

    setIsFetchingUrl(true);
    setApiErrorMsg(null);
    setApiSuccessMsg(null);

    try {
      const data = await loadOpenFootballDataFromURL(customJsonUrl.trim());
      setCompetitionData(data);
      // Clean previous predictions to accommodate new teams
      setPredictions({});
      setApiSuccessMsg(`Sucesso! Carregado: "${data.competition}" - "${data.round}" com ${data.matches.length} partidas.`);
    } catch (err: any) {
      setApiErrorMsg(`Falha ao ler JSON: ${err.message || err}`);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  // Recover default classic tournament matches
  const handleRestoreDefaultModel = () => {
    setCompetitionData(openFootballMockData);
    setPredictions({});
    setApiErrorMsg(null);
    setApiSuccessMsg("Dados restaurados para o modelo padrão da Copa 2026.");
  };

  // Helper utility to wipe validator storage (perfect for evaluation/testers)
  const handleWipeValidationStorage = () => {
    if (confirm("Deseja redefinir todo o histórico local e permitir novos palpites de teste?")) {
      const keysToClear: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("loto_wc26_prediction_")) {
          keysToClear.push(key);
        }
      }
      keysToClear.forEach(k => localStorage.removeItem(k));
      loadTicketHistory();
      alert("Armazenamento limpo! Agora pode submeter novos testes livremente.");
    }
  };

  // Group matches by group name
  const groupedMatches: Record<string, typeof competitionData.matches> = {};
  activeMatches.forEach(match => {
    const grp = match.group || "Fase de Grupos";
    if (!groupedMatches[grp]) {
      groupedMatches[grp] = [];
    }
    groupedMatches[grp].push(match);
  });

  return (
    <div 
      className="min-h-screen relative overflow-x-hidden text-white font-sans flex flex-col justify-between py-6 px-4"
      style={{
        backgroundImage: "linear-gradient(rgba(11, 41, 23, 0.84), rgba(7, 28, 15, 0.93)), url('https://framerusercontent.com/images/L5snNMTtZXbSjzfzDqNfS22iL6o.jpg?scale-down-to=1024&width=2048&height=1146')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed"
      }}
    >
      
      {/* Decorative center circle pitch graphics */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-40">
        <div className="soccer-line-circle" />
        <div className="soccer-line-mid" />
      </div>

      {/* Main Header Controller */}
      <header className="relative z-10 w-full max-w-2xl mx-auto mb-6 text-center">
        <div 
          onClick={handleTrophyClick}
          className="inline-flex flex-col items-center justify-center bg-emerald-900/80 border border-emerald-700 px-5 py-2.5 rounded-2xl mb-3 backdrop-blur-xs shadow-lg cursor-pointer select-none active:scale-95 transition-transform"
          title="Clique para ativar o painel de testes"
        >
          <div className="flex items-center space-x-2.5">
            <Trophy className="h-6 w-6 text-amber-400 animate-bounce shrink-0" />
            <h1 className="text-sm font-display font-medium tracking-wider uppercase text-amber-200">
              Grupo Oficial de palpiteiros da Copa do Mundo 2026
            </h1>
          </div>
        </div>

        <p className="text-xs text-neutral-300 max-w-sm mx-auto italic border border-[#d4d4d4] p-2 rounded">
          Submeta os seus palpites, valide localmente e partilhe directamente o bilhete no WhatsApp com o seu grupo!
        </p>
      </header>

      {/* MAIN CONTAINER: Classic retro sports lottery ticket (LOTECA RECEIPT) */}
      <main className="relative z-10 w-full max-w-md mx-auto flex-1 flex flex-col justify-center">
        
        {/* Subtly Elegant Clock & Testing Simulator Controller with Easter Egg */}
        <div 
          className="w-full bg-neutral-900/85 border border-emerald-700/60 rounded-lg p-2.5 backdrop-blur-xs text-xs space-y-2 mb-3 shadow-xl cursor-default select-none"
          title="Horário Oficial Brasília"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-amber-300">
              <Clock className="h-3.5 w-3.5 animate-pulse shrink-0" />
              <span className="font-bold tracking-wide uppercase text-[9px]">Horário de Brasília (UTC-3)</span>
            </div>
            <span className="font-mono text-emerald-300 font-bold bg-[#143e24] px-2 py-0.5 rounded text-[10px] border border-emerald-700/80">
              {simulatedDate.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })} BRT
            </span>
          </div>
          
          {showSimulator && (
            <div className="border-t border-emerald-800/40 pt-1.5" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-wrap gap-1 items-center justify-start text-[8px]">
                <span className="text-neutral-400 font-bold mr-1 block">Testar Fluxo:</span>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date("2026-05-20T12:00:00-03:00");
                    setSimulatedDate(d);
                    localStorage.setItem("loto_simulated_date_brt", d.toISOString());
                  }}
                  className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                    selectedStageTab === "Fase de Grupos" && startedMatchesInActive.length === 0
                      ? "bg-emerald-700 text-white border-amber-400 font-bold"
                      : "bg-[#143e24]/60 text-emerald-200 border-emerald-800/80 hover:bg-[#143e24]"
                  }`}
                >
                  Antes do Início
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date("2026-06-11T16:00:00-03:00");
                    setSimulatedDate(d);
                    localStorage.setItem("loto_simulated_date_brt", d.toISOString());
                  }}
                  className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                    selectedStageTab === "Fase de Grupos" && startedMatchesInActive.length > 0
                      ? "bg-emerald-700 text-white border-amber-400 font-bold"
                      : "bg-[#143e24]/60 text-emerald-200 border-emerald-800/80 hover:bg-[#143e24]"
                  }`}
                >
                  México x África (Iniciado 🏁)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date("2026-06-28T12:00:00-03:00");
                    setSimulatedDate(d);
                    localStorage.setItem("loto_simulated_date_brt", d.toISOString());
                  }}
                  className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                    selectedStageTab === "Oitavas de Final"
                      ? "bg-emerald-700 text-white border-amber-400 font-bold"
                      : "bg-[#143e24]/60 text-emerald-200 border-emerald-800/80 hover:bg-[#143e24]"
                  }`}
                >
                  Oitavas de Final
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date("2026-07-06T12:00:00-03:00");
                    setSimulatedDate(d);
                    localStorage.setItem("loto_simulated_date_brt", d.toISOString());
                  }}
                  className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                    selectedStageTab === "Quartas de Final"
                      ? "bg-emerald-700 text-white border-amber-400 font-bold"
                      : "bg-[#143e24]/60 text-emerald-200 border-emerald-800/80 hover:bg-[#143e24]"
                  }`}
                >
                  Quartas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("loto_simulated_date_brt");
                    localStorage.removeItem("loto_debug_active");
                    setShowSimulator(false);
                    setSimulatedDate(new Date());
                  }}
                  className="px-1.5 py-0.5 rounded border bg-red-900/60 text-red-100 border-red-800/80 hover:bg-red-950/85 transition-colors ml-auto cursor-pointer font-bold"
                  title="Restaurar relógio em tempo real"
                >
                  Resetar Relógio ⏰
                </button>
              </div>

              {/* Maintenance Tools and Data Carga (Modo Manutenção) */}
              <div className="mt-2.5 pt-2 border-t border-emerald-800/40 flex flex-col space-y-2">
                <div className="flex items-center justify-between text-[9px] text-[#f5be18] font-bold">
                  <span>⚙️ Painel de Manutenção & Carga de Dados (JSON / API)</span>
                </div>
                
                <form onSubmit={handleFetchExternalJson} className="flex gap-1.5 items-center">
                  <input
                    type="url"
                    placeholder="https://raw.githubusercontent.com/.../soccer.json"
                    value={customJsonUrl}
                    onChange={(e) => setCustomJsonUrl(e.target.value)}
                    className="flex-1 bg-neutral-950 text-[9px] text-emerald-100 border border-emerald-800/80 rounded px-1.5 py-0.5 focus:outline-none placeholder-emerald-800/60"
                  />
                  <button
                    type="submit"
                    disabled={isFetchingUrl}
                    className="px-2 py-0.5 rounded bg-emerald-700 text-white font-bold hover:bg-emerald-600 disabled:opacity-50 text-[9px] whitespace-nowrap cursor-pointer"
                  >
                    {isFetchingUrl ? "Carregando..." : "Carregar"}
                  </button>
                </form>

                {apiErrorMsg && (
                  <div className="text-[8px] text-red-400 bg-red-950/40 p-1 rounded border border-red-900/60 leading-tight">
                    {apiErrorMsg}
                  </div>
                )}
                {apiSuccessMsg && (
                  <div className="text-[8px] text-emerald-400 bg-emerald-950/40 p-1 rounded border border-emerald-900/60 leading-tight">
                    {apiSuccessMsg}
                  </div>
                )}

                <div className="flex gap-1 text-[8px]">
                  <button
                    type="button"
                    onClick={handleRestoreDefaultModel}
                    className="px-1.5 py-0.5 rounded border border-emerald-800/60 bg-[#143e24]/60 text-emerald-300 hover:bg-[#143e24] cursor-pointer"
                  >
                    Restaurar Copa 2026 🇧🇷
                  </button>
                  <button
                    type="button"
                    onClick={handleWipeValidationStorage}
                    className="px-1.5 py-0.5 rounded border border-red-800/50 bg-red-950/40 text-red-300 hover:bg-red-900/40 cursor-pointer"
                  >
                    Limpar Histórico Local 🧹
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Teeth upper row decoration */}
        <div className="serrated-edge-top" />

        <div className="bg-[#faf6eb] text-neutral-900 px-4 py-6 font-mono lotto-slip-container flex-1 flex flex-col justify-between border-x border-neutral-300">
          
          {/* Slip Header details */}
          <div>
            <div className="text-center pb-4 border-b-2 border-dashed border-neutral-400">
              <div className="bg-[#032110] rounded-xl p-4 sm:p-5 mb-2 flex items-center justify-between select-none shadow-lg text-left">
                <div className="flex flex-col justify-center pr-3">
                  <span 
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }} 
                    className="text-[28px] sm:text-[36px] font-black tracking-tight leading-none text-[#faf6eb] uppercase"
                  >
                    PALPITEIROS
                  </span>
                  <span 
                    style={{ fontFamily: "'Inter', sans-serif" }} 
                    className="text-[12px] leading-[12px] font-black tracking-[0.16em] text-[#ebdcb9] uppercase mt-2"
                  >
                    COPA DO MUNDO 2026
                  </span>
                </div>
                <div className="flex items-center justify-center pl-1 shrink-0">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/en/thumb/e/ec/FIFA_World_Cup_Trophy.svg/512px-FIFA_World_Cup_Trophy.svg.png" 
                    alt="Trophy" 
                    className="h-16 sm:h-20 w-auto object-contain brightness-110 contrast-105 drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.trophy-fallback');
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                  <div className="trophy-fallback hidden">
                    <Trophy className="h-12 w-12 text-amber-500" />
                  </div>
                </div>
              </div>
              
              <div className="bg-neutral-900/5 border border-dashed border-neutral-300 p-2.5 rounded mt-3 text-xs text-left text-neutral-700 space-y-1">
                <div className="flex justify-between">
                  <span>DATA EMISSÃO:</span>
                  <span className="font-bold text-neutral-900">{emissionDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>SÉRIE/BILHETE:</span>
                  <span className="font-bold tracking-wider text-neutral-900">SER-2026-F1</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="shrink-0">COMPETIÇÃO:</span>
                  <span className="font-bold text-neutral-900 text-right text-[11px] leading-tight flex-1">{competitionData.competition}</span>
                </div>
                <div className="flex justify-between">
                  <span>CATEGORIA:</span>
                  <span className="font-bold text-emerald-800 font-display">{competitionData.round}</span>
                </div>
              </div>
            </div>

            {/* Form layout */}
            <form onSubmit={handleEnviarPalpites} className="mt-5 space-y-4">
              
              {/* Bettor Info Section */}
              <div className="bg-[#f0ebde] p-3 border border-neutral-300 rounded space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-neutral-600 border-b border-dashed border-neutral-400 pb-1.5 uppercase">
                  <User className="h-4 w-4" />
                  <span>DADOS DO PALPITEIRO</span>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-600 block uppercase">
                    Nome usado nos palpiteiros <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ex: Thiago Medeiros"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (validationError) setValidationError(null);
                      }}
                      className="w-full bg-[#faf6eb] border border-neutral-400/80 rounded px-2.5 py-1.5 text-xs text-neutral-900 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-800"
                    />
                  </div>
                </div>
              </div>

              {/* Match Predictions Area */}
              <div className="mt-4 space-y-4">
                
                {/* 1.ª RODADA (Main Active Phase Matches) */}
                <div className="space-y-3">
                  <div className="sticky top-0 bg-[#faf6eb] py-1 pb-1.5 border-b-2 border-[#143e24] font-display font-extrabold text-[#143e24] flex items-center justify-between text-xs tracking-wider z-10 select-none uppercase">
                    <span>🔥 {selectedStageTab === "Fase de Grupos" ? "1.ª RODADA" : selectedStageTab}</span>
                    <span className="text-[8px] bg-[#143e24] text-white px-1.5 py-0.5 rounded font-mono">FASE ATIVA</span>
                  </div>

                  <div className="space-y-4">
                    {activeMatches.map((match) => {
                      const idx = competitionData.matches.findIndex(m => m.id === match.id);
                      const prediction = predictions[match.id] || { score1: "", score2: "" };
                      const isRowFilled = prediction.score1 !== "" && prediction.score2 !== "";
                      const isStarted = isMatchStarted(match, simulatedDate);

                      return (
                        <div key={match.id} className="space-y-1">
                          {/* Match Header metadata */}
                          <div className="flex items-center justify-between text-[8px] text-neutral-500 px-2 font-mono">
                            <span className="font-bold text-[#143e24]">
                              JOGO #{String(idx + 1).padStart(2, "0")} {match.group ? `(${match.group})` : ""}
                            </span>
                            <span className="flex items-center space-x-1">
                              <span>{match.date} • {match.time} BR</span>
                              {match.stadium && (
                                <span className="text-neutral-400 hidden sm:inline">• {match.stadium}</span>
                              )}
                            </span>
                          </div>

                          {/* Beautiful Rounded Capsule Row */}
                          <div 
                            className={`w-full flex items-center justify-between bg-white border rounded-full p-1.5 shadow-sm transition-all relative ${
                              isStarted 
                                ? "bg-neutral-100/80 border-neutral-200 opacity-80"
                                : isRowFilled 
                                  ? "border-amber-400 ring-1 ring-amber-400/40 shadow-md" 
                                  : "border-neutral-300 hover:border-neutral-400"
                            }`}
                          >
                            {/* Left team: Flag + Text */}
                            <div 
                              onClick={() => setSelectedTradingCardTeam(match.team1)}
                              className="w-[38%] flex items-center pl-2 space-x-1.5 overflow-hidden cursor-pointer hover:text-amber-600 active:scale-95 transition-all select-none group/team"
                              title={`Clique para ver a Figurinha de ${match.team1}`}
                            >
                              <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-neutral-50 border border-neutral-200 select-none shrink-0 shadow-xs group-hover/team:border-amber-500 group-hover/team:bg-amber-50 group-hover/team:scale-110 transition-transform">
                                <TeamFlag teamName={match.team1} className="w-full h-full object-cover" />
                              </div>
                              <span className={`text-[10px] sm:text-[11px] font-black tracking-tight text-[#032110] group-hover/team:text-amber-700 uppercase truncate ${isStarted ? "opacity-60 line-through" : ""}`} title={match.team1}>
                                {match.team1}
                              </span>
                            </div>

                            {/* Center Section: score pill */}
                            {isStarted ? (
                                <div className="flex flex-col items-center justify-center shrink-0 w-22 h-9 rounded-full bg-neutral-200/90 border border-neutral-300 shadow-inner select-none leading-none">
                                  <span className="text-[7px] text-red-600 font-extrabold uppercase tracking-wider animate-pulse leading-none mb-0.5">
                                    INICIADO
                                  </span>
                                  {(prediction.score1 !== "" && prediction.score2 !== "") ? (
                                    <span className="text-[11px] font-black text-neutral-800 tracking-wider">
                                      {prediction.score1}-{prediction.score2}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-neutral-500 font-mono">- x -</span>
                                  )}
                                </div>
                            ) : (
                              <div className="flex items-center justify-center space-x-0.5 shrink-0 bg-[#f5be18] hover:bg-[#e6b112] border border-[#dda710] rounded-full px-2 py-1 text-neutral-950 shadow-sm transition-colors w-22 h-9">
                                <input
                                  type="number"
                                  min="0"
                                  max="99"
                                  inputMode="numeric"
                                  placeholder="0"
                                  value={prediction.score1}
                                  onChange={(e) => handleScoreChange(match.id, 1, e.target.value)}
                                  className="w-6 h-6 bg-white/95 rounded-full text-center font-black text-xs text-[#032110] focus:outline-none focus:ring-2 focus:ring-[#92400e] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0"
                                />
                                <span className="text-[10px] font-black text-[#032110] select-none">-</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="99"
                                  inputMode="numeric"
                                  placeholder="0"
                                  value={prediction.score2}
                                  onChange={(e) => handleScoreChange(match.id, 2, e.target.value)}
                                  className="w-6 h-6 bg-white/95 rounded-full text-center font-black text-xs text-[#032110] focus:outline-none focus:ring-2 focus:ring-[#92400e] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0"
                                />
                              </div>
                            )}

                            {/* Right team: Text + Flag */}
                            <div 
                              onClick={() => setSelectedTradingCardTeam(match.team2)}
                              className="w-[38%] flex items-center pr-2 space-x-1.5 justify-end text-right overflow-hidden cursor-pointer hover:text-amber-600 active:scale-95 transition-all select-none group/team"
                              title={`Clique para ver a Figurinha de ${match.team2}`}
                            >
                              <span className={`text-[10px] sm:text-[11px] font-black tracking-tight text-[#032110] group-hover/team:text-amber-700 uppercase truncate ${isStarted ? "opacity-60 line-through" : ""}`} title={match.team2}>
                                {match.team2}
                              </span>
                              <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-neutral-50 border border-neutral-200 select-none shrink-0 shadow-xs group-hover/team:border-amber-500 group-hover/team:bg-amber-50 group-hover/team:scale-110 transition-transform">
                                <TeamFlag teamName={match.team2} className="w-full h-full object-cover" />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2.ª RODADA (Future matches containing teams of started ones) */}
                {secondRoundMatchesToShow.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-dashed border-neutral-400 mt-3 animate-fade-in">
                    <div className="sticky top-0 bg-[#faf6eb] py-1 pb-1.5 border-b-2 border-emerald-600 font-display font-extrabold text-[#143e24] flex items-center justify-between text-xs tracking-wider z-10 select-none uppercase">
                      <span>⚡ 2.ª RODADA (PRÓXIMOS JOGOS)</span>
                      <span className="text-[8px] bg-emerald-800 text-white px-1.5 py-0.5 rounded font-mono">LIBERADO</span>
                    </div>

                    <div className="space-y-4">
                      {secondRoundMatchesToShow.map((match, sIdx) => {
                        const prediction = predictions[match.id] || { score1: "", score2: "" };
                        const isRowFilled = prediction.score1 !== "" && prediction.score2 !== "";
                        const isStarted = isMatchStarted(match, simulatedDate);

                        return (
                          <div key={match.id} className="space-y-1">
                            {/* Match Header metadata */}
                            <div className="flex items-center justify-between text-[8px] text-neutral-500 px-2 font-mono">
                              <span className="font-bold text-emerald-800">
                                JOGO SEGUINTE #{String(sIdx + 1).padStart(2, "0")} ({match.group})
                              </span>
                              <span className="flex items-center space-x-1">
                                <span>{match.date} • {match.time} BR</span>
                                {match.stadium && (
                                  <span className="text-neutral-400 hidden sm:inline">• {match.stadium}</span>
                                )}
                              </span>
                            </div>

                            {/* Beautiful Rounded Capsule Row */}
                            <div 
                              className={`w-full flex items-center justify-between bg-white border rounded-full p-1.5 shadow-sm transition-all relative ${
                                isStarted 
                                  ? "bg-neutral-100/80 border-neutral-200 opacity-80"
                                  : isRowFilled 
                                    ? "border-amber-400 ring-1 ring-amber-400/40 shadow-md" 
                                    : "border-neutral-300 hover:border-neutral-400"
                              }`}
                            >
                              {/* Left team: Flag + Text */}
                              <div 
                                onClick={() => setSelectedTradingCardTeam(match.team1)}
                                className="w-[38%] flex items-center pl-2 space-x-1.5 overflow-hidden cursor-pointer hover:text-amber-600 active:scale-95 transition-all select-none group/team"
                                title={`Clique para ver a Figurinha de ${match.team1}`}
                              >
                                <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-neutral-50 border border-neutral-200 select-none shrink-0 shadow-xs group-hover/team:border-amber-500 group-hover/team:bg-amber-50 group-hover/team:scale-110 transition-transform">
                                  <TeamFlag teamName={match.team1} className="w-full h-full object-cover" />
                                </div>
                                <span className={`text-[10px] sm:text-[11px] font-black tracking-tight text-[#032110] group-hover/team:text-amber-700 uppercase truncate ${isStarted ? "opacity-60 line-through" : ""}`} title={match.team1}>
                                  {match.team1}
                                </span>
                              </div>

                              {/* Center Section: score pill */}
                              {isStarted ? (
                                <div className="flex flex-col items-center justify-center shrink-0 w-22 h-9 rounded-full bg-neutral-200/90 border border-neutral-300 shadow-inner select-none leading-none">
                                  <span className="text-[7px] text-red-600 font-extrabold uppercase tracking-wider animate-pulse leading-none mb-0.5">
                                    INICIADO
                                  </span>
                                  {(prediction.score1 !== "" && prediction.score2 !== "") ? (
                                    <span className="text-[11px] font-black text-neutral-800 tracking-wider">
                                      {prediction.score1}-{prediction.score2}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-neutral-500 font-mono">- x -</span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center space-x-0.5 shrink-0 bg-[#f5be18] hover:bg-[#e6b112] border border-[#dda710] rounded-full px-2 py-1 text-neutral-950 shadow-sm transition-colors w-22 h-9">
                                  <input
                                    type="number"
                                    min="0"
                                    max="99"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={prediction.score1}
                                    onChange={(e) => handleScoreChange(match.id, 1, e.target.value)}
                                    className="w-6 h-6 bg-white/95 rounded-full text-center font-black text-xs text-[#032110] focus:outline-none focus:ring-2 focus:ring-[#92400e] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0"
                                  />
                                  <span className="text-[10px] font-black text-[#032110] select-none">-</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max="99"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={prediction.score2}
                                    onChange={(e) => handleScoreChange(match.id, 2, e.target.value)}
                                    className="w-6 h-6 bg-white/95 rounded-full text-center font-black text-xs text-[#032110] focus:outline-none focus:ring-2 focus:ring-[#92400e] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0"
                                  />
                                </div>
                              )}

                              {/* Right team: Text + Flag */}
                              <div 
                                onClick={() => setSelectedTradingCardTeam(match.team2)}
                                className="w-[38%] flex items-center pr-2 space-x-1.5 justify-end text-right overflow-hidden cursor-pointer hover:text-amber-600 active:scale-95 transition-all select-none group/team"
                                title={`Clique para ver a Figurinha de ${match.team2}`}
                              >
                                <span className={`text-[10px] sm:text-[11px] font-black tracking-tight text-[#032110] group-hover/team:text-amber-700 uppercase truncate ${isStarted ? "opacity-60 line-through" : ""}`} title={match.team2}>
                                  {match.team2}
                                </span>
                                <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-neutral-50 border border-neutral-200 select-none shrink-0 shadow-xs group-hover/team:border-amber-500 group-hover/team:bg-amber-50 group-hover/team:scale-110 transition-transform">
                                  <TeamFlag teamName={match.team2} className="w-full h-full object-cover" />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Submission Button Section */}
              <div className="pt-3 border-t-2 border-dashed border-neutral-400 flex flex-col items-center space-y-3">
                {/* Limpar Bilhete centered and placed before Send */}
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="px-6 py-2 border border-neutral-400 text-[10px] font-bold text-neutral-600 hover:text-neutral-900 bg-[#dfdcd6]/50 hover:bg-[#dfdcd6]/80 rounded transition-colors uppercase flex items-center justify-center space-x-1.5 whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                  <span>Limpar Bilhete</span>
                </button>

                {validationError && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full bg-[#fdf2f2] border-l-4 border-[#e02424] text-[#9b1c1c] text-xs font-semibold py-2 px-3 rounded-r flex items-start space-x-2"
                  >
                    <span className="text-base shrink-0 leading-none mt-[1px]">⚠️</span>
                    <span className="leading-tight text-left">{validationError}</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  className="w-full flex items-center justify-center space-x-2 bg-[#143e24] hover:bg-[#1a4f2e] text-white py-3 px-4 font-display font-black uppercase text-sm tracking-widest border-2 border-neutral-900 shadow-[4px_4px_0px_#262626] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#262626] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[2px_2px_0px_#262626] cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>Enviar Palpites</span>
                </button>

                <div className="w-full text-[9px] text-neutral-500 mt-2 flex items-start bg-neutral-100/40 p-2 rounded border border-neutral-200/50">
                  <Info style={{ backgroundColor: '#d5cbcc', color: '#d31b08' }} className="h-3.5 w-3.5 shrink-0 mr-1.5 mt-0.5 rounded-sm p-[1px]" />
                  <span className="leading-tight text-left">Palpites gravados localmente para garantir exclusividade e gerar o bilhete de segurança antes de ir ao WhatsApp.</span>
                </div>
              </div>

            </form>
          </div>

          {/* Barcode and Foot Stamp */}
          <div className="mt-8 pt-4 border-t-2 border-dashed border-neutral-400 text-center">
            
            {/* Ink Stamp decorative */}
            <div className="mb-2">
              <span className="stamp border-neutral-800 text-neutral-800 text-[10px] tracking-widest px-2.5 py-0.5 bg-neutral-300/10">
                LOTO-REGISTO COPA-2026
              </span>
            </div>

            <Barcode serial={ticketCode} />

            <div className="text-[8px] text-neutral-500 tracking-wider uppercase">
              SISTEMA PALPITES PARA  • GRUPO DE PALPITEIROS COPA 2026 (ADM: BASILIO)
            </div>
            
            {registeredKeysHistory.length > 0 && (
              <div className="mt-3.5 text-[10px] text-neutral-600 border-t border-dashed border-neutral-300 pt-2 flex items-center justify-center space-x-1 opacity-80">
                <span>Este dispositivo já registou </span>
                <span className="font-bold text-emerald-800">{registeredKeysHistory.length}</span>
                <span>palpites únicos.</span>
              </div>
            )}
          </div>

        </div>

        {/* Teeth lower row decoration */}
        <div className="serrated-edge-bottom" />

      </main>

      {/* Persistent Footer with credit */}
      <footer className="relative z-10 text-center mt-6 text-[11px] text-emerald-200">
        <p>© 2026 Palpiteiros da Copa do Mundo. | Feito por Thiago Medeiros</p>
      </footer>

      {/* MODAL TRIGGER FOR ERROR MESSAGES (DUPLICADOS / REGRAS DE NEGÓCIO) */}
      <InfoModal
        isOpen={isErrorModalOpen}
        type="error"
        title={modalTitle}
        message={modalMsg}
        onClose={() => setIsErrorModalOpen(false)}
        primaryButtonText="Corrigir Dados de Bilhete"
      />

      {/* MODAL TRIGGER FOR SUCCESS ROUTE (SUCCESS FEEDBACK & MANUAL SEND FALLBACK FOR POPUP BLOCKERS) */}
      <InfoModal
        isOpen={isSuccessModalOpen}
        type="success"
        title={modalTitle}
        message={modalMsg}
        onClose={() => {
          setIsSuccessModalOpen(false);
          // Force fallback popup manually if user clicks understood
          window.open(whatsappDestinationUrl, "_blank", "noopener,noreferrer");
        }}
        primaryButtonText="Enviar no WhatsApp Manual"
        isRedirecting={isRedirecting}
      />

      {/* EASTER EGG RETRO MODAL FOR SURPRESINHA */}
      <AnimatePresence>
        {isSurpresinhaPromoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-md overflow-hidden bg-[#faf6eb] border-4 border-neutral-800 text-neutral-800 lotto-slip-container font-mono shadow-2xl"
            >
              {/* Ticket teeth header */}
              <div className="h-3 bg-[radial-gradient(circle,transparent_4px,#faf6eb_5px)] bg-[size:14px_24px] bg-bottom w-full bg-neutral-800" />

              <div className="p-6 flex flex-col items-center text-center">
                <div className="mb-4 text-[#143e24] flex flex-col items-center">
                  <div className="p-3 bg-emerald-100 rounded-full border-2 border-emerald-800 mb-2">
                    <Sparkles className="h-8 w-8 text-amber-500 animate-spin" />
                  </div>
                  <span className="stamp text-emerald-800 border-emerald-800 px-3 py-1 text-[10px] font-bold tracking-widest bg-emerald-50/50 mt-1 uppercase">
                    MÉTODO SECRETO ATIVO
                  </span>
                </div>

                <h3 className="text-lg font-bold uppercase tracking-wide text-neutral-900 font-display mt-2 leading-tight">
                  🎰 Surpresinha Secreta!
                </h3>

                <p className="mt-3 text-xs leading-relaxed text-neutral-600 font-serif italic max-w-xs">
                  Você limpou o bilhete 10 vezes seguidas! Deseja que o nosso algoritmo inteligente preencha automaticamente o seu bilhete com palpites realistas?
                </p>

                <div className="mt-6 w-full grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      handleSurpresinha();
                      setIsSurpresinhaPromoOpen(false);
                    }}
                    className="py-2.5 px-4 bg-[#143e24] hover:bg-[#1a4f2e] text-white border-2 border-neutral-800 font-mono font-black uppercase text-xs transition-all shadow-[2px_2px_0px_#262626] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#262626] cursor-pointer"
                  >
                    Sim! 🎲
                  </button>

                  <button
                    onClick={() => {
                      setIsSurpresinhaPromoOpen(false);
                    }}
                    className="py-2.5 px-4 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 border-2 border-neutral-400 font-mono font-bold uppercase text-xs transition-all shadow-[2px_2px_0px_#a3a3a3] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#a3a3a3] cursor-pointer"
                  >
                    Não 🧹
                  </button>
                </div>
              </div>

              {/* Ticket teeth footer */}
              <div className="h-3 bg-[radial-gradient(circle,transparent_4px,#faf6eb_5px)] bg-[size:14px_24px] bg-top w-full bg-neutral-800" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <TeamCardModal
        isOpen={selectedTradingCardTeam !== null}
        teamName={selectedTradingCardTeam || ""}
        onClose={() => setSelectedTradingCardTeam(null)}
      />

    </div>
  );
}
