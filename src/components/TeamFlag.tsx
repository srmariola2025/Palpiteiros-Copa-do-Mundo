import React from "react";

// Mapeamento preciso de nomes de países para códigos ISO utilizados no FlagCDN (https://flagcdn.com)
export const flagCodes: Record<string, string> = {
  "México": "mx",
  "África do Sul": "za",
  "Coreia do Sul": "kr",
  "República Checa": "cz",
  "Canadá": "ca",
  "Bósnia": "ba",
  "Qatar": "qa",
  "Catar": "qa",
  "Suíça": "ch",
  "Brasil": "br",
  "Marrocos": "ma",
  "Haiti": "ht",
  "Escócia": "gb-sct",
  "Estados Unidos": "us",
  "Paraguai": "py",
  "Austrália": "au",
  "Turquia": "tr",
  "Alemanha": "de",
  "Curaçao": "cw",
  "Costa do Marfim": "ci",
  "Equador": "ec",
  "Holanda": "nl",
  "Japão": "jp",
  "Suécia": "se",
  "Tunísia": "tn",
  "Bélgica": "be",
  "Egito": "eg",
  "Irã": "ir",
  "Nova Zelândia": "nz",
  "Espanha": "es",
  "Cabo Verde": "cv",
  "Arábia Saudita": "sa",
  "Uruguai": "uy",
  "França": "fr",
  "Senegal": "sn",
  "Iraque": "iq",
  "Noruega": "no",
  "Argentina": "ar",
  "Argélia": "dz",
  "Áustria": "at",
  "Jordânia": "jo",
  "Portugal": "pt",
  "RD Congo": "cd",
  "Uzbequistão": "uz",
  "Colômbia": "co",
  "Inglaterra": "gb-eng",
  "Croácia": "hr",
  "Gana": "gh",
  "Panamá": "pa"
};

interface TeamFlagProps {
  teamName: string;
  className?: string;
  size?: "w40" | "w80" | "w160";
}

export default function TeamFlag({ teamName, className = "w-6 h-6", size = "w80" }: TeamFlagProps) {
  const normalized = teamName ? teamName.trim() : "";
  const code = flagCodes[normalized];

  if (code) {
    return (
      <img
        src={`https://flagcdn.com/${size}/${code}.png`}
        alt={`Bandeira de ${teamName}`}
        className={`object-cover ${className}`}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={(e) => {
          // Em caso de erro ao carregar, fallback para uma bola de futebol
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }

  // Fallback visual limpo
  return (
    <div className={`flex items-center justify-center bg-neutral-800 text-neutral-400 font-bold text-[10px] uppercase select-none ${className}`}>
      ⚽
    </div>
  );
}
