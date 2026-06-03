import React from "react";
import { History, Share2, Eye, User, Ticket } from "lucide-react";
import { BetSlipSubmission } from "../types";

interface RecentSlipsProps {
  slips: BetSlipSubmission[];
  onResend: (slip: BetSlipSubmission) => void;
  onRestore: (slip: BetSlipSubmission) => void;
}

export default function RecentSlips({ slips, onResend, onRestore }: RecentSlipsProps) {
  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl border-2 border-white/20 bg-emerald-950/40 p-5 font-mono shadow-2xl backdrop-blur-xs select-none mt-10">
      <div className="flex items-center space-x-2 pb-3 border-b-2 border-dashed border-emerald-800/40 text-neutral-300">
        <History className="h-4.5 w-4.5 shrink-0 text-amber-400" />
        <h3 className="font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider">
          Meus Palpites Recentes
        </h3>
      </div>

      <div className="mt-4 space-y-3">
        {slips.length === 0 ? (
          <div className="text-center py-7 px-5 rounded-2xl border-2 border-dashed border-emerald-800/40 bg-neutral-950/20">
            <Ticket className="h-8 w-8 mx-auto text-neutral-500 mb-2.5 animate-pulse" />
            <p className="text-[11px] text-neutral-400 font-bold leading-relaxed max-w-xs mx-auto">
              Nenhum palpite recente encontrado! Envie o formulário de palpites para salvar e acompanhar o recibo de aposta desta sessão.
            </p>
          </div>
        ) : (
          slips.map((slip) => (
            <div
              key={slip.ticketCode}
              id={`slip-${slip.ticketCode}`}
              className="flex items-center justify-between p-4 rounded-xl border-2 border-neutral-950 bg-[#b9ccbe] hover:bg-[#c2d6c7] transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.01]"
            >
              {/* Slip Left Column content */}
              <div className="flex-1 flex flex-col space-y-2.5 text-left min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-neutral-700 font-mono">
                  <Ticket className="h-4 w-4 text-neutral-700 shrink-0" />
                  
                  {/* Yellow coupon highlighting */}
                  <span className="bg-[#fbbf24] text-neutral-950 font-black px-2 py-0.5 rounded text-[10px] border border-neutral-950 shrink-0 tracking-wider">
                    {slip.ticketCode}
                  </span>
                  
                  <span className="text-[10px] text-neutral-700 font-extrabold">
                    • {formatDate(slip.submittedAt)}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-neutral-900">
                  <User className="h-4 w-4 text-neutral-700 shrink-0" />
                  <span className="text-[11px] font-black uppercase tracking-tight truncate">
                    POR: {slip.fullName}
                  </span>
                </div>
              </div>

              {/* Action Buttons styled precisely as attachment or original visual */}
              <div className="flex items-center space-x-2 pl-3 shrink-0">
                {/* Resend via WhatsApp */}
                <button
                  type="button"
                  onClick={() => onResend(slip)}
                  className="p-1.5 bg-[#b9ccbe] sm:p-2 rounded border-2 border-neutral-950 hover:bg-emerald-800 hover:text-white transition-all cursor-pointer text-neutral-900 shadow-xs active:scale-95"
                  title="Reenviar Palpites no WhatsApp"
                >
                  <Share2 className="h-4.5 w-4.5" />
                </button>

                {/* View/Restore / Edit */}
                <button
                  type="button"
                  onClick={() => onRestore(slip)}
                  className="p-1.5 bg-[#b9ccbe] sm:p-2 rounded border-2 border-neutral-950 hover:bg-emerald-800 hover:text-white transition-all cursor-pointer text-neutral-900 shadow-xs active:scale-95"
                  title="Restaurar e Editar no Volante"
                >
                  <Eye className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const formatDate = (isoString: string) => {
  try {
    const d = new Date(isoString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  } catch (e) {
    return isoString;
  }
};
