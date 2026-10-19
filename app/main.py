from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import IncidentInput, FinTechTriageOutput
from app.services.triage_service import process_triage, process_compare

app = FastAPI(title="FinTech Triage API")

# VERY IMPORTANT: Allows React (port 5173) to talk to FastAPI (port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev purposes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health(): return {"status": "healthy"}

@app.post("/triage", response_model=FinTechTriageOutput)
async def triage(incident: IncidentInput):
    if incident.provider == "compare": raise HTTPException(status_code=400, detail="Use /compare")
    return await process_triage(incident)

@app.post("/compare")
async def compare(incident: IncidentInput):
    return await process_compare(incident)
