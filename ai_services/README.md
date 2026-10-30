# AI Services Module

Dedicated AI module layer for LLM agents, RAG pipelines, tool execution, and vector embeddings.

## Folder Structure

```
ai_services/
├── agents/              # Autonomous agent workflows and task executors
│   └── base_agent.py
├── chains/              # Execution pipelines (RAG, reasoning chains)
│   └── rag_pipeline.py
├── prompts/             # System prompts and dynamic prompt templates
│   └── templates.py
├── providers/           # Model client providers (Gemini, OpenAI, etc.)
│   └── llm_provider.py
├── tools/               # Agent tool calling functions
│   └── custom_tools.py
├── vector_store/        # Vector database management (ChromaDB, FAISS)
│   └── vector_db.py
├── utils/               # Text splitters, chunking, and token helpers
│   └── text_splitter.py
├── config.py            # AI configuration & settings
├── requirements.txt     # AI dependencies
├── .env.example
├── .gitignore
└── README.md
```

## Setup & Usage

### 1. Configure Environment Variables
Copy `.env.example` to `.env` in the `ai_services/` directory (or use root `.env`):
```bash
cp .env.example .env
```
Fill in your API keys (`GEMINI_API_KEY` or `OPENAI_API_KEY`).

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Usage from FastAPI Backend (`server`)
You can import modules directly into `server/app` services or endpoints:
```python
from ai_services.chains.rag_pipeline import RAGPipeline

rag = RAGPipeline()
response = await rag.execute("Your question here")
```

