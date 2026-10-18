import React, { useState } from 'react';
import { X, Copy, Check, Terminal } from 'lucide-react';

interface ApiSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrompt: string;
}

export const ApiSandboxModal: React.FC<ApiSandboxModalProps> = ({
  isOpen,
  onClose,
  currentPrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'fastapi' | 'curl' | 'python' | 'node' | 'schema'>('fastapi');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const testPayload = JSON.stringify({
    user_prompt: currentPrompt || 'Hi, please analyze John Doe. Card: 4532-1111-2222-3333 and email: john.doe@company.com.',
  });

  const fastapiSnippet = `# requirements.txt:
# fastapi>=0.110.0
# uvicorn>=0.29.0
# google-generativeai>=0.8.0
# python-dotenv>=1.0.1

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="PrivacyShield AI Core", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PromptRequest(BaseModel):
    user_prompt: str

@app.post("/analyze-prompt")
async def analyze_prompt(request: PromptRequest):
    # Returns strict RFC 8259 JSON response
    return {
        "status": "success",
        "risk_score": 95,
        "masked_prompt": "Hi, please analyze [PERSON]. Card: [CREDIT_CARD].",
        "violations_prevented": ["GDPR", "PCI-DSS"],
        "detected_entities": [
            {"entity_name": "Credit Card", "status": "Masked"},
            {"entity_name": "PII", "status": "Masked"}
        ]
    }

# Run with: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
`;

  const curlSnippet = `curl -X POST http://127.0.0.1:8000/analyze-prompt \\
  -H "Content-Type: application/json" \\
  -d '${testPayload.replace(/'/g, "'\\''")}'`;

  const pythonSnippet = `import requests

def inspect_prompt_dlp(prompt: str):
    url = "http://127.0.0.1:8000/analyze-prompt"
    response = requests.post(url, json={"user_prompt": prompt})
    dlp_data = response.json()
    
    # Processed safe prompt with bold standard placeholders
    masked_prompt = dlp_data["masked_prompt"]
    print(f"Risk Score: {dlp_data['risk_score']}")
    print(f"Violations Prevented: {dlp_data['violations_prevented']}")
    print(f"Masked Prompt: {masked_prompt}")
    return masked_prompt

# Test
sanitized = inspect_prompt_dlp("${currentPrompt ? currentPrompt.replace(/"/g, '\\"') : 'Hi, please analyze John Doe.'}")
`;

  const nodeSnippet = `import fetch from 'node-fetch';

async function interceptWithPrivacyShield(prompt: string) {
  const res = await fetch('http://127.0.0.1:8000/analyze-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_prompt: prompt })
  });
  
  const dlp = await res.json();
  return dlp.masked_prompt;
}
`;

  const schemaSnippet = `{
  "system_metadata": {
    "status": "SECURE",
    "timestamp": "${new Date().toISOString()}"
  },
  "threat_analysis": {
    "risk_score": 95,
    "risk_level": "CRITICAL",
    "action_taken": "PAYLOAD_SANITIZED"
  },
  "sanitized_payload": "Hi, please analyze the spending habits of [PERSON_NAME]. His credit card is [VISA_CARD] and email is [EMAIL_ADDRESS].",
  "forensic_logs": [
    {
      "entity_type": "Credit Card (Visa)",
      "redaction_tag": "[VISA_CARD]",
      "compliance_framework_saved": "PCI-DSS"
    },
    {
      "entity_type": "Individual Person Name",
      "redaction_tag": "[PERSON_NAME]",
      "compliance_framework_saved": "GDPR"
    },
    {
      "entity_type": "Internal Email Address",
      "redaction_tag": "[EMAIL_ADDRESS]",
      "compliance_framework_saved": "GDPR"
    }
  ],
  "defense_telemetry": {
    "prompt_injection_detected": false,
    "data_leakage_prevented": true
  }
}`;

  const currentCode =
    activeTab === 'fastapi'
      ? fastapiSnippet
      : activeTab === 'curl'
      ? curlSnippet
      : activeTab === 'python'
      ? pythonSnippet
      : activeTab === 'node'
      ? nodeSnippet
      : schemaSnippet;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm font-sans">
      <div className="bg-carbon border border-bordercolor rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-bordercolor bg-obsidian">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accentGold/10 border border-accentGold/30 text-accentGold glow-gold">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Developer Integration &amp; API Endpoint</h2>
              <p className="text-xs text-slate-400">
                Intercept LLM traffic with PrivacyShield Core via standard REST / cURL / FastAPI middleware.
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

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-5 pt-3 border-b border-bordercolor bg-obsidian/40">
          <div className="flex items-center gap-2">
            {[
              { id: 'fastapi', label: 'FastAPI (Python)' },
              { id: 'curl', label: 'cURL Command' },
              { id: 'python', label: 'Python Client' },
              { id: 'node', label: 'Node.js' },
              { id: 'schema', label: 'JSON Schema' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 text-xs font-mono font-medium border-b-2 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-accentGold text-accentGold font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-obsidian hover:bg-carbon text-slate-200 text-xs font-mono transition-colors border border-bordercolor mb-2 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-safeGreen" />
                <span className="text-safeGreen font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-accentGold" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code Block */}
        <div className="p-5 flex-1">
          <pre className="p-4 bg-obsidian border border-bordercolor rounded-xl font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre leading-relaxed scrollbar-thin scrollbar-thumb-bordercolor">
            {currentCode}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-bordercolor bg-obsidian flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Endpoint: POST http://127.0.0.1:8000/analyze-prompt</span>
          <span className="text-safeGreen font-bold">Content-Type: application/json</span>
        </div>
      </div>
    </div>
  );
};
