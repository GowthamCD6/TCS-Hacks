"""
Base Agent class for building intelligent multi-step reasoning agents.
"""

from typing import List, Dict, Any, Callable
from ai_services.providers.llm_provider import LLMProvider


class BaseAgent:
    def __init__(self, name: str, role: str, tools: List[Callable] = None):
        self.name = name
        self.role = role
        self.tools = tools or []
        self.llm = LLMProvider()

    async def run(self, task: str) -> Dict[str, Any]:
        """Executes the agent task."""
        return {
            "agent": self.name,
            "role": self.role,
            "task": task,
            "status": "completed",
        }

