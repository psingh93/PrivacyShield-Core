import React, { useState } from 'react';
import { Eye, Shield, Tag, ArrowRight, Check, Copy } from 'lucide-react';
import { DLPResult, DetailedEntitySpan } from '../types/dlp';

interface VisualHighlighterProps {
  originalText: string;
  result: DLPResult | null;
}

export const VisualHighlighter: React.FC<VisualHighlighterProps> = ({ originalText, result }) => {
  const [selectedSpan, setSelectedSpan] = useState<DetailedEntitySpan | null>(null);
  const [copied, setCopied] = useState(false);

  if (!result || !originalText.trim()) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs font-mono">
        Enter a prompt above to inspect sensitive entity tokens and zero-leakage masking.
      </div>
    );
  }

  const spans = result._telemetry?.masked_spans || [];

  const handleCopyMasked = async () => {
    if (!result?.masked_prompt) return;
    await navigator.clipboard.writeText(result.masked_prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getEntityStyle = (category: string) => {
    switch (category) {
      case 'financial':
        return 'bg-rose-500/20 text-rose-200 border-rose-500/50 hover:bg-rose-500/30';
      case 'secret':
        return 'bg-red-500/20 text-red-200 border-red-500/50 hover:bg-red-500/30';
      case 'health':
        return 'bg-amber-500/20 text-amber-200 border-amber-500/50 hover:bg-amber-500/30';
      case 'network':
        return 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50 hover:bg-cyan-500/30';
      case 'pii':
      default:
        return 'bg-indigo-500/20 text-indigo-200 border-indigo-500/50 hover:bg-indigo-500/30';
    }
  };

  // Render tokens with highlights
  const renderHighlightedPrompt = () => {
    if (spans.length === 0) {
      return <span className="text-slate-300">{originalText}</span>;
    }

    const elements: React.ReactNode[] = [];
    let cursor = 0;

    spans.forEach((span, idx) => {
      // Unmasked text before span
      if (span.start > cursor) {
        elements.push(
          <span key={`text-${cursor}`} className="text-slate-300">
            {originalText.slice(cursor, span.start)}
          </span>
        );
      }

      // Highlighted sensitive token
      const isSelected = selectedSpan?.id === span.id;
      elements.push(
        <button
          key={`span-${span.id}-${idx}`}
          onClick={() => setSelectedSpan(span)}
          className={`inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded text-xs font-mono font-medium border transition-all cursor-pointer ${getEntityStyle(
            span.category
          )} ${isSelected ? 'ring-2 ring-white shadow-lg' : ''}`}
          title={`Click to inspect ${span.entity_type}`}
        >
          <Tag className="w-2.5 h-2.5 opacity-70" />
          <span>{span.value}</span>
          <span className="text-[10px] opacity-75 font-bold">→ {span.placeholder}</span>
        </button>
      );

      cursor = span.end;
    });

    if (cursor < originalText.length) {
      elements.push(
        <span key={`text-end`} className="text-slate-300">
          {originalText.slice(cursor)}
        </span>
      );
    }

    return elements;
  };

  return (
    <div className="space-y-4">
      {/* Visual Token Detection View */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            Detected Sensitive Entities ({spans.length})
          </span>
          <span className="text-[11px] text-slate-500">Click highlighted tokens to inspect details</span>
        </div>

        <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg text-xs leading-relaxed font-sans min-h-[70px] max-h-48 overflow-y-auto">
          {renderHighlightedPrompt()}
        </div>

        {/* Selected token inspector card */}
        {selectedSpan && (
          <div className="mt-3 p-3 bg-slate-800/80 border border-slate-700/80 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white">{selectedSpan.entity_type}</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-700">
                  {selectedSpan.category}
                </span>
                <span className="text-[10px] text-slate-400">
                  Confidence: {Math.round(selectedSpan.confidence * 100)}%
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">{selectedSpan.description}</p>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-rose-300 line-through bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                {selectedSpan.value}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                {selectedSpan.placeholder}
              </span>
              <button
                onClick={() => setSelectedSpan(null)}
                className="text-slate-500 hover:text-slate-300 ml-1 text-xs"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Zero-Leakage Masked Prompt Output */}
      <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-4 shadow-sm shadow-emerald-950/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 font-mono">
              Zero-Leakage Masked Prompt
            </span>
          </div>
          <button
            onClick={handleCopyMasked}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-mono transition-colors border border-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Masked</span>
              </>
            )}
          </button>
        </div>

        <div className="p-3 bg-slate-950 border border-emerald-500/20 rounded-lg text-xs leading-relaxed font-mono text-emerald-100/90 min-h-[70px] select-all">
          {result.masked_prompt || <span className="text-slate-600">No output generated.</span>}
        </div>
      </div>
    </div>
  );
};
