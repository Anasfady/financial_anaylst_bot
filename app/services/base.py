from abc import ABC, abstractmethod
from app.schemas import FinTechTriageOutput

class LLMProvider(ABC):
    @abstractmethod
    async def triage(self, text: str) -> FinTechTriageOutput:
        pass
