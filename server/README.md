# FastAPI Backend

Production-ready modular FastAPI backend service.

## Folder Structure

```
server/
├── app/
│   ├── api/             # API routing & versioning
│   │   └── v1/
│   │       ├── endpoints/ # Route handlers (e.g., auth, users, health)
│   │       └── api.py     # v1 router aggregator
│   ├── core/            # Core application configurations & security
│   │   ├── config.py    # Environment settings via Pydantic
│   │   └── security.py  # Security / JWT / hashing utilities
│   ├── db/              # Database sessions and migrations
│   │   └── session.py
│   ├── models/          # ORM models (SQLAlchemy / SQLModel / Tortoise)
│   ├── schemas/         # Pydantic validation schemas
│   ├── services/        # Business logic layer
│   ├── utils/           # Helper functions & utilities
│   └── main.py          # Application factory & entrypoint
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

## Quick Start

### 1. Create and Activate a Virtual Environment

```bash
# In the server directory:
cd server
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# Windows (cmd):
.\venv\Scripts\activate.bat

# Linux / macOS:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Setup Environment Variables

```bash
cp .env.example .env
```

### 4. Run the Development Server

```bash
uvicorn app.main:app --reload --port 8000
```

- **API Root**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- **ReDoc**: [http://localhost:8000/api/v1/redoc](http://localhost:8000/api/v1/redoc)
- **Health Check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

