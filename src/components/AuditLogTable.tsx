import React, { useState } from 'react';
import { X, Download, Trash2, Search, ShieldCheck } from 'lucide-react';
import { AuditEntry } from '../types/dlp';

interface AuditLogTableProps {
  isOpen: boolean;
  onClose: () => void;
  entries: AuditEntry[];
  onClear: () => void;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  isOpen,
  onClose,
  entries,
  onClear,
}) => {
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  if (!isOpen) return null;

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.original_prompt.toLowerCase().includes(search.toLowerCase()) ||
      entry.result.masked_prompt.toLowerCase().includes(search.toLowerCase()) ||
      (entry.result.violations_prevented || entry.result.compliance_alerts || []).some((c) =>
        c.toLowerCase().includes(search.toLowerCase())
      );

    const matchesFilter = filterLevel === 'ALL' || entry.result.risk_level === filterLevel;

    return matchesSearch && matchesFilter;
  });

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `privacyshield-audit-log-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const exportCsv = () => {
    const headers = ['Timestamp', 'Risk Score', 'Risk Level', 'Entities Masked', 'Violations Prevented', 'Safe To Process', 'Original Prompt Preview'];
    const rows = entries.map((e) => [
      e.timestamp,
      e.result.risk_score ?? e.result.original_risk_score,
      e.result.risk_level,
      e.result.detected_entities.map((ent) => ent.entity_name || ent.entity_type).join('; '),
      (e.result.violations_prevented || e.result.compliance_alerts || []).join('; '),
      e.result.safe_to_process ? 'YES' : 'NO',
      `"${e.original_prompt.replace(/"/g, '""').slice(0, 100)}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `privacyshield-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm font-sans">
      <div className="bg-carbon border border-bordercolor rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-bordercolor bg-obsidian">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-accentGold/10 border border-accentGold/30 text-accentGold glow-gold">
              <ShieldCheck className="w-5 h-5 text-accentGold" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">DLP Interception Audit Log</h2>
              <p className="text-xs text-slate-400">
                Tamper-evident record of intercepted prompts, sanitization actions, and regulatory compliance breaches.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              disabled={entries.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-obsidian hover:bg-carbon text-slate-200 text-xs font-mono transition-colors border border-bordercolor disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-accentGold" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={exportJson}
              disabled={entries.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-obsidian hover:bg-carbon text-slate-200 text-xs font-mono transition-colors border border-bordercolor disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-safeGreen" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={onClear}
              disabled={entries.length === 0}
              className="p-1.5 rounded-lg text-slate-400 hover:text-dangerRed hover:bg-obsidian transition-colors disabled:opacity-50 cursor-pointer"
              title="Clear audit entries"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-obsidian transition-colors ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-bordercolor bg-obsidian/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search prompt, entity, or alert..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-obsidian border border-bordercolor rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accentGold font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto text-xs font-mono">
            <span className="text-slate-500 text-[11px]">Filter Risk:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                  filterLevel === lvl
                    ? 'bg-carbon border-accentGold text-accentGold'
                    : 'bg-obsidian border-bordercolor text-slate-400 hover:bg-carbon'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto">
          {filteredEntries.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs font-mono">
              No audit log records found matching query.
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-obsidian border-b border-bordercolor text-slate-400 uppercase text-[10px] sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Risk</th>
                  <th className="py-2.5 px-4">Entities Detected</th>
                  <th className="py-2.5 px-4">Violations Prevented</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Prompt Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bordercolor/60">
                {filteredEntries.map((entry) => {
                  const score = entry.result.risk_score ?? entry.result.original_risk_score ?? 0;
                  const isCrit = entry.result.risk_level === 'CRITICAL' || !entry.result.safe_to_process;
                  const isHigh = entry.result.risk_level === 'HIGH';
                  const isMed = entry.result.risk_level === 'MEDIUM';

                  return (
                    <tr key={entry.id} className="hover:bg-obsidian/60 transition-colors">
                      <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isCrit
                              ? 'bg-dangerRed/15 text-dangerRed border-dangerRed/40'
                              : isHigh || isMed
                              ? 'bg-accentGold/15 text-accentGold border-accentGold/40'
                              : 'bg-safeGreen/15 text-safeGreen border-safeGreen/40'
                          }`}
                        >
                          {score}/100 • {entry.result.risk_level}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {entry.result.detected_entities.length === 0 ? (
                            <span className="text-slate-600">None</span>
                          ) : (
                            entry.result.detected_entities.map((e, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.2 rounded bg-carbon text-accentGold text-[10px] border border-accentGold/30"
                              >
                                {e.entity_name || e.entity_type}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(entry.result.violations_prevented || entry.result.compliance_alerts || []).length === 0 ? (
                            <span className="text-safeGreen font-bold">Compliant</span>
                          ) : (
                            (entry.result.violations_prevented || entry.result.compliance_alerts || []).map((c, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.2 rounded bg-dangerRed/15 text-dangerRed text-[10px] border border-dangerRed/40 font-bold"
                              >
                                {c}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold ${
                            entry.result.safe_to_process ? 'text-safeGreen' : 'text-dangerRed'
                          }`}
                        >
                          {entry.result.safe_to_process ? 'PASSED' : 'BLOCKED'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-300 truncate max-w-xs font-sans">
                        {entry.original_prompt}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-bordercolor bg-obsidian flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Showing {filteredEntries.length} of {entries.length} recorded events</span>
          <span className="text-safeGreen font-bold">IBM LinuxONE / SOC 2 Compliance</span>
        </div>
      </div>
    </div>
  );
};
