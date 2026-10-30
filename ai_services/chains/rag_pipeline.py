"""
Retrieval-Augmented Generation (RAG) pipeline module.
"""

from typing import Dict, Any
from ai_services.prompts.templates import RAG_QA_PROMPT
from ai_services.vector_store.vector_db import VectorStoreManager
from ai_services.providers.llm_provider import LLMProvider


class RAGPipeline:
    def __init__(self):
        self.vector_store = VectorStoreManager()
        self.llm_provider = LLMProvider()

    async def execute(self, query: str) -> Dict[str, Any]:
        """Runs the RAG retrieval and answer generation."""
        context_chunks = self.vector_store.similarity_search(query)
        context_text = "\n\n".join([chunk.get("text", "") for chunk in context_chunks])
        
        prompt = RAG_QA_PROMPT.format(context=context_text, question=query)
        
        return {
            "query": query,
            "prompt": prompt,
            "context": context_chunks,
        }

