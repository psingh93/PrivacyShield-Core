import React, { useState } from 'react';
import { X, Send, ShieldCheck, ArrowRight, Bot, Lock, RefreshCw, KeyRound, Check } from 'lucide-react';
import { DLPResult } from '../types/dlp';

interface LlmSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalPrompt: string;
  dlpResult: DLPResult | null;
}

export const LlmSimulatorModal: React.FC<LlmSimulatorModalProps> = ({
  isOpen,
  onClose,
  originalPrompt,
  dlpResult,
}) => {
  const [loading, setLoading] = useState(false);
  const [llmRawResponse, setLlmRawResponse] = useState<string | null>(null);
  const [rehydratedResponse, setRehydratedResponse] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  if (!isOpen) return null;

  const handleSimulate = async () => {
    if (!dlpResult) return;
    setLoading(true);
    setActiveStep(2);

    try {
      const response = await fetch('/api/dlp/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: originalPrompt,
          model: 'gemini-3.8-flash',
          systemInstruction: 'You are a helpful enterprise AI assistant. Answer the user prompt directly and professionally.',
        }),
      });

      const data = await response.json();
      setActiveStep(3);

      setTimeout(() => {
        setLlmRawResponse(data.llm_raw_response || data.sanitized_prompt_dispatched);
        setRehydratedResponse(data.rehydrated_client_response || data.llm_raw_response);
        setActiveStep(4);
        setLoading(false);
      }, 600);
    } catch (err: any) {
      setTimeout(() => {
        const simulated = `Analysis complete for ${dlpResult.masked_prompt.includes('[PERSON]') ? '[PERSON]' : 'the requested query'}: Account activity patterns have been processed safely under enterprise zero-trust governance.`;
        const vault = dlpResult._telemetry?.reidentification_vault || {};
        let hydrated = simulated;
        for (const [placeholder, original] of Object.entries(vault)) {
          hydrated = hydrated.split(placeholder).join(original);
        }
        setLlmRawResponse(simulated);
        setRehydratedResponse(hydrated);
        setActiveStep(4);
        setLoading(false);
      }, 700);
    }
  };

  const vault = dlpResult?._telemetry?.reidentification_vault || {};
  const vaultEntries = Object.entries(vault);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-carbon border border-bordercolor rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-bordercolor bg-obsidian">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-accentGold/10 border border-accentGold/30 text-accentGold glow-gold">
              <ShieldCheck className="w-5 h-5 text-accentGold" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Zero-Trust AI Gateway Simulator
                <span className="text-xs font-mono font-medium text-safeGreen bg-safeGreen/10 px-2 py-0.5 rounded border border-safeGreen/30">
                  Zero Leakage
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Observe end-to-end prompt interception, sanitized cloud forwarding, and local client re-identification.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-carbon transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pipeline Progression Steps */}
        <div className="p-4 border-b border-bordercolor bg-obsidian/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg border bg-carbon border-bordercolor text-slate-200">
              <div className="font-bold text-slate-400 text-[10px]">STEP 1</div>
              <div>Input Intercepted</div>
            </div>
            <div
              className={`p-2.5 rounded-lg border transition-all ${
                activeStep >= 2
                  ? 'bg-accentGold/15 border-accentGold text-accentGold glow-gold font-bold'
                  : 'bg-obsidian border-bordercolor text-slate-500'
              }`}
            >
              <div className="font-bold text-[10px] text-accentGold">STEP 2</div>
              <div>Masking &amp; Vault Hash</div>
            </div>
            <div
              className={`p-2.5 rounded-lg border transition-all ${
                activeStep >= 3
                  ? 'bg-safeGreen/15 border-safeGreen text-safeGreen glow-green font-bold'
                  : 'bg-obsidian border-bordercolor text-slate-500'
              }`}
            >
              <div className="font-bold text-[10px] text-safeGreen">STEP 3</div>
              <div>Sanitized Cloud LLM</div>
            </div>
            <div
              className={`p-2.5 rounded-lg border transition-all ${
                activeStep >= 4
                  ? 'bg-accentGold/20 border-accentGold text-white font-bold'
                  : 'bg-obsidian border-bordercolor text-slate-500'
              }`}
            >
              <div className="font-bold text-[10px] text-accentGold">STEP 4</div>
              <div>Local Re-identification</div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 flex-1">
          {/* Step 1 & 2: Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Input */}
            <div className="bg-obsidian border border-bordercolor rounded-xl p-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 text-dangerRed font-bold">
                  <Lock className="w-3.5 h-3.5" /> Original Client Prompt (Unmasked)
                </span>
                <span className="text-dangerRed text-[10px] bg-dangerRed/15 px-1.5 py-0.5 rounded border border-dangerRed/40 font-bold">
                  NEVER LEAKED TO AI
                </span>
              </div>
              <div className="p-3 bg-carbon border border-bordercolor rounded-lg text-xs font-sans text-slate-300 leading-relaxed min-h-[70px]">
                {originalPrompt}
              </div>
            </div>

            {/* Sanitized Prompt Sent to LLM */}
            <div className="bg-obsidian border border-safeGreen/40 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs font-mono text-safeGreen mb-2">
                <span className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Prompt Dispatched to Cloud LLM
                </span>
                <span className="text-[10px] bg-safeGreen/15 px-1.5 py-0.5 rounded border border-safeGreen/40 font-bold">
                  ZERO LEAKAGE
                </span>
              </div>
              <div className="p-3 bg-carbon border border-safeGreen/20 rounded-lg text-xs font-mono text-safeGreen leading-relaxed min-h-[70px]">
                {dlpResult?.masked_prompt}
              </div>
            </div>
          </div>

          {/* Local Token Vault */}
          <div className="bg-obsidian border border-bordercolor rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
                <KeyRound className="w-3.5 h-3.5 text-accentGold" />
                Local Client Token Vault (Held exclusively in browser memory)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {vaultEntries.length} token mapping{vaultEntries.length === 1 ? '' : 's'}
              </span>
            </div>

            {vaultEntries.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono">No sensitive tokens to map for this prompt.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {vaultEntries.map(([placeholder, original]) => (
                  <div
                    key={placeholder}
                    className="flex items-center gap-1.5 bg-carbon border border-bordercolor px-2.5 py-1 rounded-md text-xs font-mono"
                  >
                    <span className="text-safeGreen font-bold">{placeholder}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                    <span className="text-dangerRed line-through">{original}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Forward Action & Response */}
          <div>
            {!llmRawResponse ? (
              <div className="text-center py-4">
                <button
                  onClick={handleSimulate}
                  disabled={loading || !dlpResult?.safe_to_process}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-accentGold to-amber-600 hover:from-amber-500 hover:to-accentGold text-black font-bold text-xs uppercase tracking-wider transition-all glow-gold disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                      <span>Dispatching Sanitized Prompt to LLM...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-black" />
                      <span>Forward Sanitized Prompt to Cloud AI Gateway</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Raw LLM Response */}
                  <div className="bg-obsidian border border-accentGold/40 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-xs font-mono text-accentGold font-bold mb-2">
                      <Bot className="w-4 h-4" />
                      External LLM Raw Output (Received by Proxy)
                    </div>
                    <div className="p-3 bg-carbon rounded-lg text-xs font-mono text-slate-300 leading-relaxed min-h-[90px]">
                      {llmRawResponse}
                    </div>
                  </div>

                  {/* Rehydrated End-User View */}
                  <div className="bg-obsidian border border-safeGreen/40 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-xs font-mono text-safeGreen font-bold mb-2">
                      <Check className="w-4 h-4" />
                      Rehydrated Response (Rendered for End-User)
                    </div>
                    <div className="p-3 bg-carbon border border-safeGreen/20 rounded-lg text-xs font-sans text-white leading-relaxed min-h-[90px]">
                      {rehydratedResponse}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSimulate}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-carbon hover:bg-carbon/80 text-accentGold text-xs font-mono border border-bordercolor transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Re-test Gateway</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
