"""
System prompt templates and instructions.
"""

SYSTEM_ASSISTANT_PROMPT = """You are an intelligent, helpful AI assistant built for TCS-Hacks.
Provide accurate, structured, and concise solutions.
"""

RAG_QA_PROMPT = """Context:
{context}

Question:
{question}

Answer the question strictly using the provided context. If the answer is not in the context, state that clearly.
"""

