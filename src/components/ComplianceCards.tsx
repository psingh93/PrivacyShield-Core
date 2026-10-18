import React from 'react';
import { AlertCircle, CheckCircle2, Shield, Scale, FileText, Lock } from 'lucide-react';

interface ComplianceCardsProps {
  alerts: string[];
}

interface FrameworkMeta {
  code: string;
  name: string;
  region: string;
  description: string;
  clause: string;
  icon: React.ReactNode;
}

const FRAMEWORKS: FrameworkMeta[] = [
  {
    code: 'GDPR',
    name: 'General Data Protection Regulation',
    region: 'EU / EEA',
    description: 'Protection of natural persons with regard to personal data processing.',
    clause: 'Art. 6 (Lawful Basis) & Art. 9 (Special Category Data)',
    icon: <Scale className="w-4 h-4 text-accentGold" />,
  },
  {
    code: 'PCI-DSS',
    name: 'Payment Card Industry Data Security Standard',
    region: 'Global / Payment Systems',
    description: 'Mandatory technical controls for primary account numbers (PAN) & card data.',
    clause: 'Requirement 3: Protect Stored Cardholder Data',
    icon: <Lock className="w-4 h-4 text-dangerRed" />,
  },
  {
    code: 'HIPAA',
    name: 'Health Insurance Portability & Accountability Act',
    region: 'United States',
    description: 'Protection of Protected Health Information (PHI) & clinical privacy.',
    clause: 'Privacy Rule § 164.514 (18 PHI Safe Harbor Identifiers)',
    icon: <Shield className="w-4 h-4 text-accentGold" />,
  },
  {
    code: 'DPDP',
    name: 'Digital Personal Data Protection Act',
    region: 'India / APAC',
    description: 'Statutory compliance for processing digital personal data & consent records.',
    clause: 'Section 6 (Consent) & Section 8 (Security Safeguards)',
    icon: <FileText className="w-4 h-4 text-accentGold" />,
  },
  {
    code: 'SOC-2',
    name: 'SOC 2 Type II Security & Confidentiality',
    region: 'Global Enterprise',
    description: 'Controls preventing API keys, passwords, and private network telemetry leaks.',
    clause: 'Trust Services Criteria CC6.1 & CC6.6 (Logical Access & Secrets)',
    icon: <AlertCircle className="w-4 h-4 text-dangerRed" />,
  },
];

export const ComplianceCards: React.FC<ComplianceCardsProps> = ({ alerts }) => {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
          <Scale className="w-3.5 h-3.5 text-accentGold" />
          Regulatory Compliance Impact
        </h3>
        <span className="text-[11px] font-mono text-slate-500">
          {alerts.length} Framework{alerts.length === 1 ? '' : 's'} Triggered
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {FRAMEWORKS.map((fw) => {
          const isTriggered = alerts.includes(fw.code) || alerts.some((a) => a.includes(fw.code));
          return (
            <div
              key={fw.code}
              className={`p-3 rounded-lg border transition-all ${
                isTriggered
                  ? 'bg-carbon border-dangerRed/50 shadow-sm shadow-black/40 ring-1 ring-dangerRed/30'
                  : 'bg-obsidian/60 border-bordercolor opacity-65'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 font-bold font-mono text-xs">
                  {fw.icon}
                  <span className={isTriggered ? 'text-white' : 'text-slate-400'}>{fw.code}</span>
                </div>
                {isTriggered ? (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-dangerRed/15 text-dangerRed border border-dangerRed/40 flex items-center gap-1">
                    <AlertCircle className="w-2.5 h-2.5" /> TRIGGERED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-obsidian text-slate-500 border border-bordercolor flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-safeGreen" /> Compliant
                  </span>
                )}
              </div>

              <div className="text-[11px] font-medium text-slate-300 line-clamp-1 font-sans">{fw.name}</div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                {fw.description}
              </p>
              {isTriggered && (
                <div className="mt-2 pt-1.5 border-t border-dangerRed/30 text-[9px] font-mono text-dangerRed">
                  {fw.clause}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
