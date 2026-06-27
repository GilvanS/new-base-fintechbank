import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Brain, Lightbulb, RefreshCw, X, Home, ChevronRight } from 'lucide-react';
import { Transaction } from '../types';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  theme: 'yellow' | 'midnight';
}

interface AnalysisResult {
  analysis: string;
  actionableTip: string;
  demoMode?: boolean;
}

const LOADING_STEPS = [
  "Rastreando categorias de gastos...",
  "Analisando frequência de despesas...",
  "Calculando seu volume de saída de caixa...",
  "Criando uma recomendação inteligente sob medida para você..."
];

export default function AiAssistantModal({
  isOpen,
  onClose,
  transactions,
  theme
}: AiAssistantModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cycling loading step messages
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    setLoadingStep(0);
    try {
      const response = await fetch('/api/gemini/analyze-spending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transactions })
      });

      if (!response.ok) {
        throw new Error('Falha ao obter análise da IA. Verifique sua conexão ou tente novamente.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro ao processar seus dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAnalysis();
    } else {
      // Clear state when closed
      setResult(null);
      setError(null);
    }
  }, [isOpen]);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.93, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.93, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.8 }}
            onDragEnd={(event, info) => {
              if (info.offset.y > 100 || info.velocity.y > 300) {
                onClose();
              }
            }}
            className={`relative w-full max-w-md z-10 p-6 rounded-2xl flex flex-col gap-4 overflow-y-auto max-h-[90vh] scrollbar-none select-none cursor-grab active:cursor-grabbing ${
              theme === 'midnight'
                ? 'bg-zinc-950 border border-zinc-800 text-white shadow-2xl'
                : 'bg-white text-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            {/* Draggable Handle Pill */}
            <div className="w-12 h-1.5 bg-black/10 dark:bg-white/15 rounded-full mx-auto -mt-2 mb-2 cursor-grab shrink-0" />

            {/* Breadcrumb Navigation Bar */}
            <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border w-fit ${
              theme === 'midnight'
                ? 'text-zinc-500 bg-black/20 border-white/5'
                : 'text-zinc-500 bg-gray-50 border-black/10 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] font-bold'
            }`}>
              <button
                type="button"
                onClick={onClose}
                className="hover:text-volt-green transition-colors flex items-center gap-1 cursor-pointer text-zinc-500"
              >
                <Home size={10} />
                Início
              </button>
              <ChevronRight size={8} className="text-zinc-400" />
              <button
                type="button"
                onClick={() => {
                  if (!loading) {
                    fetchAnalysis();
                  }
                }}
                disabled={loading}
                className={`transition-colors ${!loading ? 'hover:text-volt-green text-zinc-400 cursor-pointer' : 'text-zinc-500'}`}
              >
                Volt IA
              </button>
              {loading && (
                <>
                  <ChevronRight size={8} className="text-zinc-400" />
                  <span className="text-volt-green animate-pulse">Carregando...</span>
                </>
              )}
              {!loading && result && (
                <>
                  <ChevronRight size={8} className="text-zinc-400" />
                  <span className="text-volt-green">Recomendação</span>
                </>
              )}
            </div>

            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b-2 border-black/5 dark:border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl border border-black/10 dark:border-white/15 ${
                  theme === 'midnight' ? 'bg-purple-950/40 text-purple-400' : 'bg-purple-100 text-purple-600'
                }`}>
                  <Brain size={18} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-tight">Volt IA</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Consultor Financeiro</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto pr-0.5 space-y-4 py-2 cursor-default select-text">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="relative flex items-center justify-center">
                    {/* Pulsing neon circles */}
                    <div className="absolute w-16 h-16 rounded-full border-4 border-purple-500/10 animate-ping" />
                    <div className="absolute w-12 h-12 rounded-full border-4 border-purple-500/20 animate-pulse" />
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-black ${
                      theme === 'midnight' ? 'bg-purple-950 text-purple-400' : 'bg-purple-500 text-white'
                    }`}>
                      <RefreshCw size={18} className="animate-spin" />
                    </div>
                  </div>
                  <div className="space-y-1 px-4">
                    <p className="text-xs font-black uppercase tracking-wider text-purple-500 dark:text-purple-400">Processando Inteligência</p>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={loadingStep}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className={`text-xs font-bold ${theme === 'midnight' ? 'text-zinc-400' : 'text-gray-600'}`}
                      >
                        {LOADING_STEPS[loadingStep]}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
              ) : error ? (
                <div className="p-4 rounded-xl border-2 border-dashed border-red-500/50 bg-red-500/5 text-center space-y-3">
                  <span className="text-2xl">⚠️</span>
                  <p className="text-xs font-bold text-red-500 dark:text-red-400">{error}</p>
                  <button
                    onClick={fetchAnalysis}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:opacity-90 active:scale-95 transition-all cursor-pointer ${
                      theme === 'midnight' ? 'bg-zinc-800 text-white' : 'bg-red-100 text-black'
                    }`}
                  >
                    Tentar Novamente
                  </button>
                </div>
              ) : result ? (
                <div className="space-y-4">
                  {/* Total spent warning card */}
                  <div className={`p-3 rounded-xl border border-black/10 dark:border-white/10 flex items-center justify-between ${
                    theme === 'midnight' ? 'bg-zinc-900/40' : 'bg-gray-50'
                  }`}>
                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Histórico Analisado</span>
                    <span className="text-xs font-black text-red-500">
                      -{totalExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                  {/* Spending Patterns Box */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-zinc-500">
                      <Brain size={14} className="text-purple-500" />
                      Análise de Padrões
                    </h4>
                    <div className={`p-4 rounded-xl border-2 border-black leading-relaxed text-xs font-bold ${
                      theme === 'midnight'
                        ? 'bg-zinc-900/60 text-zinc-200 border-zinc-800'
                        : 'bg-white text-gray-800'
                    }`}>
                      {result.analysis}
                    </div>
                  </div>

                  {/* Actionable Tip Box */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-purple-500">
                      <Lightbulb size={14} />
                      Dica Inteligente para Economizar
                    </h4>
                    <div className={`p-4 rounded-xl border-2 border-black leading-relaxed text-xs font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                      theme === 'midnight'
                        ? 'bg-purple-950/20 text-purple-300 border-purple-500/50 shadow-purple-500/20'
                        : 'bg-purple-50 text-purple-900 border-purple-600 shadow-[3px_3px_0px_0px_rgba(147,51,234,1)]'
                    }`}>
                      {result.actionableTip}
                    </div>
                  </div>

                  {result.demoMode && (
                    <div className="text-[9px] font-bold text-center text-zinc-500 dark:text-zinc-400 mt-2 uppercase tracking-wide">
                      ⚡ Rodando em modo de demonstração.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-zinc-500">Nenhum dado disponível.</div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-black/5 dark:border-white/5 flex gap-2 shrink-0">
              {result && !loading && (
                <button
                  onClick={fetchAnalysis}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-black flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 ${
                    theme === 'midnight' ? 'bg-zinc-900 text-white' : 'bg-white text-black'
                  }`}
                >
                  <RefreshCw size={12} />
                  Atualizar Análise
                </button>
              )}
              <button
                onClick={onClose}
                className={`py-2.5 px-6 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer active:scale-95 ${
                  theme === 'midnight'
                    ? 'bg-[#00FF9D] text-black border-black hover:opacity-90'
                    : 'bg-[#A2FF00] text-black border-black hover:opacity-90'
                }`}
              >
                Entendido!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
