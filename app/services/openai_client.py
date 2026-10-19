import time
import json
from openai import AsyncOpenAI
from app.schemas import FinTechTriageOutput, ExecutionMetrics
from app.prompts import SYSTEM_PROMPT
from app.config import settings
from app.services.base import LLMProvider

# Initialize the async OpenAI client
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

class OpenAIProvider(LLMProvider):
    async def triage(self, text: str) -> FinTechTriageOutput:
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is missing in .env")
            
        start_time = time.monotonic()
        
        response = await client.chat.completions.create(
            model=settings.EXTERNAL_MODEL,
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
        
        # Calculate cost based on gpt-4o-mini pricing in config
        cost = (in_tok / 1000.0 * settings.EXTERNAL_INPUT_PRICE_PER_1K) + (out_tok / 1000.0 * settings.EXTERNAL_OUTPUT_PRICE_PER_1K)
        
        # Parse the JSON string returned by OpenAI into our Pydantic model
        result = FinTechTriageOutput(**json.loads(response.choices[0].message.content))
        result.metadata = ExecutionMetrics(
            input_tokens=in_tok, 
            output_tokens=out_tok, 
            estimated_cost_usd=round(cost, 6),
            latency_ms=latency, 
            provider="openai", 
            model=settings.EXTERNAL_MODEL
        )
        
        return result