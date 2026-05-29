import { CompetitionData, Match } from "../types";

export interface FifaValidationCheck {
  title: string;
  status: "success" | "warning" | "info";
  message: string;
}

export interface FifaAuditReport {
  isFullyCompliant: boolean;
  checks: FifaValidationCheck[];
  summary: string;
  logs: string[];
}

/**
 * Validates CompetitionData against official FIFA 2026 World Cup structures and schedules,
 * in order to alert administrators of repository inconsistencies while staying fully compliant.
 */
export function validateOpenFootballDataFor2026(data: CompetitionData): FifaAuditReport {
  const checks: FifaValidationCheck[] = [];
  const logs: string[] = [];
  let warningsCount = 0;

  logs.push(`Iniciando auditoria para: "${data.competition}"`);

  // --- Rule 1: 12 Groups (A to L) instead of 8 (A to H) ---
  const groupNames = new Set<string>();
  data.matches.forEach(m => {
    if (m.group && m.group.toLowerCase().includes("grupo")) {
      groupNames.add(m.group.trim());
    }
  });

  const groupCount = groupNames.size;
  logs.push(`Fase de Grupos: Identificados ${groupCount} grupos no repositório.`);
  
  if (groupCount === 12) {
    checks.push({
      title: "Quantidade de Grupos (FIFA 2026)",
      status: "success",
      message: `Em conformidade. Foram encontrados os 12 grupos regulamentares (Grupos A ao L).`
    });
  } else {
    warningsCount++;
    const diff = 12 - groupCount;
    checks.push({
      title: "Quantidade de Grupos",
      status: "warning",
      message: `Inconsistência de Formato: O regulamento oficial da FIFA 2026 estabelece 12 grupos (A a L), mas os dados carregados possuem apenas ${groupCount} grupos (${diff > 0 ? `faltam ${diff}` : `excesso de ${-diff}`}).`
    });
    logs.push(`[AVISO] Divergência na quantidade de grupos: esperado 12, encontrado ${groupCount}.`);
  }

  // --- Rule 2: Round of 32 (16 de Final) presence ---
  const hasRoundOf32 = data.matches.some(
    m => m.stage === "16 de Final" || 
         (m.group && m.group.toLowerCase().includes("16 de final")) || 
         (m.group && m.group.toLowerCase().includes("round of 32"))
  );

  if (hasRoundOf32) {
    checks.push({
      title: "Fase 'Round of 32' (16-avos)",
      status: "success",
      message: "Fase eliminatória de 32 avos (Round of 32) identificada com sucesso na tabela."
    });
  } else {
    warningsCount++;
    checks.push({
      title: "Fase 'Round of 32' (16-avos)",
      status: "warning",
      message: "Nova Fase Ausente: A FIFA 2026 introduziu uma nova fase mata-mata com 32 seleções (Round of 32 / 16 de Final), porém nenhuma partida foi encontrada nesta fase nos dados fornecidos do repositório."
    });
    logs.push(`[AVISO] Round of 32 ausente do chaveamento eliminatório.`);
  }

  // --- Rule 3: 32 Teams in the Elimination Bracket, not 16 ---
  // Let's count teams or matches in the very first knockout stage.
  const r32Matches = data.matches.filter(
    m => m.stage === "16 de Final" || 
         (m.group && m.group.toLowerCase().includes("16 de final")) || 
         (m.group && m.group.toLowerCase().includes("round of 32"))
  );
  
  const oitavasMatches = data.matches.filter(m => m.stage === "Oitavas de Final");

  if (r32Matches.length === 16) {
    checks.push({
      title: "Equipes no Mata-Mata Inicial",
      status: "success",
      message: `Estrutura de 32 seleções (16 jogos de 16-avos de final) detectada de forma íntegra.`
    });
  } else if (r32Matches.length > 0) {
    warningsCount++;
    checks.push({
      title: "Equipes no Mata-Mata Inicial",
      status: "warning",
      message: `Inconsistência de Tamanho: Esperava-se 16 jogos para o 'Round of 32' (32 seleções), mas foram encontrados ${r32Matches.length} jogos nesta fase.`
    });
    logs.push(`[AVISO] Quantidade inesperada de jogos no Round of 32: encontrado ${r32Matches.length} (esperado 16).`);
  } else if (oitavasMatches.length === 8) {
    warningsCount++;
    checks.push({
      title: "Equipes no Mata-Mata Inicial",
      status: "warning",
      message: "Chave Eliminatória Reduzida: Os dados carregados iniciam o mata-mata diretamente nas Oitavas de Final (16 equipes), característico do formato antigo de 32 seleções no total, em vez do novo formato de 48 seleções."
    });
    logs.push(`[AVISO] Chaveamento curto iniciando diretamente em Oitavas de Final, ignorando a Round of 32.`);
  } else {
    checks.push({
      title: "Nível Eliminatório Primário",
      status: "info",
      message: "Incapaz de auditar times do mata-mata pelo fato da fase eliminatória de 32 avos (Round of 32) não estar definida nos dados."
    });
  }

  // --- Rule 4: Knockout Dates Validation ---
  // Group stage finishes on 2026-06-27. Knockout starts 2026-06-28.
  // Check if any match in knockout holds date earlier than 2026-06-28.
  const earlyKnockoutMatches = data.matches.filter(m => {
    const isKnockout = m.stage && m.stage !== "Fase de Grupos";
    return isKnockout && m.date < "2026-06-28";
  });

  if (earlyKnockoutMatches.length === 0) {
    checks.push({
      title: "Calendário do Mata-Mata",
      status: "success",
      message: "Todas as partidas eliminatórias agendadas seguem as balizas oficiais (a partir de 28/06/2026)."
    });
  } else {
    warningsCount++;
    checks.push({
      title: "Calendário do Mata-Mata",
      status: "warning",
      message: `Inconsistência de Calendário: Existem ${earlyKnockoutMatches.length} partida(s) de mata-mata agendada(s) antes da data oficial de início das eliminatórias (28/06/2026). Ex: Jogo ${earlyKnockoutMatches[0].id} agendado para ${earlyKnockoutMatches[0].date}.`
    });
    logs.push(`[CONFLITO DATA] Existem jogos de eliminatórias agendados precocemente (antes de 28/06).`);
  }

  // --- Rule 5: Final Calendar (2026-07-19) ---
  const finalMatches = data.matches.filter(m => m.stage === "Final" || (m.group && m.group.toLowerCase() === "final"));
  if (finalMatches.length > 0) {
    const finalDate = finalMatches[0].date;
    if (finalDate === "2026-07-19") {
      checks.push({
        title: "Agendamento da Grande Final",
        status: "success",
        message: "Data da final validada com sucesso: 19 de Julho de 2026, conforme o cronograma oficial da FIFA."
      });
    } else {
      warningsCount++;
      checks.push({
        title: "Agendamento da Grande Final",
        status: "warning",
        message: `Divergência de Cronograma: A Grande Final da Copa 2026 está agendada no repositório para o dia ${finalDate ? finalDate.split("-").reverse().join("/") : "data não preenchida"} em vez de 19/07/2026.`
      });
      logs.push(`[AVISO DIRETRIZ] A data da final no repositório (${finalDate}) difere da oficial FIFA 19/07/2026.`);
    }
  } else {
    checks.push({
      title: "Partida Final do Copa",
      status: "info",
      message: "Grande Final ainda não instanciada nos dados importados para verificação de data."
    });
  }

  // --- Rule 6: ID and Team consistency across phases ---
  let emptyOrInvalidTeamsCount = 0;
  data.matches.forEach(m => {
    if (!m.team1 || m.team1.trim() === "" || !m.team2 || m.team2.trim() === "") {
      emptyOrInvalidTeamsCount++;
    }
  });

  if (emptyOrInvalidTeamsCount === 0) {
    checks.push({
      title: "Integridade de Identificadores",
      status: "success",
      message: "Identificadores de seleções e confrontos íntegros de cabo a rabo (sem vazios)."
    });
  } else {
    warningsCount++;
    checks.push({
      title: "Integridade de Identificadores",
      status: "warning",
      message: `Incompatibilidade de Equipes: Foram identificadas ${emptyOrInvalidTeamsCount} partida(s) com definidor de equipes invalido ou incompleto no repositório.`
    });
    logs.push(`[AVISO INTEGRIDADE] ${emptyOrInvalidTeamsCount} jogos com nomes de equipes corrompidos ou em branco.`);
  }

  // Final summary
  const isFullyCompliant = warningsCount === 0;
  const summary = isFullyCompliant 
    ? "O repositório está perfeitamente alinhado com todas as diretrizes de formato da nova Copa FIFA 2026 (48 seleções, 12 grupos, Round of 32 ativo e correspondência de calendário)."
    : `O repositório possui divergências em relação às regras estritas da FIFA 2026. Alerta para ${warningsCount} inconformidades. Lembrar: a regra de ouro do sistema prioriza a leitura direta do repositório para manter a fidelidade com os palpites ativos dos usuários.`;

  logs.push(`Auditoria finalizada. Total de avisos: ${warningsCount}. Compatibilidade garantida via regra de prioridade do repositório.`);

  return {
    isFullyCompliant,
    checks,
    summary,
    logs
  };
}
