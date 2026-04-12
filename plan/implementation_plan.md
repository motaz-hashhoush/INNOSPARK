# INNOSPARK Platform — Implementation Plan

A full-stack platform for showcasing university graduation projects, connecting them with private-sector challenges, and enabling AI-powered matching — built under An-Najah Innovation Park.

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic |
| **Database** | PostgreSQL 16 |
| **Auth** | JWT (python-jose) + bcrypt, role-based (Student, Supervisor, Company, Evaluator, Admin) |
| **AI/NLP** | sentence-transformers (all-MiniLM-L6-v2), scikit-learn |
| **File Storage** | Local filesystem (configurable to S3 later) |
| **Frontend** | Angular 18, TypeScript, Vanilla CSS |
| **i18n** | @ngx-translate/core (Arabic/English, RTL/LTR) |
| **Deployment** | Docker Compose |

---

## Proposed Changes

### Backend — Project Structure

```
backend/
├── app/
│   ├── main.py                    # FastAPI app entry
│   ├── config.py                  # Settings (env vars)
│   ├── database.py                # DB engine & session
│   ├── models/                    # SQLAlchemy models
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── challenge.py
│   │   ├── match.py
│   │   └── notification.py
│   ├── schemas/                   # Pydantic schemas
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── challenge.py
│   │   └── match.py
│   ├── routers/                   # API route groups
│   │   ├── auth.py
│   │   ├── projects.py
│   │   ├── challenges.py
│   │   ├── matching.py
│   │   ├── analytics.py
│   │   ├── pipeline.py
│   │   └── notifications.py
│   ├── services/                  # Business logic
│   │   ├── auth_service.py
│   │   ├── ai_matching.py
│   │   └── file_service.py
│   └── utils/
│       ├── security.py            # JWT helpers
│       └── deps.py                # Dependency injection
├── alembic/                       # DB migrations
├── uploads/                       # Uploaded files
├── requirements.txt
├── Dockerfile
└── .env.example
```

---

#### [NEW] [main.py](file:///d:/Work/INNOSPARK/backend/app/main.py)
FastAPI app with CORS, routers, startup events (DB init), and static file mount for uploads.

#### [NEW] [config.py](file:///d:/Work/INNOSPARK/backend/app/config.py)
Pydantic `Settings` class reading from `.env`: `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `UPLOAD_DIR`.

#### [NEW] [database.py](file:///d:/Work/INNOSPARK/backend/app/database.py)
SQLAlchemy async engine & session factory with `get_db` dependency.

---

#### [NEW] Models — [user.py](file:///d:/Work/INNOSPARK/backend/app/models/user.py)
- `User`: id, email, password_hash, full_name, role (enum: student/supervisor/company/evaluator/admin), language_pref, created_at

#### [NEW] Models — [project.py](file:///d:/Work/INNOSPARK/backend/app/models/project.py)
- `Project`: id, title_ar, title_en, summary_ar, summary_en, problem, value_proposition, sector (enum), team_members (JSON), supervisor_id (FK→User), technical_outputs, development_needs, readiness_level (concept/prototype/pilot-ready), video_url, status (submitted/under_review/incubation/partnership/marketed), embedding (vector), created_at
- `ProjectFile`: id, project_id, file_path, file_type, uploaded_at

#### [NEW] Models — [challenge.py](file:///d:/Work/INNOSPARK/backend/app/models/challenge.py)
- `Challenge`: id, company_id (FK→User), title, description, sector, priorities, expected_outputs, budget, is_public, status, embedding, created_at

#### [NEW] Models — [match.py](file:///d:/Work/INNOSPARK/backend/app/models/match.py)
- `Match`: id, project_id, challenge_id, similarity_score, status (suggested/accepted/rejected), created_at

#### [NEW] Models — [notification.py](file:///d:/Work/INNOSPARK/backend/app/models/notification.py)
- `Notification`: id, user_id, message, type, is_read, created_at

---

#### [NEW] Routers — [auth.py](file:///d:/Work/INNOSPARK/backend/app/routers/auth.py)
- `POST /auth/register` — create user with role
- `POST /auth/login` — return JWT token
- `GET /auth/me` — current user profile

#### [NEW] Routers — [projects.py](file:///d:/Work/INNOSPARK/backend/app/routers/projects.py)
- `POST /projects` — create project (student/supervisor)
- `GET /projects` — list/filter by sector, readiness, status
- `GET /projects/{id}` — project detail (Virtual Booth)
- `PUT /projects/{id}` — update project
- `POST /projects/{id}/files` — upload files
- `DELETE /projects/{id}` — soft delete

#### [NEW] Routers — [challenges.py](file:///d:/Work/INNOSPARK/backend/app/routers/challenges.py)
- `POST /challenges` — create challenge (company role)
- `GET /challenges` — list/filter
- `GET /challenges/{id}` — detail

#### [NEW] Routers — [matching.py](file:///d:/Work/INNOSPARK/backend/app/routers/matching.py)
- `POST /matching/run/{challenge_id}` — run AI matching for a challenge
- `GET /matching/results/{challenge_id}` — get ranked matches
- `PUT /matching/{match_id}/status` — accept/reject match

#### [NEW] Routers — [analytics.py](file:///d:/Work/INNOSPARK/backend/app/routers/analytics.py)
- `GET /analytics/overview` — project counts by sector, readiness, pipeline stage
- `GET /analytics/matches` — match statistics

#### [NEW] Routers — [pipeline.py](file:///d:/Work/INNOSPARK/backend/app/routers/pipeline.py)
- `PUT /pipeline/{project_id}/advance` — move project to next pipeline stage
- `GET /pipeline/stages` — list all stages with project counts

#### [NEW] Routers — [notifications.py](file:///d:/Work/INNOSPARK/backend/app/routers/notifications.py)
- `GET /notifications` — user's notifications
- `PUT /notifications/{id}/read` — mark as read

---

#### [NEW] Services — [ai_matching.py](file:///d:/Work/INNOSPARK/backend/app/services/ai_matching.py)
- Uses `sentence-transformers` (`all-MiniLM-L6-v2`) to embed project and challenge descriptions
- Cosine similarity for matching
- Readiness classification via keyword/rule-based heuristic
- Stores embeddings as JSON arrays in DB (upgradeable to pgvector later)

#### [NEW] Services — [auth_service.py](file:///d:/Work/INNOSPARK/backend/app/services/auth_service.py)
- Password hashing (bcrypt), JWT creation/verification, role-based permission checks

#### [NEW] Services — [file_service.py](file:///d:/Work/INNOSPARK/backend/app/services/file_service.py)
- Handle file uploads (PDF, PPT, images, CAD), validation, storage path management

---

### Frontend — Project Structure (Angular 18)

```
frontend/
├── src/
│   ├── app/
│   │   ├── app.component.ts       # Root component
│   │   ├── app.config.ts          # App configuration
│   │   ├── app.routes.ts          # Route definitions
│   │   ├── core/                  # Singleton services & guards
│   │   │   ├── services/
│   │   │   │   ├── api.service.ts
│   │   │   │   └── auth.service.ts
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts
│   │   │   └── interceptors/
│   │   │       └── jwt.interceptor.ts
│   │   ├── shared/                # Shared components & pipes
│   │   │   ├── components/
│   │   │   │   ├── navbar/
│   │   │   │   ├── footer/
│   │   │   │   ├── project-card/
│   │   │   │   ├── challenge-card/
│   │   │   │   ├── file-uploader/
│   │   │   │   └── language-switcher/
│   │   │   └── pipes/
│   │   ├── pages/
│   │   │   ├── landing/
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── projects/
│   │   │   │   ├── project-list/    # Virtual Booth grid
│   │   │   │   ├── project-detail/  # Project booth
│   │   │   │   └── project-submit/
│   │   │   ├── challenges/
│   │   │   │   ├── challenge-list/
│   │   │   │   └── challenge-submit/
│   │   │   ├── dashboard/
│   │   │   └── pipeline/
│   │   └── models/                # TypeScript interfaces
│   ├── assets/
│   │   └── i18n/
│   │       ├── en.json
│   │       └── ar.json
│   ├── styles.css                 # Global styles
│   └── environments/
├── angular.json
├── package.json
├── Dockerfile
└── .env.example
```

---

#### Key Frontend Pages

| Page | Description |
|---|---|
| **Landing** | Hero section, stats, featured projects, CTA buttons |
| **Login / Register** | Auth forms with role selection |
| **Virtual Booth** | Grid of project cards filterable by sector; click → full booth |
| **Project Booth** | Video embed, summary, documents, team, contact form |
| **Project Submit** | Multi-section form with file upload |
| **Challenge Submit** | Company challenge form (public/private toggle) |
| **Dashboard** | Charts (projects by sector, readiness, matches), KPI cards |
| **Pipeline** | Kanban-style board: Submitted → Review → Incubation → Partnership → Market |

---

### Infrastructure

#### [NEW] [docker-compose.yml](file:///d:/Work/INNOSPARK/docker-compose.yml)
- `db`: PostgreSQL 16
- `backend`: FastAPI app (port 8000)
- `frontend`: Angular app via nginx (port 4200)
- Shared network, volume for uploads and DB data

#### [NEW] [.env.example](file:///d:/Work/INNOSPARK/.env.example)
Template for all environment variables.

---

## User Review Required

> [!IMPORTANT]
> **AI Model Choice**: The plan uses `all-MiniLM-L6-v2` (80MB, runs on CPU) for embedding/matching. This is lightweight and good for a first version. For production with Arabic-heavy text, consider `paraphrase-multilingual-MiniLM-L12-v2`. Which do you prefer?

> [!IMPORTANT]
> **Database**: The plan uses a local PostgreSQL instance via Docker Compose. Would you like to connect to your existing local PostgreSQL instead (as you've done in previous projects)?

> [!IMPORTANT]
> **Scope**: This is a large project. I'll build it in phases — the initial implementation will have all core features working end-to-end but with simplified UI that can be polished iteratively. Is this approach acceptable?

---

## Verification Plan

### Automated Tests
1. **Backend API tests**: Run `pytest` to test all CRUD endpoints, auth flow, and matching logic
   ```bash
   cd backend && python -m pytest tests/ -v
   ```

2. **Frontend build check**: Verify Angular compiles without errors
   ```bash
   cd frontend && ng build
   ```

### Browser Testing
- Navigate to `http://localhost:4200` and verify:
  1. Landing page loads with proper RTL/LTR layout
  2. Register → Login flow works
  3. Project submission form accepts data and files
  4. Virtual Booth displays projects
  5. Challenge submission works
  6. Dashboard shows analytics charts
  7. Language switcher toggles Arabic/English

### Manual Verification
- After deployment, the user should verify:
  1. Docker Compose brings up all services: `docker compose up`
  2. API docs accessible at `http://localhost:8000/docs`
  3. Frontend accessible at `http://localhost:4200`
  4. End-to-end flow: Register → Submit Project → Submit Challenge → View Matches
