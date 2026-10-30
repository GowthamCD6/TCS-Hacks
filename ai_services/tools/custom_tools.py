"""
Custom tools and function call definitions for AI agents.
"""

from typing import Any, Dict


def search_web_tool(query: str) -> Dict[str, Any]:
    """Mock web search tool for agent tool calling."""
    return {"query": query, "results": []}


def calculate_tool(expression: str) -> Any:
    """Safely evaluated calculation tool."""
    return {"expression": expression, "result": eval(expression, {"__builtins__": {}}, {})}

