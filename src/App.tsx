/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  X,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2
} from "lucide-react";

import { openFootballMockData, getTeamFlag, teamFlags, groupStageSecondRoundMatches, groupStageThirdRoundMatches } from "./data/mockSoccerData";
import { CompetitionData, UserPrediction, Match, BetSlipSubmission } from "./types";
import { formatWhatsAppMessage, generateTicketCode, sanitizeScore } from "./utils/whatsappFormatter";
import { loadOpenFootballDataFromURL, mergeCupFinalsIntoCompetitionData, mergeGoogleSheetCSVIntoCompetitionData } from "./utils/openFootballLoader";
import { validateOpenFootballDataFor2026 } from "./utils/fifaValidator";

import Barcode from "./components/Barcode";
import InfoModal from "./components/InfoModal";
import TeamCardModal from "./components/TeamCardModal";
import TeamFlag from "./components/TeamFlag";
import RecentSlips from "./components/RecentSlips";

const getGroupColors = (groupName: string) => {
  const cleanName = groupName.trim().toUpperCase();
  if (cleanName.includes("GRUPO A")) {
    return {
      border: "border-emerald-500/40",
      bg: "bg-emerald-50/20",
      text: "text-emerald-800",
      badge: "bg-emerald-100 text-emerald-800 border border-emerald-300",
      dot: "bg-emerald-500"
    };
  }
  if (cleanName.includes("GRUPO B")) {
    return {
      border: "border-rose-500/40",
      bg: "bg-rose-50/20",
      text: "text-rose-800",
      badge: "bg-rose-100 text-rose-800 border border-rose-300",
      dot: "bg-rose-500"
    };
  }
  if (cleanName.includes("GRUPO C")) {
    return {
      border: "border-amber-500/40",
      bg: "bg-amber-50/25",
      text: "text-amber-800",
      badge: "bg-amber-100 text-amber-800 border border-amber-300",
      dot: "bg-amber-500"
    };
  }
  if (cleanName.includes("GRUPO D")) {
    return {
      border: "border-blue-500/40",
      bg: "bg-blue-50/20",
      text: "text-blue-800",
      badge: "bg-blue-100 text-blue-800 border border-blue-300",
      dot: "bg-blue-500"
    };
  }
  if (cleanName.includes("GRUPO E")) {
    return {
      border: "border-purple-500/40",
      bg: "bg-purple-50/15",
      text: "text-purple-800",
      badge: "bg-purple-100 text-purple-800 border border-purple-300",
      dot: "bg-purple-500"
    };
  }
  if (cleanName.includes("GRUPO F")) {
    return {
      border: "border-orange-500/40",
      bg: "bg-orange-50/20",
      text: "text-orange-850",
      badge: "bg-orange-100 text-orange-800 border border-orange-300",
      dot: "bg-orange-500"
    };
  }
  if (cleanName.includes("GRUPO G")) {
    return {
      border: "border-teal-500/40",
      bg: "bg-teal-50/20",
      text: "text-teal-850",
      badge: "bg-teal-100 text-teal-850 border border-teal-300",
      dot: "bg-teal-500"
    };
  }
  if (cleanName.includes("GRUPO H")) {
    return {
      border: "border-indigo-500/40",
      bg: "bg-indigo-50/20",
      text: "text-indigo-800",
      badge: "bg-indigo-100 text-indigo-800 border border-indigo-300",
      dot: "bg-indigo-500"
    };
  }
  if (cleanName.includes("GRUPO I")) {
    return {
      border: "border-pink-500/40",
      bg: "bg-pink-50/15",
      text: "text-pink-800",
      badge: "bg-pink-100 text-pink-800 border border-pink-300",
      dot: "bg-pink-500"
    };
  }
  if (cleanName.includes("GRUPO J")) {
    return {
      border: "border-cyan-500/40",
      bg: "bg-cyan-50/20",
      text: "text-cyan-800",
      badge: "bg-cyan-100 text-cyan-800 border border-cyan-300",
      dot: "bg-cyan-500"
    };
  }
  if (cleanName.includes("GRUPO K")) {
    return {
      border: "border-fuchsia-500/40",
      bg: "bg-fuchsia-50/15",
      text: "text-fuchsia-800",
      badge: "bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-300",
      dot: "bg-fuchsia-500"
    };
  }
  if (cleanName.includes("GRUPO L")) {
    return {
      border: "border-lime-500/40",
      bg: "bg-lime-50/20",
      text: "text-lime-800",
      badge: "bg-lime-100 text-lime-800 border border-lime-300",
      dot: "bg-lime-500"
    };
  }
  return {
    border: "border-neutral-300/60",
    bg: "bg-neutral-50/10",
    text: "text-neutral-700",
    badge: "bg-neutral-100 text-neutral-800 border border-neutral-300",
    dot: "bg-neutral-400"
  };
};

const getDuePhaseIndex = (date: Date, matches: Match[]): number => {
  if (!matches || matches.length === 0) return 0;
  const phasesEndTimes: { index: number; maxTime: number; minTime: number }[] = [];
  
  for (let idx = 0; idx <= 7; idx++) {
    const pMatches = matches.filter(m => {
      const mStage = m.stage || "Fase de Grupos";
      if (idx === 0) {
        return mStage === "Fase de Grupos" && !m.id.includes("-2r") && !m.id.includes("-3r");
      }
      if (idx === 1) {
        return mStage === "Fase de Grupos" && m.id.includes("-2r");
      }
      if (idx === 2) {
        return mStage === "Fase de Grupos" && m.id.includes("-3r");
      }
      if (idx === 3) {
        return mStage === "16 de Final" || mStage.toLowerCase().includes("16") || mStage.includes("32") || mStage.toLowerCase().includes("dezesseis");
      }
      if (idx === 4) {
        return mStage === "Oitavas de Final" || mStage.toLowerCase().includes("oitav") || mStage.includes("1/8") || mStage.toLowerCase().includes("r16");
      }
      if (idx === 5) {
        return mStage === "Quartas de Final" || mStage.toLowerCase().includes("quartas") || mStage.includes("1/4") || mStage.toLowerCase().includes("quarter");
      }
      if (idx === 6) {
        return mStage === "Semifinais" || mStage.toLowerCase().includes("semi");
      }
      if (idx === 7) {
        return mStage === "Disputa de 3º Lugar" || mStage === "Final" || ["final", "3o lugar", "disputa de 3º lugar", "terceiro"].includes(mStage.toLowerCase());
      }
      return false;
    });

    if (pMatches.length > 0) {
      const times = pMatches.map(m => {
        return new Date(`${m.date}T${m.time}:00-03:00`).getTime();
      });
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times) + 2.5 * 60 * 60 * 1000; // 2.5 hours duration
      phasesEndTimes.push({ index: idx, minTime, maxTime });
    }
  }

  phasesEndTimes.sort((a, b) => a.index - b.index);
  const dateTime = date.getTime();

  for (const p of phasesEndTimes) {
    if (dateTime <= p.maxTime) {
      return p.index;
    }
  }
  return 7;
};

interface TeamStats {
  team: string;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export default function App() {
  // 1. Core State
  const [competitionData, setCompetitionData] = useState<CompetitionData>(() => {
    const raw = { ...openFootballMockData };
    const groupMatchesIds = new Set(raw.matches.map(m => m.id));
    const mergedMatches = [...raw.matches];
    groupStageSecondRoundMatches.forEach(m => {
      if (!groupMatchesIds.has(m.id)) {
        mergedMatches.push(m);
      }
    });
    groupStageThirdRoundMatches.forEach(m => {
      if (!groupMatchesIds.has(m.id)) {
        mergedMatches.push(m);
      }
    });
    raw.matches = mergedMatches;
    return raw;
  });
  
  const [selectedStageTab, setSelectedStageTab] = useState<string>("Fase de Grupos");
  const bracketContainerRef = useRef<HTMLDivElement>(null);

  // --- COPA 2026 DE SEQUENTIAL PHASES STATE ---
  const PHASES = [
    "1ª Rodada (Fase de Grupos)",
    "2ª Rodada (Fase de Grupos)",
    "3ª Rodada (Fase de Grupos)",
    "Dezesseis-avos de Final",
    "Oitavas de Final",
    "Quartas de Final",
    "Semifinais",
    "Disputa do 3º Lugar e Final"
  ];

  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("copa_selected_phase");
      if (saved !== null) {
        const idx = parseInt(saved, 10);
        if (idx >= 0 && idx <= 7) return idx;
      }
    } catch (err) {
      console.warn("Storage inacessível para fase inicial:", err);
    }
    
    // Default dynamic index based on loaded matches and simulated/real date
    try {
      const storedDateStr = localStorage.getItem("loto_simulated_date_brt");
      const d = storedDateStr ? new Date(storedDateStr) : new Date();
      const raw = { ...openFootballMockData };
      const groupMatchesIds = new Set(raw.matches.map(m => m.id));
      const mergedMatches = [...raw.matches];
      groupStageSecondRoundMatches.forEach(m => {
        if (!groupMatchesIds.has(m.id)) mergedMatches.push(m);
      });
      groupStageThirdRoundMatches.forEach(m => {
        if (!groupMatchesIds.has(m.id)) mergedMatches.push(m);
      });
      return getDuePhaseIndex(d, mergedMatches);
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("copa_selected_phase", String(currentPhaseIndex));
    } catch (err) {
      console.warn("Falha ao salvar copa_selected_phase:", err);
    }
  }, [currentPhaseIndex]);

  const handlePrevPhase = () => {
    setCurrentPhaseIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextPhase = () => {
    setCurrentPhaseIndex(prev => Math.min(7, prev + 1));
  };

  // Sync currentPhaseIndex selection with selectedStageTab for compatible rendering and scrolling
  useEffect(() => {
    if (currentPhaseIndex === 0 || currentPhaseIndex === 1 || currentPhaseIndex === 2) {
      setSelectedStageTab("Fase de Grupos");
    } else if (currentPhaseIndex === 3) {
      setSelectedStageTab("16 de Final");
    } else if (currentPhaseIndex === 4) {
      setSelectedStageTab("Oitavas de Final");
    } else if (currentPhaseIndex === 5) {
      setSelectedStageTab("Quartas de Final");
    } else if (currentPhaseIndex === 6) {
      setSelectedStageTab("Semifinais");
    } else if (currentPhaseIndex === 7) {
      setSelectedStageTab("Final");
    }
  }, [currentPhaseIndex]);

  // --- TRIAL/TEST MODE CONTROLLER ---
  const [showSimulator, setShowSimulator] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("loto_debug_active") === "true";
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  const [debugClicks, setDebugClicks] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  // Dynamic Simulated or Live current date in Brasília Time (UTC-3)
  const [simulatedDate, setSimulatedDate] = useState<Date>(() => {
    try {
      const stored = localStorage.getItem("loto_simulated_date_brt");
      if (stored) return new Date(stored);
    } catch (e) {
      // ignore
    }
    
    if (typeof window !== "undefined") {
      let isTestActive = false;
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

  const [customBrtInput, setCustomBrtInput] = useState<string>(() => {
    try {
      const year = simulatedDate.getFullYear();
      const month = String(simulatedDate.getMonth() + 1).padStart(2, "0");
      const day = String(simulatedDate.getDate()).padStart(2, "0");
      const hours = String(simulatedDate.getHours()).padStart(2, "0");
      const minutes = String(simulatedDate.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (e) {
      return "2026-06-11T16:00";
    }
  });

  useEffect(() => {
    try {
      const year = simulatedDate.getFullYear();
      const month = String(simulatedDate.getMonth() + 1).padStart(2, "0");
      const day = String(simulatedDate.getDate()).padStart(2, "0");
      const hours = String(simulatedDate.getHours()).padStart(2, "0");
      const minutes = String(simulatedDate.getMinutes()).padStart(2, "0");
      setCustomBrtInput(`${year}-${month}-${day}T${hours}:${minutes}`);
    } catch (e) {
      // silent
    }
  }, [simulatedDate]);

  // Ticking effect for real clock when not simulated/frozen
  useEffect(() => {
    let hasStoredOverride = false;
    try {
      hasStoredOverride = localStorage.getItem("loto_simulated_date_brt") !== null;
    } catch (e) {}
    
    if (!showSimulator && !hasStoredOverride) {
      const interval = setInterval(() => {
        const now = new Date();
        setSimulatedDate(now);
        
        let hasManualPhaseOverride = false;
        try {
          hasManualPhaseOverride = localStorage.getItem("copa_selected_phase") !== null;
        } catch (e) {}
        
        if (!hasManualPhaseOverride) {
          setCurrentPhaseIndex(getDuePhaseIndex(now, competitionData.matches));
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showSimulator, competitionData.matches]);

  const handleTrophyClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const nextClicks = debugClicks + 1;
    // Exactly 10 clicks to toggle simulator as requested
    if (nextClicks >= 10) {
      setDebugClicks(0);
      if (showSimulator) {
        // If it's already active, turning it off does not require password
        setShowSimulator(false);
        try {
          localStorage.removeItem("loto_debug_active");
          localStorage.removeItem("loto_simulated_date_brt");
        } catch (err) {
          console.warn("Storage inacessível:", err);
        }
      } else {
        // Turning ON requires password modal verification
        setPasswordValue("");
        setPasswordError(false);
        setShowPasswordModal(true);
      }
    } else {
      setDebugClicks(nextClicks);
    }
  };

  const handlePasswordSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passwordValue === "142536") {
      setShowPasswordModal(false);
      setShowSimulator(true);
      setPasswordError(false);
      try {
        localStorage.setItem("loto_debug_active", "true");
      } catch (err) {
        console.warn("Storage inacessível:", err);
      }
    } else {
      setPasswordError(true);
    }
  };

  // --- SYNC SWIPE CAROUSEL SCROLL POSITION WITH TAB SELECTION ---
  useEffect(() => {
    if (selectedStageTab !== "Fase de Grupos" && bracketContainerRef.current) {
      let targetColId = "";
      if (selectedStageTab === "16 de Final") targetColId = "col-16_avos";
      else if (selectedStageTab === "Oitavas de Final") targetColId = "col-oitavas";
      else if (selectedStageTab === "Quartas de Final") targetColId = "col-quartas";
      else if (selectedStageTab === "Semifinais") targetColId = "col-semis";
      else if (selectedStageTab === "Disputa de 3º Lugar") targetColId = "col-terceiro";
      else if (selectedStageTab === "Final") targetColId = "col-final";

      if (targetColId) {
        const targetElement = bracketContainerRef.current.querySelector(`#${targetColId}`);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center"
          });
        }
      }
    }
  }, [selectedStageTab]);

  const [fullName, setFullName] = useState("");
  const [predictions, setPredictions] = useState<Record<string, { score1: string; score2: string }>>({});
  const [ticketCode, setTicketCode] = useState("LOTO-INIT-26");

  const [recentSlips, setRecentSlips] = useState<BetSlipSubmission[]>(() => {
    try {
      const stored = localStorage.getItem("copa_betslips");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn("Storage inacessível:", e);
      return [];
    }
  });

  const handleRestoreSlip = (slip: BetSlipSubmission) => {
    setFullName(slip.fullName);
    
    const restoredPreds: Record<string, { score1: string; score2: string }> = {};
    slip.predictions.forEach(p => {
      const s1 = sanitizeScore(p.team1Score);
      const s2 = sanitizeScore(p.team2Score);
      restoredPreds[p.matchId] = {
        score1: s1 === "0" && p.team1Score !== 0 && p.team1Score !== "0" ? "" : s1,
        score2: s2 === "0" && p.team2Score !== 0 && p.team2Score !== "0" ? "" : s2
      };
    });
    
    setPredictions(prev => ({
      ...prev,
      ...restoredPreds
    }));
    
    if (slip.ticketCode) {
      setTicketCode(slip.ticketCode);
    }
    
    setTimeout(() => {
      const targetElement = document.getElementById("id-do-volante");
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" });
      } else {
        document.querySelector("form")?.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleResendRecentSlip = (slip: BetSlipSubmission) => {
    const mappedPredictions: UserPrediction[] = slip.predictions.map(p => {
      const s1 = sanitizeScore(p.team1Score);
      const s2 = sanitizeScore(p.team2Score);
      return {
        matchId: p.matchId,
        score1: s1,
        score2: s2
      };
    });

    const secondRoundMatchesToShow = groupStageSecondRoundMatches.filter((match) => {
      const pred = mappedPredictions.find(pr => pr.matchId === match.id);
      return pred && pred.score1 !== "" && pred.score2 !== "" && pred.score1 !== "0" && pred.score2 !== "0";
    });

    const activeStageName = selectedStageTab || "Fase de Grupos";
    
    const mainMatchesList: Match[] = [];
    slip.predictions.forEach(p => {
      const match = competitionData.matches.find(m => m.id === p.matchId);
      if (match) {
        mainMatchesList.push(match);
      } else {
        mainMatchesList.push({
          id: p.matchId,
          team1: p.team1Name,
          team2: p.team2Name,
          date: "2026-06-11",
          time: "16:00",
          stage: activeStageName
        });
      }
    });

    const slipDate = new Date(slip.submittedAt);
    const dd = String(slipDate.getDate()).padStart(2, '0');
    const mm = String(slipDate.getMonth() + 1).padStart(2, '0');
    const yyyy = slipDate.getFullYear();
    const formattedSlipDate = `${dd}/${mm}/${yyyy}`;

    const formattedMsg = formatWhatsAppMessage({
      fullName: slip.fullName,
      round: slip.phaseName || `${competitionData.round} [${activeStageName.toUpperCase()}]`,
      competition: competitionData.competition,
      matches: mainMatchesList.length > 0 ? mainMatchesList : activeMatches,
      predictions: mappedPredictions,
      emissionDate: formattedSlipDate,
      ticketCode: slip.ticketCode,
      secondRoundMatches: secondRoundMatchesToShow,
      simulatedDateStr: slip.submittedAt,
      groupPredictions,
      finalistPredictions,
      activeStage: activeStageName
    });

    const encodedText = encodeURIComponent(formattedMsg);
    const finalWhatsAppUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(finalWhatsAppUrl, "_blank", "noopener,noreferrer");
  };

  const hadSavedPrognosticos = useRef<boolean>(false);
  useEffect(() => {
    const groupsList = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
    let found = false;
    try {
      for (const g of groupsList) {
        if (localStorage.getItem(`grupo${g}_1o`) || localStorage.getItem(`grupo${g}_2o`)) {
          found = true;
          break;
        }
      }
      if (!found) {
        if (
          localStorage.getItem("finalista_1o") ||
          localStorage.getItem("finalista_2o") ||
          localStorage.getItem("finalista_3o") ||
          localStorage.getItem("finalista_4o")
        ) {
          found = true;
        }
      }
    } catch (err) {
      console.warn("Storage inacessível:", err);
    }
    hadSavedPrognosticos.current = found;
  }, []);

  // Prognósticos States initialized from localStorage as requested
  const [groupPredictions, setGroupPredictions] = useState<Record<string, { first: string; second: string }>>(() => {
    const initial: Record<string, { first: string; second: string }> = {};
    const groupsList = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
    groupsList.forEach(g => {
      let first = "";
      let second = "";
      try {
        first = localStorage.getItem(`grupo${g}_1o`) || "";
        second = localStorage.getItem(`grupo${g}_2o`) || "";
      } catch (err) {
        console.warn("Storage inacessível:", err);
      }
      initial[g] = { first, second };
    });
    return initial;
  });

  const [finalistPredictions, setFinalistPredictions] = useState<{ first: string; second: string; third: string; fourth: string }>(() => {
    let first = "";
    let second = "";
    let third = "";
    let fourth = "";
    try {
      first = localStorage.getItem("finalista_1o") || "";
      second = localStorage.getItem("finalista_2o") || "";
      third = localStorage.getItem("finalista_3o") || "";
      fourth = localStorage.getItem("finalista_4o") || "";
    } catch (err) {
      console.warn("Storage inacessível:", err);
    }
    return { first, second, third, fourth };
  });

  const handleGroupPredictionChange = (g: string, place: "first" | "second", val: string) => {
    setGroupPredictions(prev => {
      const groupConfig = { ...prev[g] };
      groupConfig[place] = val;
      
      // Auto-clear second place if it conflicts with first
      if (place === "first" && groupConfig.second === val) {
        groupConfig.second = "";
      }
      
      const updated = { ...prev, [g]: groupConfig };
      try {
        localStorage.setItem(`grupo${g}_1o`, updated[g].first);
        localStorage.setItem(`grupo${g}_2o`, updated[g].second);
      } catch (err) {
        console.warn("Falha ao salvar prognóstico:", err);
      }
      return updated;
    });
  };

  const handleFinalistPredictionChange = (place: "first" | "second" | "third" | "fourth", val: string) => {
    setFinalistPredictions(prev => {
      const updated = { ...prev, [place]: val };
      try {
        localStorage.setItem("finalista_1o", updated.first);
        localStorage.setItem("finalista_2o", updated.second);
        localStorage.setItem("finalista_3o", updated.third);
        localStorage.setItem("finalista_4o", updated.fourth);
      } catch (err) {
        console.warn("Falha ao salvar finalista:", err);
      }
      return updated;
    });
  };

  // 2. Integration / Settings State
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [zoomPan, setZoomPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!isLeaderboardModalOpen) {
      setZoomScale(1);
      setZoomPan({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [isLeaderboardModalOpen]);

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.3, 3.5));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => {
      const next = Math.max(prev - 0.3, 1);
      if (next === 1) {
        setZoomPan({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleZoomReset = () => {
    setZoomScale(1);
    setZoomPan({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (zoomScale <= 1) return; // Only allow panning when zoomed in
    isDraggingRef.current = true;
    setIsDragging(true);
    
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    
    dragStartRef.current = { x: clientX, y: clientY };
    panStartRef.current = { ...zoomPan };
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingRef.current || zoomScale <= 1) return;
    
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;

    setZoomPan({
      x: panStartRef.current.x + deltaX,
      y: panStartRef.current.y + deltaY
    });
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };
  const [customJsonUrl, setCustomJsonUrl] = useState("https://docs.google.com/spreadsheets/d/e/2PACX-1vRFOMgTg3z8yjd9-xqPx5Ks0LrqfSMiU1Ieona4IMT8Xv_mqiFMLytSdPjNNzhkH6qwuudJe56Wj6vt/pub?output=csv");
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [apiSuccessMsg, setApiSuccessMsg] = useState<string | null>(null);
  const [apiErrorMsg, setApiErrorMsg] = useState<string | null>(null);
  const [headerImageUrl, setHeaderImageUrl] = useState<string>(() => {
    try {
      const stored = localStorage.getItem("head_img_url");
      if (!stored || stored === "https://i.imgur.com/jI6EOx1.jpeg" || stored.trim() === "") {
        return "https://drive.google.com/file/d/1iZbVpV46lKJnNwiVhmkIMJEF0wjzVSQG/preview";
      }
      return stored;
    } catch (_) {
      return "https://drive.google.com/file/d/1iZbVpV46lKJnNwiVhmkIMJEF0wjzVSQG/preview";
    }
  });

  const getCleanIframeUrl = (input: string): string => {
    if (!input) return "";
    const trimmed = input.trim();
    if (trimmed.toLowerCase().includes("<iframe")) {
      const match = trimmed.match(/src=["']([^"']+)["']/i);
      if (match && match[1]) {
        return match[1];
      }
    }
    return trimmed;
  };

  const updateHeaderImageUrl = (url: string) => {
    setHeaderImageUrl(url);
    try {
      localStorage.setItem("head_img_url", url);
    } catch (_) {}
  };

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
  const [showConfirmMissingModal, setShowConfirmMissingModal] = useState(false);
  const [missingConfirmData, setMissingConfirmData] = useState<{ filled: number; missing: number } | null>(null);

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

    // Background loader to sync directly with the official Google Sheet CSV for real-time 2026 data
    const syncRealWorldCupData = async () => {
      try {
        const data = await loadOpenFootballDataFromURL("https://docs.google.com/spreadsheets/d/e/2PACX-1vRFOMgTg3z8yjd9-xqPx5Ks0LrqfSMiU1Ieona4IMT8Xv_mqiFMLytSdPjNNzhkH6qwuudJe56Wj6vt/pub?output=csv");
        if (data && data.isCsvGoogleSheet && data.csvContent) {
          setCompetitionData(current => mergeGoogleSheetCSVIntoCompetitionData(current, data.csvContent!));
          console.log("Sincronização em segundo plano via Google Sheet efetuada com sucesso!");
        } else if (data && data.isTxtCupFinals && data.txtContent) {
          setCompetitionData(current => mergeCupFinalsIntoCompetitionData(current, data.txtContent!));
          console.log("Sincronização em segundo plano via cup_finals.txt efetuada com sucesso!");
        } else if (data && data.matches && data.matches.length > 0) {
          setCompetitionData(data);
          console.log("Sincronização em segundo plano efetuada com sucesso!");
        }
      } catch (err) {
        // Safe silent fallback: we already have a robust, updated, high-fidelity offline-first template loaded.
        console.warn("Sincronização em segundo plano não disponível. Usando modelo local de alta fidelidade.");
      }
    };

    syncRealWorldCupData();
  }, []);

  // Update dynamic ticket code as predictions change
  useEffect(() => {
    const listPredictions: UserPrediction[] = Object.keys(predictions).map(id => ({
      matchId: id,
      score1: sanitizeScore(predictions[id]?.score1),
      score2: sanitizeScore(predictions[id]?.score2)
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

  // --- CLASSIFICAÇÃO DINÂMICA DE GRUPOS E MATA-MATA ---
  const resolvedMatches = useMemo(() => {
    if (!showSimulator) {
      // Normal/User mode: strictly obey loaded data from sheet.
      // Normalize any dynamic/placeholder name containing "A Definir" to exactly "A Definir"
      return competitionData.matches.map(m => {
        const isKnockout = m.stage !== "Fase de Grupos";
        return {
          ...m,
          team1: isKnockout && m.team1.includes("A Definir") ? "A Definir" : m.team1,
          team2: isKnockout && m.team2.includes("A Definir") ? "A Definir" : m.team2
        };
      });
    }

    const groupsList = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
    const groupsStandings: Record<string, TeamStats[]> = {};

    groupsList.forEach(letter => {
      const fullGroupName = `Grupo ${letter}`;
      
      const teamsSet = new Set<string>();
      competitionData.matches.forEach(m => {
        if ((m.stage || "Fase de Grupos") === "Fase de Grupos" && (m.group || "").trim().toLowerCase() === fullGroupName.trim().toLowerCase()) {
          if (m.team1) teamsSet.add(m.team1);
          if (m.team2) teamsSet.add(m.team2);
        }
      });
      const groupTeams = Array.from(teamsSet);

      const statsMap: Record<string, TeamStats> = {};
      groupTeams.forEach(t => {
        statsMap[t] = {
          team: t,
          points: 0,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0
        };
      });

      const groupMatches = competitionData.matches.filter(m => 
        (m.stage || "Fase de Grupos") === "Fase de Grupos" && 
        (m.group || "").trim().toLowerCase() === fullGroupName.trim().toLowerCase()
      );

      groupMatches.forEach(m => {
        const pred = predictions[m.id];
        const hasScore = pred && pred.score1 !== "" && pred.score2 !== "";
        if (hasScore && statsMap[m.team1] && statsMap[m.team2]) {
          const s1 = parseInt(pred.score1, 10);
          const s2 = parseInt(pred.score2, 10);
          
          statsMap[m.team1].played += 1;
          statsMap[m.team2].played += 1;
          statsMap[m.team1].goalsFor += s1;
          statsMap[m.team1].goalsAgainst += s2;
          statsMap[m.team2].goalsFor += s2;
          statsMap[m.team2].goalsAgainst += s1;
          statsMap[m.team1].goalDifference = statsMap[m.team1].goalsFor - statsMap[m.team1].goalsAgainst;
          statsMap[m.team2].goalDifference = statsMap[m.team2].goalsFor - statsMap[m.team2].goalsAgainst;

          if (s1 > s2) {
            statsMap[m.team1].points += 3;
            statsMap[m.team1].wins += 1;
            statsMap[m.team2].losses += 1;
          } else if (s2 > s1) {
            statsMap[m.team2].points += 3;
            statsMap[m.team2].wins += 1;
            statsMap[m.team1].losses += 1;
          } else {
            statsMap[m.team1].points += 1;
            statsMap[m.team2].points += 1;
            statsMap[m.team1].draws += 1;
            statsMap[m.team2].draws += 1;
          }
        }
      });

      const sortedStats = Object.values(statsMap).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.team.localeCompare(b.team);
      });

      groupsStandings[letter] = sortedStats;
    });

    const thirdsList: { letter: string; stats: TeamStats }[] = [];
    groupsList.forEach(letter => {
      const standings = groupsStandings[letter];
      if (standings && standings.length >= 3) {
        thirdsList.push({ letter, stats: standings[2] });
      }
    });

    thirdsList.sort((a, b) => {
      if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
      if (b.stats.goalDifference !== a.stats.goalDifference) return b.stats.goalDifference - a.stats.goalDifference;
      if (b.stats.goalsFor !== a.stats.goalsFor) return b.stats.goalsFor - a.stats.goalsFor;
      return a.stats.team.localeCompare(b.stats.team);
    });

    const bestThirdsQualified = thirdsList.slice(0, 8);

    const resolveTeamFromGroup = (rawName: string): string => {
      if (!rawName || !rawName.includes("A Definir")) return rawName;

      const firstMatch = rawName.match(/1º\s+Grupo\s+([A-L])/i);
      if (firstMatch) {
        const letter = firstMatch[1].toUpperCase();
        const groupFirst = groupsStandings[letter]?.[0];
        if (groupFirst && groupFirst.played > 0) {
          return groupFirst.team;
        }
        return rawName;
      }

      const secondMatch = rawName.match(/2º\s+Grupo\s+([A-L])/i);
      if (secondMatch) {
        const letter = secondMatch[1].toUpperCase();
        const groupSecond = groupsStandings[letter]?.[1];
        if (groupSecond && groupSecond.played > 0) {
          return groupSecond.team;
        }
        return rawName;
      }

      const thirdMatch = rawName.match(/3º\s+Grupo\s+([A-L\/]+)/i);
      if (thirdMatch) {
        const lettersStr = thirdMatch[1];
        const allowedLetters = lettersStr.split("/").map(l => l.toUpperCase().trim());
        
        const candidates = bestThirdsQualified.filter(cand => allowedLetters.includes(cand.letter) && cand.stats.played > 0);
        if (candidates.length > 0) {
          return candidates[0].stats.team;
        }

        const anyCand = thirdsList.filter(cand => allowedLetters.includes(cand.letter) && cand.stats.played > 0);
        if (anyCand.length > 0) {
          return anyCand[0].stats.team;
        }
      }

      return rawName;
    };

    const matchesCopy = competitionData.matches.map(m => ({ ...m }));

    matchesCopy.forEach(m => {
      const mStage = String(m.stage || "").toLowerCase();
      if (mStage === "16 de final" || mStage.includes("32") || mStage.includes("16 avos") || mStage.includes("dezesseis")) {
        m.team1 = resolveTeamFromGroup(m.team1);
        m.team2 = resolveTeamFromGroup(m.team2);
      }
    });

    const getWinnerOrPerdedor = (matchId: string, wantWinner: boolean): string => {
      const m = matchesCopy.find(x => x.id === matchId);
      if (!m) return "";
      if (m.team1.includes("A Definir") || m.team2.includes("A Definir")) return "";

      const pred = predictions[matchId];
      if (pred && pred.score1 !== "" && pred.score2 !== "") {
        const s1 = parseInt(pred.score1, 10);
        const s2 = parseInt(pred.score2, 10);
        if (s1 > s2) {
          return wantWinner ? m.team1 : m.team2;
        } else if (s2 > s1) {
          return wantWinner ? m.team2 : m.team1;
        } else {
          return wantWinner ? m.team1 : m.team2;
        }
      }
      return "";
    };

    const oitavasMapping: Record<string, [string, string]> = {
      "wc2026-o1": ["wc2026-r32-1", "wc2026-r32-2"],
      "wc2026-o2": ["wc2026-r32-3", "wc2026-r32-4"],
      "wc2026-o3": ["wc2026-r32-5", "wc2026-r32-6"],
      "wc2026-o4": ["wc2026-r32-7", "wc2026-r32-8"],
      "wc2026-o5": ["wc2026-r32-9", "wc2026-r32-10"],
      "wc2026-o6": ["wc2026-r32-11", "wc2026-r32-12"],
      "wc2026-o7": ["wc2026-r32-13", "wc2026-r32-14"],
      "wc2026-o8": ["wc2026-r32-15", "wc2026-r32-16"]
    };

    matchesCopy.forEach(m => {
      const deps = oitavasMapping[m.id];
      if (deps) {
        const t1 = getWinnerOrPerdedor(deps[0], true);
        const t2 = getWinnerOrPerdedor(deps[1], true);
        if (t1) m.team1 = t1;
        if (t2) m.team2 = t2;
      }
    });

    const quartasMapping: Record<string, [string, string]> = {
      "wc2026-q1": ["wc2026-o1", "wc2026-o2"],
      "wc2026-q2": ["wc2026-o3", "wc2026-o4"],
      "wc2026-q3": ["wc2026-o5", "wc2026-o6"],
      "wc2026-q4": ["wc2026-o7", "wc2026-o8"]
    };

    matchesCopy.forEach(m => {
      const deps = quartasMapping[m.id];
      if (deps) {
        const t1 = getWinnerOrPerdedor(deps[0], true);
        const t2 = getWinnerOrPerdedor(deps[1], true);
        if (t1) m.team1 = t1;
        if (t2) m.team2 = t2;
      }
    });

    const semisMapping: Record<string, [string, string]> = {
      "wc2026-s1": ["wc2026-q1", "wc2026-q2"],
      "wc2026-s2": ["wc2026-q3", "wc2026-q4"]
    };

    matchesCopy.forEach(m => {
      const deps = semisMapping[m.id];
      if (deps) {
        const t1 = getWinnerOrPerdedor(deps[0], true);
        const t2 = getWinnerOrPerdedor(deps[1], true);
        if (t1) m.team1 = t1;
        if (t2) m.team2 = t2;
      }
    });

    matchesCopy.forEach(m => {
      if (m.id === "wc2026-t3") {
        const t1 = getWinnerOrPerdedor("wc2026-s1", false);
        const t2 = getWinnerOrPerdedor("wc2026-s2", false);
        if (t1) m.team1 = t1;
        if (t2) m.team2 = t2;
      }
      if (m.id === "wc2026-f1") {
        const t1 = getWinnerOrPerdedor("wc2026-s1", true);
        const t2 = getWinnerOrPerdedor("wc2026-s2", true);
        if (t1) m.team1 = t1;
        if (t2) m.team2 = t2;
      }
    });

    return matchesCopy;
  }, [competitionData.matches, predictions, showSimulator]);

  const enrichedMatches = resolvedMatches;

  // Find all unique stages present in the matches, in a friendly order
  const allAvailableStages: string[] = Array.from(
    new Set(enrichedMatches.map(m => String(m.stage || "Fase de Grupos")))
  );
  
  // Sort stages
  const stagePriority = ["Fase de Grupos", "16 de Final", "Oitavas de Final", "Quartas de Final", "Semifinais", "Disputa de 3º Lugar", "Final"];
  allAvailableStages.sort((a: string, b: string) => {
    const idxA = stagePriority.indexOf(a);
    const idxB = stagePriority.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  const isMatchStarted = (match: any, now: Date = simulatedDate): boolean => {
    // 1st Round (Rodada 1) is permanently locked from now on
    const isFirstRound = (match.stage || "Fase de Grupos") === "Fase de Grupos" && !match.id.includes("-2r") && !match.id.includes("-3r");
    if (isFirstRound) {
      return true;
    }
    const matchTimeBRT = new Date(`${match.date}T${match.time}:00-03:00`);
    return now >= matchTimeBRT;
  };

  const isGlobalPredictionLocked = (): boolean => {
    const sorted = [...competitionData.matches].sort((a, b) => {
      const timeValA = new Date(`${a.date}T${a.time}:00-03:00`).getTime();
      const timeValB = new Date(`${b.date}T${b.time}:00-03:00`).getTime();
      return timeValA - timeValB;
    });
    if (sorted.length === 0) return false;
    const earliestMatch = sorted[0];
    const matchTimeBRT = new Date(`${earliestMatch.date}T${earliestMatch.time}:00-03:00`);
    const realNow = new Date();
    return realNow >= matchTimeBRT || simulatedDate >= matchTimeBRT;
  };

  const isGroupStageFinished = (): boolean => {
    const groupMatches = competitionData.matches.filter(m => (m.stage || "Fase de Grupos") === "Fase de Grupos");
    if (groupMatches.length === 0) return false;
    
    const sorted = [...groupMatches].sort((a, b) => {
      const timeValA = new Date(`${a.date}T${a.time}:00-03:00`).getTime();
      const timeValB = new Date(`${b.date}T${b.time}:00-03:00`).getTime();
      return timeValA - timeValB;
    });
    
    const latestGroupMatch = sorted[sorted.length - 1];
    const matchTimeBRT = new Date(`${latestGroupMatch.date}T${latestGroupMatch.time}:00-03:00`);
    const matchEndTimeBRT = new Date(matchTimeBRT.getTime() + 2 * 60 * 60 * 1000); // 2 hours
    const realNow = new Date();
    return realNow >= matchEndTimeBRT || simulatedDate >= matchEndTimeBRT;
  };

  // Reset selected tab to "Fase de Grupos" when group stage has not concluded
  useEffect(() => {
    if (!isGroupStageFinished() && selectedStageTab !== "Fase de Grupos") {
      setSelectedStageTab("Fase de Grupos");
    }
  }, [simulatedDate, selectedStageTab]);

  const isGroupPredictionLocked = (groupName: string): boolean => {
    return isGlobalPredictionLocked() || !isGroupStageClassificationVisible();
  };

  const isGroupStageClassificationVisible = (): boolean => {
    const limitDate = new Date("2026-06-11T16:00:00-03:00");
    const realNow = new Date();
    return simulatedDate < limitDate && realNow < limitDate;
  };

  const isFinalistsPrognosticsVisibleAndActive = (): boolean => {
    const startDate = new Date("2026-06-27T23:00:00-03:00");
    const endDate = new Date("2026-07-02T21:00:00-03:00");
    const realNow = new Date();
    
    const activeBySimulated = simulatedDate >= startDate && simulatedDate <= endDate;
    const activeByReal = realNow >= startDate && realNow <= endDate;
    
    return activeBySimulated || activeByReal;
  };

  const isFinalistsPredictionLocked = (): boolean => {
    return !isFinalistsPrognosticsVisibleAndActive();
  };

  const getGroupTeams = (fullGroupName: string): string[] => {
    const teamsSet = new Set<string>();
    competitionData.matches.forEach(m => {
      if ((m.group || "").trim().toLowerCase() === fullGroupName.trim().toLowerCase()) {
        if (m.team1) teamsSet.add(m.team1);
        if (m.team2) teamsSet.add(m.team2);
      }
    });
    return Array.from(teamsSet);
  };

  const getEliminatoriaTeams = (): string[] => {
    const teamsSet = new Set<string>();
    enrichedMatches.forEach(m => {
      const stage = String(m.stage || "").toLowerCase();
      if (stage === "16 de final" || stage === "round of 32") {
        if (m.team1 && !m.team1.includes("A Definir")) teamsSet.add(m.team1);
        if (m.team2 && !m.team2.includes("A Definir")) teamsSet.add(m.team2);
      }
    });

    // Se houver poucas equipes classificadas no mata-mata (por exemplo, antes ou durante a fase de grupos),
    // permitimos que o usuário palpite os finalistas escolhendo entre todas as 48 seleções da Copa do Mundo.
    if (teamsSet.size < 16) {
      return Object.keys(teamFlags).sort((a, b) => a.localeCompare(b));
    }

    return Array.from(teamsSet).sort((a, b) => a.localeCompare(b));
  };

  // Automatically manage timeline simulation predictions
  const handleSimulateTimeline = (targetDate: Date) => {
    setSimulatedDate(targetDate);
    setCurrentPhaseIndex(getDuePhaseIndex(targetDate, competitionData.matches));
    try {
      localStorage.setItem("loto_simulated_date_brt", targetDate.toISOString());
    } catch (e) {
      console.warn("Storage inacessível:", e);
    }

    const newPredictions = { ...predictions };
    
    // Clear future predictions (matches that have NOT started relative to targetDate)
    competitionData.matches.forEach(m => {
      const matchTimeBRT = new Date(`${m.date}T${m.time}:00-03:00`);
      if (matchTimeBRT > targetDate) {
        delete newPredictions[m.id];
      }
    });

    // Fill past matches predictions beautifully for simulation testing
    const sortedMatches = [...competitionData.matches].sort((a, b) => {
      const ta = new Date(`${a.date}T${a.time}:00-03:00`).getTime();
      const tb = new Date(`${b.date}T${b.time}:00-03:00`).getTime();
      return ta - tb;
    });

    sortedMatches.forEach(m => {
      const matchTimeBRT = new Date(`${m.date}T${m.time}:00-03:00`);
      if (targetDate >= matchTimeBRT) {
        if (!newPredictions[m.id] || newPredictions[m.id].score1 === "" || newPredictions[m.id].score2 === "") {
          const tieAllowed = m.stage === "Fase de Grupos";
          let s1 = 0;
          let s2 = 0;
          if (tieAllowed) {
            const rand = Math.random();
            if (rand < 0.25) { s1 = 1; s2 = 1; }
            else if (rand < 0.5) { s1 = 0; s2 = 0; }
            else if (rand < 0.75) { s1 = 2; s2 = 1; }
            else { s1 = 1; s2 = 2; }
          } else {
            s1 = Math.floor(Math.random() * 3) + 1;
            s2 = Math.floor(Math.random() * 3);
            if (s1 === s2) s1 += 1;
          }
          newPredictions[m.id] = {
            score1: String(s1),
            score2: String(s2)
          };
        }
      }
    });

    setPredictions(newPredictions);
  };

  const handleApplyCustomTime = (dateTimeString: string) => {
    if (!dateTimeString) return;
    const parsedDate = new Date(`${dateTimeString}:00-03:00`);
    if (!isNaN(parsedDate.getTime())) {
      handleSimulateTimeline(parsedDate);
    }
  };

  // Filter matches of the active stage based sequentially on currentPhaseIndex
  const activeMatches = enrichedMatches.filter(m => {
    const mStage = m.stage || "Fase de Grupos";
    
    if (currentPhaseIndex === 0) {
      // 1ª Rodada (Fase de Grupos)
      return mStage === "Fase de Grupos" && !m.id.includes("-2r") && !m.id.includes("-3r");
    }
    if (currentPhaseIndex === 1) {
      // 2ª Rodada (Fase de Grupos)
      return mStage === "Fase de Grupos" && m.id.includes("-2r");
    }
    if (currentPhaseIndex === 2) {
      // 3ª Rodada (Fase de Grupos)
      return mStage === "Fase de Grupos" && m.id.includes("-3r");
    }
    if (currentPhaseIndex === 3) {
      // Dezesseis-avos de Final
      return mStage === "16 de Final" || mStage.toLowerCase().includes("16") || mStage.includes("32") || mStage.toLowerCase().includes("dezesseis");
    }
    if (currentPhaseIndex === 4) {
      // Oitavas de Final
      return mStage === "Oitavas de Final" || mStage.toLowerCase().includes("oitav") || mStage.includes("1/8") || mStage.toLowerCase().includes("r16");
    }
    if (currentPhaseIndex === 5) {
      // Quartas de Final
      return mStage === "Quartas de Final" || mStage.toLowerCase().includes("quartas") || mStage.includes("1/4") || mStage.toLowerCase().includes("quarter");
    }
    if (currentPhaseIndex === 6) {
      // Semifinais
      return mStage === "Semifinais" || mStage.toLowerCase().includes("semi");
    }
    if (currentPhaseIndex === 7) {
      // Disputa do 3º Lugar e Final
      return mStage === "Disputa de 3º Lugar" || mStage === "Final" || ["final", "3o lugar", "disputa de 3º lugar", "terceiro"].includes(mStage.toLowerCase());
    }
    return false;
  });

  // Previews are now completely deactivated
  const secondRoundMatchesToShow: Match[] = [];

  // Pre-fill fields or trigger random results "Surpresinha" for active matches
  const handleSurpresinha = () => {
    const newPredictions = { ...predictions };
    activeMatches.forEach(match => {
      if (isMatchStarted(match)) return; // Skip started matches

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
    activeMatches.forEach(m => {
      if (!isMatchStarted(m)) {
        delete newPredictions[m.id];
      }
    });
    setPredictions(newPredictions);
    setApiErrorMsg(null);
    setApiSuccessMsg(null);
    setValidationError(null);
  };

  const getCleanPrediction = (matchId: string) => {
    const rawPred = predictions[matchId];
    const s1 = rawPred?.score1 !== undefined && rawPred.score1 !== null ? String(rawPred.score1).trim() : "";
    const s2 = rawPred?.score2 !== undefined && rawPred.score2 !== null ? String(rawPred.score2).trim() : "";
    const cleanS1 = s1.toLowerCase() === "undefined" || s1.toLowerCase() === "null" ? "" : s1;
    const cleanS2 = s2.toLowerCase() === "undefined" || s2.toLowerCase() === "null" ? "" : s2;
    return { score1: cleanS1, score2: cleanS2 };
  };

  // Handle manual input of score lines
  const handleScoreChange = (matchId: string, teamNum: 1 | 2, value: string) => {
    // Keep it restricted to a single digit (0-9)
    const cleaned = value.replace(/\D/g, "");
    const cleanVal = cleaned.substring(0, 1);
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
  const executeSubmission = (onlyFilled: boolean) => {
    setValidationError(null);

    // Combine predictions for active round and second round (optional previews are only sent if predicted!)
    const listPredictions: UserPrediction[] = [];

    activeMatches.forEach(m => {
      const pred = predictions[m.id];
      const isClosed = isMatchStarted(m);
      if (isClosed) {
        listPredictions.push({
          matchId: m.id,
          score1: sanitizeScore(pred?.score1),
          score2: sanitizeScore(pred?.score2)
        });
      } else {
        const score1 = pred?.score1 !== undefined ? String(pred.score1).trim() : "";
        const score2 = pred?.score2 !== undefined ? String(pred.score2).trim() : "";
        const cleanS1 = score1.toLowerCase() === "undefined" || score1.toLowerCase() === "null" ? "" : score1;
        const cleanS2 = score2.toLowerCase() === "undefined" || score2.toLowerCase() === "null" ? "" : score2;
        const hasPred = cleanS1 !== "" && cleanS2 !== "";

        if (hasPred) {
          listPredictions.push({
            matchId: m.id,
            score1: cleanS1,
            score2: cleanS2
          });
        } else if (!onlyFilled) {
          listPredictions.push({
            matchId: m.id,
            score1: cleanS1 !== "" ? cleanS1 : "0",
            score2: cleanS2 !== "" ? cleanS2 : "0"
          });
        }
      }
    });

    secondRoundMatchesToShow
      .filter(m => {
        const pred = predictions[m.id];
        if (!pred) return false;
        const s1 = pred.score1 !== undefined ? String(pred.score1).trim() : "";
        const s2 = pred.score2 !== undefined ? String(pred.score2).trim() : "";
        return s1 !== "" && s2 !== "" && s1.toLowerCase() !== "undefined" && s2.toLowerCase() !== "undefined";
      })
      .forEach(m => {
        const pred = predictions[m.id]!;
        listPredictions.push({
          matchId: m.id,
          score1: sanitizeScore(pred.score1),
          score2: sanitizeScore(pred.score2)
        });
      });

    // Determine matches that are actually going to be shown in the WhatsApp message text
    const matchesToSend = activeMatches.filter(m => {
      const isClosed = isMatchStarted(m);
      if (isClosed) return true;
      const pred = predictions[m.id];
      if (!pred) return !onlyFilled;
      const s1 = pred.score1 !== undefined ? String(pred.score1).trim() : "";
      const s2 = pred.score2 !== undefined ? String(pred.score2).trim() : "";
      const hasPred = s1 !== "" && s2 !== "" && s1.toLowerCase() !== "undefined" && s2.toLowerCase() !== "undefined";
      if (onlyFilled) {
        return hasPred;
      }
      return true;
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

      // Save structured slip into recentSlips and "copa_betslips" in localStorage
      const structuredPredictions = listPredictions.map(p => {
        const match = competitionData.matches.find(m => m.id === p.matchId);
        return {
          matchId: p.matchId,
          team1Score: p.score1,
          team2Score: p.score2,
          team1Name: match ? match.team1 : "Equipa A",
          team2Name: match ? match.team2 : "Equipa B"
        };
      });

      const slipSubmission: BetSlipSubmission = {
        ticketCode,
        fullName,
        submittedAt: new Date().toISOString(),
        predictions: structuredPredictions,
        phaseName: PHASES[currentPhaseIndex]
      };

      const updatedSlips = [slipSubmission, ...recentSlips].slice(0, 3);
      setRecentSlips(updatedSlips);
      localStorage.setItem("copa_betslips", JSON.stringify(updatedSlips));
    } catch (saveErr) {
      console.error("Não foi possível salvar na cache do telemóvel:", saveErr);
    }

    // Build the beautiful Pre-formatted WhatsApp text payload with second round support
    const formattedMsg = formatWhatsAppMessage({
      fullName,
      round: PHASES[currentPhaseIndex],
      competition: competitionData.competition,
      matches: activeMatches,
      predictions: listPredictions,
      emissionDate,
      ticketCode,
      secondRoundMatches: secondRoundMatchesToShow,
      simulatedDateStr: new Date().toISOString(),
      groupPredictions,
      finalistPredictions,
      activeStage: selectedStageTab
    });

    const encodedText = encodeURIComponent(formattedMsg);
    // WhatsApp redirect link WITHOUT hardcoded phone parameter, forces user selection list!
    const finalWhatsAppUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    setWhatsappDestinationUrl(finalWhatsAppUrl);

    // Open directly in a new window/tab without ever modifying current window location inside the iframe
    window.open(finalWhatsAppUrl, "_blank", "noopener,noreferrer");
  };

  const handleEnviarPalpites = (e: React.FormEvent) => {
    e.preventDefault();

    // Verification 1: Mandatory fields Check
    if (!fullName.trim()) {
      setValidationError("Por favor, preencha o seu Nome Completo para assinar o bilhete.");
      return;
    }

    // REGRA 1: PROGNÓSTICOS (Grupos A-L + 4 Finalistas)
    const isLocked = isGlobalPredictionLocked();
    if (!hadSavedPrognosticos.current) {
      const groupsList = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
      const missingGroups = (!isLocked && isGroupStageClassificationVisible()) ? groupsList.filter(g => !groupPredictions[g]?.first || !groupPredictions[g]?.second) : [];
      const missingFinalists = isFinalistsPrognosticsVisibleAndActive()
        ? (!finalistPredictions.first || !finalistPredictions.second || !finalistPredictions.third || !finalistPredictions.fourth)
        : false;

      if (missingGroups.length > 0 || missingFinalists) {
        if (missingGroups.length > 0) {
          setValidationError("Como este é seu primeiro acesso, você deve preencher o 1º e 2º de todos os grupos A-L nos prognósticos obrigatórios antes de gerar o bilhete.");
        } else {
          setValidationError("Você deve preencher os 4 Finalistas obrigatórios nos prognósticos antes de gerar o bilhete.");
        }
        return;
      }
    }

    // Checking if all matches that are NOT started have predictions
    const editableMatches = activeMatches.filter(m => !isMatchStarted(m));

    const missingPreds = editableMatches.filter(match => {
      const pred = getCleanPrediction(match.id);
      return pred.score1 === "" || pred.score2 === "";
    });

    if (missingPreds.length > 0) {
      if (missingPreds.length === editableMatches.length) {
        setValidationError("Por favor, preencha pelo menos 1 palpite nesta rodada antes de enviar.");
        return;
      }
      
      const filledCount = editableMatches.length - missingPreds.length;
      setMissingConfirmData({ filled: filledCount, missing: missingPreds.length });
      setShowConfirmMissingModal(true);
      return;
    }

    executeSubmission(false);
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
      
      if (data.isCsvGoogleSheet) {
        setCompetitionData(current => {
          const merged = mergeGoogleSheetCSVIntoCompetitionData(current, data.csvContent!);
          setApiSuccessMsg("Sucesso! As equipes classificadas da planilha Google Sheet (CSV) foram mescladas com os seus palpites de forma dinâmica!");
          return merged;
        });
      } else if (data.isTxtCupFinals) {
        setCompetitionData(current => {
          const merged = mergeCupFinalsIntoCompetitionData(current, data.txtContent!);
          setApiSuccessMsg("Sucesso! As equipes classificadas nos jogos das eliminatórias de cup_finals.txt foram mescladas com os seus palpites de forma dinâmica!");
          return merged;
        });
      } else {
        // Perform FIFA 2026 validation check on the loaded JSON file
        const report = validateOpenFootballDataFor2026(data);
        if (!report.isFullyCompliant) {
          const warnings = report.checks
            .filter(c => c.status === "warning")
            .map(c => `• ${c.message}`)
            .join("\n");
          alert(`⚠️ Alerta de Incompatibilidade FIFA 2026:\n\n${warnings}\n\nPor favor, certifique-se de que os dados carregados estão com a estrutura correta.`);
          setApiErrorMsg(`Incompatibilidade FIFA 2026: ${report.summary}`);
        } else {
          setApiSuccessMsg(`Sucesso! Carregado: "${data.competition}" - "${data.round}" com ${data.matches.length} partidas. Todos os critérios FIFA 2026 estão conformes!`);
        }

        setCompetitionData(data);
        // Clean previous predictions to accommodate new teams
        setPredictions({});
      }
    } catch (err: any) {
      setApiErrorMsg(`Falha ao ler dados do link: ${err.message || err}`);
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
          title="Clique 10 vezes para ativar/desativar o painel de testes"
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
        
        {/* Subtly Elegant Clock & Live Real-Time Timekeeper */}
        {showSimulator && (
          <div 
            className="w-full bg-neutral-900/85 border border-emerald-700/60 rounded-lg p-3 backdrop-blur-xs text-xs mb-3 shadow-xl select-none"
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
            <div className="border-t border-emerald-800/40 pt-2.5 mt-2.5" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-amber-300 font-bold text-[9px] uppercase tracking-wider block">
                    ⏱️ SIMULADOR DE DATA/HORA DA COPA 2026:
                  </span>
                  
                  {/* Input DateTime-Local e Botão Aplicar */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <input
                      type="datetime-local"
                      value={customBrtInput}
                      onChange={(e) => setCustomBrtInput(e.target.value)}
                      className="bg-neutral-800 text-emerald-200 border border-emerald-700/60 rounded px-1.5 py-0.5 text-[9px] font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 h-6 shrink-0"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCustomTime(customBrtInput)}
                      className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-neutral-950 font-black px-2 py-0.5 rounded text-[8px] tracking-wider uppercase cursor-pointer h-6 transition-all"
                      title="Aplicar data e hora customizados para teste futuro"
                    >
                      Aplicar 🚀
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 items-center justify-start text-[8px]">
                  {/* Presets de data rápidos */}
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date("2026-06-11T12:00:00-03:00");
                      handleSimulateTimeline(d);
                    }}
                    className="px-1.5 py-0.5 rounded border transition-colors cursor-pointer bg-[#143e24]/60 text-emerald-200 border-emerald-800/80 hover:bg-[#143e24] active:scale-95"
                    title="Fase de Grupos (Abertura da Copa)"
                  >
                    ⚽ Abertura (11/Jun)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date("2026-06-28T12:00:00-03:00");
                      handleSimulateTimeline(d);
                    }}
                    className="px-1.5 py-0.5 rounded border transition-colors cursor-pointer bg-[#143e24]/60 text-emerald-200 border-emerald-800/80 hover:bg-[#143e24] active:scale-95"
                    title="Conclusão da Fase de Grupos / Início do Mata-Mata (16 de Final)"
                  >
                    ⚡ Mata-Mata (28/Jun)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date("2026-07-19T12:00:00-03:00");
                      handleSimulateTimeline(d);
                    }}
                    className="px-1.5 py-0.5 rounded border transition-colors cursor-pointer bg-[#143e24]/60 text-emerald-250 border-emerald-800/80 hover:bg-[#143e24] active:scale-95"
                    title="O grande dia da Final do Mundial"
                  >
                    🏆 Grande Final (19/Jul)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      try {
                        localStorage.removeItem("loto_simulated_date_brt");
                        localStorage.removeItem("loto_debug_active");
                        localStorage.removeItem("copa_selected_phase");
                      } catch (e) {}
                      setShowSimulator(false);
                      const realNow = new Date();
                      setSimulatedDate(realNow);
                      setCurrentPhaseIndex(getDuePhaseIndex(realNow, competitionData.matches));
                    }}
                    className="px-2 py-0.5 rounded border bg-red-900/60 text-red-100 border-red-800/80 hover:bg-red-950/85 transition-colors ml-auto cursor-pointer font-bold active:scale-95"
                    title="Restaurar relógio para o tempo real"
                  >
                    Restaurar Tempo Real ⏰
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* Clean Google Sheet / CSV Sync bar */}
          <div className="mt-2.5 pt-2 border-t border-emerald-800/40 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-neutral-400 font-bold text-[9px] uppercase">
                Sincronizar Classificados:
              </span>
              <button
                type="button"
                id="sync-api-button"
                disabled={isFetchingUrl}
                onClick={async (e) => {
                  e.preventDefault();
                  setIsFetchingUrl(true);
                  setApiErrorMsg(null);
                  setApiSuccessMsg(null);
                  try {
                    const data = await loadOpenFootballDataFromURL(customJsonUrl.trim());
                    if (data.isCsvGoogleSheet) {
                      setCompetitionData(current => {
                        const merged = mergeGoogleSheetCSVIntoCompetitionData(current, data.csvContent!);
                        setApiSuccessMsg("Sincronizado! As equipes classificadas da planilha Google Sheet foram mescladas com sucesso!");
                        return merged;
                      });
                    } else if (data.isTxtCupFinals) {
                      setCompetitionData(current => {
                        const merged = mergeCupFinalsIntoCompetitionData(current, data.txtContent!);
                        setApiSuccessMsg("Sincronizado! As equipes classificadas de cup_finals.txt foram mescladas com sucesso!");
                        return merged;
                      });
                    } else {
                      const report = validateOpenFootballDataFor2026(data);
                      if (!report.isFullyCompliant) {
                        const warnings = report.checks
                          .filter(c => c.status === "warning")
                          .map(c => `• ${c.message}`)
                          .join("\n");
                        alert(`⚠️ Alerta de Incompatibilidade FIFA 2026:\n\n${warnings}\n\nPor favor, garanta que os dados importados estão corretos.`);
                        setApiErrorMsg(`Incompatibilidade FIFA 2026: ${report.summary}`);
                      } else {
                        setApiSuccessMsg(`Sincronizado! "${data.competition}" configurada.`);
                      }
                      setCompetitionData(data);
                      setPredictions({});
                    }
                  } catch (err: any) {
                    setApiErrorMsg(`Erro de rede / CORS: '${err.message || err}'`);
                  } finally {
                    setIsFetchingUrl(false);
                  }
                }}
                className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 border border-amber-500 font-bold font-mono text-[8.5px] text-white cursor-pointer active:scale-95 transition-all text-right shrink-0 hover:text-white"
              >
                {isFetchingUrl ? "🔄 Sincronizando..." : "🔄 Atualizar via Planilha Google"}
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[8px] text-neutral-400 font-medium">Link de Publicação da Planilha Google (CSV):</label>
              <input
                type="text"
                value={customJsonUrl}
                onChange={(e) => setCustomJsonUrl(e.target.value)}
                placeholder="Cole o link CSV publicado do Google Sheets..."
                className="w-full bg-[#13301c] border border-emerald-900/60 rounded px-1.5 py-0.5 text-[8.5px] font-mono text-emerald-100 placeholder-emerald-800/80 focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1 pt-1.5">
              <label className="text-[8px] text-neutral-400 font-medium font-mono uppercase tracking-wider">Link ou Código HTML do Iframe da Classificação:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={headerImageUrl}
                  onChange={(e) => updateHeaderImageUrl(e.target.value)}
                  placeholder="Cole a URL ou código iframe do seu arquivo do Google Drive..."
                  className="flex-1 bg-[#13301c] border border-emerald-900/60 rounded px-1.5 py-0.5 text-[8.5px] font-mono text-emerald-100 placeholder-emerald-800/80 focus:outline-none focus:border-amber-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => updateHeaderImageUrl("https://drive.google.com/file/d/1iZbVpV46lKJnNwiVhmkIMJEF0wjzVSQG/preview")}
                  className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 hover:text-white border border-amber-500 font-bold font-mono text-[7.5px] text-white cursor-pointer active:scale-95 transition-all text-center shrink-0"
                  title="Restaurar o link padrão do Google Drive"
                >
                  Padrão 🔄
                </button>
              </div>
            </div>
          </div>
          
          {(apiErrorMsg || apiSuccessMsg) && (
            <div className={`mt-2 text-[8px] leading-relaxed p-1.5 rounded border ${
              apiErrorMsg ? "text-red-400 bg-red-950/20 border-red-900/40" : "text-emerald-400 bg-emerald-950/20 border-emerald-900/40"
            }`}>
              {apiErrorMsg && <p>{apiErrorMsg}</p>}
              {apiSuccessMsg && <p>{apiSuccessMsg}</p>}
            </div>
          )}
        </div>
      )}

        {/* 🎖️ SELETOR DE FASES PÚBLICO */}
        <div className="w-full bg-[#11321d] border border-emerald-700/50 rounded-xl p-3 shadow-lg select-none mb-3">
          <span className="text-[#ebdcb9] font-mono font-bold text-[10px] block mb-2 uppercase tracking-widest text-center">
            ⚽ SELECIONE A RODADA OU FASE:
          </span>
          <div className="flex items-center justify-between gap-2 bg-[#faf6eb] p-2 border-2 border-neutral-800 rounded-md text-neutral-900">
            {/* Botão Anterior */}
            <button
              type="button"
              id="btn-prev-phase-public"
              onClick={handlePrevPhase}
              disabled={currentPhaseIndex <= 0}
              className={`px-3 py-1.5 font-mono font-bold uppercase text-[9px] border-2 border-neutral-900 shadow-[2px_2px_0px_#171717] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#171717] ${
                currentPhaseIndex <= 0
                  ? "bg-neutral-200 text-neutral-400 border-neutral-300 shadow-none cursor-not-allowed"
                  : "bg-amber-400 hover:bg-amber-500 text-neutral-900 cursor-pointer"
              }`}
            >
              ◀ Anterior
            </button>

            {/* Dropdown Seletor Central */}
            <div className="flex-1 min-w-0">
              <select
                id="phase-dropdown-select-public"
                value={currentPhaseIndex}
                onChange={(e) => setCurrentPhaseIndex(parseInt(e.target.value, 10))}
                className="w-full text-center bg-[#faf6eb] border-2 border-neutral-900 py-1 px-1 font-mono font-black text-xs text-neutral-900 uppercase tracking-tight focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer rounded-none text-center"
              >
                {PHASES.map((phase, idx) => (
                  <option key={idx} value={idx} className="bg-neutral-100 text-neutral-900 font-mono text-xs">
                    {phase}
                  </option>
                ))}
              </select>
            </div>

            {/* Botão Próximo */}
            <button
              type="button"
              id="btn-next-phase-public"
              onClick={handleNextPhase}
              disabled={currentPhaseIndex >= 7}
              className={`px-3 py-1.5 font-mono font-bold uppercase text-[9px] border-2 border-neutral-900 shadow-[2px_2px_0px_#171717] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#171717] ${
                currentPhaseIndex >= 7
                  ? "bg-neutral-200 text-neutral-400 border-neutral-300 shadow-none cursor-not-allowed"
                  : "bg-amber-400 hover:bg-amber-500 text-neutral-900 cursor-pointer"
              }`}
            >
              Próxima ▶
            </button>
          </div>
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

            {headerImageUrl && (
              <div className="mt-3.5 mx-auto w-full px-1 flex justify-center animate-fade-in">
                <button
                  type="button"
                  onClick={() => setIsLeaderboardModalOpen(true)}
                  className="w-full min-h-[48px] px-4 py-3 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-600 hover:to-amber-600 text-neutral-950 rounded-lg shadow-md hover:shadow-lg border-2 border-amber-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all"
                >
                  <Trophy className="h-5 w-5 text-neutral-950 animate-bounce" />
                  <span>Classificação dos Palpiteiros</span>
                  <Sparkles className="h-4 w-4 text-neutral-950 animate-pulse" />
                </button>
              </div>
            )}

            {/* Form layout */}
            <form onSubmit={handleEnviarPalpites} id="id-do-volante" className="mt-5 space-y-4">
              
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

                {/* 🏆 FINALISTAS DA COPA 2026 */}
                {isFinalistsPrognosticsVisibleAndActive() && (
                  <div className="bg-[#FFFDE7] border-2 border-[#FFD700] rounded-2xl p-4 shadow-md space-y-3.5 text-neutral-900 border-dashed animate-fade-in max-w-xl mx-auto my-2">
                    <div className="flex items-center space-x-2 pb-1.5 border-b border-amber-200">
                      <span className="text-lg">🏆</span>
                      <h3 className="font-display font-extrabold text-[#143e24] text-xs tracking-wider uppercase">
                        Finalistas da Copa 2026
                      </h3>
                    </div>

                    <p className="text-[10px] text-neutral-600 font-medium">
                      Selecione as quatro melhores equipes em ordem exata antes do pontapé inicial do mata-mata!
                    </p>

                    <div className="space-y-3">
                      {/* 1º Colocado */}
                      <div className="space-y-1">
                        <label className="block text-[9px] font-black uppercase text-amber-950 flex items-center space-x-1.5">
                          <span>🥇 1.º Colocado (Campeão)</span>
                        </label>
                        <select
                          id="pred-finalist-1o"
                          value={finalistPredictions.first}
                          onChange={(e) => handleFinalistPredictionChange("first", e.target.value)}
                          className="w-full h-11 px-3 bg-white border-2 border-[#FFD700] rounded-lg text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-xs"
                        >
                          <option value="">-- Escolha o Campeão --</option>
                          {getEliminatoriaTeams().map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      {/* 2º Colocado */}
                      <div className="space-y-1">
                        <label className="block text-[9px] font-black uppercase text-amber-950 flex items-center space-x-1.5">
                          <span>🥈 2.º Colocado (Vice)</span>
                        </label>
                        <select
                          id="pred-finalist-2o"
                          value={finalistPredictions.second}
                          onChange={(e) => handleFinalistPredictionChange("second", e.target.value)}
                          className="w-full h-11 px-3 bg-white border-2 border-[#FFD700] rounded-lg text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-xs"
                          disabled={!finalistPredictions.first}
                        >
                          <option value="">-- Escolha o Vice --</option>
                          {getEliminatoriaTeams()
                            .filter(t => t !== finalistPredictions.first)
                            .map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                      </div>

                      {/* 3º Colocado */}
                      <div className="space-y-1">
                        <label className="block text-[9px] font-black uppercase text-amber-950 flex items-center space-x-1.5">
                          <span>🥉 3.º Colocado</span>
                        </label>
                        <select
                          id="pred-finalist-3o"
                          value={finalistPredictions.third}
                          onChange={(e) => handleFinalistPredictionChange("third", e.target.value)}
                          className="w-full h-11 px-3 bg-white border-2 border-[#FFD700] rounded-lg text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-xs"
                          disabled={!finalistPredictions.second}
                        >
                          <option value="">-- Escolha o Terceiro Lugar --</option>
                          {getEliminatoriaTeams()
                            .filter(t => t !== finalistPredictions.first && t !== finalistPredictions.second)
                            .map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                      </div>

                      {/* 4º Colocado */}
                      <div className="space-y-1">
                        <label className="block text-[9px] font-black uppercase text-[#854d0e] flex items-center space-x-1.5">
                          <span>🏅 4.º Colocado</span>
                        </label>
                        <select
                          id="pred-finalist-4o"
                          value={finalistPredictions.fourth}
                          onChange={(e) => handleFinalistPredictionChange("fourth", e.target.value)}
                          className="w-full h-11 px-3 bg-white border-2 border-[#FFD700] rounded-lg text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-xs"
                          disabled={!finalistPredictions.third}
                        >
                          <option value="">-- Escolha o Quarto Lugar --</option>
                          {getEliminatoriaTeams()
                            .filter(t => t !== finalistPredictions.first && t !== finalistPredictions.second && t !== finalistPredictions.third)
                            .map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-dashed border-amber-200 text-center">
                      <span className="text-[8px] font-mono font-bold text-red-600 uppercase tracking-widest leading-none">
                        ⚠️ Palpites de Finalistas ativos de 27/06 23:00 BRT até 02/07 21:00 BRT!
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Main Active Phase Matches */}
                <div className="space-y-3">
                  <div className="sticky top-0 bg-[#faf6eb] py-1 pb-1.5 border-b-2 border-[#143e24] font-display font-extrabold text-[#143e24] flex items-center justify-between text-xs tracking-wider z-10 select-none uppercase">
                    <span>🔥 {PHASES[currentPhaseIndex].toUpperCase()}</span>
                    <span className="text-[8px] bg-[#143e24] text-white px-1.5 py-0.5 rounded font-mono">FASE ATIVA</span>
                  </div>

                  <div className="space-y-4">
                    {(() => {
                      if (selectedStageTab !== "Fase de Grupos") {
                        // Bracket Columns configurations
                        const bracketColumns = [
                          { id: "16_avos", key: "16 de final", title: "16 de Final" },
                          { id: "oitavas", key: "8 de final", title: "Oitavas" },
                          { id: "quartas", key: "4 de final", title: "Quartas" },
                          { id: "semis", key: "semi", title: "Semifinais" },
                          { id: "terceiro", key: "3o lugar", title: "3º Lugar 🥉" },
                          { id: "final", key: "final", title: "Grande Final 🏆" }
                        ];

                        const matchStageFilter = (m: Match, s: string) => {
                          const mStage = String(m.stage || "").toLowerCase();
                          const query = s.toLowerCase();
                          if (query === "16 de final") {
                            return mStage === "16 de final" || mStage.includes("32") || mStage.includes("16 avos") || mStage.includes("dezesseis");
                          }
                          if (query === "8 de final") {
                            return mStage === "oitavas de final" || mStage.includes("oitav") || mStage.includes("r16") || mStage.includes("round of 16") || mStage.includes("1/8");
                          }
                          if (query === "4 de final") {
                            return mStage === "quartas de final" || mStage.includes("quartas") || mStage.includes("quarter") || mStage.includes("1/4");
                          }
                          if (query === "semi") {
                            return mStage === "semifinais" || mStage.includes("semi");
                          }
                          if (query === "3o lugar") {
                            return mStage === "disputa de 3º lugar" || mStage.includes("3") || mStage.includes("terceiro") || mStage.includes("bronze");
                          }
                          if (query === "final") {
                            return mStage === "final" || mStage === "f1" || (mStage.includes("final") && !mStage.includes("16") && !mStage.includes("oitav") && !mStage.includes("quartas") && !mStage.includes("semi") && !mStage.includes("3o") && !mStage.includes("3º") && !mStage.includes("terceiro"));
                          }
                          return false;
                        };

                        const columnsWithMatches = bracketColumns.map(col => {
                          const colsMatches = enrichedMatches.filter(m => matchStageFilter(m, col.key));
                          return { ...col, matches: colsMatches };
                        }).filter(col => col.matches.length > 0);

                        return (
                          <div className="w-full space-y-2">
                            <p className="text-[10px] text-neutral-500 font-mono italic text-center select-none animate-pulse">
                              ↔️ Deslize para o lado para navegar no Chaveamento (Mata-Mata)
                            </p>
                            
                            <div 
                              ref={bracketContainerRef}
                              className="flex gap-x-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-hide scroll-smooth w-full"
                            >
                              {columnsWithMatches.map((col) => {
                                const isColActive = col.matches.some(m => m.stage === selectedStageTab);
                                return (
                                  <div 
                                    key={col.id} 
                                    id={`col-${col.id}`}
                                    className={`min-w-[85%] sm:min-w-[325px] shrink-0 flex flex-col snap-center p-3.5 rounded-2xl border transition-all duration-300 relative ${
                                      isColActive 
                                        ? "bg-amber-50/50 border-amber-500 ring-2 ring-amber-400/35 shadow-md shadow-amber-950/5" 
                                        : "bg-[#fbf9f2]/75 border-neutral-300/80 opacity-85 hover:opacity-100"
                                    }`}
                                  >
                                    {/* Column Stage Title Card */}
                                    <div className="sticky top-0 bg-[#ebdcb9] border-b-2 border-emerald-800 mb-2 py-1 px-2.5 rounded-lg text-center font-display font-extrabold text-emerald-950 text-[10px] tracking-wider select-none uppercase">
                                      {col.title}
                                    </div>

                                    {/* Matches distributed symmetrically with flex-justify-around */}
                                    <div className="flex-1 flex flex-col justify-around gap-y-3 min-h-[480px] py-1">
                                      {col.matches.map((match) => {
                                        const idx = competitionData.matches.findIndex(m => m.id === match.id);
                                        const prediction = getCleanPrediction(match.id);
                                        const isRowFilled = prediction.score1 !== "" && prediction.score2 !== "";
                                        const isStarted = isMatchStarted(match);
                                        const isActiveStage = match.stage === selectedStageTab;

                                        return (
                                          <div 
                                            key={match.id} 
                                            className={`p-2 rounded-xl border bg-white shadow-xs transition-all relative ${
                                              isActiveStage 
                                                ? isRowFilled 
                                                  ? "border-amber-500 ring-2 ring-amber-400/35" 
                                                  : "border-neutral-400 hover:border-emerald-600 shadow-sm"
                                                : "border-neutral-200 bg-neutral-100/60 opacity-80"
                                            }`}
                                          >
                                            {/* Micro Header */}
                                            <div className="flex items-center justify-between text-[7px] text-neutral-500 font-mono mb-1 pb-1 border-b border-dashed border-neutral-200">
                                              <span className="font-bold text-emerald-800">🚀 JOGO #{String(idx + 1).padStart(2, "0")}</span>
                                              <span>{match.date} • {match.time}</span>
                                            </div>

                                            {/* Teams Stacked */}
                                            <div className="space-y-1">
                                              {/* Team 1 */}
                                              <div className="flex items-center justify-between">
                                                <div 
                                                  onClick={() => setSelectedTradingCardTeam(match.team1)}
                                                  className="flex items-center space-x-1 hover:text-amber-600 max-w-[150px] text-left cursor-pointer transition-all select-none group/team"
                                                  title={`Clique para ver a Figurinha de ${match.team1}`}
                                                >
                                                  <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center border border-neutral-200 bg-neutral-50 shrink-0 shadow-2xs group-hover/team:scale-110 transition-transform">
                                                    <TeamFlag teamName={match.team1} className="w-full h-full object-cover" />
                                                  </div>
                                                  <span className={`text-[9px] font-black tracking-tight text-neutral-900 group-hover/team:text-amber-700 uppercase truncate ${isStarted ? "opacity-60 line-through" : ""}`} title={match.team1}>
                                                    {match.team1}
                                                  </span>
                                                </div>

                                                {isStarted ? (
                                                  <span className="text-[9px] font-mono font-bold text-neutral-600 bg-neutral-200/50 px-1 py-0.5 rounded leading-none shrink-0 min-w-[14px] text-center">
                                                    {prediction.score1 !== "" ? prediction.score1 : "-"}
                                                  </span>
                                                ) : (
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    max="9"
                                                    maxLength={1}
                                                    inputMode="numeric"
                                                    placeholder=""
                                                    disabled={isStarted}
                                                    value={prediction.score1}
                                                    onChange={(e) => handleScoreChange(match.id, 1, e.target.value)}
                                                    className="w-5 h-4.5 bg-[#faf6eb] border border-neutral-300 rounded text-center font-black text-[9px] text-[#032110] focus:outline-none focus:ring-1 focus:ring-[#92400e] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0"
                                                  />
                                                )}
                                              </div>

                                              {/* Team 2 */}
                                              <div className="flex items-center justify-between">
                                                <div 
                                                  onClick={() => setSelectedTradingCardTeam(match.team2)}
                                                  className="flex items-center space-x-1 hover:text-amber-600 max-w-[150px] text-left cursor-pointer transition-all select-none group/team"
                                                  title={`Clique para ver a Figurinha de ${match.team2}`}
                                                >
                                                  <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center border border-neutral-200 bg-neutral-50 shrink-0 shadow-2xs group-hover/team:scale-110 transition-transform">
                                                    <TeamFlag teamName={match.team2} className="w-full h-full object-cover" />
                                                  </div>
                                                  <span className={`text-[9px] font-black tracking-tight text-neutral-900 group-hover/team:text-amber-700 uppercase truncate ${isStarted ? "opacity-60 line-through" : ""}`} title={match.team2}>
                                                    {match.team2}
                                                  </span>
                                                </div>

                                                {isStarted ? (
                                                  <span className="text-[9px] font-mono font-bold text-neutral-600 bg-neutral-200/50 px-1 py-0.5 rounded leading-none shrink-0 min-w-[14px] text-center">
                                                    {prediction.score2 !== "" ? prediction.score2 : "-"}
                                                  </span>
                                                ) : (
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    max="9"
                                                    maxLength={1}
                                                    inputMode="numeric"
                                                    placeholder=""
                                                    disabled={isStarted}
                                                    value={prediction.score2}
                                                    onChange={(e) => handleScoreChange(match.id, 2, e.target.value)}
                                                    className="w-5 h-4.5 bg-[#faf6eb] border border-neutral-300 rounded text-center font-black text-[9px] text-[#032110] focus:outline-none focus:ring-1 focus:ring-[#92400e] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0"
                                                  />
                                                )}
                                              </div>
                                            </div>

                                            {/* Micro Footer */}
                                            {match.stadium && (
                                              <div className="text-[6px] text-neutral-400 font-mono mt-1 pt-0.5 border-t border-dashed border-neutral-100 flex items-center justify-between">
                                                <span className="truncate max-w-[140px]">{match.stadium}</span>
                                                {isActiveStage && (
                                                  <span className="text-[5px] bg-red-600 text-white font-extrabold rounded px-1 scale-90 select-none uppercase">ATIVO</span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Bullet Pagination Indicators for Match Stages */}
                            <div className="flex flex-col items-center justify-center space-y-1 mt-1 select-none">
                              <div className="flex items-center space-x-1.5 py-1">
                                {columnsWithMatches.map((col) => {
                                  const isColActive = col.matches.some(m => m.stage === selectedStageTab);
                                  const colTabName = 
                                    col.id === "16_avos" ? "16 de Final" :
                                    col.id === "oitavas" ? "Oitavas de Final" :
                                    col.id === "quartas" ? "Quartas de Final" :
                                    col.id === "semis" ? "Semifinais" :
                                    col.id === "terceiro" ? "Disputa de 3º Lugar" :
                                    "Final";

                                  return (
                                    <button
                                      key={`dot-${col.id}`}
                                      type="button"
                                      onClick={() => setSelectedStageTab(colTabName)}
                                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                                        isColActive 
                                          ? "w-5.5 bg-amber-500 shadow-xs shadow-amber-700/30" 
                                          : "w-2 bg-neutral-300 hover:bg-neutral-400"
                                      }`}
                                      title={`Ir para ${col.title}`}
                                    />
                                  );
                                })}
                              </div>
                              <span className="text-[8px] font-mono font-black text-amber-700 uppercase tracking-wider">
                                {columnsWithMatches.findIndex(col => col.matches.some(m => m.stage === selectedStageTab)) !== -1 
                                  ? `Fase Selecionada: ${columnsWithMatches.find(col => col.matches.some(m => m.stage === selectedStageTab))?.title}`
                                  : "Arraste para o Lado"
                                }
                              </span>
                            </div>
                          </div>
                        );
                      }

                      // Group matches of active stage
                      const groups: { groupName: string; matches: any[] }[] = [];
                      activeMatches.forEach(match => {
                        const gName = match.group || "Partidas";
                        let exist = groups.find(g => g.groupName === gName);
                        if (!exist) {
                          exist = { groupName: gName, matches: [] };
                          groups.push(exist);
                        }
                        exist.matches.push(match);
                      });

                      return groups.map((grpItem) => {
                        const colors = getGroupColors(grpItem.groupName);
                        return (
                          <div
                            key={grpItem.groupName}
                            className={`p-3.5 rounded-2xl border-2 ${colors.border} ${colors.bg} space-y-3 shadow-xs relative transition-all bg-white/40 backdrop-blur-xs`}
                          >
                            <div className="flex items-center justify-between pb-1 border-b border-dashed border-neutral-300/80">
                              <div className="flex items-center space-x-1.5 pb-0.5">
                                <span className={`w-2 h-2 rounded-full ${colors.dot}`}></span>
                                <span className={`text-[11px] font-black uppercase tracking-wider font-display ${colors.text}`}>
                                  {grpItem.groupName}
                                </span>
                              </div>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono ${colors.badge}`}>
                                Grupo
                              </span>
                            </div>

                            {(() => {
                              const isLocked = isGroupPredictionLocked(grpItem.groupName);
                              const groupLetter = grpItem.groupName.replace("Grupo ", "").trim();
                              const groupPred = groupPredictions[groupLetter] || { first: "", second: "" };
                              const groupTeams = getGroupTeams(grpItem.groupName);
                              const firstSelected = groupPred.first;
                              const secondSelected = groupPred.second;

                              if (isLocked) return null;

                              return (
                                <div className="bg-[#FFFDE7] border-2 border-[#FFD700] rounded-xl p-3.5 shadow-md space-y-3 text-neutral-900 border-dashed">
                                  <div className="flex items-center space-x-1.5 pb-1 border-b border-amber-200">
                                    <span className="text-sm">📊</span>
                                    <span className="text-[10px] font-extrabold tracking-wider text-amber-900 uppercase">
                                      Prognóstico de Classificação - Grupo {groupLetter}
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    {/* 1º Colocado */}
                                    <div className="space-y-1">
                                      <label className="block text-[9px] font-black uppercase text-amber-950 flex items-center space-x-1">
                                        <span>🏆 1.º Colocado</span>
                                      </label>
                                      <select
                                        id={`pred-1o-${groupLetter}`}
                                        value={firstSelected}
                                        onChange={(e) => handleGroupPredictionChange(groupLetter, "first", e.target.value)}
                                        className="w-full h-11 px-2.5 bg-white border-2 border-[#FFD700] rounded-lg text-[11px] font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-xs"
                                      >
                                        <option value="">-- Selecione --</option>
                                        {groupTeams.map(t => (
                                          <option key={t} value={t}>{t}</option>
                                        ))}
                                      </select>
                                    </div>

                                    {/* 2º Colocado */}
                                    <div className="space-y-1">
                                      <label className="block text-[9px] font-black uppercase text-amber-950 flex items-center space-x-1">
                                        <span>🥈 2.º Colocado</span>
                                      </label>
                                      <select
                                        id={`pred-2o-${groupLetter}`}
                                        value={secondSelected}
                                        onChange={(e) => handleGroupPredictionChange(groupLetter, "second", e.target.value)}
                                        className="w-full h-11 px-2.5 bg-white border-2 border-[#FFD700] rounded-lg text-[11px] font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-xs"
                                      >
                                        <option value="">-- Selecione --</option>
                                        {groupTeams
                                          .filter(t => t !== firstSelected)
                                          .map(t => (
                                            <option key={t} value={t}>{t}</option>
                                          ))}
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            <div className="space-y-4">
                              {grpItem.matches.map((match) => {
                                const idx = competitionData.matches.findIndex(m => m.id === match.id);
                                const prediction = getCleanPrediction(match.id);
                                const isRowFilled = prediction.score1 !== "" && prediction.score2 !== "";
                                const isStarted = isMatchStarted(match);

                                return (
                                  <div key={match.id} className="space-y-1">
                                    {/* Match Header metadata */}
                                    <div className="flex items-center justify-between text-[8px] text-neutral-500 px-2 font-mono">
                                      <span className="font-bold text-[#143e24]">
                                        JOGO #{String(idx + 1).padStart(2, "0")}
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
                                            max="9"
                                            maxLength={1}
                                            inputMode="numeric"
                                            placeholder=""
                                            value={prediction.score1}
                                            onChange={(e) => handleScoreChange(match.id, 1, e.target.value)}
                                            className="w-6 h-6 bg-white/95 rounded-full text-center font-black text-xs text-[#032110] focus:outline-none focus:ring-2 focus:ring-[#92400e] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0"
                                          />
                                          <span className="text-[10px] font-black text-[#032110] select-none">-</span>
                                          <input
                                            type="number"
                                            min="0"
                                            max="9"
                                            maxLength={1}
                                            inputMode="numeric"
                                            placeholder=""
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
                        );
                      });
                    })()}
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
                      {(() => {
                        // Group secondRoundMatchesToShow by group Name to show group highlights "destaque de grupos nas prévias"
                        const nextGroups: { groupName: string; matches: typeof secondRoundMatchesToShow }[] = [];
                        secondRoundMatchesToShow.forEach(match => {
                          const gName = match.group || "Fase de Grupos";
                          let exist = nextGroups.find(g => g.groupName === gName);
                          if (!exist) {
                            exist = { groupName: gName, matches: [] };
                            nextGroups.push(exist);
                          }
                          exist.matches.push(match);
                        });

                        return nextGroups.map(grpItem => {
                          const colors = getGroupColors(grpItem.groupName);
                          return (
                            <div
                              key={"next-" + grpItem.groupName}
                              className={`p-3.5 rounded-2xl border-2 ${colors.border} ${colors.bg} space-y-3 shadow-xs relative transition-all bg-white/45 backdrop-blur-xs`}
                            >
                              {/* Header for Group inside 2ª Rodada Preview */}
                              <div className="flex items-center justify-between pb-1 border-b border-dashed border-neutral-300/80">
                                <div className="flex items-center space-x-1.5 pb-0.5">
                                  <span className={`w-2 h-2 rounded-full ${colors.dot}`}></span>
                                  <span className={`text-[11px] font-black uppercase tracking-wider font-display ${colors.text}`}>
                                    {grpItem.groupName} (PREVISÃO)
                                  </span>
                                </div>
                                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
                                  Próxima Rodada
                                </span>
                              </div>

                              <div className="space-y-4">
                                {grpItem.matches.map((match, sIdx) => {
                                  const prediction = getCleanPrediction(match.id);
                                  const isRowFilled = prediction.score1 !== "" && prediction.score2 !== "";
                                  const isStarted = isMatchStarted(match);

                                  return (
                                    <div key={match.id} className="space-y-1">
                                      {/* Match Header metadata */}
                                      <div className="flex items-center justify-between text-[8px] text-neutral-550 px-2 font-mono">
                                        <span className="font-bold text-emerald-850">
                                          JOGO SEGUINTE #{String(sIdx + 1).padStart(2, "0")}
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
                                              max="9"
                                              maxLength={1}
                                              inputMode="numeric"
                                              placeholder=""
                                              value={prediction.score1}
                                              onChange={(e) => handleScoreChange(match.id, 1, e.target.value)}
                                              className="w-6 h-6 bg-white/95 rounded-full text-center font-black text-xs text-[#032110] focus:outline-none focus:ring-2 focus:ring-[#92400e] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0"
                                            />
                                            <span className="text-[10px] font-black text-[#032110] select-none">-</span>
                                            <input
                                              type="number"
                                              min="0"
                                              max="9"
                                              maxLength={1}
                                              inputMode="numeric"
                                              placeholder=""
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
                          );
                        });
                      })()}
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

      <RecentSlips
        slips={recentSlips}
        onResend={handleResendRecentSlip}
        onRestore={handleRestoreSlip}
      />

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

      {/* CLASSIFICAÇÃO DOS PALPITEIROS MODAL */}
      <AnimatePresence>
        {isLeaderboardModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-1 sm:p-4 md:p-6 bg-black/95 backdrop-blur-md overflow-hidden"
            onClick={() => setIsLeaderboardModalOpen(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full h-[95vh] sm:h-[88vh] max-w-5xl bg-[#143e24] border-2 border-amber-500 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[97vh] sm:max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header inside the modal */}
              <div className="flex items-center justify-between px-3.5 py-3 bg-[#0d2818] border-b border-amber-500/35 shrink-0">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500 animate-pulse shrink-0" />
                  <h3 className="font-bold text-xs sm:text-base text-amber-400 font-display uppercase tracking-wider">
                    Classificação dos Palpiteiros
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLeaderboardModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-neutral-350 hover:text-white cursor-pointer active:scale-90 transition-all shrink-0"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable body with the iframe */}
              <div className="flex-1 flex flex-col min-h-0 bg-[#0d2818]/60 overflow-hidden">
                
                {/* Helpful hint bar */}
                <div className="bg-[#05140b] text-[9px] sm:text-xs text-neutral-300 font-mono py-2 px-3 flex items-center justify-between border-b border-amber-500/10 shrink-0">
                  <span className="flex items-center gap-1.5 leading-snug">
                    <Info className="h-3.5 w-3.5 text-amber-500 shrink-0 animate-pulse" />
                    <span>Navegue e aproxime o quadro diretamente na visualização interativa abaixo</span>
                  </span>
                </div>

                {headerImageUrl ? (
                  <div className="flex-1 w-full bg-neutral-950 flex items-center justify-center overflow-hidden min-h-0">
                    <iframe
                      src={getCleanIframeUrl(headerImageUrl)}
                      title="Classificação dos Palpiteiros"
                      className="w-full h-full border-none bg-neutral-950"
                      allow="autoplay; encrypted-media"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="py-16 text-center text-neutral-400 font-mono text-xs">
                    Nenhuma classificação disponível no momento.
                  </div>
                )}
              </div>

              {/* Footer inside the modal */}
              <div className="p-3 bg-[#0d2818] border-t border-amber-500/35 flex justify-center shrink-0">
                <button
                  type="button"
                  onClick={() => setIsLeaderboardModalOpen(false)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all text-center cursor-pointer shadow"
                >
                  Fechar Classificação
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* CONFIRM MODAL FOR PARTIAL PREDICTIONS */}
      <AnimatePresence>
        {showConfirmMissingModal && missingConfirmData && (
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
                  <div className="p-3 bg-amber-100 rounded-full border-2 border-amber-500 mb-2">
                    <AlertTriangle className="h-8 w-8 text-amber-500" />
                  </div>
                  <span className="stamp text-amber-600 border-amber-600 px-3 py-1 text-sm tracking-widest bg-amber-50/50 mt-1">
                    ALERTA
                  </span>
                </div>

                <h3 className="text-xl font-bold uppercase tracking-wide text-neutral-900 font-display mt-2">
                  Palpites Incompletos
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-neutral-600 font-serif italic max-w-xs">
                  Você preencheu apenas <strong className="text-neutral-900">{missingConfirmData.filled}</strong> jogo(s). Ainda faltam preencher <strong className="text-neutral-900">{missingConfirmData.missing}</strong> jogo(s) nessa rodada.
                  <br /><br />
                  Quer enviar apenas os jogos preenchidos?
                </p>

                <div className="mt-6 flex w-full gap-3">
                  <button
                    onClick={() => {
                      executeSubmission(true);
                      setShowConfirmMissingModal(false);
                    }}
                    className="flex-1 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-mono font-bold uppercase border-2 border-neutral-800 text-sm transition-all shadow-md active:translate-y-0.5 active:shadow-sm cursor-pointer"
                  >
                    Sim
                  </button>
                  <button
                    onClick={() => setShowConfirmMissingModal(false)}
                    className="flex-1 py-2.5 px-4 bg-red-100 hover:bg-red-200 text-red-800 font-mono font-bold uppercase border-2 border-red-800 text-sm transition-all shadow-md active:translate-y-0.5 active:shadow-sm cursor-pointer"
                  >
                    Não
                  </button>
                </div>
              </div>

              {/* Ticket teeth footer */}
              <div className="h-3 bg-[radial-gradient(circle,transparent_4px,#faf6eb_5px)] bg-[size:14px_24px] bg-top w-full bg-neutral-800" />
            </motion.div>
          </div>
        )}

        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-sm overflow-hidden bg-[#faf6eb] border-4 border-neutral-800 text-neutral-800 lotto-slip-container font-mono shadow-2xl"
            >
              <div className="h-3 bg-[radial-gradient(circle,transparent_4px,#faf6eb_5px)] bg-[size:14px_24px] bg-bottom w-full bg-neutral-800" />
              
              <div className="p-6 flex flex-col items-center">
                <div className="mb-4 text-[#143e24] flex flex-col items-center">
                  <div className="p-3 bg-amber-100 rounded-full border-2 border-amber-500 mb-2">
                    <Trophy className="h-8 w-8 text-amber-500 animate-bounce" />
                  </div>
                  <span className="stamp text-amber-600 border-amber-600 px-3 py-1 text-xs tracking-widest bg-amber-50/50 mt-1">
                    MODO GERENCIAL
                  </span>
                </div>

                <h3 className="text-lg font-bold uppercase tracking-wide text-neutral-900 font-display text-center">
                  Acesso Restrito
                </h3>

                <p className="mt-2 text-xs text-center text-neutral-500 italic mb-4">
                  Insira a senha fixa de 6 dígitos para continuar.
                </p>

                <form onSubmit={handlePasswordSubmit} className="w-full flex flex-col items-center">
                  <input
                    type="password"
                    maxLength={12}
                    value={passwordValue}
                    onChange={(e) => {
                      setPasswordValue(e.target.value);
                      setPasswordError(false);
                    }}
                    placeholder="Digite a Senha"
                    className="w-full px-3 py-2 border-2 border-neutral-800 bg-[#faf6eb] text-center text-sm font-bold tracking-widest text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500 text-center"
                    autoFocus
                  />

                  {passwordError && (
                    <p className="mt-2 text-xs font-bold text-red-600 animate-pulse">
                      ⚠️ Senha incorreta! Tente novamente.
                    </p>
                  )}

                  <div className="mt-5 flex w-full gap-2">
                    <button
                      type="submit"
                      className="flex-grow py-2 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-mono font-bold uppercase border-2 border-neutral-800 text-xs transition-shadow shadow-md active:translate-y-0.5 active:shadow-sm cursor-pointer"
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordModal(false);
                        setPasswordError(false);
                      }}
                      className="py-2 px-4 bg-red-100 hover:bg-red-200 text-red-800 font-mono font-bold uppercase border-2 border-red-800 text-xs transition-shadow shadow-md active:translate-y-0.5 active:shadow-sm cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>

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
