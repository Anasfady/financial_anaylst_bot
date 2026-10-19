from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    
    GROQ_INPUT_PRICE_PER_1K: float = 0.00059
    GROQ_OUTPUT_PRICE_PER_1K: float = 0.00079
    
    OLLAMA_BASE_URL: str = "http://127.0.0.1:11434"
    OLLAMA_MODEL: str = "tinyllama"
    # Ensure the ': bool' annotation is present here
    SIMULATE_LOCAL_ON_FAILURE: bool = False
    TIMEOUT_SECONDS: int = 30

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
