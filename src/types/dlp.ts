export interface DetectedEntity {
  entity_type: string;
  action_taken: 'Masked' | 'Blocked' | 'Alerted';
  entity_name?: string;
  category?: 'PII' | 'FINANCIAL' | 'HEALTH' | 'SECRET' | string;
  status?: string;
}

export interface DetailedEntitySpan {
  id: string;
  entity_type: string;
  value: string;
  start: number;
  end: number;
  placeholder: string;
  category: 'pii' | 'financial' | 'secret' | 'health' | 'network' | 'injection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
}

export interface QuantumForensicLog {
  entity_type: string;
  redaction_tag: string;
  compliance_framework_saved: string;
}

export interface PrivacyShieldQuantumResponse {
  system_metadata: {
    status: 'SECURE' | 'BLOCKED_INJECTION';
    timestamp: string;
  };
  threat_analysis: {
    risk_score: number;
    risk_level: 'SAFE' | 'WARNING' | 'CRITICAL';
    action_taken: 'PAYLOAD_SANITIZED' | 'PAYLOAD_DROPPED';
  };
  sanitized_payload: string;
  forensic_logs: QuantumForensicLog[];
  defense_telemetry: {
    prompt_injection_detected: boolean;
    data_leakage_prevented: boolean;
  };
}

export interface StrictQuantumEntity {
  entity_type: string;
  action_taken: 'Masked' | 'Blocked';
}

export interface StrictQuantumResponse {
  status: 'success' | 'blocked';
  risk_score: number;
  risk_level: 'SAFE' | 'WARNING' | 'HIGH' | 'CRITICAL';
  masked_prompt: string;
  violations_prevented: string[];
  detected_entities: StrictQuantumEntity[];
  defense_telemetry: {
    prompt_injection_detected: boolean;
    data_leakage_prevented: boolean;
  };
}

export interface DLPResult {
  status: 'success' | 'blocked' | 'error';
  original_risk_score: number;
  risk_score: number;
  risk_level: 'SAFE' | 'WARNING' | 'CRITICAL' | 'LOW' | 'MEDIUM' | 'HIGH';
  masked_prompt: string;
  detected_entities: DetectedEntity[];
  compliance_alerts: string[];
  violations_prevented: string[];
  defense_status?: string;
  safe_to_process: boolean;

  // Quantum Military-Grade Spec properties
  system_metadata?: {
    status: 'SECURE' | 'BLOCKED_INJECTION';
    timestamp: string;
  };
  threat_analysis?: {
    risk_score: number;
    risk_level: 'SAFE' | 'WARNING' | 'CRITICAL';
    action_taken: 'PAYLOAD_SANITIZED' | 'PAYLOAD_DROPPED';
  };
  sanitized_payload?: string;
  forensic_logs?: QuantumForensicLog[];
  defense_telemetry?: {
    prompt_injection_detected: boolean;
    data_leakage_prevented: boolean;
  };
  quantum_response?: PrivacyShieldQuantumResponse;

  _telemetry?: {
    processing_time_ms: number;
    char_count: number;
    masked_spans: DetailedEntitySpan[];
    injection_detected: boolean;
    injection_reasons: string[];
    reidentification_vault?: Record<string, string>;
    semantic_scan_applied?: boolean;
    model_used?: string;
  };
}

export type DLPInspectionResponse = DLPResult;

export interface AuditEntry {
  id: string;
  timestamp: string;
  original_prompt: string;
  result: DLPResult;
  source: 'UI Playground' | 'API Gateway' | 'Proxy' | 'FastAPI Endpoint' | 'Local Engine' | string;
}

export interface PolicyConfig {
  detectCreditCards: boolean;
  detectApiKeys: boolean;
  detectPasswords: boolean;
  detectSsn: boolean;
  detectEmails: boolean;
  detectPhones: boolean;
  detectNames: boolean;
  detectInternalIps: boolean;
  detectMedicalPhi: boolean;
  detectInjections: boolean;
  maskingStyle: 'standard' | 'indexed' | 'asterisk' | 'quantum';
  blockOnCritical: boolean;
  customKeywords: string[];
}
