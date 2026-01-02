
import React, { useState, useEffect, useRef } from 'react';
import { EnergyLevel, HistoryEntry, Reward } from './types';
import { PASSCODE, PREMIUM_CODE, TRACKS, SOS_OPTIONS, BADGES } from './constants';
import { GoogleGenAI } from "@google/genai";
import { 
  Zap, Calendar, Trophy, Settings, 
  Play, Pause, Lock, RotateCcw, 
  Music, Heart, X, CheckCircle2,
  Download, Upload, Trash2,
  Volume2, Sparkles, BrainCircuit,
  MessageCircle, ChevronRight, Star,
  Crown, ExternalLink, ShieldCheck
} from 'lucide-react';
const getStorage = <T,>(key: string, defaultValue: T): T => {
  const storageKey = `ps365_${key}`;
  const saved = localStorage.getItem(storageKey);

  if (!saved) return defaultValue;

  try {
    return JSON.parse(saved) as T;
  } catch (e) {
    // Si está corrupto (ej: "media" sin comillas), lo limpiamos y seguimos
    localStorage.removeItem(storageKey);
    return defaultValue;
  }
};

const setStorage = (key: string, value: any) => {
  localStorage.setItem(`ps365_${key}`, JSON.stringify(value));
};

const Card: React.FC<{ children: React.ReactNode; className?: string; id?: string }> = ({ children, className = "", id }) => (
  <div id={id} className={`glass-card rounded-3xl p-6 mb-5 transition-all duration-300 ${className}`}>
    {children}
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<'flow' | 'week' | 'awards' | 'premium'>('flow');
  const [auth, setAuth] = useState(getStorage('auth', false));
  const [isPremium, setIsPremium] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  useEffect(() => {
  localStorage.removeItem("ps365_isPremium");
}, []);
  const [passInput, setPassInput] = useState("");
  const [premiumInput, setPremiumInput] = useState("");
  const [username, setUsername] = useState(getStorage('username', ''));
  const [showWelcome, setShowWelcome] = useState(!getStorage('username', ''));
  const [energy, setEnergy] = useState<EnergyLevel>(getStorage('energy', null));
  const [missionAlpha, setMissionAlpha] = useState(getStorage('mission', ''));
  const [toast, setToast] = useState<{ message: string; icon: string } | null>(null);
  const [blocks, setBlocks] = useState(getStorage('blocks', [
    { id: 1, text: '', isCompleted: false },
    { id: 2, text: '', isCompleted: false },
    { id: 3, text: '', isCompleted: false },
    { id: 4, text: '', isCompleted: false },
  ]));
  const [history, setHistory] = useState<HistoryEntry[]>(getStorage('history', []));
  const [showSOS, setShowSOS] = useState(false);
  const [sosIndex, setSosIndex] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTimer, setActiveTimer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { setStorage('auth', auth); }, [auth]);
  useEffect(() => { setStorage('username', username); }, [username]);
  useEffect(() => { setStorage('energy', energy); }, [energy]);
  useEffect(() => { setStorage('mission', missionAlpha); }, [missionAlpha]);
  useEffect(() => { setStorage('blocks', blocks); }, [blocks]);
  useEffect(() => { setStorage('history', history); }, [history]);
useEffect(() => {
  const token = localStorage.getItem("ps365_premiumToken");
  if (!token) return;

  (async () => {
    try {
      const res = await fetch("/.netlify/functions/validate-premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      if (data?.ok === true) setIsPremium(true);
      else {
        setIsPremium(false);
        localStorage.removeItem("ps365_premiumToken");
      }
    } catch {
      // si falla la conexión, NO cambiamos estado
      // (evita desactivar premium solo por un error temporal)
    }
  })();
}, []);

  useEffect(() => {
    audioRef.current = new Audio();
    return () => { audioRef.current?.pause(); audioRef.current = null; };
  }, []);

  useEffect(() => {
    if (audioRef.current && currentTrack.src) {
      audioRef.current.src = currentTrack.src;
      if (isPlaying) audioRef.current.play().catch(e => console.log("Audio play blocked", e));
    }
  }, [currentTrack]);

  const showNotification = (message: string, icon: string) => {
    setToast({ message, icon });
    setTimeout(() => setToast(null), 4500);
  };

  const handleEnergySelect = (lv: EnergyLevel) => {
    setEnergy(lv);
    if (lv === 'baja') {
      showNotification("Detente. Escucha una frecuencia para elevar tu vibración antes de empezar.", "🌊");
      document.getElementById('music-player')?.scrollIntoView({ behavior: 'smooth' });
    } else if (lv === 'media') {
      showNotification("Equilibrio perfecto. Adelante, sigue con tu intención del día.", "✨");
    } else if (lv === 'alta') {
      showNotification("¡Aprovecha el flow! Programa tus acciones para hoy.", "🔥");
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(e => console.log("Audio play blocked", e));
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    let interval: any;
    if (activeTimer !== null && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && activeTimer !== null) {
      setActiveTimer(null);
      new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play();
      showNotification("¡Bloque completado! Regálate un respiro de sanación.", "🎉");
    }
    return () => clearInterval(interval);
  }, [activeTimer, timeLeft]);

  const startTimer = (id: number) => {
    if (activeTimer === id) setActiveTimer(null);
    else { 
      if (energy === 'baja') {
        showNotification("Tu energía es baja. Intenta elevarla primero con música para no procrastinar.", "⚠️");
      }
      setActiveTimer(id); 
      setTimeLeft(900); 
    }
  };

  const getAiGuidance = async () => {
    if (!missionAlpha) return alert("Define tu Misión Alpha primero.");
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Eres un experto en neurociencia y sanación de heridas de infancia. Genera una frase corta de empoderamiento cuántico para alguien cuya misión de hoy es "${missionAlpha}" y tiene energía "${energy}". Usa un tono compasivo y profesional.`,
      });
      setAiAdvice(response.text || "Tu intención es tu poder.");
    } catch (error) {
      setAiAdvice("El universo conspira a tu favor. Fluye.");
    } finally { setIsAiLoading(false); }
  };

  const handleAuth = () => {
    if (passInput === PASSCODE) setAuth(true);
    else alert("Clave de acceso incorrecta.");
  };

  const handlePremiumUnlock = async () => {
  try {
    const res = await fetch("/.netlify/functions/validate-premium", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: premiumInput.trim() }),
    });

    const data = await res.json();
	if (data?.ok === true) {
		// guardar token si viene
		  
    if (data?.token){localStorage.setItem("ps365_premiumToken", data.token);}

  setIsPremium(true);
  setView('flow');
  setPremiumInput('');
  alert("✨ Premium activado correctamente");
} else {
  alert("Código inválido. Revisa e inténtalo nuevamente.");
}

  } catch (e) {
    alert("Error de conexión con el servidor");
  }
};

  const closeDay = () => {
    if (window.confirm("¿Deseas cerrar el ciclo de hoy? Tu progreso se guardará en la bitácora.")) {
      const entry: HistoryEntry = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        mission: missionAlpha || "Sanación Libre",
        energy: energy,
        completedBlocks: blocks.filter(b => b.isCompleted).length
      };
      setHistory([entry, ...history]);
      setMissionAlpha('');
      setBlocks(blocks.map(b => ({ ...b, text: '', isCompleted: false })));
      setEnergy(null);
      setAiAdvice(null);
      setView('week');
    }
  };

  if (!auth) {
    return (
      <div className="min-h-screen bg-ps-dark flex flex-col items-center justify-center p-8 text-center animate-fade-up">
        <div className="w-24 h-24 bg-gradient-to-br from-ps-deep to-ps-lila rounded-[2.5rem] flex items-center justify-center mb-10 shadow-2xl shadow-ps-deep/40 border border-ps-soft/20">
          <BrainCircuit className="text-ps-mist w-12 h-12" />
        </div>
        <h1 className="font-serif text-4xl mb-3 text-ps-mist italic">Quantum Flow</h1>
        <h2 className="text-[10px] font-black text-ps-blue uppercase tracking-[0.4em] mb-12">Planner • PS365</h2>
        
        <p className="text-ps-muted text-xs mb-12 max-w-[260px] leading-relaxed opacity-80">
          Entra en tu santuario digital de reprogramación y soberanía personal.
        </p>

        <div className="w-full max-w-xs space-y-5">
          <input 
            type="password" 
            value={passInput}
            onChange={(e) => setPassInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
            className="bg-ps-deep/10 border border-ps-soft/20 rounded-2xl px-6 py-5 text-center text-3xl text-ps-mist focus:outline-none focus:border-ps-lila/50 w-full tracking-widest placeholder:text-ps-muted/30 placeholder:text-sm placeholder:tracking-normal"
            placeholder="CLAVE DE ACCESO"
          />
          <button onClick={handleAuth} className="w-full bg-ps-deep hover:bg-ps-lila transition-all text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl btn-glow">
            Iniciar Sanación
          </button>
        </div>
        
        <p className="fixed bottom-10 text-[8px] text-ps-muted font-bold uppercase tracking-[0.3em] opacity-40">ProyectoSana365 © 2025</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative overflow-hidden bg-ps-dark selection:bg-ps-lila/30">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100] animate-fade-up w-[90%] max-w-[320px]">
          <div className="bg-[#2a2a2e]/95 text-ps-mist px-6 py-4 rounded-[2rem] shadow-2xl border border-ps-soft/10 flex items-center gap-4 backdrop-blur-xl">
            <span className="text-2xl drop-shadow-md">{toast.icon}</span>
            <p className="text-[11px] font-semibold leading-relaxed tracking-wide">{toast.message}</p>
          </div>
        </div>
      )}

      {showWelcome && (
        <div className="fixed inset-0 z-[100] bg-ps-dark/95 backdrop-blur-3xl flex items-center justify-center p-6">
          <Card className="w-full text-center py-12 border-ps-lila/20 shadow-3xl">
            <div className="w-20 h-20 bg-ps-blue/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-ps-blue/20">
               <Heart className="text-ps-blue w-10 h-10 animate-pulse" />
            </div>
            <h2 className="font-serif text-3xl mb-4 text-ps-mist italic">Bienvenido al Flujo</h2>
            <p className="text-xs text-ps-muted mb-10 px-4 leading-relaxed font-medium">En <span className="text-ps-blue">Quantum Flow Planner</span> honramos tu proceso. ¿Cómo te gustaría que te llamemos?</p>
            <div className="px-4">
              <input 
                type="text" 
                placeholder="Tu nombre o alias..."
                className="bg-ps-mist/5 border border-ps-soft/20 rounded-2xl px-6 py-5 w-full text-center mb-8 text-ps-mist focus:outline-none focus:border-ps-blue/50 text-lg"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value;
                    if (val) { setUsername(val); setShowWelcome(false); }
                  }
                }}
              />
              <button onClick={() => {
                const val = (document.querySelector('input') as HTMLInputElement).value;
                if (val) { setUsername(val); setShowWelcome(false); }
              }} className="bg-ps-deep text-white w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl">Comenzar Ahora</button>
            </div>
          </Card>
        </div>
      )}

      <header className="px-6 py-6 flex justify-between items-center bg-ps-dark/80 backdrop-blur-xl sticky top-0 z-40 border-b border-ps-soft/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ps-deep to-ps-lila flex items-center justify-center text-white font-bold relative shadow-lg">
            {username[0]?.toUpperCase() || 'S'}
            {isPremium && <Crown size={14} className="absolute -top-1.5 -right-1.5 text-yellow-400 fill-yellow-400 drop-shadow" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-ps-blue uppercase tracking-[0.2em]">QUANTUM FLOW</span>
              {isPremium && <span className="bg-yellow-400/10 text-yellow-400 text-[8px] px-2 py-0.5 rounded-full font-black">PREMIUM</span>}
            </div>
            <p className="font-serif text-xl leading-tight text-ps-mist">{username}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSettings(true)} className="p-3 bg-ps-mist/5 rounded-2xl text-ps-muted hover:text-ps-mist transition-colors"><Settings size={20} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-32 pt-4">
        {view === 'premium' && (
    <div className="animate-fade-up">
      <Card className="border-ps-lila/20 bg-ps-mist/5">
        <h2 className="font-serif text-3xl text-ps-mist italic text-center mb-3">
          Activar Premium
        </h2>

        <p className="text-xs text-ps-muted text-center mb-8 leading-relaxed font-medium">
          Desbloquea todas las pistas de neuro-reprogramación Premium.
        </p>

        <a
          href="https://pay.hotmart.com/P103209773V?checkoutMode=10"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-ps-blue/15 hover:bg-ps-blue/25 text-ps-blue py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl"
        >
          <ExternalLink size={14} />
          Comprar Premium
        </a>

        <div className="mt-8 p-5 rounded-2xl bg-black/20 border border-white/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-ps-soft mb-3">
            Ya compré, tengo mi código
          </p>

          <input
            type="email"
            placeholder="Tu email de compra"
            className="bg-ps-dark/60 border border-ps-soft/10 rounded-2xl px-5 py-4 text-xs text-ps-mist focus:outline-none focus:border-ps-lila/50 w-full mb-3"
          />

          <input
            type="text"
            placeholder="Código Premium"
            value={premiumInput}
            onChange={(e) => setPremiumInput(e.target.value)}
            className="bg-ps-dark/60 border border-ps-soft/10 rounded-2xl px-5 py-4 text-xs text-ps-mist focus:outline-none focus:border-ps-lila/50 w-full"
          />

          <button
            onClick={handlePremiumUnlock}
            className="mt-4 bg-ps-lila text-ps-dark py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl btn-glow w-full"
          >
            Activar ahora
          </button>

          <button
            onClick={() => setView('flow')}
            className="mt-4 w-full text-[9px] text-ps-muted font-bold uppercase tracking-widest hover:underline"
          >
            Volver al Flow
          </button>
        </div>
      </Card>
    </div>
	 )}
		{view === 'flow' && (
          <div className="animate-fade-up">
            <div className="mb-8">
              <p className="text-[10px] font-bold text-ps-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles size={12} className="text-ps-blue" /> Estado Vibracional
              </p>
              <div className="flex gap-4">
                {(['baja', 'media', 'alta'] as EnergyLevel[]).map((lv) => (
                  <button
                    key={lv}
                    onClick={() => handleEnergySelect(lv)}
                    className={`flex-1 py-4 rounded-3xl border transition-all duration-500 text-xs font-semibold capitalize flex flex-col items-center gap-1.5
                      ${energy === lv 
                        ? 'bg-ps-lila/20 border-ps-lila/50 text-ps-mist shadow-xl shadow-ps-lila/5 scale-[1.02]' 
                        : 'bg-ps-muted/5 border-ps-soft/5 text-ps-muted hover:bg-ps-muted/10'}`}
                  >
                    <span className="text-2xl">{lv === 'baja' ? '🌊' : lv === 'media' ? '✨' : '🔥'}</span>
                    <span className="tracking-wide">{lv}</span>
                  </button>
                ))}
              </div>
            </div>

            <Card className="border-l-4 border-l-ps-blue bg-ps-blue/5">
              <h2 className="text-[10px] font-black text-ps-blue uppercase tracking-widest mb-4">Intención del Día</h2>
              <textarea 
                rows={2}
                value={missionAlpha}
                onChange={(e) => setMissionAlpha(e.target.value)}
                placeholder="Hoy elijo enfocarme en..."
                className="bg-transparent w-full text-2xl font-serif text-ps-mist focus:outline-none placeholder:text-ps-muted/20 resize-none leading-relaxed italic"
              />
              <div className="mt-6 pt-6 border-t border-ps-soft/10">
                {!aiAdvice ? (
                  <button onClick={getAiGuidance} disabled={isAiLoading} className="flex items-center justify-center gap-3 w-full py-3.5 bg-ps-blue/10 text-ps-blue rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-ps-blue/20 transition-all btn-glow">
                    {isAiLoading ? <RotateCcw className="animate-spin" size={14} /> : <BrainCircuit size={16} />}
                    Guía de Sanación
                  </button>
                ) : (
                  <div className="bg-ps-dark/40 p-5 rounded-2xl border border-ps-blue/10">
                    <p className="text-[11px] italic text-ps-blue leading-relaxed font-medium">"{aiAdvice}"</p>
                    <button onClick={() => setAiAdvice(null)} className="text-[9px] text-ps-muted mt-3 underline font-bold">Nueva guía cuántica</button>
                  </div>
                )}	
              </div>
            </Card>

            <div className="mb-10">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="font-serif text-2xl text-ps-mist">Acciones de Enfoque</h3>
                 <button onClick={closeDay} className="flex items-center gap-2 bg-ps-deep/20 text-ps-soft px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-ps-deep/30">
                   Cerrar Ciclo
                 </button>
               </div>
               <div className="space-y-5">
                 {blocks.map((block, idx) => (
                   <div key={block.id} className="flex items-center gap-5">
                     <button 
                       onClick={() => startTimer(block.id)}
                       className={`w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all shadow-xl
                         ${activeTimer === block.id ? 'bg-ps-sos text-white animate-pulse' : block.isCompleted ? 'bg-green-500/30 text-ps-soft border border-green-500/20' : 'bg-ps-deep/40 text-ps-soft border border-ps-deep/30'}`}
                     >
                       {activeTimer === block.id ? (
                         <span className="text-xs font-black">{Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}</span>
                       ) : block.isCompleted ? (
                         <CheckCircle2 size={28} />
                       ) : (
                         <Play size={26} fill="currentColor" className="ml-1" />
                       )}
                     </button>
                     <div className="flex-1 glass-card !mb-0 !p-5 rounded-3xl flex items-center gap-4 group">
                        <input 
                          type="text" 
                          value={block.text}
                          onChange={(e) => {
                            const newBlocks = [...blocks];
                            newBlocks[idx].text = e.target.value;
                            setBlocks(newBlocks);
                          }}
                          placeholder={`Paso de sanación ${idx + 1}...`}
                          className="bg-transparent flex-1 text-sm text-ps-mist focus:outline-none placeholder:text-ps-muted/30"
                        />
                        <input 
                          type="checkbox"
                          checked={block.isCompleted}
                          onChange={(e) => {
                            const newBlocks = [...blocks];
                            newBlocks[idx].isCompleted = e.target.checked;
                            setBlocks(newBlocks);
                          }}
                          className="w-7 h-7 rounded-xl accent-ps-lila cursor-pointer transition-transform active:scale-90"
                        />
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            <Card id="music-player" className="bg-gradient-to-br from-ps-deep/30 to-ps-dark border border-ps-lila/10 shadow-2xl scroll-mt-24">
              <div className="flex justify-between items-center mb-8">
                  <h3 className="text-[9px] font-black text-ps-lila uppercase tracking-[0.3em] mb-2">Neuro-Reprogramación</h3>
                  <p className="text-sm text-ps-mist font-semibold truncate w-48 leading-relaxed">{currentTrack.title}</p>
                </div>
                <button onClick={togglePlay} className="w-14 h-14 bg-ps-mist text-ps-dark rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform">
                  {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} className="ml-1" fill="currentColor" />}
                </button>              
              <div className="space-y-2">
                {TRACKS.map((t) => {
                  const locked = t.isLocked && !isPremium;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                       if (locked) {
                       setView('premium');
                       return;
                       }
                    setCurrentTrack(t);
                    }}			
                      className={`w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all duration-300
                        ${currentTrack.id === t.id ? 'bg-ps-mist/10 ring-1 ring-ps-mist/20' : 'hover:bg-ps-mist/5'}
                        ${locked ? 'opacity-30 cursor-pointer' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl ${currentTrack.id === t.id ? 'bg-ps-lila/30 text-ps-lila shadow-inner' : 'bg-ps-dark/50 text-ps-muted'}`}>
                          {locked ? <Lock size={14} /> : <Volume2 size={14} />}
                        </div>
                        <div>
                           <span className="text-[11px] font-bold block leading-none mb-1">{t.title}</span>
                           <span className="text-[9px] text-ps-muted font-medium opacity-60 uppercase tracking-tighter">{t.intent}</span>
                        </div>
                      </div>
                      {locked && <Star size={12} className="text-yellow-400 fill-yellow-400" />}
                    </button>
                  );
                })}
              </div>
            </Card>

            <div className="text-center py-10">
              <button 
                onClick={() => { setSosIndex(Math.floor(Math.random() * SOS_OPTIONS.length)); setShowSOS(true); }}
                className="group flex items-center justify-center gap-5 mx-auto bg-transparent border border-ps-sos/20 hover:border-ps-sos/40 text-ps-mist px-10 py-6 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.25em] transition-all active:scale-95 shadow-2xl shadow-ps-sos/5"
              >
                <div className="w-12 h-12 rounded-full bg-ps-sos flex items-center justify-center text-[10px] text-ps-soft font-black shadow-inner">SOS</div>
                <span className="font-bold uppercase tracking-widest text-[11px]">Necesito apoyo ahora</span>
              </button>
            </div>
          </div>
        )}

        {view === 'week' && (
          <div className="animate-fade-up">
            <h2 className="font-serif text-3xl mb-10 text-ps-mist italic">Bitácora de Sanación</h2>
            {history.length === 0 ? (
              <div className="text-center py-32 opacity-20">
                <Calendar size={60} className="mx-auto mb-6" />
                <p className="font-serif text-lg tracking-wide">Tu primer día comienza con una intención.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {history.map(entry => (
                  <Card key={entry.id} className="flex justify-between items-center group hover:bg-ps-mist/5 border-ps-soft/5">
                    <div className="max-w-[70%]">
                      <p className="text-[10px] font-black text-ps-lila uppercase tracking-[0.2em] mb-2">{entry.date}</p>
                      <p className="text-base font-medium text-ps-mist truncate italic">"{entry.mission}"</p>
                    </div>
                    <div className="text-right">
                       <span className="text-3xl drop-shadow-sm">{entry.energy === 'alta' ? '🔥' : entry.energy === 'media' ? '✨' : '🌊'}</span>
                       <p className="text-[9px] text-ps-muted mt-3 font-black uppercase tracking-widest">{entry.completedBlocks}/4 Pasos</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'awards' && (
          <div className="animate-fade-up">
             <div className="text-center mb-12">
               <div className="w-20 h-20 bg-ps-blue/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-ps-blue/10">
                 <Trophy size={40} className="text-ps-blue" />
               </div>
               <h2 className="font-serif text-3xl text-ps-mist">Logros de Presencia</h2>
               <p className="text-xs text-ps-muted mt-3 font-medium">Ciclos de sanación completados: <span className="text-ps-blue font-black">{history.length}</span></p>
             </div>
             <div className="grid grid-cols-2 gap-5">
                {BADGES.map(badge => {
                  const unlocked = history.length >= badge.days;
                  return (
                    <Card key={badge.title} className={`text-center py-10 flex flex-col items-center gap-4 transition-all duration-500 ${unlocked ? 'border-ps-blue/20 bg-ps-blue/5 scale-100' : 'opacity-10 grayscale scale-95'}`}>
                      <div className="text-5xl mb-1 drop-shadow-lg">{unlocked ? badge.icon : '🔒'}</div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-ps-mist mb-1">{badge.title}</h4>
                        <p className="text-[8px] text-ps-muted px-2 font-medium leading-relaxed">{badge.desc}</p>
                      </div>
                    </Card>
                  );
                })}
             </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 w-full max-w-md bg-ps-dark/95 backdrop-blur-2xl border-t border-ps-soft/10 p-4 flex justify-around safe-area-bottom z-50 rounded-t-[2.5rem] shadow-2xl">
        {[
          { id: 'flow', icon: Zap, label: 'Flujo' },
          { id: 'week', icon: BitacoraIcon, label: 'Diario' },
          { id: 'awards', icon: Trophy, label: 'Logros' }
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => setView(item.id as any)}
            className={`flex flex-col items-center gap-2 p-4 w-full rounded-3xl transition-all duration-300 ${view === item.id ? 'text-ps-mist bg-ps-mist/10' : 'text-ps-muted hover:text-ps-mist/50'}`}
          >
            <item.icon size={22} className={view === item.id ? 'scale-110 transition-transform' : ''} />
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">{item.label}</span>
          </button>
        ))}
      </nav>

      {showSOS && (
        <div className="fixed inset-0 z-[100] bg-ps-dark/98 backdrop-blur-3xl flex items-center justify-center p-6 animate-fade-up">
          <Card className="w-full relative py-12 border-ps-sos/30 bg-ps-sos/10 shadow-3xl">
            <button onClick={() => setShowSOS(false)} className="absolute top-6 right-6 text-ps-muted hover:text-ps-mist transition-colors"><X /></button>
            <div className="text-7xl text-center mb-8 drop-shadow-2xl">{SOS_OPTIONS[sosIndex].icon}</div>
            <h3 className="font-serif text-3xl text-center mb-3 text-ps-mist italic">{SOS_OPTIONS[sosIndex].title}</h3>
            <p className="text-xs text-ps-sos text-center mb-10 px-8 font-bold uppercase tracking-widest leading-relaxed">{SOS_OPTIONS[sosIndex].subtitle}</p>
            <div className="space-y-4 bg-ps-dark/60 p-8 rounded-[2rem] mb-10 border border-ps-sos/20">
              {SOS_OPTIONS[sosIndex].steps.map((step, i) => (
                <div key={i} className="flex gap-5 items-start text-[13px] text-ps-soft font-medium">
                  <span className="w-7 h-7 rounded-full bg-ps-sos/30 flex items-center justify-center text-ps-sos flex-shrink-0 text-[11px] font-black">{i+1}</span>
                  <p className="leading-relaxed opacity-90">{step}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowSOS(false)} className="bg-ps-sos text-white w-full py-5 rounded-2xl font-black shadow-2xl transition-all active:scale-95 uppercase tracking-[0.2em] text-[11px]">Vuelvo a mi centro</button>
          </Card>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-ps-dark/98 backdrop-blur-3xl flex items-center justify-center p-6 animate-fade-up">
          <Card className="w-full relative py-10 border-ps-soft/10 overflow-y-auto max-h-[85vh] shadow-3xl">
             <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 text-ps-muted hover:text-ps-mist"><X /></button>
             <h3 className="font-serif text-2xl mb-10 text-ps-mist italic text-center">Centro de Enfoque</h3>
             
             <div className="mb-10 p-6 bg-gradient-to-br from-ps-deep/40 to-ps-lila/10 rounded-[2rem] border border-ps-lila/20 shadow-inner">
                <div className="flex items-center gap-3 mb-5">
                  <Star className="text-yellow-400 fill-yellow-400" size={20} />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-ps-soft">Activar Premium</h4>
                </div>
                {isPremium ? (
                  <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-green-500" />
                    <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Soberanía Premium Activa</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <input 
                      type="text" 
                      placeholder="Código de Sanación..."
                      value={premiumInput}
                      onChange={(e) => setPremiumInput(e.target.value)}
                      className="bg-ps-dark/60 border border-ps-soft/10 rounded-2xl px-5 py-4 text-xs text-ps-mist focus:outline-none focus:border-ps-lila/50"
                    />
                    <button onClick={handlePremiumUnlock} className="bg-ps-lila text-ps-dark py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl btn-glow">Activar Ahora</button>
                    <a href="https://proyectosana365.com/premium" target="_blank" rel="noopener noreferrer" className="mt-3 text-[9px] text-center text-ps-blue font-bold flex items-center justify-center gap-2 hover:underline tracking-wider">
                      <ExternalLink size={12} /> Solicitar mi código
                    </a>
                  </div>
                )}
             </div>

             <div className="space-y-4">
               <button onClick={() => {
                 const data = { history, username, isPremium, auth, energy, missionAlpha, blocks };
                 const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                 const url = URL.createObjectURL(blob);
                 const link = document.createElement('a');
                 link.href = url;
                 link.download = `backup_ps365_${new Date().toISOString().split('T')[0]}.json`;
                 link.click();
               }} className="w-full flex items-center justify-between bg-ps-mist/5 p-5 rounded-2xl text-[11px] font-bold text-ps-soft border border-ps-soft/5">
                 <span className="flex items-center gap-3 uppercase tracking-widest"><Download size={18} /> Exportar Progreso</span>
                 <ChevronRight size={16} className="opacity-30" />
               </button>
               <button onClick={() => { if(confirm("¿Seguro que deseas resetear tu santuario?")) { localStorage.clear(); window.location.reload(); } }} className="w-full text-red-500/40 p-6 text-[9px] font-black uppercase tracking-[0.4em] mt-6">Limpiar Todo</button>
             </div>
          </Card>
        </div>
      )}
    </div>
  );
};
  
const BitacoraIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <path d="M12 6v6" />
    <path d="M15 9h-6" />
  </svg>
);

export default App;
