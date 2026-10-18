import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Terminal,
  Cpu,
  Lock,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ClipboardPaste,
  Sliders,
  History,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Scale,
  CreditCard,
  Key,
  Mail,
  User,
  HeartPulse,
  Network,
  Eye,
  Settings,
} from 'lucide-react';
import { PresetsBar, PRESETS, PresetItem } from './components/PresetsBar';
import { SpeedometerGauge } from './components/SpeedometerGauge';
import { JsonViewer } from './components/JsonViewer';
import { LlmSimulatorModal } from './components/LlmSimulatorModal';
import { PolicyConfigModal } from './components/PolicyConfigModal';
import { ApiSandboxModal } from './components/ApiSandboxModal';
import { AuditLogTable } from './components/AuditLogTable';
import { inspectPrompt } from './dlp/engine';
import { DLPResult, PolicyConfig, AuditEntry } from './types/dlp';

interface ApiDLPResponse {
  status: string;
  risk_score: number;
  masked_prompt: string;
  violations_prevented: string[];
  detected_entities: Array<{
    entity_name?: string;
    entity_type?: string;
    status?: string;
    action_taken?: string;
  }>;
}

const DEFAULT_POLICY: PolicyConfig = {
  detectCreditCards: true,
  detectApiKeys: true,
  detectPasswords: true,
  detectSsn: true,
  detectEmails: true,
  detectPhones: true,
  detectNames: true,
  detectInternalIps: true,
  detectMedicalPhi: true,
  detectInjections: true,
  maskingStyle: 'standard',
  blockOnCritical: true,
  customKeywords: [],
};

const INITIAL_PROMPT =
  'Hi, please analyze the spending habits of John Doe. His credit card is 4532-1111-2222-3333 and email is john.doe@company.com.';

export default function App() {
  const [promptInput, setPromptInput] = useState<string>(INITIAL_PROMPT);
  const [activePresetId, setActivePresetId] = useState<string | null>('example_prompt');
  const [dlpResult, setDlpResult] = useState<DLPResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [apiEndpoint, setApiEndpoint] = useState<string>('http://127.0.0.1:8000/analyze-prompt');
  const [apiStatus, setApiStatus] = useState<'idle' | 'calling' | 'success' | 'fallback'>('idle');
  const [lastLatencyMs, setLastLatencyMs] = useState<number>(6);

  // Modals
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState(false);
  const [showConfigEndpoint, setShowConfigEndpoint] = useState(false);

  // Session audit log
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedMasked, setCopiedMasked] = useState(false);

  // Core inspect & process trigger
  const processAndInspect = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        const emptyResult = inspectPrompt('');
        setDlpResult(emptyResult);
        return;
      }

      setIsAnalyzing(true);
      setApiStatus('calling');
      const start = performance.now();

      let parsedData: ApiDLPResponse | null = null;
      let usedFallback = false;

      // 1. Primary API Integration: Attempt POST to apiEndpoint (http://127.0.0.1:8000/analyze-prompt)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_prompt: text }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          parsedData = await response.json();
          setApiStatus('success');
        } else {
          throw new Error(`Server returned ${response.status}`);
        }
      } catch (err) {
        // 2. Gateway fallback: If port 8000 is not reachable from this client context, call local proxy route /analyze-prompt
        try {
          const res = await fetch('/analyze-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_prompt: text }),
          });
          if (res.ok) {
            parsedData = await res.json();
            setApiStatus('success');
          } else {
            throw new Error('Local route error');
          }
        } catch (fallbackErr) {
          // 3. In-browser deterministic zero-trust engine fallback
          usedFallback = true;
          setApiStatus('fallback');
          const localRes = inspectPrompt(text);
          parsedData = {
            status: localRes.status,
            risk_score: localRes.risk_score,
            masked_prompt: localRes.masked_prompt,
            violations_prevented: localRes.violations_prevented || localRes.compliance_alerts,
            detected_entities: localRes.detected_entities.map((e) => ({
              entity_name: e.entity_name || e.entity_type,
              status: 'Masked',
            })),
          };
        }
      }

      const elapsed = Math.round(performance.now() - start);
      setLastLatencyMs(elapsed);

      if (parsedData) {
        const localEngineRes = inspectPrompt(text, { maskingStyle: 'quantum' });
        const finalRiskScore = parsedData.risk_score ?? localEngineRes.risk_score;
        const isBlocked = parsedData.status === 'blocked' || localEngineRes.status === 'blocked';

        let quantumRiskLevel: 'SAFE' | 'WARNING' | 'CRITICAL' = 'SAFE';
        if (finalRiskScore >= 86) {
          quantumRiskLevel = 'CRITICAL';
        } else if (finalRiskScore >= 16) {
          quantumRiskLevel = 'WARNING';
        } else {
          quantumRiskLevel = 'SAFE';
        }

        // Map to DLPResult
        const mappedResult: DLPResult = {
          status: isBlocked ? 'blocked' : 'success',
          original_risk_score: finalRiskScore,
          risk_score: finalRiskScore,
          risk_level: quantumRiskLevel,
          masked_prompt: (parsedData as any).sanitized_payload || parsedData.masked_prompt || localEngineRes.masked_prompt,
          detected_entities: (parsedData.detected_entities || localEngineRes.detected_entities).map((e) => ({
            entity_type: e.entity_type || e.entity_name || 'ENTITY',
            entity_name: e.entity_name || e.entity_type || 'Sensitive Token',
            action_taken: (e.action_taken as any) || 'Masked',
            status: e.status || 'Masked',
          })),
          compliance_alerts: parsedData.violations_prevented || localEngineRes.compliance_alerts,
          violations_prevented: parsedData.violations_prevented || localEngineRes.violations_prevented,
          safe_to_process: !isBlocked,

          // Quantum Spec bindings
          system_metadata: (parsedData as any).system_metadata || localEngineRes.system_metadata,
          threat_analysis: (parsedData as any).threat_analysis || {
            risk_score: finalRiskScore,
            risk_level: quantumRiskLevel,
            action_taken: isBlocked ? 'PAYLOAD_DROPPED' : 'PAYLOAD_SANITIZED',
          },
          sanitized_payload: (parsedData as any).sanitized_payload || localEngineRes.sanitized_payload,
          forensic_logs: (parsedData as any).forensic_logs || localEngineRes.forensic_logs,
          defense_telemetry: (parsedData as any).defense_telemetry || localEngineRes.defense_telemetry,
          quantum_response: (parsedData as any).quantum_response || localEngineRes.quantum_response,

          _telemetry: {
            processing_time_ms: elapsed,
            char_count: text.length,
            masked_spans: localEngineRes._telemetry?.masked_spans || [],
            injection_detected: isBlocked,
            injection_reasons: localEngineRes._telemetry?.injection_reasons || [],
            reidentification_vault: localEngineRes._telemetry?.reidentification_vault || {},
          },
        };

        setDlpResult(mappedResult);

        // Record in audit history
        const newEntry: AuditEntry = {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          original_prompt: text,
          result: mappedResult,
          source: usedFallback ? 'Local Engine' : 'FastAPI Endpoint',
        };
        setAuditEntries((prev) => [newEntry, ...prev.slice(0, 99)]);
      }

      setIsAnalyzing(false);
    },
    [apiEndpoint]
  );

  // Initial scan on load
  useEffect(() => {
    processAndInspect(INITIAL_PROMPT);
  }, []);

  const handleSelectPreset = (preset: PresetItem) => {
    setActivePresetId(preset.id);
    setPromptInput(preset.prompt);
    processAndInspect(preset.prompt);
  };

  const handleClear = () => {
    setPromptInput('');
    setActivePresetId(null);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setPromptInput(text);
        setActivePresetId(null);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(promptInput);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyMasked = async () => {
    if (!dlpResult?.masked_prompt) return;
    await navigator.clipboard.writeText(dlpResult.masked_prompt);
    setCopiedMasked(true);
    setTimeout(() => setCopiedMasked(false), 2000);
  };

  const currentScore = dlpResult?.risk_score ?? dlpResult?.original_risk_score ?? 0;
  const violations = dlpResult?.violations_prevented || dlpResult?.compliance_alerts || [];
  const entities = dlpResult?.detected_entities || [];

  return (
    <div className="bg-obsidian text-slate-200 min-h-screen flex flex-col font-sans selection:bg-accentGold/30 selection:text-white">
      {/* Top Header - Strict Palette: Obsidian, Carbon, Gold, Green */}
      <header className="border-b border-bordercolor bg-carbon px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {/* Shield in Cyber Gold */}
          <div className="bg-accentGold/10 p-2.5 rounded-lg border border-accentGold/30 glow-gold text-accentGold flex items-center justify-center">
            <Shield className="w-5 h-5 text-accentGold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-wider text-white">
                PrivacyShield <span className="text-accentGold text-sm font-semibold">QUANTUM</span>
              </h1>
              <span className="text-[10px] bg-accentGold/15 border border-accentGold/40 text-accentGold px-2 py-0.5 rounded font-mono font-bold">
                MILITARY-GRADE DLP PROXY
              </span>
            </div>
            <p className="text-xs text-slate-400">Zero-Trust AI Gateway • Deep Redaction • Injection Shield</p>
          </div>
        </div>

        {/* Right Nav & Trust Badges */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Gateway Simulator modal button */}
          <button
            onClick={() => setIsSimulatorModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-obsidian border border-accentGold/40 text-accentGold hover:bg-accentGold/10 transition-all text-xs font-mono font-bold cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Safe Gateway Sim</span>
          </button>

          {/* Audit Log modal */}
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-obsidian border border-bordercolor text-slate-300 hover:text-white hover:bg-carbon transition-colors text-xs font-mono cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-accentGold" />
            <span>Audit Log ({auditEntries.length})</span>
          </button>

          {/* FastAPI code modal */}
          <button
            onClick={() => setIsApiModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-obsidian border border-bordercolor text-slate-300 hover:text-white hover:bg-carbon transition-colors text-xs font-mono cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5 text-accentGold" />
            <span>FastAPI Docs</span>
          </button>

          {/* Policy modal */}
          <button
            onClick={() => setIsPolicyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-obsidian border border-bordercolor text-slate-300 hover:text-white hover:bg-carbon transition-colors text-xs font-mono cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-safeGreen" />
            <span>Policy</span>
          </button>

          {/* IBM LinuxONE Trust badge */}
          <span className="flex items-center gap-2 text-xs bg-safeGreen/10 border border-safeGreen/30 text-safeGreen px-3 py-1.5 rounded-full font-mono">
            <span className="w-2 h-2 bg-safeGreen rounded-full animate-ping"></span>
            IBM LinuxONE Secured
          </span>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Preset Benchmark Scenarios */}
        <PresetsBar onSelectPreset={handleSelectPreset} activeId={activePresetId} />

        {/* API Endpoint Config Indicator */}
        <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-carbon/60 border border-bordercolor text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-safeGreen">
              <span className="w-2 h-2 rounded-full bg-safeGreen"></span>
              Active Target API:
            </span>
            <code className="text-accentGold font-bold bg-obsidian px-2 py-0.5 rounded border border-bordercolor">
              {apiEndpoint}
            </code>
            <span className="text-slate-500">• Latency: {lastLatencyMs}ms</span>
          </div>

          <button
            onClick={() => setShowConfigEndpoint(!showConfigEndpoint)}
            className="text-slate-400 hover:text-accentGold transition-colors text-[11px] flex items-center gap-1"
          >
            <Settings className="w-3 h-3" />
            <span>{showConfigEndpoint ? 'Hide API URL' : 'Configure Endpoint'}</span>
          </button>
        </div>

        {/* Collapsible Endpoint URL input */}
        {showConfigEndpoint && (
          <div className="p-3 bg-carbon border border-accentGold/30 rounded-lg flex items-center gap-3 text-xs font-mono">
            <label className="text-slate-300 font-bold whitespace-nowrap">POST Endpoint URL:</label>
            <input
              type="text"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              className="flex-1 bg-obsidian border border-bordercolor rounded px-3 py-1.5 text-accentGold focus:outline-none focus:border-accentGold text-xs"
              placeholder="http://127.0.0.1:8000/analyze-prompt"
            />
            <button
              onClick={() => setApiEndpoint('http://127.0.0.1:8000/analyze-prompt')}
              className="px-2.5 py-1.5 bg-obsidian hover:bg-carbon border border-bordercolor rounded text-slate-400 hover:text-white"
            >
              Default (Port 8000)
            </button>
            <button
              onClick={() => setApiEndpoint('/analyze-prompt')}
              className="px-2.5 py-1.5 bg-obsidian hover:bg-carbon border border-bordercolor rounded text-slate-400 hover:text-white"
            >
              Self-Host Proxy
            </button>
          </div>
        )}

        {/* Two-Column Grid: Left (Interceptor) + Right (Risk Analysis) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT PANEL: INTERCEPTOR (7/12) ================= */}
          <section className="lg:col-span-7 flex flex-col gap-6">
            {/* Intercept & Transform Card */}
            <div className="glass-panel rounded-xl p-5 flex flex-col relative overflow-hidden border border-bordercolor">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white text-sm uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Terminal className="w-4 h-4 text-accentGold" />
                  Prompt Intercept &amp; Secure Process
                </h3>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-400">{promptInput.length} chars</span>
                  <button
                    onClick={handlePaste}
                    className="p-1 px-2 rounded bg-obsidian hover:bg-carbon border border-bordercolor text-slate-300 transition-colors cursor-pointer"
                    title="Paste from clipboard"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5 inline mr-1 text-accentGold" /> Paste
                  </button>
                  <button
                    onClick={handleCopyPrompt}
                    className="p-1 px-2 rounded bg-obsidian hover:bg-carbon border border-bordercolor text-slate-300 transition-colors cursor-pointer"
                    title="Copy input prompt"
                  >
                    {copiedPrompt ? <Check className="w-3.5 h-3.5 inline text-safeGreen" /> : <Copy className="w-3.5 h-3.5 inline" />}
                  </button>
                  <button
                    onClick={handleClear}
                    className="p-1 px-2 rounded bg-obsidian hover:bg-carbon border border-bordercolor text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Clear prompt"
                  >
                    <RotateCcw className="w-3.5 h-3.5 inline" />
                  </button>
                </div>
              </div>

              {/* Textarea for user input */}
              <textarea
                id="userInput"
                value={promptInput}
                onChange={(e) => {
                  setPromptInput(e.target.value);
                  setActivePresetId(null);
                }}
                className="w-full bg-obsidian border border-bordercolor rounded-lg p-4 text-sm text-slate-200 focus:outline-none focus:border-accentGold/60 transition resize-none min-h-[140px] mb-4 font-sans leading-relaxed"
                placeholder="E.g., Try inputting PII (Names, Phone Numbers, Card details or enterprise keys) to view realtime masking..."
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-safeGreen" />
                  <span>Payload will be dispatched to <code className="text-slate-300">/analyze-prompt</code></span>
                </div>

                {/* 'Process & Inspect' button styled with Cyber Gold */}
                <button
                  onClick={() => processAndInspect(promptInput)}
                  disabled={isAnalyzing}
                  className="bg-gradient-to-r from-accentGold to-amber-600 hover:from-amber-500 hover:to-accentGold text-black font-bold py-3 px-6 rounded-lg transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 glow-gold self-end cursor-pointer disabled:opacity-50"
                >
                  <span>{isAnalyzing ? 'Processing...' : 'Process & Inspect'}</span>
                  <Cpu className="w-4 h-4 text-black" />
                </button>
              </div>
            </div>

            {/* Redacted output Visualizer Card (Processed Safe Prompt) */}
            <div className="glass-panel rounded-xl p-5 border border-bordercolor border-t-2 border-t-accentGold/60">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 font-mono">
                  <Shield className="w-4 h-4 text-safeGreen" />
                  Processed Safe Prompt (Redacted Response)
                </h4>
                <button
                  onClick={handleCopyMasked}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-obsidian border border-bordercolor text-slate-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
                >
                  {copiedMasked ? <Check className="w-3 h-3 text-safeGreen" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedMasked ? 'Copied' : 'Copy Redacted'}</span>
                </button>
              </div>

              {/* Display box with masked entities highlighted in Gold/Red */}
              <div className="bg-obsidian border border-bordercolor rounded-lg p-4 min-h-[110px] text-sm text-slate-200 font-mono relative leading-relaxed select-all">
                {dlpResult?.masked_prompt ? (
                  renderHighlightedPrompt(dlpResult.masked_prompt)
                ) : (
                  <span className="text-slate-500">
                    Awaiting input prompt. Click &quot;Process &amp; Inspect&quot; to transform.
                  </span>
                )}
              </div>
            </div>

            {/* Strict JSON Output Viewer */}
            <div className="glass-panel rounded-xl p-5 border border-bordercolor">
              <JsonViewer result={dlpResult} includeTelemetry={false} />
            </div>
          </section>

          {/* ================= RIGHT PANEL: RISK ANALYSIS (5/12) ================= */}
          <section className="lg:col-span-5 flex flex-col gap-6">
            {/* Speedometer Gauge Card */}
            <div className="glass-panel rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden border border-bordercolor">
              <div className="w-full flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 font-mono">
                  <SpeedometerIcon score={currentScore} />
                  Security Risk Analysis
                </h4>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                    currentScore >= 61
                      ? 'bg-dangerRed/15 text-dangerRed border-dangerRed/40'
                      : currentScore >= 21
                      ? 'bg-accentGold/15 text-accentGold border-accentGold/40'
                      : 'bg-safeGreen/15 text-safeGreen border-safeGreen/40'
                  }`}
                >
                  {dlpResult?.risk_level || 'EVALUATING'}
                </span>
              </div>

              {/* Semi-circular Speedometer SVG */}
              <SpeedometerGauge score={currentScore} loading={isAnalyzing} />

              <p className="text-xs text-slate-400 px-4 mt-2">
                {currentScore >= 61
                  ? 'High risk exposure: Sensitive credentials, financial data, or clinical PHI intercepted.'
                  : currentScore >= 21
                  ? 'Medium risk: Personal identity records (names, contact info) sanitized.'
                  : 'Low risk: Clean prompt without sensitive regulatory exposure.'}
              </p>

              {/* Status Banner */}
              <div
                className={`mt-4 w-full p-2.5 rounded-lg border text-xs font-mono font-bold flex items-center justify-center gap-2 ${
                  dlpResult?.safe_to_process
                    ? 'bg-safeGreen/10 border-safeGreen/30 text-safeGreen'
                    : 'bg-dangerRed/10 border-dangerRed/30 text-dangerRed'
                }`}
              >
                {dlpResult?.safe_to_process ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-safeGreen" />
                    <span>SAFE_TO_PROCESS: TRUE (Zero Data Leakage)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-dangerRed" />
                    <span>SAFE_TO_PROCESS: FALSE (Malicious Injection Blocked)</span>
                  </>
                )}
              </div>
            </div>

            {/* Violations Prevented Section */}
            <div className="glass-panel rounded-xl p-5 border border-bordercolor">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 font-mono">
                  <Scale className="w-4 h-4 text-accentGold" />
                  Violations Prevented
                </h4>
                <span className="text-[11px] font-mono text-slate-500">
                  {violations.length} Framework{violations.length === 1 ? '' : 's'} Protected
                </span>
              </div>

              {/* Regulatory Framework Tags */}
              <div className="flex flex-wrap gap-2">
                {violations.length > 0 ? (
                  violations.map((framework) => {
                    const isCard = framework === 'PCI-DSS';
                    const isGdpr = framework === 'GDPR';
                    const isSevere = isCard || isGdpr;

                    return (
                      <span
                        key={framework}
                        className={`text-xs px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1.5 border ${
                          isSevere
                            ? 'bg-dangerRed/15 border-dangerRed/40 text-dangerRed glow-red'
                            : 'bg-accentGold/15 border-accentGold/40 text-accentGold glow-gold'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        <span>{framework} VIOLATION PREVENTED</span>
                      </span>
                    );
                  })
                ) : (
                  <span className="bg-safeGreen/15 border border-safeGreen/40 text-safeGreen text-xs px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ALL REGULATORY FRAMEWORKS COMPLIANT</span>
                  </span>
                )}
              </div>
            </div>

            {/* Forensic Logs & Detected Entities Section */}
            <div className="glass-panel rounded-xl p-5 flex-1 border border-bordercolor">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 font-mono">
                  <Eye className="w-4 h-4 text-accentGold" />
                  Forensic Redaction Logs ({dlpResult?.forensic_logs?.length ?? entities.length})
                </h4>
                <span className="text-[11px] text-safeGreen font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-safeGreen"></span>
                  {dlpResult?.threat_analysis?.action_taken || 'PAYLOAD_SANITIZED'}
                </span>
              </div>

              {/* Forensic Logs List */}
              <div className="flex flex-col gap-2.5">
                {dlpResult?.forensic_logs && dlpResult.forensic_logs.length > 0 ? (
                  dlpResult.forensic_logs.map((item, index) => {
                    const isSevere =
                      item.compliance_framework_saved === 'PCI-DSS' ||
                      item.compliance_framework_saved === 'SOC-2' ||
                      item.redaction_tag.includes('CARD') ||
                      item.redaction_tag.includes('VISA') ||
                      item.redaction_tag.includes('SECRET') ||
                      item.redaction_tag.includes('BREACH');

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2.5 bg-obsidian border border-bordercolor rounded-lg transition-colors hover:border-accentGold/40"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-1.5 rounded border ${
                              isSevere
                                ? 'bg-dangerRed/10 border-dangerRed/30 text-dangerRed'
                                : 'bg-accentGold/10 border-accentGold/30 text-accentGold'
                            }`}
                          >
                            {getEntityIcon(item.entity_type)}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-white block leading-tight">
                              {item.entity_type}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Tag: <code className="text-accentGold font-bold bg-carbon px-1 py-0.5 rounded border border-bordercolor">{item.redaction_tag}</code>
                            </span>
                          </div>
                        </div>

                        {/* Framework & Redacted Badge */}
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase border ${
                              isSevere
                                ? 'bg-dangerRed/15 border-dangerRed/40 text-dangerRed'
                                : 'bg-accentGold/15 border-accentGold/40 text-accentGold'
                            }`}
                          >
                            {item.compliance_framework_saved}
                          </span>
                          <span className="text-[10px] bg-safeGreen/15 border border-safeGreen/40 text-safeGreen px-2 py-0.5 rounded font-mono uppercase font-bold tracking-wider">
                            Redacted
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : entities.length === 0 ? (
                  <div className="text-xs text-slate-500 font-mono py-4 text-center bg-obsidian rounded border border-bordercolor">
                    No sensitive entities detected in prompt.
                  </div>
                ) : (
                  entities.map((item, index) => {
                    const label = item.entity_name || item.entity_type || 'Sensitive Token';
                    const isCreditCard = label.toLowerCase().includes('credit') || label.toLowerCase().includes('card');
                    const isKey = label.toLowerCase().includes('key') || label.toLowerCase().includes('password') || label.toLowerCase().includes('secret');

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2.5 bg-obsidian border border-bordercolor rounded-lg transition-colors hover:border-accentGold/40"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-1.5 rounded border ${
                              isCreditCard || isKey
                                ? 'bg-dangerRed/10 border-dangerRed/30 text-dangerRed'
                                : 'bg-accentGold/10 border-accentGold/30 text-accentGold'
                            }`}
                          >
                            {getEntityIcon(label)}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-white block leading-tight">
                              {label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Entity #{index + 1}
                            </span>
                          </div>
                        </div>

                        {/* Status: Masked Badge */}
                        <span className="text-[10px] bg-safeGreen/15 border border-safeGreen/40 text-safeGreen px-2.5 py-0.5 rounded font-mono uppercase font-bold tracking-wider">
                          {item.status || item.action_taken || 'Masked'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Defense Telemetry Box */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-obsidian border border-bordercolor rounded-lg p-3">
                <span className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1">
                  Prompt Injection Shield
                </span>
                <span
                  className={`font-bold flex items-center gap-1.5 ${
                    dlpResult?.defense_telemetry?.prompt_injection_detected
                      ? 'text-dangerRed'
                      : 'text-safeGreen'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${dlpResult?.defense_telemetry?.prompt_injection_detected ? 'bg-dangerRed animate-ping' : 'bg-safeGreen'}`}></span>
                  {dlpResult?.defense_telemetry?.prompt_injection_detected
                    ? 'BREACH_ATTEMPT DETECTED'
                    : 'CLEAN (NO INJECTION)'}
                </span>
              </div>

              <div className="bg-obsidian border border-bordercolor rounded-lg p-3">
                <span className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1">
                  Data Leakage Prevention
                </span>
                <span className="text-safeGreen font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-safeGreen"></span>
                  {dlpResult?.defense_telemetry?.data_leakage_prevented ? 'PREVENTED & REDACTED' : 'CLEAN TRAFFIC'}
                </span>
              </div>
            </div>

            {/* Audit Trail & Secure Connection Status Box */}
            <div className="text-[11px] font-mono text-slate-500 bg-obsidian p-4 border border-bordercolor rounded-lg">
              <div className="flex items-center justify-between mb-1.5 text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3 h-3 text-accentGold" />
                  Audit logs: Connected
                </span>
                <span className="text-safeGreen flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 bg-safeGreen rounded-full animate-pulse"></span> Active Feed
                </span>
              </div>
              <div className="text-slate-400 truncate">
                {new Date().toISOString().replace('T', ' ').slice(0, 19)} [SECURE] PII Redacted -&gt; Payload Encrypted -&gt; Safe-Proxy to Gemini 1.5
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer - Strict Palette */}
      <footer className="border-t border-bordercolor bg-carbon px-6 py-3.5 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 mt-auto">
        <div className="flex items-center gap-2">
          <span>🔒</span>
          <span>PrivacyShield AI Engine v1.0. All Intercepts Redacted &amp; Cleared Local Memory in Realtime.</span>
        </div>
        <div className="mt-2 md:mt-0 font-mono text-slate-400">
          Powered by IBM LinuxONE &amp; Google AI Studio
        </div>
      </footer>

      {/* Modals */}
      <LlmSimulatorModal
        isOpen={isSimulatorModalOpen}
        onClose={() => setIsSimulatorModalOpen(false)}
        originalPrompt={promptInput}
        dlpResult={dlpResult}
      />

      <PolicyConfigModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        config={DEFAULT_POLICY}
        onChange={() => {}}
      />

      <ApiSandboxModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        currentPrompt={promptInput}
      />

      <AuditLogTable
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        entries={auditEntries}
        onClear={() => setAuditEntries([])}
      />
    </div>
  );
}

// Visual highlighting helper: Masked placeholders in Gold / Red
function renderHighlightedPrompt(maskedText: string) {
  // Regex to capture placeholders like [PERSON], [CREDIT_CARD], [EMAIL], [API_KEY], etc.
  const parts = maskedText.split(/(\[[A-Z0-9_]+\])/g);

  return parts.map((part, idx) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      const isRed =
        part.includes('CARD') ||
        part.includes('VISA') ||
        part.includes('MASTERCARD') ||
        part.includes('AMEX') ||
        part.includes('PASSWORD') ||
        part.includes('SECRET') ||
        part.includes('SSN') ||
        part.includes('KEY') ||
        part.includes('BREACH');

      return (
        <span
          key={idx}
          className={`inline-block px-1.5 py-0.5 rounded border font-bold text-xs mx-0.5 ${
            isRed
              ? 'bg-dangerRed/20 text-dangerRed border-dangerRed/50'
              : 'bg-accentGold/20 text-accentGold border-accentGold/50'
          }`}
        >
          {part}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

function getEntityIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('credit') || lower.includes('card')) {
    return <CreditCard className="w-3.5 h-3.5 text-dangerRed" />;
  }
  if (lower.includes('key') || lower.includes('password') || lower.includes('secret') || lower.includes('token')) {
    return <Key className="w-3.5 h-3.5 text-dangerRed" />;
  }
  if (lower.includes('email')) {
    return <Mail className="w-3.5 h-3.5 text-accentGold" />;
  }
  if (lower.includes('health') || lower.includes('diagnosis') || lower.includes('medical') || lower.includes('phi')) {
    return <HeartPulse className="w-3.5 h-3.5 text-accentGold" />;
  }
  if (lower.includes('ip') || lower.includes('network')) {
    return <Network className="w-3.5 h-3.5 text-accentGold" />;
  }
  return <User className="w-3.5 h-3.5 text-accentGold" />;
}

function SpeedometerIcon({ score }: { score: number }) {
  if (score >= 61) {
    return <AlertTriangle className="w-4 h-4 text-dangerRed" />;
  }
  if (score >= 21) {
    return <Sparkles className="w-4 h-4 text-accentGold" />;
  }
  return <CheckCircle2 className="w-4 h-4 text-safeGreen" />;
}
