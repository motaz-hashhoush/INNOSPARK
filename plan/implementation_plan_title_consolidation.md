# Implementation Plan - Consolidate Project Titles

The objective is to replace the separate `title_en` and `title_ar` fields in the `Project` model with a single `title` field.

## User Requirements
- Change `title_en` and `title_ar` to a single `title` column.

## Proposed Changes

### 1. Backend: Model Update
- **File**: `backend/app/models/project.py`
- **Action**: Replace `title_en` and `title_ar` with `title`.

### 2. Backend: Schema Update
- **File**: `backend/app/schemas/project.py`
- **Action**: Update `ProjectCreate`, `ProjectUpdate`, and `ProjectResponse` to use `title`.

### 3. Backend: Service Update
- **File**: `backend/app/services/ai_matching.py`
- **Action**: Update `build_project_text` to use `title`. Update notification message logic.

### 4. Backend: Router Updates
- **File**: `backend/app/routers/projects.py`
- **Action**: Update creation, listing (search filters), and update logic.
- **File**: `backend/app/routers/analytics.py`
- **Action**: Update `get_match_analytics` query.
- **File**: `backend/app/routers/pipeline.py`
- **Action**: Update project list in `get_pipeline_stages` and notification message in `advance_project`.
- **File**: `backend/app/routers/matching.py`
- **Action**: Update `MatchResponse` population logic.

### 5. Frontend: Interface Update
- **File**: `frontend/src/app/models/interfaces.ts`
- **Action**: Update `Project` interface.

### 6. Frontend: Component Updates
- **File**: `frontend/src/app/pages/projects/project-submit/project-submit.component.ts`
- **Action**: Update form to have a single title field.
- **File**: `frontend/src/app/pages/projects/project-list/project-list.component.ts`
- **Action**: Update template to use `project.title`.
- **File**: `frontend/src/app/pages/projects/project-detail/project-detail.component.ts`
- **Action**: Update template to use `project.title`.
