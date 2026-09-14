import React, { useState, useEffect } from 'react';
import { DEFAULT_MODEL_CONFIG } from '../config/agentRoster';
import { useLocation } from 'react-router-dom';
import { Sparkles, Mic, MicOff, BrainCircuit, ArrowRight, Zap, Coins, Clock, HelpCircle, HardDrive, Lock, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import SEOHead from './SEOHead';
import { PAGE_SEO } from '../lib/seoConfig';

interface ProjectIntakeProps {
  onSubmit: (prompt: string, modelConfig: Record<string, string>) => void;
}

export default function ProjectIntake({ onSubmit }: ProjectIntakeProps) {
  const location = useLocation();
  const { user, profile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  // Check for prefilled prompt from template gallery
  useEffect(() => {
    if (location.state && (location.state as any).prefilledPrompt) {
      setPrompt((location.state as any).prefilledPrompt);
    }
  }, [location.state]);

  // Model Routing options matching requested multi-provider architecture
  const [modelConfig, setModelConfig] = useState<Record<string, string>>({ ...DEFAULT_MODEL_CONFIG });

  // Memory RAG settings
  const [ragMemory, setRagMemory] = useState(true);
  const [codingStandard, setCodingStandard] = useState('Strict TypeScript - Clean Architecture');

  const presets = [
    {
      title: 'Full-Stack Razorpay E-Commerce',
      prompt: 'Build a premium developer marketplace where creators can sell customized prompt packs and components. Integrate fully compliant Razorpay monthly checkout modal, creator earnings dashboard, and GST-compliant downloadable receipts.',
      credits: 450,
    },
    {
      title: 'Self-Healing Kubernetes SRE Swarm',
      prompt: 'Create an automated monitoring service that scans container logs for OWASP Top 10 vulnerabilities, automatically runs an SRE self-healing repair script to fix bugs, and deploys to Google Cloud Run.',
      credits: 600,
    },
    {
      title: 'Real-Time Multi-Agent Task Orchestrator',
      prompt: 'Build a visual app builder with drag-and-drop workflow nodes where multiple users can collaborate in real-time, modify API JSON paths, and view live hot-reloaded preview side-by-side.',
      credits: 500,
    }
  ];

  const modelOptions: Record<string, { label: string; value: string; provider: string }[]> = {
    'CEO Orchestrator': [
      { label: 'Gemini 2.5 Flash (Google)', value: 'gemini-2.5-flash', provider: 'gemini' },
      { label: 'Gemini 2.5 Pro (Google)', value: 'gemini-2.5-pro', provider: 'gemini' }
    ],
    'Product Manager': [
      { label: 'LLaMA 3.3 70B (OpenRouter Free)', value: 'meta-llama/llama-3.3-70b-instruct:free', provider: 'openrouter' },
      { label: 'DeepSeek Chat V3 (OpenRouter Free)', value: 'deepseek/deepseek-chat:free', provider: 'openrouter' },
      { label: 'DeepSeek R1 (OpenRouter Free)', value: 'deepseek/deepseek-r1:free', provider: 'openrouter' },
      { label: 'Auto Free Router (OpenRouter)', value: 'openrouter/free', provider: 'openrouter' },
      { label: 'Gemini 2.5 Flash (Google)', value: 'gemini-2.5-flash', provider: 'gemini' }
    ],
    'Solution Architect': [
      { label: 'DeepSeek R1 Reasoning (OpenRouter Free)', value: 'deepseek/deepseek-r1:free', provider: 'openrouter' },
      { label: 'DeepSeek Chat V3 (OpenRouter Free)', value: 'deepseek/deepseek-chat:free', provider: 'openrouter' },
      { label: 'Qwen 2.5 Coder 32B (OpenRouter Free)', value: 'qwen/qwen-2.5-coder-32b-instruct:free', provider: 'openrouter' },
      { label: 'LLaMA 3.3 70B (OpenRouter Free)', value: 'meta-llama/llama-3.3-70b-instruct:free', provider: 'openrouter' },
      { label: 'Gemini 2.5 Pro (Google)', value: 'gemini-2.5-pro', provider: 'gemini' }
    ],
    'Frontend Engineer': [
      { label: 'LLaMA 3.1 70B (NVIDIA NIM)', value: 'meta/llama-3.1-70b-instruct', provider: 'nvidia' },
      { label: 'Nemotron 340B (NVIDIA NIM)', value: 'nvidia/nemotron-4-340b-instruct', provider: 'nvidia' },
      { label: 'Gemini 2.5 Flash (Google)', value: 'gemini-2.5-flash', provider: 'gemini' }
    ],
    'QA/Test Engineer': [
      { label: 'LLaMA 3.3 70B Versatile (Groq Free)', value: 'llama-3.3-70b-versatile', provider: 'groq' },
      { label: 'Mixtral 8x7B (Groq Free)', value: 'mixtral-8x7b-32768', provider: 'groq' },
      { label: 'DeepSeek R1 (OpenRouter Free)', value: 'deepseek/deepseek-r1:free', provider: 'openrouter' }
    ],
    'DevOps Engineer': [
      { label: 'Mixtral 8x7B 32k (Groq Free)', value: 'mixtral-8x7b-32768', provider: 'groq' },
      { label: 'LLaMA 3.3 70B (Groq Free)', value: 'llama-3.3-70b-versatile', provider: 'groq' },
      { label: 'Gemini 2.5 Flash (Google)', value: 'gemini-2.5-flash', provider: 'gemini' }
    ]
  };

  const handlePresetSelect = (index: number) => {
    setSelectedPreset(index);
    setPrompt(presets[index].prompt);
  };

  // Voice Recognition states
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);

  // Browser Voice Recognition Engine
  const toggleSpeech = () => {
    setSpeechError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn('Error stopping speech:', e);
        }
      }
      setIsListening(false);
      setInterimTranscript('');
      return;
    }

    try {
      const rec = new SpeechRecognition();
      recognitionRef.current = rec;
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      rec.onresult = (event: any) => {
        let currentInterim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcriptPiece;
          } else {
            currentInterim += transcriptPiece;
          }
        }

        setInterimTranscript(currentInterim);

        if (finalChunk.trim()) {
          setPrompt((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${finalChunk.trim()}` : finalChunk.trim();
          });
          setSelectedPreset(null);
        }
      };

      rec.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setSpeechError('Microphone access was denied. Please allow microphone permissions in your browser.');
        } else if (event.error === 'no-speech') {
          // Ignored, user just paused
        } else if (event.error === 'network') {
          setSpeechError('Speech recognition network error. Please check your internet connection.');
        } else {
          setSpeechError(`Voice error: ${event.error}`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      rec.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setSpeechError(err.message || 'Unable to access microphone.');
    }
  };

  // Clean up speech recognition on unmount
  React.useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // noop
        }
      }
    };
  }, []);

  const handleModelChange = (role: string, model: string) => {
    setModelConfig(prev => ({ ...prev, [role]: model }));
  };

  // Simulated metrics based on selected models
  const getSimulatedMetrics = () => {
    let latency = 0;
    let cost = 0;
    Object.entries(modelConfig).forEach(([role, model]) => {
      const modelName = model as string;
      if (modelName.includes('pro') || modelName.includes('claude') || modelName.includes('reasoner')) {
        latency += 1800;
        cost += 0.015;
      } else if (modelName.includes('flash') || modelName.includes('mini')) {
        latency += 600;
        cost += 0.0015;
      } else {
        latency += 1100;
        cost += 0.005;
      }
    });

    return {
      estTime: `${(latency / 1000).toFixed(1)}s`,
      estCost: `$${cost.toFixed(4)}`,
      selectedCount: Object.keys(modelConfig).length
    };
  };

  const metrics = getSimulatedMetrics();

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-12 gap-8 text-slate-100" id="project-intake">
      <SEOHead pageSlug="/" pageId="home" {...PAGE_SEO.home} />
      
      {/* LEFT PANEL: Prompt Area and Presets */}
      <div className="lg:col-span-7 space-y-8">
        <div className="border-b border-white/10 pb-6">
          <span className="label mb-2 block">Core Sandbox</span>
          <h1 className="massive-type text-6xl text-white">
            Forge Application<span className="text-violet-500">.</span>
          </h1>
          <p className="text-slate-400 text-xs uppercase tracking-wider mt-2">
            DevForge AI choreographs a synchronized agent swarm to build, secure, and deploy complete server containers.
          </p>
        </div>

        {/* Input Text Area */}
        <div className="relative bg-[#111111] border border-[#222222] p-5 shadow-2xl focus-within:border-violet-500/50 transition-colors">
          <textarea
            className="w-full h-44 bg-transparent resize-none text-slate-200 placeholder-slate-600 text-xs outline-none border-none focus:ring-0 leading-relaxed font-sans"
            placeholder="e.g. Build a fully functional meeting notes summarizer with Express backend service, Spanner database, and Gemini API auto-categorization..."
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setSelectedPreset(null);
            }}
            id="prompt-textarea"
          />

          {/* Live Voice Recording Status & Interim Preview */}
          {isListening && (
            <div className="mb-3 p-2.5 bg-rose-950/30 border border-rose-500/40 rounded-none flex items-center justify-between text-xs font-mono text-rose-200">
              <div className="flex items-center space-x-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span className="font-bold uppercase tracking-wider text-[10px] text-rose-300">Listening to Voice:</span>
                <span className="italic text-slate-300 truncate max-w-xs md:max-w-md">
                  {interimTranscript || 'Speak your app requirements now...'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-1 h-3 bg-rose-500 animate-pulse"></span>
                <span className="w-1 h-5 bg-rose-400 animate-pulse delay-75"></span>
                <span className="w-1 h-2 bg-rose-500 animate-pulse delay-150"></span>
                <span className="w-1 h-4 bg-rose-400 animate-pulse delay-100"></span>
              </div>
            </div>
          )}

          {/* Speech Error Banner */}
          {speechError && (
            <div className="mb-3 p-2.5 bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs font-mono flex items-center justify-between">
              <span className="text-[11px]">{speechError}</span>
              <button
                onClick={() => setSpeechError(null)}
                className="text-amber-400 hover:text-amber-200 text-[10px] uppercase underline ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-[#222222]">
            {/* Audio Voice button */}
            <button
              type="button"
              onClick={toggleSpeech}
              className={`flex items-center space-x-2 px-4 py-2 border text-[10px] font-bold uppercase tracking-widest transition duration-200 ${
                isListening
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-lg animate-pulse'
                  : 'bg-transparent hover:bg-white/5 text-slate-300 border-[#222222]'
              }`}
              id="voice-btn"
            >
              {isListening ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-slate-400" />}
              <span>{isListening ? 'Stop Listening' : 'Voice Command'}</span>
            </button>

            {/* Submit button & Auth Guard */}
            <div className="flex items-center space-x-3">
              {!user && (
                <span className="hidden sm:flex items-center gap-1 text-[9px] font-mono text-amber-400/90 uppercase tracking-wider">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Login required</span>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    setShowAuthModal(true);
                    return;
                  }
                  const submittedPrompt = prompt || presets[0].prompt;
                  console.log('[prompt:ui-submitted]', submittedPrompt);
                  onSubmit(submittedPrompt, modelConfig);
                }}
                className="bg-white hover:bg-violet-400 text-black text-xs font-bold uppercase tracking-widest px-6 py-2.5 transition-colors duration-200 flex items-center space-x-2 shadow-lg"
                id="forge-btn"
              >
                {!user ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sign In to Forge</span>
                  </>
                ) : (
                  <>
                    <span>Forge Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Presets Grid */}
        <div className="space-y-4">
          <h2 className="label flex items-center space-x-2 text-slate-400">
            <Zap className="text-violet-500 w-3.5 h-3.5" />
            <span>Accelerated Launch Presets</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {presets.map((p, i) => (
              <div
                key={i}
                onClick={() => handlePresetSelect(i)}
                className={`p-5 border transition cursor-pointer text-left flex flex-col justify-between h-44 ${
                  selectedPreset === i
                    ? 'bg-gradient-to-b from-violet-500/10 to-transparent border-violet-500'
                    : 'bg-[#111111] border-[#222222] hover:border-slate-700'
                }`}
                id={`preset-card-${i}`}
              >
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">{p.title}</h3>
                  <p className="text-[10px] text-slate-400 mt-2 line-clamp-3 leading-relaxed">{p.prompt}</p>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#222222] text-[9px] font-mono text-slate-500">
                  <span className="label text-[8px]">EST. COST</span>
                  <span className="text-violet-400 font-bold font-mono">{p.credits} CREDITS</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Intelligent Routing and Memory Preferences */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Swarm Intelligence Routing */}
        <div className="bg-[#111111] border border-[#222222] p-6 shadow-2xl space-y-5">
          <div className="flex justify-between items-center pb-2 border-b border-[#222222]">
            <h2 className="label flex items-center space-x-2 text-slate-200">
              <BrainCircuit className="text-cyan-400 w-4 h-4" />
              <span>Swarms Router Config</span>
            </h2>
            <span className="text-[8px] font-mono text-slate-500 tracking-wider">VM RUNTIMES</span>
          </div>

          <div className="space-y-3">
            {Object.keys(modelConfig).map((role) => (
              <div key={role} className="flex items-center justify-between text-xs bg-[#050505] p-3 border border-[#222222]">
                <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">{role}</span>
                <select
                  value={modelConfig[role]}
                  onChange={(e) => handleModelChange(role, e.target.value)}
                  className="bg-[#111111] border border-[#222222] px-2 py-1 text-slate-300 text-[10px] uppercase outline-none cursor-pointer focus:border-violet-500 font-mono max-w-[200px]"
                  id={`router-select-${role.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {modelOptions[role]?.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Model Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#222222] text-center">
            <div className="bg-[#050505] p-3 border border-[#222222]">
              <Clock className="w-3.5 h-3.5 text-slate-500 mx-auto mb-1" />
              <div className="text-[8px] label text-slate-500">Latency</div>
              <div className="text-xs font-mono font-bold text-slate-200 mt-1">{metrics.estTime}</div>
            </div>
            <div className="bg-[#050505] p-3 border border-[#222222]">
              <Coins className="w-3.5 h-3.5 text-slate-500 mx-auto mb-1" />
              <div className="text-[8px] label text-slate-500">Est. Tokens</div>
              <div className="text-xs font-mono font-bold text-cyan-400 mt-1">{metrics.estCost}</div>
            </div>
            <div className="bg-[#050505] p-3 border border-[#222222]">
              <Sparkles className="w-3.5 h-3.5 text-slate-500 mx-auto mb-1" />
              <div className="text-[8px] label text-slate-500">Nodes</div>
              <div className="text-xs font-mono font-bold text-violet-400 mt-1">{metrics.selectedCount} / 5</div>
            </div>
          </div>
        </div>

        {/* AI Memory & RAG preferences */}
        <div className="bg-[#111111] border border-[#222222] p-6 shadow-2xl space-y-4">
          <h2 className="label flex items-center space-x-2 text-slate-200">
            <HardDrive className="text-violet-400 w-4 h-4" />
            <span>AI Memory Engine</span>
          </h2>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-[#050505] border border-[#222222]">
              <div>
                <span className="block font-bold text-slate-200 uppercase text-[10px] tracking-wider">Semantic Vector Store (RAG)</span>
                <span className="block text-[9px] text-slate-500 mt-0.5">Inject preceding session context inside prompt structures</span>
              </div>
              <input
                type="checkbox"
                checked={ragMemory}
                onChange={() => setRagMemory(!ragMemory)}
                className="border-[#222222] bg-[#050505] text-violet-600 focus:ring-0 w-4 h-4 cursor-pointer rounded-none"
                id="rag-checkbox"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[9px] label text-slate-400">Custom Code Standards</label>
              <input
                type="text"
                value={codingStandard}
                onChange={(e) => setCodingStandard(e.target.value)}
                className="w-full bg-[#050505] border border-[#222222] px-3 py-2 text-slate-300 text-xs focus:ring-0 focus:border-violet-500 outline-none"
                id="standards-input"
              />
            </div>
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
