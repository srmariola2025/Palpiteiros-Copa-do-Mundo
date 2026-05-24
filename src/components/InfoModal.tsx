import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, CheckCircle2, MessageSquare, Loader2 } from "lucide-react";

interface InfoModalProps {
  isOpen: boolean;
  type: "success" | "error";
  title: string;
  message: string;
  onClose: () => void;
  primaryButtonText?: string;
  isRedirecting?: boolean;
}

export default function InfoModal({
  isOpen,
  type,
  title,
  message,
  onClose,
  primaryButtonText = "Entendido",
  isRedirecting = false
}: InfoModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-md overflow-hidden bg-[#faf6eb] border-4 border-neutral-800 text-neutral-800 lotto-slip-container font-mono"
          >
            {/* Ticket teeth header */}
            <div className="h-3 bg-[radial-gradient(circle,transparent_4px,#faf6eb_5px)] bg-[size:14px_24px] bg-bottom w-full bg-neutral-800" />

            <div className="p-6 flex flex-col items-center text-center">
              {/* Icon / Stamp */}
              {type === "error" ? (
                <div className="mb-4 text-red-600 flex flex-col items-center">
                  <div className="p-3 bg-red-100 rounded-full border-2 border-red-600 mb-2">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                  <span className="stamp text-red-600 border-red-600 px-3 py-1 text-sm tracking-widest bg-red-50/50 mt-1">
                    DUPLICADO
                  </span>
                </div>
              ) : (
                <div className="mb-4 text-[#143e24] flex flex-col items-center">
                  <div className="p-3 bg-emerald-100 rounded-full border-2 border-emerald-600 mb-2">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <span className="stamp text-[#143e24] border-[#143e24] px-3 py-1 text-sm tracking-widest bg-emerald-50/50 mt-1">
                    AUTORIZADO
                  </span>
                </div>
              )}

              {/* Title */}
              <h3 className="text-xl font-bold uppercase tracking-wide text-neutral-900 font-display mt-2">
                {title}
              </h3>

              {/* Message */}
              <p className="mt-3 text-sm leading-relaxed text-neutral-600 font-serif italic max-w-xs">
                {message}
              </p>

              {/* Action Details */}
              {isRedirecting && (
                <div className="mt-5 w-full bg-[#ebdcb5] border-t-2 border-b-2 border-dashed border-neutral-700 py-3 px-4 text-xs flex flex-col items-center space-y-2 text-neutral-700">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-800" />
                    <span>Preparando ambiente do WhatsApp...</span>
                  </div>
                  <p className="text-[10px] text-center italic">
                    (Se o redirecionamento automático falhar, clique no botão para forçar o envio)
                  </p>
                </div>
              )}

              {/* Footer Button */}
              <div className="mt-6 w-full">
                <button
                  onClick={onClose}
                  className={`w-full py-2.5 px-4 font-mono font-bold uppercase border-2 text-sm transition-all shadow-md active:translate-y-0.5 active:shadow-sm ${
                    type === "error"
                      ? "bg-red-100 hover:bg-red-200 text-red-800 border-red-800 shadow-red-900/10"
                      : "bg-[#143e24] hover:bg-[#1a4f2e] text-white border-neutral-800 shadow-neutral-900/20"
                  }`}
                >
                  <span className="flex items-center justify-center space-x-2">
                    {type === "success" && <MessageSquare className="h-4 w-4" />}
                    <span>{primaryButtonText}</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Ticket teeth footer */}
            <div className="h-3 bg-[radial-gradient(circle,transparent_4px,#faf6eb_5px)] bg-[size:14px_24px] bg-top w-full bg-neutral-800" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
