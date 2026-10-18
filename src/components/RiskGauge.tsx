import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle, Info, Zap } from 'lucide-react';
import { DLPResult } from '../types/dlp';

interface RiskGaugeProps {
  result: DLPResult | null;
  loading: boolean;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ result, loading }) => {
  if (!result && !loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-center text-slate-400">
        <Info className="w-6 h-6 mx-auto mb-2 text-slate-500" />
        <p className="text-sm">Awaiting prompt input for interception.</p>
      </div>
    );
  }

  const score = result ? result.original_risk_score : 0;
  const level = result ? result.risk_level : 'LOW';
  const safe = result ? result.safe_to_process : true;
  const isBlocked = result?.status === 'blocked' || !safe;

  // Determine accent color
  let colorClass = 'text-emerald-400';
  let bgGradient = 'from-emerald-500/20 to-transparent';
  let borderColor = 'border-emerald-500/40';
  let badgeClass = 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';

  if (level === 'CRITICAL' || isBlocked) {
    colorClass = 'text-rose-400';
    bgGradient = 'from-rose-500/20 to-transparent';
    borderColor = 'border-rose-500/40';
    badgeClass = 'bg-rose-950/80 text-rose-300 border-rose-700/60';
  } else if (level === 'HIGH') {
    colorClass = 'text-orange-400';
    bgGradient = 'from-orange-500/20 to-transparent';
    borderColor = 'border-orange-500/40';
    badgeClass = 'bg-orange-950/80 text-orange-300 border-orange-700/60';
  } else if (level === 'MEDIUM') {
    colorClass = 'text-amber-400';
    bgGradient = 'from-amber-500/20 to-transparent';
    borderColor = 'border-amber-500/40';
    badgeClass = 'bg-amber-950/80 text-amber-300 border-amber-700/60';
  }

  // Circular progress calculation
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`relative bg-slate-900/80 border ${borderColor} rounded-xl p-5 transition-all overflow-hidden`}>
      <div className={`absolute -right-12 -top-12 w-36 h-36 bg-gradient-to-br ${bgGradient} blur-2xl pointer-events-none rounded-full`} />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Score Gauge dial */}
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className={`${colorClass} transition-all duration-700 ease-out`}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black font-mono tracking-tight text-white leading-none">
                {loading ? '--' : score}
              </span>
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">
                /100
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                Risk Score
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${badgeClass}`}>
                {level}
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-xs">
              {level === 'LOW' && 'Safe general content. No critical exposure detected.'}
              {level === 'MEDIUM' && 'Medium sensitivity: Standard PII (names, contact info).'}
              {level === 'HIGH' && 'High sensitivity: High density PII or network infra.'}
              {level === 'CRITICAL' && 'Critical exposure: Financial cardholder data, credentials, or PHI.'}
            </p>
            {result?._telemetry?.processing_time_ms !== undefined && (
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-1.5">
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>Interception latency: {result._telemetry.processing_time_ms}ms</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Safe to Process Verdict */}
        <div className="w-full sm:w-auto">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
              isBlocked
                ? 'bg-rose-950/60 border-rose-600/50 text-rose-200'
                : 'bg-emerald-950/60 border-emerald-600/50 text-emerald-200'
            }`}
          >
            {isBlocked ? (
              <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0" />
            ) : (
              <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider font-mono">
                  {safe ? 'SAFE_TO_PROCESS: TRUE' : 'SAFE_TO_PROCESS: FALSE'}
                </span>
              </div>
              <p className="text-xs opacity-90 leading-snug">
                {isBlocked
                  ? 'Malicious prompt injection / jailbreak detected. Blocked.'
                  : 'Masking successful. Safe to forward to LLM model.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
