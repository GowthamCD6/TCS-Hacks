"""
LLM Provider abstraction supporting multiple models (Gemini, OpenAI, Anthropic, Ollama, etc.).
"""

from typing import Any, Dict, List, Optional
from ai_services.config import ai_config


class LLMProvider:
    """Base LLM Provider to instantiate model clients and generate completions."""

    def __init__(self, provider: Optional[str] = None, model_name: Optional[str] = None):
        self.provider = (provider or ai_config.DEFAULT_MODEL_PROVIDER).lower()
        self.model_name = model_name or ai_config.DEFAULT_MODEL_NAME
        self._client = None

    def get_client(self) -> Any:
        """Returns the configured client instance (cached)."""
        if self._client is not None:
            return self._client

        if self.provider == "gemini":
            from google import genai
            self._client = genai.Client(api_key=ai_config.GEMINI_API_KEY)
        elif self.provider == "openai":
            from openai import OpenAI
            self._client = OpenAI(api_key=ai_config.OPENAI_API_KEY)
        else:
            raise ValueError(f"Unsupported provider: {self.provider}. Supported: 'gemini', 'openai'.")
        
        return self._client

    def generate(self, prompt: str, **kwargs) -> str:
        """
        Generate text response from the configured model.
        """
        client = self.get_client()

        if self.provider == "gemini":
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                **kwargs,
            )
            return response.text or ""

        elif self.provider == "openai":
            messages = [{"role": "user", "content": prompt}]
            response = client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                **kwargs,
            )
            return response.choices[0].message.content or ""

        raise NotImplementedError(f"Generation for provider '{self.provider}' is not implemented.")

    def chat(self, messages: List[Dict[str, str]], **kwargs) -> str:
        """
        Multi-turn chat completion.
        Messages format: [{"role": "user"|"assistant"|"system", "content": "..."}]
        """
        client = self.get_client()

        if self.provider == "gemini":
            # Convert OpenAI-style messages or pass formatted string to Gemini
            formatted_contents = [
                f"{msg.get('role', 'user').capitalize()}: {msg.get('content', '')}"
                for msg in messages
            ]
            full_prompt = "\n".join(formatted_contents)
            response = client.models.generate_content(
                model=self.model_name,
                contents=full_prompt,
                **kwargs,
            )
            return response.text or ""

        elif self.provider == "openai":
            response = client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                **kwargs,
            )
            return response.choices[0].message.content or ""

        raise NotImplementedError(f"Chat for provider '{self.provider}' is not implemented.")

    def get_embedding(self, text: str, model: Optional[str] = None) -> List[float]:
        """
        Generate vector embedding for the given input text.
        """
        client = self.get_client()
        embedding_model = model or ai_config.EMBEDDING_MODEL

        if self.provider == "gemini":
            result = client.models.embed_content(
                model=embedding_model,
                contents=text,
            )
            # Handle single embedding return
            if hasattr(result, "embedding") and hasattr(result.embedding, "values"):
                return result.embedding.values
            return []

        elif self.provider == "openai":
            model_to_use = model or "text-embedding-3-small"
            response = client.embeddings.create(
                model=model_to_use,
                input=text,
            )
            return response.data[0].embedding

        raise NotImplementedError(f"Embeddings for provider '{self.provider}' is not implemented.")


__all__ = ["LLMProvider"]
