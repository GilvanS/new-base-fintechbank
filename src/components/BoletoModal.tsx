import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ChevronDown, ChevronUp, AlertCircle, Calendar, Check, 
  ArrowLeft, ArrowRight, ShieldCheck, Lock, Landmark, 
  User, CheckCircle2, RefreshCw, Sparkles, Copy, CalendarDays,
  Zap, Keyboard
} from 'lucide-react';
import { Transaction } from '../types';

interface BoletoModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountBalance: number;
  onTransactionComplete: (newTx: Transaction, amount: number) => void;
  theme?: 'yellow' | 'midnight';
}

type BoletoStep = 'scan_camera' | 'input_barcode' | 'boleto_info' | 'confirm_payment';

export default function BoletoModal({ 
  isOpen, 
  onClose, 
  accountBalance, 
  onTransactionComplete,
  theme = 'yellow'
}: BoletoModalProps) {
  const isMidnight = theme === 'midnight';

  // Navigation steps
  const [step, setStep] = useState<BoletoStep>('scan_camera');
  
  // Input states
  const [rawBarcode, setRawBarcode] = useState('34198862666531252277792218900006890430000039322');
  const [description, setDescription] = useState('Test Automated 473');
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);
  const [showAttentionModal, setShowAttentionModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<'26/08/2024' | 'hoje'>('26/08/2024');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Success state after final approval
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Format barcode helper
  const formatBoletoCode = (raw: string): string => {
    const digits = raw.replace(/\D/g, '').slice(0, 47);
    if (digits.length === 0) return '';
    
    let result = '';
    
    // Group 1: 34198.86266
    if (digits.length > 0) {
      const part1 = digits.slice(0, 5);
      const part2 = digits.slice(5, 10);
      result += part1;
      if (part2.length > 0) {
        result += '.' + part2;
      }
    }
    
    // Group 2: 65312.522777
    if (digits.length > 10) {
      const part1 = digits.slice(10, 15);
      const part2 = digits.slice(15, 21);
      result += ' ' + part1;
      if (part2.length > 0) {
        result += '.' + part2;
      }
    }
    
    // Group 3: 92218.900006
    if (digits.length > 21) {
      const part1 = digits.slice(21, 26);
      const part2 = digits.slice(26, 32);
      result += '\n' + part1;
      if (part2.length > 0) {
        result += '.' + part2;
      }
    }
    
    // Group 4: 8
    if (digits.length > 32) {
      result += ' ' + digits.slice(32, 33);
    }
    
    // Group 5: 90430000039322
    if (digits.length > 33) {
      result += '\n' + digits.slice(33, 47);
    }
    
    return result;
  };

  // Keyboard keys data
  const keyboardKeys = [
    { main: '1', sub: ' ' },
    { main: '2', sub: 'ABC' },
    { main: '3', sub: 'DEF' },
    { main: '—', isSpecial: true, action: 'dash' },
    
    { main: '4', sub: 'GHI' },
    { main: '5', sub: 'JKL' },
    { main: '6', sub: 'MNO' },
    { main: '␣', isSpecial: true, action: 'space' },
    
    { main: '7', sub: 'PQRS' },
    { main: '8', sub: 'TUV' },
    { main: '9', sub: 'WXYZ' },
    { main: '⌫', isSpecial: true, action: 'backspace' },
    
    { main: '* #', isSpecial: true, action: 'symbols' },
    { main: '0', sub: '+' },
    { main: ',', isSpecial: true, action: 'comma' },
    { main: '✓', isSpecial: true, action: 'submit' },
  ];

  const handleKeyPress = (key: typeof keyboardKeys[0]) => {
    if (key.isSpecial) {
      if (key.action === 'backspace') {
        setRawBarcode(prev => prev.slice(0, -1));
      } else if (key.action === 'submit') {
        handleProceedFromInput();
      } else if (key.action === 'space') {
        // Ignored for raw numeric typing, but can add space
      }
      return;
    }
    
    if (rawBarcode.length < 47) {
      setRawBarcode(prev => prev + key.main);
    }
  };

  const handleProceedFromInput = () => {
    if (rawBarcode.length < 10) {
      alert('Por favor, digite um código de barras válido.');
      return;
    }
    setStep('boleto_info');
  };

  const handleConfirmPaymentInit = () => {
    setShowAttentionModal(true);
  };

  const handleFinalPaymentApproval = () => {
    setShowAttentionModal(false);
    setLoading(true);

    setTimeout(() => {
      // Create new transaction
      const now = new Date();
      const formatNumber = (num: number) => String(num).padStart(2, '0');
      const formattedDate = `${formatNumber(now.getDate())}/${formatNumber(now.getMonth() + 1)}/${now.getFullYear()}`;
      
      const weekdays = [
        'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
      ];

      const newTx: Transaction = {
        id: Math.random().toString(36).substring(2, 11),
        title: description.trim() || 'Pagamento de Boleto',
        amount: -393.22,
        type: 'expense',
        category: 'outros',
        date: now.toISOString(),
        formattedDate: `${weekdays[now.getDay()]}, ${formattedDate}`,
        time: `${formatNumber(now.getHours())}:${formatNumber(now.getMinutes())}`,
        note: `Boleto: Beneficiário Ambiente Homologação. Cód: ${rawBarcode.slice(0, 10)}...`
      };

      onTransactionComplete(newTx, -393.22);
      setLoading(false);
      setPaymentSuccess(true);
    }, 1500);
  };

  const handleCloseAll = () => {
    setStep('scan_camera');
    setRawBarcode('34198862666531252277792218900006890430000039322');
    setDescription('Test Automated 473');
    setPaymentSuccess(false);
    setShowAttentionModal(false);
    setSelectedDate('26/08/2024');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        
        {/* Main Phone Mockup Shell */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className={`relative w-full max-w-[410px] h-[780px] overflow-hidden flex flex-col select-none ${
            isMidnight 
              ? 'bg-[#1c1b1b] border-[10px] border-zinc-800 rounded-[45px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] text-[#e5e2e1] font-sans' 
              : 'bg-white border-[10px] border-black rounded-[45px] shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-black'
          }`}
          id="boleto-simulator-phone"
        >
          {/* Top Notch Area */}
          <div className={`absolute top-0 inset-x-0 h-7 flex items-center justify-between px-6 z-40 text-[10px] font-medium ${
            isMidnight ? 'bg-zinc-900 text-zinc-300' : 'bg-black text-white'
          }`}>
            <div className="flex items-center gap-1.5">
              <span>17:26</span>
              <div className={`w-2.5 h-2.5 rounded flex items-center justify-center text-[6px] font-bold font-mono scale-90 ${
                isMidnight ? 'bg-zinc-800 text-green-400' : 'bg-green-500 text-black'
              }`}>w</div>
              <div className={`w-2.5 h-2.5 rounded flex items-center justify-center text-[6px] font-bold font-mono scale-90 ${
                isMidnight ? 'bg-zinc-800 text-blue-400' : 'bg-blue-500 text-white'
              }`}>f</div>
            </div>
            
            {/* Center Camera Pill */}
            <div className={`w-20 h-4 rounded-full absolute left-1/2 -translate-x-1/2 top-1.5 flex items-center justify-center ${
              isMidnight ? 'bg-zinc-950' : 'bg-zinc-900'
            }`}>
              <div className={`w-2.5 h-2.5 rounded-full ${isMidnight ? 'bg-zinc-900 border border-zinc-800' : 'bg-zinc-800'}`} />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-bold">4G+</span>
              <div className={`w-5 h-2.5 border rounded-sm p-0.5 flex items-center ${isMidnight ? 'border-white/20' : 'border-white/40'}`}>
                <div className="h-full w-4/5 bg-white rounded-2xs" />
              </div>
            </div>
          </div>

          {/* Sub Header (Status / Carrier Info Bar) */}
          <div className={`h-6 mt-7 flex items-center justify-between px-4 text-[9px] font-bold tracking-wider uppercase shrink-0 ${
            isMidnight ? 'bg-[#1c1b1b] border-b border-zinc-800 text-[#b9cbbc]' : 'bg-white border-b border-black text-black'
          }`}>
            <span>VOLTCONTA</span>
            <div className="flex gap-2 items-center">
              <span>ALARM SET</span>
              <div className={`w-1.5 h-1.5 rounded-full ${isMidnight ? 'bg-green-500' : 'bg-red-600'}`} />
            </div>
          </div>

          {/* Core App View Container */}
          <div className={`flex-1 flex flex-col overflow-y-auto relative pb-12 ${
            isMidnight ? 'bg-[#131313]' : 'bg-white'
          }`}>
            
            {/* SUCCESS SCREEN */}
            {paymentSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 p-6 flex flex-col items-center justify-center text-center gap-6"
              >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${
                  isMidnight 
                    ? 'bg-[#00ff9d]/10 border-4 border-[#00ff9d] text-[#00ff9d] shadow-green-500/20' 
                    : 'bg-[#A2FF00] border-4 border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                }`}>
                  <CheckCircle2 size={44} className="stroke-[2.5]" />
                </div>
                <div className="space-y-2">
                  <h3 className={`text-xl font-extrabold ${isMidnight ? 'text-[#e5e2e1]' : 'text-black font-display'}`}>
                    Pagamento Confirmado!
                  </h3>
                  <p className={`text-sm px-4 leading-relaxed ${isMidnight ? 'text-[#b9cbbc]' : 'text-zinc-600 font-bold'}`}>
                    Seu boleto no valor de <strong className={isMidnight ? 'text-[#00ff9d]' : 'text-black font-black'}>R$ 393,22</strong> foi pago com sucesso usando seu saldo VoltConta.
                  </p>
                </div>

                <div className={`w-full p-4 text-left space-y-3 rounded-2xl ${
                  isMidnight 
                    ? 'bg-[#201f1f] border border-zinc-800 text-[#e5e2e1]' 
                    : 'bg-[#FFED86] border-2 border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                }`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className={`uppercase font-black ${isMidnight ? 'text-[#b9cbbc]' : 'text-black/60'}`}>Beneficiário</span>
                    <span className="font-extrabold truncate max-w-[200px]">Beneficiário Ambiente Homologação</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className={`uppercase font-black ${isMidnight ? 'text-[#b9cbbc]' : 'text-black/60'}`}>Valor</span>
                    <span className="font-extrabold text-sm">R$ 393,22</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className={`uppercase font-black ${isMidnight ? 'text-[#b9cbbc]' : 'text-black/60'}`}>Data de Débito</span>
                    <span className="font-extrabold">{selectedDate === 'hoje' ? 'Hoje' : selectedDate}</span>
                  </div>
                  <div className={`flex justify-between items-center text-xs pt-2 border-t border-dashed ${
                    isMidnight ? 'border-zinc-800' : 'border-black'
                  }`}>
                    <span className={`uppercase font-black ${isMidnight ? 'text-[#b9cbbc]' : 'text-black/60'}`}>Código Autenticação</span>
                    <span className="font-mono text-[10px]">VOLT-PAY-88274619</span>
                  </div>
                </div>

                <button
                  onClick={handleCloseAll}
                  className={
                    isMidnight
                      ? "w-full py-4 bg-[#00ff9d] text-zinc-950 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-[#00e087] transition-all transform active:scale-95 cursor-pointer shadow-lg shadow-green-500/10 mt-4"
                      : "w-full py-4 bg-[#A2FF00] text-black border-2 border-black rounded-xl font-display font-black text-sm uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer mt-4"
                  }
                >
                  Fechar
                </button>
              </motion.div>
            ) : (
              <>
                {/* SCREEN 0: Scan Camera (Leitor de código de barras) */}
                {step === 'scan_camera' && (
                  <div className="flex-grow flex flex-col h-full bg-zinc-950 text-white">
                    {/* Top Action Navbar */}
                    <div className="h-14 flex items-center justify-between px-4 shrink-0 border-b border-zinc-800 bg-zinc-900/50">
                      <div className="flex items-center">
                        <button 
                          onClick={onClose}
                          className="p-2 -ml-2 rounded-full text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <ArrowLeft size={22} className="stroke-[2.5]" />
                        </button>
                        <h2 className="ml-3 font-extrabold text-base font-display">
                          Pagar com Código
                        </h2>
                      </div>
                      
                      {/* Simulating Flash Toggle */}
                      <button className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer">
                        <Zap size={20} />
                      </button>
                    </div>

                    {/* Camera view content */}
                    <div className="flex-1 flex flex-col p-6 items-center justify-center relative overflow-hidden">
                      {/* Camera simulator backdrop & frame */}
                      <div className="absolute inset-0 bg-radial from-transparent to-zinc-950/90 z-0 pointer-events-none" />
                      
                      {/* Scanning Box container */}
                      <div className="w-full aspect-[4/3] max-w-[280px] rounded-2xl relative border-2 border-dashed border-zinc-700/60 flex items-center justify-center bg-black/40 z-10 overflow-hidden shadow-inner">
                        {/* Target Frame Corners */}
                        <div className="absolute top-2 left-2 w-5 h-5 border-t-4 border-l-4 border-[#00ff9d] rounded-tl-md" />
                        <div className="absolute top-2 right-2 w-5 h-5 border-t-4 border-r-4 border-[#00ff9d] rounded-tr-md" />
                        <div className="absolute bottom-2 left-2 w-5 h-5 border-b-4 border-l-4 border-[#00ff9d] rounded-bl-md" />
                        <div className="absolute bottom-2 right-2 w-5 h-5 border-b-4 border-r-4 border-[#00ff9d] rounded-br-md" />

                        {/* Scanner Laser Animation line */}
                        <motion.div 
                          animate={{ 
                            top: ['10%', '90%', '10%'] 
                          }}
                          transition={{ 
                            duration: 2.5, 
                            repeat: Infinity, 
                            ease: 'easeInOut' 
                          }}
                          className="absolute inset-x-4 h-0.5 bg-red-500 shadow-[0_0_10px_2px_rgba(239,68,68,0.8)] z-20"
                        />

                        {/* Animated dummy barcode graphic inside */}
                        <div className="opacity-40 flex flex-col items-center gap-1.5 transform scale-90">
                          <div className="flex gap-1">
                            <span className="w-1 h-14 bg-white" />
                            <span className="w-2 h-14 bg-white" />
                            <span className="w-0.5 h-14 bg-white" />
                            <span className="w-3 h-14 bg-white" />
                            <span className="w-1.5 h-14 bg-white" />
                            <span className="w-1 h-14 bg-white" />
                            <span className="w-2.5 h-14 bg-white" />
                            <span className="w-0.5 h-14 bg-white" />
                            <span className="w-1 h-14 bg-white" />
                            <span className="w-3 h-14 bg-white" />
                            <span className="w-1.5 h-14 bg-white" />
                            <span className="w-1 h-14 bg-white" />
                          </div>
                          <span className="font-mono text-[8px] tracking-widest text-zinc-400">34198.86266 ... 39322</span>
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className="mt-8 text-center space-y-2 z-10 px-2">
                        <p className="text-sm font-extrabold text-zinc-100">
                          Posicione o código de barras na área demarcada
                        </p>
                        <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                          A leitura do boleto é feita automaticamente com a sua câmera.
                        </p>
                      </div>

                      {/* Simulation helpers */}
                      <div className="mt-6 flex flex-col items-center gap-2 z-10 w-full px-4">
                        <button
                          onClick={() => setStep('boleto_info')}
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-[#00ff9d] rounded-full text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 border border-zinc-700"
                        >
                          <Sparkles size={14} /> Simular Leitura com Sucesso
                        </button>
                      </div>
                    </div>

                    {/* Footer bottom menu options */}
                    <div className="p-6 bg-zinc-900 border-t border-zinc-800 shrink-0 flex flex-col items-center gap-4">
                      <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">
                        Não consegue ler o código?
                      </span>
                      
                      <button
                        onClick={() => setStep('input_barcode')}
                        className="w-full py-4 bg-zinc-800 border border-zinc-700 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-zinc-700 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Keyboard size={18} />
                        Digitar código de barras
                      </button>
                    </div>
                  </div>
                )}

                {/* SCREEN 1: Input Barcode (Digite o código de barras) */}
                {step === 'input_barcode' && (
                  <div className="flex-grow flex flex-col">
                    {/* Top Action Navbar */}
                    <div className={`h-14 flex items-center px-4 shrink-0 border-b ${
                      isMidnight ? 'bg-[#1c1b1b] border-zinc-800 text-[#e5e2e1]' : 'bg-white border-black border-b-2 text-black'
                    }`}>
                      <button 
                        onClick={() => setStep('scan_camera')}
                        className={`p-2 -ml-2 rounded-full transition-colors cursor-pointer ${
                          isMidnight ? 'text-[#e5e2e1] hover:bg-zinc-800' : 'text-black hover:bg-zinc-100'
                        }`}
                      >
                        <ArrowLeft size={22} className="stroke-[2.5]" />
                      </button>
                      <h2 className={`ml-3 font-extrabold text-base ${isMidnight ? 'font-sans text-[#e5e2e1]' : 'font-display text-black'}`}>
                        Pagamento de Boleto
                      </h2>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-grow flex flex-col gap-6">
                      <div className="space-y-1">
                        <h3 className={`text-xl font-extrabold leading-tight ${isMidnight ? 'text-[#e5e2e1]' : 'text-black font-display'}`}>
                          Digite o código de barras
                        </h3>
                        <p className={`text-[11px] font-bold tracking-wide uppercase ${isMidnight ? 'text-[#b9cbbc]' : 'text-zinc-500'}`}>
                          Boleto Bancário ou Concessionária
                        </p>
                      </div>

                      {/* Code Input Display Area */}
                      <div className={`relative py-3 pr-8 min-h-[90px] flex items-center border-b ${
                        isMidnight ? 'border-[#00ff9d]' : 'border-black border-b-4'
                      }`}>
                        <div className={`font-mono text-base font-extrabold tracking-widest whitespace-pre-line leading-relaxed ${
                          isMidnight ? 'text-[#e5e2e1]' : 'text-black'
                        }`}>
                          {rawBarcode ? formatBoletoCode(rawBarcode) : (
                            <span className={isMidnight ? 'text-zinc-600 font-sans tracking-normal font-normal' : 'text-zinc-400 font-sans tracking-normal font-normal'}>
                              00000.00000 00000.000000...
                            </span>
                          )}
                        </div>
                        {rawBarcode && (
                          <button 
                            onClick={() => setRawBarcode('')}
                            className={`absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-full cursor-pointer transition-colors ${
                              isMidnight ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
                            }`}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>

                      {/* Helpful Prefill Hint */}
                      <div className={`p-3 flex justify-between items-center rounded-2xl ${
                        isMidnight 
                          ? 'bg-[#201f1f] border border-zinc-800' 
                          : 'bg-[#FFED86] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      }`}>
                        <div className="flex flex-col">
                          <span className={`text-[10px] font-black uppercase ${isMidnight ? 'text-[#b9cbbc]' : 'text-black/60'}`}>Exemplo Homologado</span>
                          <span className={`text-xs font-extrabold ${isMidnight ? 'text-[#e5e2e1]' : 'text-black'}`}>Boleto de R$ 393,22</span>
                        </div>
                        <button
                          onClick={() => setRawBarcode('34198862666531252277792218900006890430000039322')}
                          className={
                            isMidnight
                              ? "px-3 py-1.5 bg-[#00ff9d]/15 hover:bg-[#00ff9d]/25 text-[#00ff9d] border border-[#00ff9d]/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                              : "px-3 py-1.5 bg-[#00E5FF] border-2 border-black text-black rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                          }
                        >
                          Carregar
                        </button>
                      </div>

                      <div className="flex-grow" />

                      {/* Continuar button */}
                      <button
                        onClick={handleProceedFromInput}
                        className={
                          isMidnight
                            ? "w-full py-4 bg-[#00ff9d] text-zinc-950 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-[#00e087] transition-all transform active:scale-95 cursor-pointer shrink-0 shadow-lg shadow-green-500/10"
                            : "w-full py-4 bg-[#A2FF00] text-black border-2 border-black rounded-xl font-display font-black text-sm uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer shrink-0"
                        }
                      >
                        Continuar
                      </button>
                    </div>

                    {/* CUSTOM DIGITAL KEYPAD */}
                    <div className={`p-3 grid grid-cols-4 gap-2.5 shrink-0 border-t ${
                      isMidnight ? 'bg-[#131313] border-zinc-800 shadow-2xl' : 'bg-[#FFD700] border-black border-t-2 shadow-2xl'
                    }`}>
                      {keyboardKeys.map((key, index) => {
                        let keyClass = '';
                        if (isMidnight) {
                          if (key.action === 'submit') {
                            keyClass = 'bg-[#00ff9d] text-zinc-950 font-bold';
                          } else if (key.isSpecial) {
                            keyClass = 'bg-[#201f1f] hover:bg-[#2a2a2a] border border-zinc-800 text-[#00ff9d] font-bold';
                          } else {
                            keyClass = 'bg-[#1c1b1b] hover:bg-[#2a2a2a] border border-zinc-800 text-[#e5e2e1] font-medium';
                          }
                        } else {
                          if (key.action === 'submit') {
                            keyClass = 'bg-[#A2FF00] border-2 border-black text-black font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]';
                          } else if (key.isSpecial) {
                            keyClass = 'bg-[#00E5FF] border-2 border-black text-black font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]';
                          } else {
                            keyClass = 'bg-white border-2 border-black text-black font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]';
                          }
                        }

                        return (
                          <button
                            key={index}
                            onClick={() => handleKeyPress(key)}
                            className={`h-11 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
                              isMidnight ? 'active:scale-95' : ''
                            } ${keyClass}`}
                          >
                            <span className="text-sm font-extrabold tracking-wide">{key.main}</span>
                            {key.sub && key.sub.trim() && (
                              <span className={`text-[8px] -mt-0.5 font-bold ${isMidnight ? 'text-[#b9cbbc]/50' : 'text-black/50'}`}>{key.sub}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SCREEN 2: Boleto Info (Informações do boleto) */}
                {step === 'boleto_info' && (
                  <div className="flex-grow flex flex-col">
                    {/* Top Navbar */}
                    <div className={`h-14 flex items-center px-4 shrink-0 border-b ${
                      isMidnight ? 'bg-[#1c1b1b] border-zinc-800 text-[#e5e2e1]' : 'bg-white border-black border-b-2 text-black'
                    }`}>
                      <button 
                        onClick={() => setStep('input_barcode')}
                        className={`p-2 -ml-2 rounded-full transition-colors cursor-pointer ${
                          isMidnight ? 'text-[#e5e2e1] hover:bg-zinc-800' : 'text-black hover:bg-zinc-100'
                        }`}
                      >
                        <ArrowLeft size={22} className="stroke-[2.5]" />
                      </button>
                      <h2 className={`ml-3 font-extrabold text-base ${isMidnight ? 'font-sans text-[#e5e2e1]' : 'font-display text-black'}`}>
                        Informações do Boleto
                      </h2>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-grow overflow-y-auto space-y-6">
                      
                      {/* Giant Payment Value Section */}
                      <div className={`space-y-1 py-4 border-b ${
                        isMidnight ? 'border-zinc-800' : 'border-black border-b-2'
                      }`}>
                        <span className={`text-xs font-bold uppercase tracking-wider ${isMidnight ? 'text-[#b9cbbc]' : 'text-zinc-500'}`}>
                          Valor do pagamento
                        </span>
                        <div className={`text-4xl font-extrabold tracking-tight flex items-baseline ${isMidnight ? 'text-[#e5e2e1]' : 'text-black'}`}>
                          <span className={`text-2xl mr-1 font-bold ${isMidnight ? 'text-[#00ff9d]' : 'text-zinc-400'}`}>R$</span>
                          393,22
                        </div>
                      </div>

                      {/* Header summary list */}
                      <div className="space-y-4">
                        <div className={`flex justify-between items-start text-xs pb-3 border-b ${isMidnight ? 'border-zinc-800' : 'border-zinc-200'}`}>
                          <span className={`font-bold uppercase tracking-wide shrink-0 ${isMidnight ? 'text-[#b9cbbc]' : 'text-zinc-500'}`}>
                            Vencimento
                          </span>
                          <span className={`font-extrabold text-right ${isMidnight ? 'text-[#e5e2e1]' : 'text-black'}`}>
                            24/08/2024
                          </span>
                        </div>

                        <div className={`flex justify-between items-start text-xs pb-3 border-b ${isMidnight ? 'border-zinc-800' : 'border-zinc-200'}`}>
                          <span className={`font-bold uppercase tracking-wide shrink-0 ${isMidnight ? 'text-[#b9cbbc]' : 'text-zinc-500'}`}>
                            Beneficiário
                          </span>
                          <span className={`font-extrabold text-right max-w-[200px] leading-snug ${isMidnight ? 'text-[#e5e2e1]' : 'text-black'}`}>
                            Beneficiario Ambiente Homologacao
                          </span>
                        </div>

                        <div className={`flex justify-between items-start text-xs pb-3 border-b ${isMidnight ? 'border-zinc-800' : 'border-zinc-200'}`}>
                          <span className={`font-bold uppercase tracking-wide shrink-0 ${isMidnight ? 'text-[#b9cbbc]' : 'text-zinc-500'}`}>
                            Pagador
                          </span>
                          <span className={`font-extrabold text-right max-w-[200px] leading-snug ${isMidnight ? 'text-[#e5e2e1]' : 'text-black'}`}>
                            Pagador Ambiente De Homologacao
                          </span>
                        </div>
                      </div>

                      {/* Expandable detailed data block */}
                      <div className={`rounded-2xl overflow-hidden ${
                        isMidnight 
                          ? 'border border-zinc-800 bg-[#201f1f]' 
                          : 'border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      }`}>
                        <button
                          onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                          className={`w-full p-4 flex justify-between items-center font-extrabold text-xs uppercase tracking-wider cursor-pointer border-b ${
                            isMidnight 
                              ? 'bg-[#1c1b1b] border-zinc-800 text-[#e5e2e1]' 
                              : 'bg-[#FFED86] border-black border-b-2 text-black'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            📄 Dados do pagamento
                          </span>
                          {isDetailsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        <AnimatePresence>
                          {isDetailsExpanded && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className={`overflow-hidden text-[11px] divide-y ${
                                isMidnight ? 'divide-zinc-800' : 'divide-zinc-200'
                              }`}
                            >
                              <div className="p-4 space-y-3.5">
                                <div className="flex justify-between items-center">
                                  <span className={isMidnight ? 'text-[#b9cbbc] font-bold' : 'text-zinc-500 font-bold'}>Valor do Documento</span>
                                  <span className={`font-extrabold ${isMidnight ? 'text-[#e5e2e1]' : 'text-black'}`}>R$ 393,22</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className={isMidnight ? 'text-[#b9cbbc] font-bold' : 'text-zinc-500 font-bold'}>Valor do Título</span>
                                  <span className={`font-extrabold ${isMidnight ? 'text-[#e5e2e1]' : 'text-black'}`}>R$ 436,92</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className={isMidnight ? 'text-[#b9cbbc] font-bold' : 'text-zinc-500 font-bold'}>Descontos (-)</span>
                                  <span className="text-red-500 font-extrabold">- R$ 43,70</span>
                                </div>
                                
                                <div className="space-y-1 pt-1.5">
                                  <span className={`font-bold block ${isMidnight ? 'text-[#b9cbbc]' : 'text-zinc-500'}`}>Código de Barras</span>
                                  <span className={`font-mono font-bold leading-normal block break-all text-[10px] ${
                                    isMidnight ? 'text-[#00ff9d]' : 'text-black'
                                  }`}>
                                    34198862666531252277792218900006890430000039322
                                  </span>
                                </div>

                                <div className="space-y-1 pt-1.5">
                                  <span className={`font-bold block ${isMidnight ? 'text-[#b9cbbc]' : 'text-zinc-500'}`}>Dados do Beneficiário</span>
                                  <span className={`font-extrabold block ${isMidnight ? 'text-[#e5e2e1]' : 'text-black'}`}>Beneficiario Ambiente Homologacao</span>
                                  <span className={isMidnight ? 'text-[#b9cbbc]/70' : 'text-zinc-500'}>13.935.893/0001-09</span>
                                </div>

                                <div className="space-y-1 pt-1.5">
                                  <span className={`font-bold block ${isMidnight ? 'text-[#b9cbbc]' : 'text-zinc-500'}`}>Dados do Pagador</span>
                                  <span className={`font-extrabold block ${isMidnight ? 'text-[#e5e2e1]' : 'text-black'}`}>Pagador Ambiente De Homologacao</span>
                                  <span className={isMidnight ? 'text-[#b9cbbc]/70' : 'text-zinc-500'}>13.935.893/0001-09</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Bottom Button */}
                      <div className="pt-4">
                        <button
                          onClick={() => setStep('confirm_payment')}
                          className={
                            isMidnight
                              ? "w-full py-4 bg-[#00ff9d] text-zinc-950 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-[#00e087] transition-all transform active:scale-95 cursor-pointer shadow-lg shadow-green-500/10"
                              : "w-full py-4 bg-[#A2FF00] text-black border-2 border-black rounded-xl font-display font-black text-sm uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                          }
                        >
                          Continuar
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                {/* SCREEN 3: Payment Confirmation (Confirmação pagamento) */}
                {step === 'confirm_payment' && (
                  <div className="flex-grow flex flex-col">
                    {/* Top Navbar */}
                    <div className={`h-14 flex items-center px-4 shrink-0 border-b ${
                      isMidnight ? 'bg-[#1c1b1b] border-zinc-800 text-[#e5e2e1]' : 'bg-white border-black border-b-2 text-black'
                    }`}>
                      <button 
                        onClick={() => setStep('boleto_info')}
                        className={`p-2 -ml-2 rounded-full transition-colors cursor-pointer ${
                          isMidnight ? 'text-[#e5e2e1] hover:bg-zinc-800' : 'text-black hover:bg-zinc-100'
                        }`}
                      >
                        <ArrowLeft size={22} className="stroke-[2.5]" />
                      </button>
                      <h2 className={`ml-3 font-extrabold text-base ${isMidnight ? 'font-sans text-[#e5e2e1]' : 'font-display text-black'}`}>
                        Confirmação de Pagamento
                      </h2>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-grow overflow-y-auto space-y-5">
                      
                      {/* Header Payment Value block */}
                      <div className={`space-y-1 py-3 border-b ${
                        isMidnight ? 'border-zinc-800' : 'border-black border-b-2'
                      }`}>
                        <span className={`text-[10px] font-black uppercase tracking-wider block ${isMidnight ? 'text-[#b9cbbc]' : 'text-zinc-500'}`}>
                          Valor do pagamento
                        </span>
                        <span className={`text-3xl font-black tracking-tight block ${isMidnight ? 'text-[#e5e2e1]' : 'text-black'}`}>
                          R$ 393,22
                        </span>
                      </div>

                      {/* Detail list rows */}
                      <div className="space-y-3.5">
                        <div className={`flex justify-between items-start text-xs pb-2.5 border-b ${isMidnight ? 'border-zinc-800' : 'border-zinc-200'}`}>
                          <span className={isMidnight ? 'text-[#b9cbbc] font-bold' : 'text-zinc-500 font-bold'}>Vencimento</span>
                          <span className={`font-extrabold ${isMidnight ? 'text-[#e5e2e1]' : 'text-black'}`}>24/08/2024</span>
                        </div>

                        <div className={`flex justify-between items-start text-xs pb-2.5 border-b ${isMidnight ? 'border-zinc-800' : 'border-zinc-200'}`}>
                          <span className={isMidnight ? 'text-[#b9cbbc] font-bold' : 'text-zinc-500 font-bold'}>Beneficiário</span>
                          <span className={`font-extrabold text-right max-w-[200px] leading-snug ${isMidnight ? 'text-[#e5e2e1]' : 'text-black'}`}>Beneficiario Ambiente Homologacao</span>
                        </div>

                        <div className={`flex justify-between items-start text-xs pb-2.5 border-b ${isMidnight ? 'border-zinc-800' : 'border-zinc-200'}`}>
                          <span className={isMidnight ? 'text-[#b9cbbc] font-bold' : 'text-zinc-500 font-bold'}>Pagador</span>
                          <span className={`font-extrabold text-right max-w-[200px] leading-snug ${isMidnight ? 'text-[#e5e2e1]' : 'text-black'}`}>Pagador Ambiente De Homologacao</span>
                        </div>

                        <div className={`flex justify-between items-center text-xs pb-2.5 border-b ${isMidnight ? 'border-zinc-800' : 'border-zinc-200'}`}>
                          <span className={isMidnight ? 'text-[#b9cbbc] font-bold' : 'text-zinc-500 font-bold'}>Pagar Com</span>
                          <span className={`font-extrabold flex items-center gap-1 ${isMidnight ? 'text-[#e5e2e1]' : 'text-black'}`}>
                            💳 VoltConta
                          </span>
                        </div>

                        {/* Interactive Date Agendamento Row */}
                        <div className={`flex justify-between items-center text-xs pb-2.5 border-b ${isMidnight ? 'border-zinc-800' : 'border-zinc-200'}`}>
                          <span className={isMidnight ? 'text-[#b9cbbc] font-bold' : 'text-zinc-500 font-bold'}>Agendado Para</span>
                          <div className="relative">
                            <button
                              onClick={() => setShowDatePicker(!showDatePicker)}
                              className={`font-extrabold underline border-dashed cursor-pointer flex items-center gap-1 ${
                                isMidnight 
                                  ? 'text-[#00ff9d] border-[#00ff9d] hover:text-[#00ff9d]/80' 
                                  : 'text-blue-600 border-blue-600 hover:text-blue-800'
                              }`}
                            >
                              <CalendarDays size={13} />
                              {selectedDate === 'hoje' ? 'Hoje (Pagar Agora)' : '26/08/2024'}
                            </button>

                            {showDatePicker && (
                              <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl z-30 p-2 divide-y ${
                                isMidnight 
                                  ? 'bg-[#1c1b1b] border border-zinc-800 divide-zinc-800 text-[#e5e2e1]' 
                                  : 'bg-white border-2 border-black divide-zinc-200 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                              }`}>
                                <button
                                  onClick={() => {
                                    setSelectedDate('hoje');
                                    setShowDatePicker(false);
                                  }}
                                  className={`w-full text-left p-2.5 text-xs font-bold rounded-lg flex justify-between items-center ${
                                    isMidnight ? 'text-[#e5e2e1] hover:bg-zinc-800' : 'text-black hover:bg-zinc-100'
                                  }`}
                                >
                                  <span>Pagar Hoje</span>
                                  {selectedDate === 'hoje' && <Check size={14} className={isMidnight ? "text-[#00ff9d]" : "text-green-600"} />}
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedDate('26/08/2024');
                                    setShowDatePicker(false);
                                  }}
                                  className={`w-full text-left p-2.5 text-xs font-bold rounded-lg flex justify-between items-center ${
                                    isMidnight ? 'text-[#e5e2e1] hover:bg-zinc-800' : 'text-black hover:bg-zinc-100'
                                  }`}
                                >
                                  <span>Agendar (26/08/2024)</span>
                                  {selectedDate === '26/08/2024' && <Check size={14} className={isMidnight ? "text-[#00ff9d]" : "text-green-600"} />}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Warning box */}
                      <div className={
                        isMidnight
                          ? "bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 flex gap-3 text-amber-500 shadow-sm leading-relaxed"
                          : "bg-[#FFED86] border-2 border-black rounded-2xl p-4 flex gap-3 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] leading-relaxed"
                      }>
                        <span className="text-base font-extrabold">ⓘ</span>
                        <p className={`text-[11px] font-bold ${isMidnight ? 'text-amber-500/90' : 'text-black'}`}>
                          Os valores podem sofrer alterações caso o boleto possua juros, multa ou desconto.
                        </p>
                      </div>

                      {/* Description Optional Input */}
                      <div className="space-y-1.5 pt-1">
                        <label className={`text-[10px] font-black uppercase tracking-wider block ${isMidnight ? 'text-[#b9cbbc]' : 'text-black/60'}`}>
                          Descrição
                        </label>
                        <input
                          type="text"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Digite uma descrição opcional"
                          className={`w-full bg-transparent border-b-2 py-1.5 text-xs font-extrabold focus:outline-none transition-colors ${
                            isMidnight 
                              ? 'border-zinc-800 focus:border-[#00ff9d] text-[#e5e2e1]' 
                              : 'border-black focus:border-[#FF5C8D] text-black'
                          }`}
                        />
                        <span className={`text-[9px] font-bold block ${isMidnight ? 'text-[#b9cbbc]/60' : 'text-zinc-500'}`}>
                          Campo opcional, exibido no comprovante.
                        </span>
                      </div>

                      {/* Dropdown breakdown */}
                      <div className={`rounded-2xl overflow-hidden ${
                        isMidnight 
                          ? 'border border-zinc-800 bg-[#201f1f]' 
                          : 'border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      }`}>
                        <button
                          onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                          className={`w-full p-3.5 flex justify-between items-center font-extrabold text-[11px] uppercase tracking-wider cursor-pointer border-b ${
                            isMidnight 
                              ? 'bg-[#1c1b1b] border-zinc-800 text-[#e5e2e1]' 
                              : 'bg-[#FFED86] border-black border-b-2 text-black'
                          }`}
                        >
                          <span>📄 Detalhes do Pagamento</span>
                          {isDetailsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        <AnimatePresence>
                          {isDetailsExpanded && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className={`overflow-hidden text-[10px] divide-y ${
                                isMidnight ? 'divide-zinc-800' : 'divide-zinc-200'
                              }`}
                            >
                              <div className="p-3.5 space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className={isMidnight ? 'text-[#b9cbbc]' : 'text-zinc-500'}>VALOR DO DOCUMENTO</span>
                                  <span className={`font-extrabold ${isMidnight ? 'text-[#e5e2e1]' : 'text-black'}`}>R$ 393,22</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className={isMidnight ? 'text-[#b9cbbc]' : 'text-zinc-500'}>VALOR DO TÍTULO</span>
                                  <span className={`font-extrabold ${isMidnight ? 'text-[#e5e2e1]' : 'text-black'}`}>R$ 436,92</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className={isMidnight ? 'text-[#b9cbbc]' : 'text-zinc-500'}>DESCONTOS</span>
                                  <span className="text-red-500 font-extrabold">- R$ 43,70</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Confirm payment button */}
                      <div className="pt-2">
                        <button
                          onClick={handleConfirmPaymentInit}
                          className={
                            isMidnight
                              ? "w-full py-4 bg-[#00ff9d] text-zinc-950 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-[#00e087] transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-green-500/10"
                              : "w-full py-4 bg-[#A2FF00] text-black border-2 border-black rounded-xl font-display font-black text-sm uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center justify-center gap-2"
                          }
                        >
                          {loading ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : 'Confirmar pagamento'}
                        </button>
                      </div>

                    </div>
                  </div>
                )}
              </>
            )}

          </div>

          {/* ATTENTION DIALOG OVERLAY (Image 3) */}
          <AnimatePresence>
            {showAttentionModal && (
              <>
                {/* Backdrop inside phone scope */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAttentionModal(false)}
                  className="absolute inset-0 bg-black/60 z-40 rounded-[35px]"
                />

                {/* Modal Container */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 30 }}
                  transition={{ type: 'spring', duration: 0.4 }}
                  className={`absolute bottom-6 inset-x-6 z-50 flex flex-col items-center gap-5 text-center p-6 ${
                    isMidnight 
                      ? 'bg-[#1c1b1b] border border-zinc-800 rounded-[32px] text-[#e5e2e1] shadow-2xl' 
                      : 'bg-white border-4 border-black rounded-[32px] text-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  {/* Warning Red Circle Icon */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center border shrink-0 ${
                    isMidnight 
                      ? 'bg-red-950/20 border-red-500/30 text-red-500' 
                      : 'bg-[#FFED86] border-2 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                  }`}>
                    <span className="text-4xl font-extrabold font-display">!</span>
                  </div>

                  <div className="space-y-2">
                    <h3 className={`text-xl font-extrabold ${isMidnight ? '' : 'font-display'}`}>Atenção</h3>
                    <p className={`text-xs leading-relaxed font-bold px-1 ${isMidnight ? 'text-[#b9cbbc]' : 'text-zinc-600'}`}>
                      Se na data escolhida não houver saldo suficiente em conta, o pagamento não será efetivado.
                    </p>
                  </div>

                  <div className="w-full flex flex-col gap-2.5">
                    {/* Ok red button */}
                    <button
                      onClick={handleFinalPaymentApproval}
                      className={
                        isMidnight
                          ? "w-full py-3.5 bg-[#00ff9d] text-zinc-950 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#00e087] transition-all transform active:scale-95 cursor-pointer shadow-lg shadow-green-500/10"
                          : "w-full py-3.5 bg-[#A2FF00] text-black border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                      }
                    >
                      Ok
                    </button>

                    {/* Voltar white text/dark button */}
                    <button
                      onClick={() => setShowAttentionModal(false)}
                      className={
                        isMidnight
                          ? "w-full py-3.5 bg-transparent text-[#00ff9d] hover:bg-[#00ff9d]/10 rounded-full font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                          : "w-full py-3.5 bg-transparent text-black border-2 border-black rounded-xl font-black text-xs uppercase tracking-wider hover:bg-zinc-100 transition-all cursor-pointer"
                      }
                    >
                      Voltar
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Android Bottom Mock Nav Bar */}
          <div className={`absolute bottom-0 inset-x-0 h-10 flex items-center justify-around z-40 text-white/40 ${
            isMidnight ? 'bg-zinc-950' : 'bg-black'
          }`}>
            <button className="p-2 active:text-white/80 transition-colors">
              <div className="w-3.5 h-3.5 border-b-2 border-l-2 border-white/40 rotate-45 transform translate-x-0.5" />
            </button>
            <button className="p-2 active:text-white/80 transition-colors">
              <div className="w-4 h-4 rounded-full border-2 border-white/40" />
            </button>
            <button className="p-2 active:text-white/80 transition-colors">
              <div className="w-3.5 h-3.5 border-2 border-white/40 rounded-xs" />
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
