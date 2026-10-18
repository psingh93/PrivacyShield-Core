import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import google.generativeai as genai
from dotenv import load_dotenv

# Environment variables load karein
load_dotenv()

# Gemini API configure karein
API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

# FastAPI App setup
app = FastAPI(title="PrivacyShield AI Core", version="1.0")

# Frontend se connect karne ke liye CORS allow karein
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Hackathon demo ke liye sab allow kar diya hai
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# User Request Model
class PromptRequest(BaseModel):
    user_prompt: str

class LegacyDLPRequest(BaseModel):
    input: Optional[str] = None
    user_prompt: Optional[str] = None

# System Prompt (Strictly JSON output ke liye)
SYSTEM_INSTRUCTION = """
You are 'PrivacyShield Core', an enterprise-grade AI Data Loss Prevention (DLP) Engine. 
Intercept the user input, analyze for sensitive data, mask it, and evaluate privacy risk.

INSTRUCTIONS:
1. Identify sensitive entities and replace them with standard placeholders (e.g., [PERSON], [EMAIL], [PHONE], [CREDIT_CARD], [API_KEY], [SSN], [INTERNAL_IP], [DIAGNOSIS]).
2. ZERO LEAKAGE: Never output original sensitive data in 'masked_prompt'.
3. Calculate a 'risk_score' (0-100).
4. Identify compliance framework violations (e.g., "GDPR", "HIPAA", "PCI-DSS", "DPDP", "SOC-2").
5. Respond ONLY with a valid JSON object. Do not add markdown like ```json.

JSON OUTPUT SCHEMA:
{
  "status": "success",
  "original_risk_score": <int>,
  "risk_level": "<LOW | MEDIUM | HIGH | CRITICAL>",
  "masked_prompt": "<string>",
  "detected_entities": [{"entity_type": "<string>", "action_taken": "Masked"}],
  "compliance_alerts": ["<frameworks>"],
  "safe_to_process": <boolean>
}
"""

@app.post("/analyze-prompt")
async def analyze_prompt(request: PromptRequest):
    try:
        if not API_KEY:
            # Fallback deterministic inspection if API key is not yet set
            from dlp_fallback import fallback_inspect
            return fallback_inspect(request.user_prompt)

        # Gemini model initialize karein (JSON format enforce karne ke liye)
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=SYSTEM_INSTRUCTION,
            generation_config={"response_mime_type": "application/json", "temperature": 0.1}
        )
        
        # LLM ko call karein
        response = model.generate_content(request.user_prompt)
        
        # Text response ko JSON dict mein convert karke return karein
        return json.loads(response.text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/dlp/inspect")
async def inspect_api(request: LegacyDLPRequest):
    prompt = request.user_prompt or request.input or ""
    return await analyze_prompt(PromptRequest(user_prompt=prompt))

@app.get("/")
def home():
    return {
        "message": "PrivacyShield AI Engine is running securely!",
        "version": "1.0",
        "endpoints": ["/analyze-prompt", "/api/dlp/inspect"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
