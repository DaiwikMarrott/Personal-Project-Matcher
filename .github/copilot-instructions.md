# Copilot Instructions for Project Jekyll & Hyde

## Project Overview
- **Architecture:**
  - Monorepo with `backend/` (FastAPI, Python) and `frontend/` (React Native, Expo, TypeScript).
  - AI-powered matching: profiles and projects are summarized and embedded using Google Gemini; similarity search is performed via Supabase RPC functions.
  - Database: PostgreSQL (Supabase), with vector search (HNSW) for embeddings.

## Key Workflows
- **Start Backend:**
  - `cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && uvicorn main:app --reload`
- **Start Frontend:**
  - `cd frontend && npm install && npx expo start`
- **Run Backend Tests:**
  - `cd backend && pytest`
- **Run Frontend Tests:**
  - `cd frontend && npm test`

## Matching System (Core Logic)
- **Profile/Project Creation:**
  - Triggers AI summary and embedding generation (see `backend/ai_service.py`).
  - Embeddings are stored in the database for fast similarity search.
- **Matching:**
  - Uses Supabase RPC: `match_profiles_to_project` and `match_projects_to_profile` (see `backend/schema.sql`).
  - Similarity is computed as `1 - (embedding <=> embedding)` (cosine distance).
  - Results include a `similarity_score` field for UI display.

## Project-Specific Patterns & Conventions
- **AI Service:**
  - All AI logic (summaries, embeddings, roadmaps) is in `backend/ai_service.py`.
  - Use Google Gemini API; API key loaded from `.env` (never commit `.env`).
- **Database Schema:**
  - See `backend/schema.sql` and `backend/migrations/` for structure and migrations.
  - Embedding fields: `bio_embedding` (profiles), `project_embedding` (projects), both 768D vectors.
- **Testing:**
  - Backend: `test_rpc.py` for RPC/matching, `tests/` for API and AI service tests.
  - Frontend: Use Expo/React Native testing tools.
- **Frontend Integration:**
  - API endpoints: `/profile`, `/project`, `/match`, `/recommended-projects/{profile_id}`.
  - Match scores and badges shown in UI when sorted by match.

## Integration & Troubleshooting
- **Environment Variables:**
  - All secrets in `.env` (backend) and `.env` (frontend, if needed).
- **Rate Limiting:**
  - AI calls are rate-limited; batch updates use `update_existing_data.py` with delays.
- **Storage:**
  - Supabase Storage for images/avatars; see `backend/STORAGE_SETUP.md` for policies.

## References
- See `README.md`, `CONTRIBUTING.md`, `MATCHING_ALGORITHM.md`, and `SETUP.md` for more details and examples.

---

*Update this file if you add new workflows, endpoints, or architectural changes.*
