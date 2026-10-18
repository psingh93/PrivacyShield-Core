import React from 'react';
import { ShieldCheck, Lock, Activity, FileCode, Sliders, History, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenPolicy: () => void;
  onOpenApi: () => void;
  onOpenAudit: () => void;
  deepScanEnabled: boolean;
  onToggleDeepScan: () => void;
  auditCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPolicy,
  onOpenApi,
  onOpenAudit,
  deepScanEnabled,
  onToggleDeepScan,
  auditCount,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-blue-500/20 border border-emerald-500/40 shadow-inner shadow-emerald-500/20">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2 font-mono">
                PRIVACYSHIELD <span className="text-emerald-400 font-sans font-semibold text-xs px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/60 text-emerald-300">CORE v3.4</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3 text-cyan-400" /> Zero-Trust AI DLP
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Enterprise LLM Interceptor • Sensitive Token Sanitization • Zero-Leakage Guarantee
            </p>
          </div>
        </div>

        {/* Right: Controls & Navigation */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Deep AI Semantic Scan toggle */}
          <button
            onClick={onToggleDeepScan}
            title="Toggle Gemini-powered semantic analysis for contextual nuances"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all duration-200 font-medium ${
              deepScanEnabled
                ? 'bg-purple-950/60 border-purple-500/50 text-purple-200 shadow-sm shadow-purple-500/20'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${deepScanEnabled ? 'text-purple-400 animate-pulse' : 'text-slate-500'}`} />
            <span>Deep AI Scan</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${deepScanEnabled ? 'bg-purple-800/80 text-purple-100' : 'bg-slate-800 text-slate-400'}`}>
              {deepScanEnabled ? 'ACTIVE' : 'OFF'}
            </span>
          </button>

          {/* Audit Logs button */}
          <button
            onClick={onOpenAudit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audit Log</span>
            {auditCount > 0 && (
              <span className="bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.2 rounded text-[10px] font-mono">
                {auditCount}
              </span>
            )}
          </button>

          {/* API & cURL Docs */}
          <button
            onClick={onOpenApi}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-amber-400" />
            <span>API & cURL</span>
          </button>

          {/* Policy Config */}
          <button
            onClick={onOpenPolicy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>DLP Policy</span>
          </button>
        </div>
      </div>
    </header>
  );
};
