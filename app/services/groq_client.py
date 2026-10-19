import time
import json
from groq import AsyncGroq
from app.schemas import FinTechTriageOutput, ExecutionMetrics
from app.prompts import SYSTEM_PROMPT
from app.config import settings
from app.services.base import LLMProvider

# Initialize the async Groq client
client = AsyncGroq(api_key=settings.GROQ_API_KEY)

class GroqProvider(LLMProvider):
    async def triage(self, text: str) -> FinTechTriageOutput:
        start_time = time.monotonic()
        
        response = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": text}
            ]
        )
        
        latency = int((time.monotonic() - start_time) * 1000)
        usage = response.usage
        in_tok = usage.prompt_tokens if usage else 0
        out_tok = usage.completion_tokens if usage else 0
        
        # Calculate cost based on Groq token usage
        cost = (in_tok / 1000.0 * settings.GROQ_INPUT_PRICE_PER_1K) + (out_tok / 1000.0 * settings.GROQ_OUTPUT_PRICE_PER_1K)
        
        # Parse the JSON string returned by Groq into your Pydantic schema
        result = FinTechTriageOutput(**json.loads(response.choices[0].message.content))
        result.metadata = ExecutionMetrics(
            input_tokens=in_tok, 
            output_tokens=out_tok, 
            estimated_cost_usd=round(cost, 6), # Dynamic cost calculation applied here
            latency_ms=latency, 
            provider="groq", 
            model=settings.GROQ_MODEL
        )
        
        return result