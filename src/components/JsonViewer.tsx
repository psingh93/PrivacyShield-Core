import React, { useState } from 'react';
import { Copy, Check, Code2, Terminal, Shield, Zap } from 'lucide-react';
import { DLPResult, PrivacyShieldQuantumResponse } from '../types/dlp';

interface JsonViewerProps {
  result: DLPResult | null;
  includeTelemetry?: boolean;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ result, includeTelemetry = false }) => {
  const [copied, setCopied] = useState(false);
  const [copiedMinified, setCopiedMinified] = useState(false);
  const [schemaVersion, setSchemaVersion] = useState<'quantum' | 'standard' | 'extended'>('quantum');

  if (!result) {
    return (
      <div className="bg-obsidian border border-bordercolor rounded-xl p-8 text-center text-slate-500 font-mono text-xs">
        // PrivacyShield Quantum JSON Output schema will be rendered here.
      </div>
    );
  }

  // Build the strict canonical JSON output matching the specification exactly
  let canonicalJson: Record<string, any>;

  if (schemaVersion === 'quantum') {
    canonicalJson = {
      status: result.status === 'blocked' ? 'blocked' : 'success',
      risk_score: result.risk_score ?? result.original_risk_score,
      risk_level: result.risk_level,
      masked_prompt: result.masked_prompt,
      violations_prevented: result.violations_prevented || result.compliance_alerts || [],
      detected_entities: (result.detected_entities || []).map((e) => ({
        entity_type: e.entity_type || e.entity_name || 'Sensitive Token',
        action_taken: (e.action_taken === 'Blocked' ? 'Blocked' : 'Masked') as 'Masked' | 'Blocked',
      })),
      defense_telemetry: {
        prompt_injection_detected: Boolean(result.defense_telemetry?.prompt_injection_detected || result.status === 'blocked'),
        data_leakage_prevented: Boolean(result.defense_telemetry?.data_leakage_prevented || result.status === 'blocked' || result.detected_entities.length > 0),
      },
    };
  } else if (schemaVersion === 'standard') {
    canonicalJson = {
      status: result.status,
      risk_score: result.risk_score ?? result.original_risk_score,
      masked_prompt: result.masked_prompt,
      violations_prevented: result.violations_prevented ?? result.compliance_alerts,
      detected_entities: result.detected_entities.map((e) => ({
        entity_name:
          e.entity_name ||
          (e.entity_type === 'CREDIT_CARD'
            ? 'Credit Card'
            : e.entity_type === 'PERSON'
            ? 'PII (Person Name)'
            : e.entity_type === 'EMAIL'
            ? 'Private Email'
            : e.entity_type),
        status: e.status || e.action_taken || 'Masked',
      })),
    };
  } else {
    canonicalJson = {
      status: result.status,
      original_risk_score: result.original_risk_score,
      risk_level: result.risk_level,
      masked_prompt: result.masked_prompt,
      detected_entities: result.detected_entities.map((e) => ({
        entity_type: e.entity_type,
        action_taken: e.action_taken,
      })),
      compliance_alerts: result.compliance_alerts,
      safe_to_process: result.safe_to_process,
    };
  }

  if (includeTelemetry && result._telemetry) {
    canonicalJson._telemetry = result._telemetry;
  }

  const jsonString = JSON.stringify(canonicalJson, null, 2);
  const minifiedString = JSON.stringify(canonicalJson);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyMinified = async () => {
    await navigator.clipboard.writeText(minifiedString);
    setCopiedMinified(true);
    setTimeout(() => setCopiedMinified(false), 2000);
  };

  // Syntax highlighting for JSON
  const renderFormattedJson = () => {
    const lines = jsonString.split('\n');
    return lines.map((line, idx) => {
      // Keys
      let formattedLine = line.replace(
        /"([^"]+)":/g,
        '<span class="text-accentGold font-semibold">"$1"</span>:'
      );
      // String values
      formattedLine = formattedLine.replace(
        /: "([^"]*)"/g,
        ': <span class="text-slate-300">"$1"</span>'
      );
      // Numbers
      formattedLine = formattedLine.replace(
        /: (\d+)/g,
        ': <span class="text-accentGold font-bold">$1</span>'
      );
      // Booleans
      formattedLine = formattedLine.replace(
        /: (true|false)/g,
        ': <span class="text-safeGreen font-bold">$1</span>'
      );

      return (
        <div key={idx} className="table-row">
          <span className="table-cell pr-4 select-none text-slate-600 text-right font-mono text-[11px] w-8">
            {idx + 1}
          </span>
          <span
            className="table-cell font-mono text-xs whitespace-pre"
            dangerouslySetInnerHTML={{ __html: formattedLine }}
          />
        </div>
      );
    });
  };

  return (
    <div className="bg-obsidian border border-bordercolor rounded-xl overflow-hidden shadow-2xl font-mono">
      {/* JSON Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-2.5 bg-carbon border-b border-bordercolor">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-accentGold" />
          <span className="text-xs font-bold text-white tracking-wider uppercase">
            {schemaVersion === 'quantum' ? 'Quantum Zero-Trust Spec' : 'DLP Interceptor Payload'}
          </span>
          <div className="inline-flex rounded-lg bg-obsidian p-0.5 border border-bordercolor text-[10px] ml-2">
            <button
              onClick={() => setSchemaVersion('quantum')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                schemaVersion === 'quantum'
                  ? 'bg-carbon text-accentGold font-bold border border-accentGold/30 glow-gold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Quantum Spec
            </button>
            <button
              onClick={() => setSchemaVersion('standard')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                schemaVersion === 'standard'
                  ? 'bg-carbon text-accentGold font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Classic DLP
            </button>
            <button
              onClick={() => setSchemaVersion('extended')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                schemaVersion === 'extended'
                  ? 'bg-carbon text-accentGold font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Extended
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleCopyMinified}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-obsidian hover:bg-carbon text-slate-300 text-xs transition-colors border border-bordercolor cursor-pointer"
            title="Copy minified single-line JSON"
          >
            {copiedMinified ? (
              <>
                <Check className="w-3 h-3 text-safeGreen" />
                <span className="text-safeGreen font-bold">Copied Minified</span>
              </>
            ) : (
              <>
                <Zap className="w-3 h-3 text-accentGold" />
                <span>Copy Minified</span>
              </>
            )}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-obsidian hover:bg-carbon text-slate-200 text-xs transition-colors border border-bordercolor cursor-pointer"
            title="Copy formatted JSON payload"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-safeGreen" />
                <span className="text-safeGreen font-bold">Copied JSON</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Display */}
      <div className="p-4 overflow-x-auto max-h-[340px] overflow-y-auto text-xs scrollbar-thin scrollbar-thumb-bordercolor">
        <div className="table w-full">{renderFormattedJson()}</div>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-carbon/60 border-t border-bordercolor flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 text-slate-400">
          <Terminal className="w-3 h-3 text-accentGold" />
          <span>PrivacyShield Quantum RFC 8259 Schema</span>
        </span>
        <span className="text-safeGreen font-bold flex items-center gap-1">
          <Shield className="w-3 h-3 text-safeGreen" />
          Zero Data Leakage Certified
        </span>
      </div>
    </div>
  );
};
