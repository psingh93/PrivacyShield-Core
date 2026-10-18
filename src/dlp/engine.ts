/**
 * PrivacyShield Core - Enterprise AI Data Loss Prevention & Privacy Engine
 * Zero-Trust DLP inspection, tokenization, masking, and compliance mapping.
 */

import {
  DetectedEntity,
  DetailedEntitySpan,
  DLPResult,
  DLPInspectionResponse,
  QuantumForensicLog,
  PrivacyShieldQuantumResponse,
} from '../types/dlp';

export type {
  DetectedEntity,
  DetailedEntitySpan,
  DLPResult,
  DLPInspectionResponse,
  QuantumForensicLog,
  PrivacyShieldQuantumResponse,
};

export interface DLPOptions {
  strictness?: 'balanced' | 'strict' | 'relaxed';
  maskingStyle?: 'standard' | 'indexed' | 'asterisk' | 'quantum';
  customKeywords?: string[];
  enableLuhnValidation?: boolean;
}

// Luhn Algorithm for Credit Card validation
export function isValidLuhn(numStr: string): boolean {
  const clean = numStr.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(clean)) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

// Malicious prompt injection signatures
const INJECTION_PATTERNS = [
  {
    regex: /\b(ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|directives|rules))\b/i,
    reason: 'Instruction override attempt (Jailbreak)',
  },
  {
    regex: /\b(disregard\s+(all\s+)?(previous|prior)\s+(instructions|constraints))\b/i,
    reason: 'Instruction override attempt',
  },
  {
    regex: /\b(you\s+are\s+now\s+in\s+(DAN|developer|jailbreak|unrestricted|god)\s+mode)\b/i,
    reason: 'Persona hijack / DAN jailbreak attempt',
  },
  {
    regex: /\b(reveal|output|display|show|leak|print)\s+(your\s+)?(full\s+)?(system\s+prompt|developer\s+message|internal\s+instructions)\b/i,
    reason: 'System prompt exfiltration attempt',
  },
  {
    regex: /\b(do\s+anything\s+now|bypass\s+all\s+(safety|content)\s+filters)\b/i,
    reason: 'Safety bypass attempt',
  },
  {
    regex: /\b(act\s+as\s+an\s+unfiltered\s+ai|no\s+ethical\s+restrictions)\b/i,
    reason: 'Ethical boundary bypass attempt',
  },
  {
    regex: /<script[\s\S]*?>[\s\S]*?<\/script>/i,
    reason: 'Malicious HTML/XSS script injection in prompt',
  },
];

// Common medical diagnoses & conditions for HIPAA compliance detection
const MEDICAL_DIAGNOSES = [
  'melanoma',
  'carcinoma',
  'leukemia',
  'lymphoma',
  'glioblastoma',
  'schizophrenia',
  'bipolar disorder',
  'major depression',
  'type 1 diabetes',
  'type 2 diabetes',
  'diabetic ketoacidosis',
  'acute myocardial infarction',
  'coronary artery disease',
  'congestive heart failure',
  'hypertension',
  'asthma',
  'copd',
  'chronic kidney disease',
  'hepatitis [abc]',
  'hiv positive',
  'aids',
  'alzheimer\'s disease',
  'parkinson\'s disease',
  'multiple sclerosis',
  'rheumatoid arthritis',
  'epilepsy',
  'stroke',
  'sepsis',
  'pneumonia',
  'chemotherapy',
  'radiation therapy',
  'biopsy positive',
  'stage [1-4] cancer',
  'metastasis',
];

const MEDICAL_REGEX = new RegExp(
  `\\b(${MEDICAL_DIAGNOSES.join('|')})\\b`,
  'i'
);

// Common first and last names for PERSON detection in context
const COMMON_FIRST_NAMES = [
  'john', 'jane', 'robert', 'michael', 'david', 'william', 'richard', 'joseph', 'thomas',
  'charles', 'christopher', 'daniel', 'matthew', 'anthony', 'donald', 'mark', 'paul',
  'steven', 'andrew', 'kenneth', 'joshua', 'kevin', 'brian', 'george', 'edward', 'ronald',
  'timothy', 'jason', 'jeffrey', 'ryan', 'jacob', 'gary', 'nicholas', 'eric', 'jonathan',
  'mary', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan', 'jessica',
  'sarah', 'karen', 'nancy', 'margaret', 'lisa', 'betty', 'dorothy', 'sandra', 'ashley',
  'kimberly', 'donna', 'emily', 'michelle', 'carol', 'amanda', 'melissa', 'deborah',
  'stephanie', 'rebecca', 'laura', 'sharon', 'cynthia', 'kathleen', 'amy', 'shirley',
  'angela', 'helen', 'anna', 'brenda', 'pamela', 'nicole', 'samantha', 'katherine',
  'christine', 'debra', 'rachel', 'carolyn', 'janet', 'maria', 'heather', 'diane', 'alice',
  'alex', 'sam', 'chris', 'pat', 'taylor', 'jordan', 'morgan', 'priya', 'rahul', 'wei',
  'aravind', 'ananya', 'fatima', 'ahmed', 'mohammed', 'carlos', 'lucas', 'mateo', 'diego'
];

const COMMON_LAST_NAMES = [
  'smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller', 'davis',
  'rodriguez', 'martinez', 'hernandez', 'lopez', 'gonzalez', 'wilson', 'anderson',
  'thomas', 'taylor', 'moore', 'jackson', 'martin', 'lee', 'perez', 'thompson',
  'white', 'harris', 'sanchez', 'clark', 'ramirez', 'lewis', 'robinson', 'walker',
  'young', 'allen', 'king', 'wright', 'scott', 'torres', 'nguyen', 'hill', 'flores',
  'green', 'adams', 'nelson', 'baker', 'hall', 'rivera', 'campbell', 'mitchell',
  'carter', 'roberts', 'doe', 'sharma', 'patel', 'kumar', 'singh', 'chen', 'wang', 'li'
];

// Quantum Structural Tag generator for Military-Grade DLP
export function getQuantumStructuralTag(span: DetailedEntitySpan): {
  tag: string;
  entityName: string;
  framework: string;
} {
  switch (span.entity_type) {
    case 'CREDIT_CARD': {
      const clean = span.value.replace(/[\s-]/g, '');
      if (clean.startsWith('4')) {
        return { tag: '[VISA_CARD]', entityName: 'Credit Card (Visa)', framework: 'PCI-DSS' };
      }
      if (/^5[1-5]/.test(clean)) {
        return { tag: '[MASTERCARD]', entityName: 'Credit Card (Mastercard)', framework: 'PCI-DSS' };
      }
      if (/^3[47]/.test(clean)) {
        return { tag: '[AMEX_CARD]', entityName: 'Credit Card (Amex)', framework: 'PCI-DSS' };
      }
      return { tag: '[CREDIT_CARD]', entityName: 'Credit Card (PAN)', framework: 'PCI-DSS' };
    }
    case 'API_KEY': {
      if (span.value.startsWith('AKIA')) {
        return { tag: '[AWS_SECRET]', entityName: 'AWS Secret / Access Key', framework: 'SOC-2' };
      }
      if (span.value.startsWith('AIza') || span.value.startsWith('AQ.')) {
        return { tag: '[GOOGLE_API_KEY]', entityName: 'Google Gemini API Key', framework: 'SOC-2' };
      }
      if (span.value.startsWith('sk-')) {
        return { tag: '[OPENAI_API_KEY]', entityName: 'OpenAI Secret Key', framework: 'SOC-2' };
      }
      if (span.value.startsWith('gh')) {
        return { tag: '[GITHUB_SECRET]', entityName: 'GitHub Secret Token', framework: 'SOC-2' };
      }
      return { tag: '[API_KEY]', entityName: 'API Secret Key', framework: 'SOC-2' };
    }
    case 'PASSWORD':
      return { tag: '[PASSWORD_SECRET]', entityName: 'Plaintext Password', framework: 'SOC-2' };
    case 'SSN':
      return { tag: '[SSN_NUMBER]', entityName: 'Social Security Number', framework: 'HIPAA' };
    case 'DIAGNOSIS':
      return { tag: '[DIAGNOSIS_RECORD]', entityName: 'Patient Clinical PHI', framework: 'HIPAA' };
    case 'EMAIL':
      return { tag: '[EMAIL_ADDRESS]', entityName: 'Internal Email Address', framework: 'GDPR' };
    case 'PHONE':
      return { tag: '[PHONE_NUMBER]', entityName: 'Telephone Number', framework: 'DPDP' };
    case 'INTERNAL_IP':
      return { tag: '[INTERNAL_IP]', entityName: 'Internal Network IP', framework: 'SOC-2' };
    case 'PERSON':
      return { tag: '[PERSON_NAME]', entityName: 'Individual Person Name', framework: 'GDPR' };
    default:
      return { tag: `[${span.entity_type}]`, entityName: span.description || span.entity_type, framework: 'GDPR' };
  }
}

export function inspectPrompt(input: string, options: DLPOptions = {}): DLPInspectionResponse {
  const startTime = performance.now();
  const rawText = input || '';

  if (!rawText.trim()) {
    const emptyQuantum: PrivacyShieldQuantumResponse = {
      system_metadata: {
        status: 'SECURE',
        timestamp: new Date().toISOString(),
      },
      threat_analysis: {
        risk_score: 0,
        risk_level: 'SAFE',
        action_taken: 'PAYLOAD_SANITIZED',
      },
      sanitized_payload: '',
      forensic_logs: [],
      defense_telemetry: {
        prompt_injection_detected: false,
        data_leakage_prevented: false,
      },
    };

    return {
      status: 'success',
      original_risk_score: 0,
      risk_score: 0,
      risk_level: 'SAFE',
      masked_prompt: '',
      violations_prevented: [],
      detected_entities: [],
      compliance_alerts: [],
      defense_status: 'Clean Traffic',
      safe_to_process: true,
      system_metadata: emptyQuantum.system_metadata,
      threat_analysis: emptyQuantum.threat_analysis,
      sanitized_payload: '',
      forensic_logs: [],
      defense_telemetry: emptyQuantum.defense_telemetry,
      quantum_response: emptyQuantum,
      _telemetry: {
        processing_time_ms: Math.round(performance.now() - startTime),
        char_count: 0,
        masked_spans: [],
        injection_detected: false,
        injection_reasons: [],
      },
    };
  }

  // Check 1: Prompt Injection & Malicious Prompt Detection
  const injectionReasons: string[] = [];
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.regex.test(rawText)) {
      injectionReasons.push(pattern.reason);
    }
  }

  const rawSpans: DetailedEntitySpan[] = [];
  let spanCounter = 0;

  // Helper to add span
  const addSpan = (
    start: number,
    end: number,
    value: string,
    entityType: string,
    category: DetailedEntitySpan['category'],
    severity: DetailedEntitySpan['severity'],
    confidence: number,
    description: string
  ) => {
    if (start < 0 || end > rawText.length || start >= end) return;
    spanCounter++;
    rawSpans.push({
      id: `span-${spanCounter}`,
      entity_type: entityType,
      value,
      start,
      end,
      placeholder: `[${entityType}]`,
      category,
      severity,
      confidence,
      description,
    });
  };

  // 1. CREDIT CARDS (Visa, MC, Amex, Discover, 13-19 digits with separators)
  // Supports formats: 4532-1111-2222-3333, 4532 1111 2222 3333, 4532111122223333
  const ccRegex = /\b(?:\d{4}[-\s]?){3}\d{4}\b|\b3[47]\d{2}[-\s]?\d{6}[-\s]?\d{5}\b|\b\d{13,19}\b/g;
  let match: RegExpExecArray | null;
  while ((match = ccRegex.exec(rawText)) !== null) {
    const candidate = match[0];
    const cleanDigits = candidate.replace(/[-\s]/g, '');
    // Ensure it's not a generic number or date
    if (cleanDigits.length >= 13 && cleanDigits.length <= 19) {
      const isLuhn = isValidLuhn(candidate);
      // If it has hyphens/spaces in 4-group pattern or passes Luhn or matches major prefixes (4, 5, 37, 6011)
      const hasCardPattern = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12}|(?:[0-9]{4}[-\s]){3}[0-9]{4})$/.test(candidate);
      if (isLuhn || hasCardPattern) {
        addSpan(
          match.index,
          match.index + candidate.length,
          candidate,
          'CREDIT_CARD',
          'financial',
          'critical',
          isLuhn ? 0.99 : 0.85,
          'Credit/Debit Card Number'
        );
      }
    }
  }

  // 2. API KEYS & CREDENTIAL SECRETS
  // Google / Gemini API Keys: AIza... or AQ.Ab8RN6K-...
  const googleApiKeyRegex = /\b(AIza[0-9A-Za-z\-_]{35}|AQ\.[0-9A-Za-z\-_]{20,})\b/g;
  while ((match = googleApiKeyRegex.exec(rawText)) !== null) {
    addSpan(match.index, match.index + match[0].length, match[0], 'API_KEY', 'secret', 'critical', 0.99, 'Google / Gemini API Secret Key');
  }

  // OpenAI: sk-... / sk-proj-...
  const openaiRegex = /\b(sk-[a-zA-Z0-9_\-]{20,})\b/g;
  while ((match = openaiRegex.exec(rawText)) !== null) {
    addSpan(match.index, match.index + match[0].length, match[0], 'API_KEY', 'secret', 'critical', 0.98, 'OpenAI API Secret Key');
  }

  // AWS Access Key ID: AKIA... / ASIA... (16-28 chars)
  const awsKeyRegex = /\b((?:AKIA|ASIA|ABIA|ACCA)[0-9A-Z]{14,28})\b/g;
  while ((match = awsKeyRegex.exec(rawText)) !== null) {
    addSpan(match.index, match.index + match[0].length, match[0], 'API_KEY', 'secret', 'critical', 0.99, 'AWS Access Key ID');
  }

  // Contextual API key: "api key is ...", "aws key is ...", "secret is ..."
  const contextualKeyRegex = /\b(?:aws[_-]?key|api[_-]?key|secret[_-]?token|auth[_-]?token|access[_-]?key)\s*(?:is|[:=])\s*([A-Za-z0-9_\-+=]{12,})/gi;
  while ((match = contextualKeyRegex.exec(rawText)) !== null) {
    const fullMatch = match[0];
    const keyVal = match[1];
    const valIndex = match.index + fullMatch.indexOf(keyVal);
    addSpan(valIndex, valIndex + keyVal.length, keyVal, 'API_KEY', 'secret', 'critical', 0.96, 'Cloud API / Secret Key');
  }

  // GitHub token: ghp_... / gho_... / github_pat_...
  const githubKeyRegex = /\b(gh[pousr]_[A-Za-z0-9_]{36,}|github_pat_[A-Za-z0-9_]{82})\b/g;
  while ((match = githubKeyRegex.exec(rawText)) !== null) {
    addSpan(match.index, match.index + match[0].length, match[0], 'API_KEY', 'secret', 'critical', 0.99, 'GitHub Personal Access Token');
  }

  // Slack tokens: xox[baprs]-[0-9a-zA-Z]{10,48}
  const slackKeyRegex = /\b(xox[baprs]-[0-9a-zA-Z]{10,48})\b/g;
  while ((match = slackKeyRegex.exec(rawText)) !== null) {
    addSpan(match.index, match.index + match[0].length, match[0], 'API_KEY', 'secret', 'critical', 0.99, 'Slack API Secret Token');
  }

  // Generic and vendor-prefixed API Key / Secret assignments: (e.g. GEMINI_API_KEY=..., OPENAI_API_KEY=...)
  const genericSecretRegex = /(?:[a-zA-Z0-9_]*[_-])?(?:api[_-]?key|secret[_-]?key|auth[_-]?token|access[_-]?token|client[_-]?secret|private[_-]?key)\s*[:=]\s*["']?([a-zA-Z0-9_\-.]{16,})["']?/gi;
  while ((match = genericSecretRegex.exec(rawText)) !== null) {
    const fullMatch = match[0];
    const secretVal = match[1];
    const valIndex = match.index + fullMatch.indexOf(secretVal);
    addSpan(valIndex, valIndex + secretVal.length, secretVal, 'API_KEY', 'secret', 'critical', 0.95, 'Application Secret / Access Token');
  }

  // Passwords in prompt: password is ... / password: ... / pwd=...
  const passwordRegex = /\b(?:password|passwd|pwd)\s*(?:is|[:=])\s*["']?([^\s"';,]{6,})["']?/gi;
  while ((match = passwordRegex.exec(rawText)) !== null) {
    const fullMatch = match[0];
    const pwdVal = match[1];
    const valIndex = match.index + fullMatch.indexOf(pwdVal);
    addSpan(valIndex, valIndex + pwdVal.length, pwdVal, 'PASSWORD', 'secret', 'critical', 0.95, 'Plaintext Password Credential');
  }

  // 3. SOCIAL SECURITY NUMBERS (SSN)
  // Format: 123-45-6789, 123 45 6789, or contextual SSN: 123456789
  const ssnRegex = /\b\d{3}[-\s]\d{2}[-\s]\d{4}\b/g;
  while ((match = ssnRegex.exec(rawText)) !== null) {
    addSpan(match.index, match.index + match[0].length, match[0], 'SSN', 'pii', 'critical', 0.98, 'US Social Security Number');
  }
  const ssnContextRegex = /\b(?:SSN|Social\s*Security(?:\s*Number)?)\s*[:=]?\s*(\d{9})\b/gi;
  while ((match = ssnContextRegex.exec(rawText)) !== null) {
    const ssnDigits = match[1];
    const valIndex = match.index + match[0].indexOf(ssnDigits);
    addSpan(valIndex, valIndex + ssnDigits.length, ssnDigits, 'SSN', 'pii', 'critical', 0.95, 'US Social Security Number');
  }

  // 4. EMAIL ADDRESSES
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  while ((match = emailRegex.exec(rawText)) !== null) {
    addSpan(match.index, match.index + match[0].length, match[0], 'EMAIL', 'pii', 'medium', 0.99, 'Email Address');
  }

  // 5. PHONE NUMBERS (US, International, with or without +)
  // Matches: +1 (555) 123-4567, 555-123-4567, (555) 123-4567, +44 20 7946 0958, etc.
  const phoneRegex = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
  while ((match = phoneRegex.exec(rawText)) !== null) {
    // Avoid matching parts of credit cards or dates
    const val = match[0];
    if (val.replace(/\D/g, '').length >= 10 && val.replace(/\D/g, '').length <= 15) {
      addSpan(match.index, match.index + val.length, val, 'PHONE', 'pii', 'medium', 0.90, 'Telephone Number');
    }
  }

  // 6. INTERNAL IP ADDRESSES & INFRASTRUCTURE
  // Private IPv4 (RFC 1918): 10.x.x.x, 172.(16-31).x.x, 192.168.x.x, 127.0.0.1, 169.254.169.254
  const internalIpRegex = /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|127\.0\.0\.1|169\.254\.169\.254)\b/g;
  while ((match = internalIpRegex.exec(rawText)) !== null) {
    addSpan(match.index, match.index + match[0].length, match[0], 'INTERNAL_IP', 'network', 'high', 0.98, 'Internal Private Network IP Address');
  }

  // 7. MEDICAL DIAGNOSIS (HIPAA PHI)
  // Matches medical conditions, including staged conditions (e.g. Stage 3 melanoma)
  const stagedMedicalRegex = /\b(?:(?:stage\s+[0-4]|grade\s+[1-4])\s+)?(?:melanoma|carcinoma|leukemia|lymphoma|glioblastoma|schizophrenia|bipolar disorder|major depression|type [12] diabetes|diabetic ketoacidosis|acute myocardial infarction|coronary artery disease|congestive heart failure|hypertension|asthma|copd|chronic kidney disease|hepatitis [abc]|hiv positive|aids|alzheimer's disease|parkinson's disease|multiple sclerosis|rheumatoid arthritis|epilepsy|stroke|sepsis|pneumonia|chemotherapy|radiation therapy|biopsy positive|metastasis)\b/gi;
  let medMatch: RegExpExecArray | null;
  while ((medMatch = stagedMedicalRegex.exec(rawText)) !== null) {
    addSpan(medMatch.index, medMatch.index + medMatch[0].length, medMatch[0], 'DIAGNOSIS', 'health', 'critical', 0.95, 'Medical Diagnosis / PHI Condition');
  }

  // 8. PERSON NAMES
  // Note: NO /i flag on the regex so [A-Z][a-z]+ strictly requires capitalization
  const personContextRegex = /\b(?:[Mm]r\.|[Mm]rs\.|[Mm]s\.|[Dd]r\.|[Pp]rof\.|[Pp]atient|[Ee]mployee|[Cc]lient|[Uu]ser|[Cc]ustomer|[Hh]abits of|[Nn]ame is|[Cc]ontact)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/g;
  while ((match = personContextRegex.exec(rawText)) !== null) {
    const full = match[0];
    const namePart = match[1];
    // Check it does not contain common English stopwords
    const words = namePart.split(/\s+/);
    const stopWords = ['Was', 'Is', 'Are', 'Diagnosed', 'Admitted', 'With', 'Stage', 'Grade', 'His', 'Her', 'The', 'And'];
    if (!words.some((w) => stopWords.includes(w))) {
      const nameStart = match.index + full.indexOf(namePart);
      addSpan(nameStart, nameStart + namePart.length, namePart, 'PERSON', 'pii', 'medium', 0.95, 'Individual Name (Contextual)');
    }
  }

  // Direct first name + last name matching from dictionary (case-insensitive for first/last combinations)
  const firstNamesPattern = COMMON_FIRST_NAMES.join('|');
  const lastNamesPattern = COMMON_LAST_NAMES.join('|');
  const dictNameRegex = new RegExp(`\\b(${firstNamesPattern})\\s+(${lastNamesPattern})\\b`, 'gi');
  while ((match = dictNameRegex.exec(rawText)) !== null) {
    addSpan(match.index, match.index + match[0].length, match[0], 'PERSON', 'pii', 'medium', 0.92, 'Individual Full Name');
  }

  // Contextual single name: "Patient John", "Employee Alice"
  const singleNameContextRegex = /\b(?:[Pp]atient|[Ee]mployee|[Cc]lient|[Hh]abits of)\s+([A-Z][a-z]+)\b/g;
  while ((match = singleNameContextRegex.exec(rawText)) !== null) {
    const full = match[0];
    const namePart = match[1];
    if (!['The', 'A', 'An', 'This', 'That', 'His', 'Her', 'Was', 'With'].includes(namePart)) {
      const nameStart = match.index + full.indexOf(namePart);
      addSpan(nameStart, nameStart + namePart.length, namePart, 'PERSON', 'pii', 'medium', 0.85, 'Individual Name');
    }
  }

  // 9. RESOLVE OVERLAPPING SPANS
  // Sort spans by start ASC, length DESC (longer match wins, higher severity wins)
  rawSpans.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    const sevRank = { critical: 4, high: 3, medium: 2, low: 1 };
    if (sevRank[b.severity] !== sevRank[a.severity]) {
      return sevRank[b.severity] - sevRank[a.severity];
    }
    return (b.end - b.start) - (a.end - a.start);
  });

  const nonOverlappingSpans: DetailedEntitySpan[] = [];
  let lastEnd = -1;
  for (const span of rawSpans) {
    if (span.start >= lastEnd) {
      nonOverlappingSpans.push(span);
      lastEnd = span.end;
    }
  }



  // 10. GENERATE ZERO-LEAKAGE MASKED PROMPT
  // Build re-identification token map & assemble string
  const vault: Record<string, string> = {};
  let maskedPrompt = '';
  let cursor = 0;
  const entityTypeCounts: Record<string, number> = {};

  for (const span of nonOverlappingSpans) {
    maskedPrompt += rawText.slice(cursor, span.start);

    let placeholder = `[${span.entity_type}]`;
    if (options.maskingStyle === 'quantum' || !options.maskingStyle) {
      placeholder = getQuantumStructuralTag(span).tag;
    } else if (options.maskingStyle === 'indexed') {
      entityTypeCounts[span.entity_type] = (entityTypeCounts[span.entity_type] || 0) + 1;
      placeholder = `[${span.entity_type}_${entityTypeCounts[span.entity_type]}]`;
    } else if (options.maskingStyle === 'asterisk') {
      placeholder = `[REDACTED_${span.entity_type}]`;
    }

    span.placeholder = placeholder;
    vault[placeholder] = span.value;
    maskedPrompt += placeholder;
    cursor = span.end;
  }
  maskedPrompt += rawText.slice(cursor);

  // 11. DETECTED ENTITIES LIST (exact format requested)
  const detectedEntities: DetectedEntity[] = [];
  const seenEntityTypes = new Set<string>();

  for (const span of nonOverlappingSpans) {
    let cat: 'PII' | 'FINANCIAL' | 'HEALTH' | 'SECRET' = 'PII';
    if (span.category === 'financial') cat = 'FINANCIAL';
    else if (span.category === 'health') cat = 'HEALTH';
    else if (span.category === 'secret' || span.category === 'network') cat = 'SECRET';

    let entName = span.description;
    if (span.entity_type === 'CREDIT_CARD') entName = 'Credit Card (PAN)';
    else if (span.entity_type === 'PERSON') entName = 'Individual Name';
    else if (span.entity_type === 'EMAIL') entName = 'Email Address';
    else if (span.entity_type === 'PHONE') entName = 'Phone Number';
    else if (span.entity_type === 'API_KEY') entName = 'API Secret Key';
    else if (span.entity_type === 'PASSWORD') entName = 'Password Credential';
    else if (span.entity_type === 'SSN') entName = 'Social Security Number';
    else if (span.entity_type === 'DIAGNOSIS') entName = 'Patient Diagnosis / PHI';
    else if (span.entity_type === 'INTERNAL_IP') entName = 'Internal Private IP';

    const qMeta = getQuantumStructuralTag(span);
    detectedEntities.push({
      entity_type: qMeta.entityName,
      action_taken: 'Masked',
      entity_name: entName,
      category: cat,
      status: 'Masked',
    });
    seenEntityTypes.add(span.entity_type);
  }

  // 12. RISK SCORING CALCULATION
  // Threat scoring strictly per Quantum directives:
  // 0-15: Clean/Safe
  // 16-60: Warning Risk (Names, general geo-locations, contact info)
  // 61-100: CRITICAL LEVEL (Credit Cards, SSNs, Passwords, Health Records, Cloud Keys)
  let riskScore = 0;

  if (injectionReasons.length > 0) {
    riskScore = 100;
  } else if (nonOverlappingSpans.length === 0) {
    riskScore = 0;
  } else {
    for (const span of nonOverlappingSpans) {
      switch (span.entity_type) {
        case 'CREDIT_CARD':
          riskScore += 50;
          break;
        case 'API_KEY':
          riskScore += 45;
          break;
        case 'PASSWORD':
          riskScore += 40;
          break;
        case 'SSN':
          riskScore += 40;
          break;
        case 'DIAGNOSIS':
          riskScore += 35;
          break;
        case 'INTERNAL_IP':
          riskScore += 25;
          break;
        case 'PHONE':
          riskScore += 18;
          break;
        case 'EMAIL':
          riskScore += 18;
          break;
        case 'PERSON':
          riskScore += 15;
          break;
        default:
          riskScore += 10;
          break;
      }
    }

    // Density bonus: combined sensitive identity vectors (e.g. Cardholder PAN + Person + Email)
    if (seenEntityTypes.has('CREDIT_CARD') && seenEntityTypes.has('PERSON') && seenEntityTypes.has('EMAIL')) {
      riskScore += 12;
    } else if (seenEntityTypes.has('CREDIT_CARD') && seenEntityTypes.has('PERSON')) {
      riskScore += 10;
    }
    if (seenEntityTypes.has('DIAGNOSIS') && seenEntityTypes.has('PERSON')) {
      riskScore += 15;
    }

    // Ensure ceiling and floor matches Quantum Threat Scoring specification:
    // 0-15: Clean/Safe
    // 16-60: Warning Risk (Names, general geo-locations, contact info)
    // 61-100: CRITICAL LEVEL (Credit Cards, SSNs, Passwords, Health Records, Cloud Keys)
    const hasCritical = ['CREDIT_CARD', 'API_KEY', 'PASSWORD', 'SSN', 'DIAGNOSIS'].some(t => seenEntityTypes.has(t));

    if (hasCritical) {
      riskScore = Math.max(88, Math.min(100, riskScore));
    } else if (seenEntityTypes.size > 0) {
      riskScore = Math.max(18, Math.min(60, riskScore));
    }
  }

  riskScore = Math.min(100, Math.max(0, riskScore));

  // Determine risk level strictly according to Quantum directives:
  // 0-15: Clean/Safe -> SAFE
  // 16-60: Warning Risk -> WARNING
  // 61-100: CRITICAL LEVEL -> CRITICAL (or HIGH)
  let riskLevel: 'SAFE' | 'WARNING' | 'HIGH' | 'CRITICAL';
  if (riskScore <= 15) {
    riskLevel = 'SAFE';
  } else if (riskScore <= 60) {
    riskLevel = 'WARNING';
  } else if (riskScore <= 80) {
    riskLevel = 'HIGH';
  } else {
    riskLevel = 'CRITICAL';
  }

  // 13. COMPLIANCE MAPPING
  // Map detected entities to global frameworks: GDPR, PCI-DSS, HIPAA, DPDP, SOC-2
  const complianceAlerts: string[] = [];

  if (
    seenEntityTypes.has('PERSON') ||
    seenEntityTypes.has('EMAIL') ||
    seenEntityTypes.has('PHONE') ||
    seenEntityTypes.has('SSN') ||
    seenEntityTypes.has('CREDIT_CARD') ||
    seenEntityTypes.has('DIAGNOSIS')
  ) {
    complianceAlerts.push('GDPR');
  }

  if (seenEntityTypes.has('CREDIT_CARD')) {
    complianceAlerts.push('PCI-DSS');
  }

  if (seenEntityTypes.has('DIAGNOSIS')) {
    complianceAlerts.push('HIPAA');
  }

  if (seenEntityTypes.has('PERSON') || seenEntityTypes.has('PHONE') || seenEntityTypes.has('EMAIL')) {
    complianceAlerts.push('DPDP');
  }

  if (seenEntityTypes.has('API_KEY') || seenEntityTypes.has('PASSWORD') || seenEntityTypes.has('INTERNAL_IP')) {
    complianceAlerts.push('SOC-2');
  }

  // 14. SAFE_TO_PROCESS & DEFENSE STATUS
  const isMalicious = injectionReasons.length > 0;
  const safeToProcess = !isMalicious;

  let defenseStatus = 'Clean Traffic';
  if (isMalicious) {
    defenseStatus = 'Active Defense Engaged (BREACH_ATTEMPT Blocked)';
    riskScore = 100;
    riskLevel = 'CRITICAL';
    complianceAlerts.unshift('PROMPT_INJECTION_ATTACK');
    detectedEntities.unshift({
      entity_type: 'PROMPT_INJECTION',
      entity_name: 'PROMPT_INJECTION_ATTACK',
      action_taken: 'Blocked',
      status: 'Blocked',
    });
  } else if (nonOverlappingSpans.length > 0) {
    defenseStatus = 'Active Defense Engaged';
  }

  // 15. QUANTUM FORENSIC LOGS & SANITIZED PAYLOAD
  const quantumForensicLogs: QuantumForensicLog[] = [];
  let quantumSanitizedText = '';
  let qCursor = 0;

  if (isMalicious) {
    quantumSanitizedText =
      '[BREACH_ATTEMPT DETECTED]: Outgoing payload dropped by PrivacyShield Quantum Zero-Trust Gateway. Malicious prompt injection neutralized.';
    quantumForensicLogs.push({
      entity_type: 'Adversarial Prompt Injection / Jailbreak',
      redaction_tag: '[BREACH_ATTEMPT]',
      compliance_framework_saved: 'OWASP-LLM01',
    });
  } else {
    for (const span of nonOverlappingSpans) {
      quantumSanitizedText += rawText.slice(qCursor, span.start);
      const qMeta = getQuantumStructuralTag(span);
      quantumSanitizedText += qMeta.tag;
      qCursor = span.end;
      quantumForensicLogs.push({
        entity_type: qMeta.entityName,
        redaction_tag: qMeta.tag,
        compliance_framework_saved: qMeta.framework,
      });
    }
    quantumSanitizedText += rawText.slice(qCursor);
  }

  // 16. THREAT SCORING (0-100) per Quantum Spec:
  // - 0-15: Clean/Safe.
  // - 16-50: Low/Medium Risk (Names, general geo-locations).
  // - 51-85: High Risk (Internal emails, phone numbers, UUIDs).
  // - 86-100: CRITICAL LEVEL (Credit Cards, SSNs, Passwords, Health Records, Cloud Keys).
  let quantumRiskLevel: 'SAFE' | 'WARNING' | 'CRITICAL' = 'SAFE';
  if (riskScore >= 86) {
    quantumRiskLevel = 'CRITICAL';
  } else if (riskScore >= 16) {
    quantumRiskLevel = 'WARNING';
  } else {
    quantumRiskLevel = 'SAFE';
  }

  const quantumResponse: PrivacyShieldQuantumResponse = {
    system_metadata: {
      status: isMalicious ? 'BLOCKED_INJECTION' : 'SECURE',
      timestamp: new Date().toISOString(),
    },
    threat_analysis: {
      risk_score: riskScore,
      risk_level: quantumRiskLevel,
      action_taken: isMalicious ? 'PAYLOAD_DROPPED' : 'PAYLOAD_SANITIZED',
    },
    sanitized_payload: isMalicious
      ? quantumSanitizedText
      : options.maskingStyle === 'standard'
      ? maskedPrompt
      : quantumSanitizedText,
    forensic_logs: quantumForensicLogs,
    defense_telemetry: {
      prompt_injection_detected: isMalicious,
      data_leakage_prevented: isMalicious || nonOverlappingSpans.length > 0,
    },
  };

  const processingTimeMs = Math.round(performance.now() - startTime);

  return {
    status: isMalicious ? 'blocked' : 'success',
    risk_score: riskScore,
    original_risk_score: riskScore,
    risk_level: riskLevel,
    masked_prompt: options.maskingStyle === 'standard' ? maskedPrompt : quantumSanitizedText,
    violations_prevented: complianceAlerts,
    detected_entities: detectedEntities,
    compliance_alerts: complianceAlerts,
    defense_status: defenseStatus,
    safe_to_process: safeToProcess,
    // Quantum Spec bindings
    system_metadata: quantumResponse.system_metadata,
    threat_analysis: quantumResponse.threat_analysis,
    sanitized_payload: quantumResponse.sanitized_payload,
    forensic_logs: quantumForensicLogs,
    defense_telemetry: quantumResponse.defense_telemetry,
    quantum_response: quantumResponse,
    _telemetry: {
      processing_time_ms: processingTimeMs,
      char_count: rawText.length,
      masked_spans: nonOverlappingSpans,
      injection_detected: isMalicious,
      injection_reasons: injectionReasons,
      reidentification_vault: vault,
    },
  };
}

// Generate exact PrivacyShield Quantum schema
export function generateQuantumDLP(input: string, options: DLPOptions = {}): PrivacyShieldQuantumResponse {
  const result = inspectPrompt(input, { ...options, maskingStyle: 'quantum' });
  return result.quantum_response!;
}

// Format to minified JSON string with zero extra markdown or spacing
export function toMinifiedQuantumJson(quantumRes: any): string {
  return JSON.stringify(quantumRes);
}

// Generate strict Quantum response matching user schema:
// { status, risk_score, risk_level, masked_prompt, violations_prevented, detected_entities, defense_telemetry }
export function generateStrictQuantumDLP(input: string, options: DLPOptions = {}) {
  const result = inspectPrompt(input, { ...options, maskingStyle: 'quantum' });
  return {
    status: result.status === 'blocked' ? ('blocked' as const) : ('success' as const),
    risk_score: result.risk_score,
    risk_level: result.risk_level,
    masked_prompt: result.masked_prompt,
    violations_prevented: result.violations_prevented,
    detected_entities: result.detected_entities.map((e) => ({
      entity_type: e.entity_type || e.entity_name || 'Sensitive Entity',
      action_taken: (e.action_taken === 'Blocked' ? 'Blocked' : 'Masked') as 'Masked' | 'Blocked',
    })),
    safe_to_process: Boolean(result.safe_to_process),
    defense_telemetry: {
      prompt_injection_detected: Boolean(result.defense_telemetry?.prompt_injection_detected),
      data_leakage_prevented: Boolean(result.defense_telemetry?.data_leakage_prevented),
    },
  };
}

// Rehydrate / De-anonymize an LLM response safely using the local vault
export function rehydrateResponse(llmResponse: string, vault: Record<string, string>): string {
  let result = llmResponse;
  for (const [placeholder, originalValue] of Object.entries(vault)) {
    result = result.split(placeholder).join(originalValue);
  }
  return result;
}
