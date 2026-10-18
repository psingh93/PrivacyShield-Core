import React from 'react';
import { X, Sliders, Check } from 'lucide-react';
import { PolicyConfig } from '../types/dlp';

interface PolicyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PolicyConfig;
  onChange: (newConfig: PolicyConfig) => void;
}

export const PolicyConfigModal: React.FC<PolicyConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onChange,
}) => {
  if (!isOpen) return null;

  const toggleRule = (key: keyof PolicyConfig) => {
    onChange({
      ...config,
      [key]: !config[key],
    });
  };

  const handleStyleChange = (style: PolicyConfig['maskingStyle']) => {
    onChange({
      ...config,
      maskingStyle: style,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm font-sans">
      <div className="bg-carbon border border-bordercolor rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-bordercolor bg-obsidian">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accentGold/10 border border-accentGold/30 text-accentGold glow-gold">
              <Sliders className="w-5 h-5 text-accentGold" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">DLP Governance &amp; Redaction Policy</h2>
              <p className="text-xs text-slate-400">
                Configure active detection rules, placeholder tokens, and threat enforcement thresholds.
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

        {/* Content */}
        <div className="p-5 space-y-5 flex-1">
          {/* Masking Token Style */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Placeholder Tokenization Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'standard',
                  title: 'Standard (Spec)',
                  sample: '[PERSON], [EMAIL]',
                  desc: 'Exact prompt specification',
                },
                {
                  id: 'indexed',
                  title: 'Indexed Spans',
                  sample: '[PERSON_1], [EMAIL_1]',
                  desc: 'Distinguishes multiple entities',
                },
                {
                  id: 'asterisk',
                  title: 'Redacted Prefix',
                  sample: '[REDACTED_PERSON]',
                  desc: 'Explicit enterprise redaction',
                },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => handleStyleChange(style.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    config.maskingStyle === style.id
                      ? 'bg-carbon border-accentGold text-white shadow-sm glow-gold'
                      : 'bg-obsidian border-bordercolor text-slate-400 hover:bg-carbon hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-200">{style.title}</div>
                  <div className="text-[11px] font-mono text-accentGold my-1 font-semibold">{style.sample}</div>
                  <div className="text-[10px] text-slate-500">{style.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Entity Detection Engines */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Active Entity Classifiers
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { key: 'detectCreditCards', label: 'Credit / Debit Cards (Luhn Algorithm)', tag: 'PCI-DSS' },
                { key: 'detectApiKeys', label: 'API Keys (AWS, OpenAI, GitHub, Bearer)', tag: 'SOC-2' },
                { key: 'detectPasswords', label: 'Plaintext Passwords & Auth Secrets', tag: 'SOC-2' },
                { key: 'detectSsn', label: 'Social Security Numbers (SSN)', tag: 'GDPR / HIPAA' },
                { key: 'detectMedicalPhi', label: 'Medical Diagnoses & PHI Conditions', tag: 'HIPAA' },
                { key: 'detectEmails', label: 'Corporate & Personal Email Addresses', tag: 'GDPR' },
                { key: 'detectPhones', label: 'International & National Phone Numbers', tag: 'DPDP' },
                { key: 'detectNames', label: 'Person & Individual Full Names', tag: 'GDPR' },
                { key: 'detectInternalIps', label: 'Internal IPs (10.x, 192.168.x, 172.x)', tag: 'SOC-2' },
                { key: 'detectInjections', label: 'Malicious Prompt Injections / Jailbreaks', tag: 'OWASP' },
              ].map((item) => {
                const isActive = (config as any)[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => toggleRule(item.key as any)}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer select-none transition-all ${
                      isActive
                        ? 'bg-carbon border-accentGold/60 text-white'
                        : 'bg-obsidian border-bordercolor text-slate-500'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-xs text-slate-200">{item.label}</div>
                      <span className="text-[10px] font-mono text-accentGold">{item.tag}</span>
                    </div>
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                        isActive
                          ? 'bg-accentGold border-accentGold text-black font-bold'
                          : 'border-bordercolor bg-obsidian'
                      }`}
                    >
                      {isActive && <Check className="w-3.5 h-3.5 stroke-[3] text-black" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-bordercolor bg-obsidian flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Policy applied instantaneously in real-time.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-accentGold hover:bg-amber-500 text-black text-xs font-bold font-mono transition-colors cursor-pointer"
          >
            Apply &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
