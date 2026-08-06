# AutoMacha Setup Instructions

## Backend Setup

```bash
# 1. Virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1          # Windows
source venv/bin/activate              # macOS / Linux

# 2. Install
pip install -r backend/requirements.txt

# 3. Environment
cp backend/.env.example backend/.env
# → Fill in SECRET_KEY, DB_NAME, DB_USER, DB_PASSWORD

# 4. Database
python backend/manage.py migrate

# 5. Launch
python backend/manage.py runserver
# → API live at http://127.0.0.1:8000/api/
```

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
# → App live at http://localhost:5173
```

> **Tip**: Celery runs in eager mode locally (`CELERY_TASK_ALWAYS_EAGER=True`), so all background tasks execute synchronously — no Redis or worker process needed for development.
