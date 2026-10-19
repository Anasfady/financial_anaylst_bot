import time
import json
import httpx
from app.schemas import FinTechTriageOutput, ExecutionMetrics
from app.prompts import SYSTEM_PROMPT
from app.config import settings
from app.services.base import LLMProvider

class OllamaProvider(LLMProvider):
    async def triage(self, text: str) -> FinTechTriageOutput:
        start_time = time.monotonic()
        payload = {
            "model": settings.OLLAMA_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": text}
            ],
            "format": "json",
            "stream": False,
            "options": {
                "temperature": 0.1
            }
        }

        try:
            # Set a generous 60s timeout for local CPU inference
            async with httpx.AsyncClient(timeout=60.0) as client:
                res = await client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/chat",
                    json=payload
                )
                res.raise_for_status()
                data = res.json()

            latency = int((time.monotonic() - start_time) * 1000)
            content = data.get("message", {}).get("content", "{}")
            parsed = json.loads(content)

            prompt_eval = data.get("prompt_eval_count", 0)
            eval_count = data.get("eval_count", 0)

            result = FinTechTriageOutput(**parsed)
            result.metadata = ExecutionMetrics(
                input_tokens=prompt_eval,
                output_tokens=eval_count,
                estimated_cost_usd=0.0,
                latency_ms=latency,
                provider="ollama",
                model=settings.OLLAMA_MODEL,
                usage_is_estimated=False
            )
            return result

        except Exception as e:
            print(f"[OLLAMA_ERROR]: {type(e).__name__} - {str(e)}")
            if not settings.SIMULATE_LOCAL_ON_FAILURE:
                raise e
            
            # Fallback mock only if simulation is explicitly enabled
            latency = int((time.monotonic() - start_time) * 1000)
            return FinTechTriageOutput(
                thought_process=f"[SIMULATED LOCAL] Error: {type(e).__name__}",
                category="Unknown/Ambiguous",
                urgency="Low",
                summary="Simulated response.",
                assigned_department="Customer Support Tier 1",
                metadata=ExecutionMetrics(
                    input_tokens=15,
                    output_tokens=25,
                    estimated_cost_usd=0.0,
                    latency_ms=latency,
                    provider="ollama-mock",
                    model="mock-lite",
                    usage_is_estimated=True
                )
            )
