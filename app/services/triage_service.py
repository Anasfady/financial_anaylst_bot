import asyncio
from fastapi import HTTPException
from app.schemas import IncidentInput, FinTechTriageOutput
from app.services.ollama_client import OllamaProvider
from app.services.groq_client import GroqProvider

async def process_triage(incident: IncidentInput) -> FinTechTriageOutput:
    if incident.provider == "ollama": 
        return await OllamaProvider().triage(incident.text)
    if incident.provider in ["external", "groq", "gemini"]: # Catching legacy frontend strings
        return await GroqProvider().triage(incident.text)
        
    raise HTTPException(status_code=400, detail="Provider not implemented or invalid.")

async def process_compare(incident: IncidentInput) -> dict:
    results = {"ollama": None, "external": None, "errors": {}}
    
    async def safe_run(key, provider):
        try: 
            results[key] = await provider().triage(incident.text)
        except Exception as e: 
            results["errors"][key] = str(e)

    # Run Ollama and Groq simultaneously
    await asyncio.gather(
        safe_run("ollama", OllamaProvider), 
        safe_run("external", GroqProvider)
    )
    return results