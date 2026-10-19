from pydantic import BaseModel, Field, field_validator
from typing import Literal, Optional

class IncidentInput(BaseModel):
    text: str = Field(..., min_length=10, max_length=5000)
    provider: Literal["ollama", "external", "gemini", "compare", "groq"] = Field(default="groq")

class ExecutionMetrics(BaseModel):
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    estimated_cost_usd: Optional[float] = None
    latency_ms: int
    provider: str
    model: str
    usage_is_estimated: bool = False

class FinTechTriageOutput(BaseModel):
    thought_process: str = "No thought process provided."
    category: Literal[
        "Fraud/Unrecognized Charge", "Payment Failure", "Transfer/Account Restriction", 
        "AML/Compliance", "Refund/Dispute", "General Complaint", "Unknown/Ambiguous"
    ] = "Unknown/Ambiguous"
    urgency: Literal["Low", "Medium", "High", "Critical"] = "Low"
    summary: str = "No summary provided."
    assigned_department: Literal[
        "Fraud Ops", "Payments IT", "Compliance/AML", 
        "Customer Support Tier 1", "Customer Support Tier 2", "Escalations"
    ] = "Customer Support Tier 1"
    metadata: Optional[ExecutionMetrics] = None

    @field_validator('category', mode='before')
    @classmethod
    def sanitize_category(cls, v: str) -> str:
        allowed = {
            "Fraud/Unrecognized Charge", "Payment Failure", "Transfer/Account Restriction", 
            "AML/Compliance", "Refund/Dispute", "General Complaint", "Unknown/Ambiguous"
        }
        if v in allowed:
            return v
        # Map common deviations
        lower = str(v).lower()
        if "fraud" in lower:
            return "Fraud/Unrecognized Charge"
        if "payment" in lower:
            return "Payment Failure"
        if "restriction" in lower or "transfer" in lower:
            return "Transfer/Account Restriction"
        if "aml" in lower or "compliance" in lower:
            return "AML/Compliance"
        if "refund" in lower or "dispute" in lower:
            return "Refund/Dispute"
        if "complaint" in lower:
            return "General Complaint"
        return "Unknown/Ambiguous"

    @field_validator('assigned_department', mode='before')
    @classmethod
    def sanitize_department(cls, v: str) -> str:
        allowed = {
            "Fraud Ops", "Payments IT", "Compliance/AML", 
            "Customer Support Tier 1", "Customer Support Tier 2", "Escalations"
        }
        if v in allowed:
            return v
        # Map common deviations like 'Fraud Prevention' or 'Fraud Investigation'
        lower = str(v).lower()
        if "fraud" in lower:
            return "Fraud Ops"
        if "payment" in lower or "it" in lower:
            return "Payments IT"
        if "aml" in lower or "compliance" in lower:
            return "Compliance/AML"
        if "escalat" in lower:
            return "Escalations"
        if "tier 2" in lower or "support 2" in lower:
            return "Customer Support Tier 2"
        return "Customer Support Tier 1"

    @field_validator('urgency', mode='before')
    @classmethod
    def sanitize_urgency(cls, v: str) -> str:
        allowed = {"Low", "Medium", "High", "Critical"}
        if v in allowed:
            return v
        capitalized = str(v).capitalize()
        return capitalized if capitalized in allowed else "Low"

    @field_validator('summary')
    @classmethod
    def validate_summary(cls, v: str) -> str:
        words = str(v).strip().split()
        if len(words) > 10:
            return " ".join(words[:10]) + "..."
        return v