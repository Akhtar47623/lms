# LMS FastAPI Backend

Local backend for the React LMS frontend.

## Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000/api/v1`.

Seeded accounts:

- `admin@example.com` / `password123`
- `instructor@example.com` / `password123`
- `student@example.com` / `password123`

Uploaded files are served from `/uploads/...`.
