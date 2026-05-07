import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

const SECTORS = [
  { value: 'health', label: 'Health' },
  { value: 'environment', label: 'Environment' },
  { value: 'energy', label: 'Energy' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'industry', label: 'Industry' },
  { value: 'information_technology', label: 'Information Technology' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
];

const SESSION_KEY = 'innospark_guest_session';
const SESSION_DATA_KEY = 'innospark_guest_data';

function getOrCreateSessionToken(): string {
  let token = localStorage.getItem(SESSION_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, token);
  }
  return token;
}

@Component({
  selector: 'app-guest-matcher',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="guest-page">

      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-badge">🚀 No Account Required</div>
        <h1 class="hero-title">Find Matching Innovation Projects</h1>
        <p class="hero-sub">Describe your industry challenge and our AI will instantly match you with relevant university graduation projects.</p>
        <div class="hero-steps">
          <div class="step"><span class="step-num">1</span><span>Describe your challenge</span></div>
          <div class="step-arrow">→</div>
          <div class="step"><span class="step-num">2</span><span>AI analyzes & matches</span></div>
          <div class="step-arrow">→</div>
          <div class="step"><span class="step-num">3</span><span>Explore matching projects</span></div>
        </div>
      </div>

      <div class="main-layout">

        <!-- Form Panel -->
        <div class="form-panel card" [class.collapsed]="hasResults && !showForm">
          <div class="panel-header" (click)="hasResults && toggleForm()">
            <h2 class="panel-title">
              <span class="panel-icon">🎯</span>
              {{ hasResults ? (showForm ? 'Edit Your Challenge' : 'Your Challenge') : 'Describe Your Challenge' }}
            </h2>
            <button class="toggle-btn" *ngIf="hasResults">
              {{ showForm ? '▲ Collapse' : '▼ Edit' }}
            </button>
          </div>

          <div class="form-body" [class.hidden]="hasResults && !showForm">
            <div class="form-group">
              <label class="form-label">Challenge Title <span class="required">*</span></label>
              <input
                type="text"
                class="form-input"
                [(ngModel)]="form.title"
                placeholder="e.g. Smart Water Leak Detection System"
                id="guest-title"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Sector <span class="required">*</span></label>
              <select class="form-select" [(ngModel)]="form.sector" id="guest-sector">
                <option value="">Select a sector...</option>
                <option *ngFor="let s of sectors" [value]="s.value">{{ s.label }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Problem Description <span class="required">*</span></label>
              <textarea
                class="form-textarea"
                [(ngModel)]="form.description"
                rows="5"
                placeholder="Describe the problem you are trying to solve in detail. What are the pain points? What solutions have failed?"
                id="guest-description"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Key Priorities <span class="optional">(optional)</span></label>
              <textarea
                class="form-textarea"
                [(ngModel)]="form.priorities"
                rows="3"
                placeholder="What are the most important requirements? e.g. Real-time alerts, low cost, mobile-friendly"
                id="guest-priorities"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Expected Outputs <span class="optional">(optional)</span></label>
              <textarea
                class="form-textarea"
                [(ngModel)]="form.expected_outputs"
                rows="3"
                placeholder="What deliverables or outcomes are you expecting? e.g. A working prototype, mobile app, data pipeline"
                id="guest-expected"
              ></textarea>
            </div>

            <div class="form-actions">
              <button
                class="btn btn-primary btn-lg"
                [disabled]="loading || !isFormValid()"
                (click)="submit()"
                id="guest-submit"
              >
                <span *ngIf="!loading">⚡ Find Matching Projects</span>
                <span *ngIf="loading" class="loading-text">
                  <span class="spinner"></span> AI is analyzing…
                </span>
              </button>
              <p class="form-note">
                <span class="lock-icon">🔒</span>
                Your session is private and stored only in your browser.
                <a routerLink="/auth/register">Create an account</a> to save challenges permanently.
              </p>
            </div>

            <div class="error-banner" *ngIf="error">
              <span>⚠️</span> {{ error }}
            </div>
          </div>
        </div>

        <!-- Results Panel -->
        <div class="results-panel" *ngIf="hasResults">

          <div class="results-header">
            <div class="results-meta">
              <h2 class="results-title">
                <span class="ai-icon">🤖</span>
                AI Match Results
              </h2>
              <div class="results-stats">
                <span class="stat-pill">{{ matches.length }} projects matched</span>
                <span class="stat-pill secondary">for: <strong>{{ challengeTitle }}</strong></span>
              </div>
            </div>
            <button class="btn btn-outline btn-sm" (click)="resetSession()" id="guest-reset">
              🔄 New Challenge
            </button>
          </div>

          <div class="no-matches" *ngIf="matches.length === 0">
            <div class="no-match-icon">🔍</div>
            <p>No matching projects found yet. Try broadening your description or checking back as more projects are added.</p>
          </div>

          <div class="match-list">
            <a
              [routerLink]="['/projects', m.project_id]"
              class="match-card"
              *ngFor="let m of matches; let i = index"
              [style.animation-delay]="i * 0.05 + 's'"
            >
              <div class="match-rank">#{{ i + 1 }}</div>
              <div class="match-body">
                <h3 class="match-title">{{ m.project_title }}</h3>
                <span class="match-sector">{{ m.project_sector | titlecase }}</span>
              </div>
              <div class="match-score-wrap">
                <div class="score-ring" [style.--pct]="m.similarity_score">
                  <svg viewBox="0 0 36 36" class="score-svg">
                    <path class="score-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    <path class="score-fill"
                          [attr.stroke-dasharray]="(m.similarity_score * 100).toFixed(1) + ', 100'"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                  </svg>
                  <span class="score-label">{{ (m.similarity_score * 100).toFixed(0) }}%</span>
                </div>
                <span class="score-text" [ngClass]="getScoreClass(m.similarity_score)">
                  {{ getScoreLabel(m.similarity_score) }}
                </span>
              </div>
              <div class="match-arrow">→</div>
            </a>
          </div>

          <div class="cta-banner">
            <div class="cta-content">
              <span class="cta-icon">✨</span>
              <div>
                <strong>Want to save this & do more?</strong>
                <p>Create a free account to manage challenges, get notified of new matches, and collaborate with project teams.</p>
              </div>
            </div>
            <div class="cta-actions">
              <a routerLink="/auth/register" class="btn btn-primary">Create Free Account</a>
              <a routerLink="/projects" class="btn btn-outline">Browse All Projects</a>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    .guest-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
      font-family: 'Inter', sans-serif;
      padding-bottom: 4rem;
    }

    /* ── Hero ── */
    .hero-section {
      text-align: center;
      padding: 4rem 2rem 3rem;
    }
    .hero-badge {
      display: inline-block;
      background: linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3));
      border: 1px solid rgba(168,85,247,0.4);
      color: #c4b5fd;
      padding: 0.4rem 1.2rem;
      border-radius: 50px;
      font-size: 0.85rem;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 1.5rem;
    }
    .hero-title {
      font-size: clamp(2rem, 5vw, 3.2rem);
      font-weight: 800;
      background: linear-gradient(135deg, #e2e8f0, #a78bfa, #60a5fa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 1rem;
      line-height: 1.15;
    }
    .hero-sub {
      color: #94a3b8;
      font-size: 1.1rem;
      max-width: 600px;
      margin: 0 auto 2.5rem;
      line-height: 1.6;
    }
    .hero-steps {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .step {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #cbd5e1;
      font-size: 0.9rem;
      font-weight: 500;
    }
    .step-num {
      width: 28px; height: 28px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 800; color: white;
      flex-shrink: 0;
    }
    .step-arrow { color: #475569; font-size: 1.2rem; }

    /* ── Layout ── */
    .main-layout {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    /* ── Form Panel ── */
    .form-panel {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(99,102,241,0.2);
      border-radius: 20px;
      padding: 0;
      overflow: hidden;
      backdrop-filter: blur(20px);
      transition: all 0.3s ease;
    }
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem 2rem;
      cursor: default;
      border-bottom: 1px solid rgba(99,102,241,0.15);
    }
    .form-panel.collapsed .panel-header { cursor: pointer; border-bottom: none; }
    .panel-title {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 1.2rem;
      font-weight: 700;
      color: #e2e8f0;
      margin: 0;
    }
    .panel-icon { font-size: 1.3rem; }
    .toggle-btn {
      background: rgba(99,102,241,0.1);
      border: 1px solid rgba(99,102,241,0.3);
      color: #a78bfa;
      padding: 0.35rem 0.85rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .toggle-btn:hover { background: rgba(99,102,241,0.2); }
    .form-body { padding: 2rem; }
    .form-body.hidden { display: none; }

    .form-group { margin-bottom: 1.5rem; }
    .form-label {
      display: block;
      font-size: 0.9rem;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 0.5rem;
    }
    .required { color: #f87171; margin-left: 2px; }
    .optional { color: #64748b; font-weight: 400; font-size: 0.8rem; }

    .form-input, .form-select, .form-textarea {
      width: 100%;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(99,102,241,0.2);
      border-radius: 12px;
      color: #e2e8f0;
      font-family: 'Inter', sans-serif;
      font-size: 0.95rem;
      padding: 0.75rem 1rem;
      transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
    }
    .form-input::placeholder, .form-textarea::placeholder { color: #475569; }
    .form-select option { background: #1e293b; }
    .form-textarea { resize: vertical; min-height: 100px; }

    .form-actions { margin-top: 2rem; }
    .btn-lg { padding: 0.9rem 2rem; font-size: 1rem; border-radius: 14px; width: 100%; justify-content: center; }
    .btn {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.6rem 1.4rem; border-radius: 10px;
      font-weight: 600; font-size: 0.9rem;
      text-decoration: none; cursor: pointer;
      transition: all 0.2s; border: none;
    }
    .btn-primary {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
    }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(99,102,241,0.4); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .btn-outline {
      background: transparent;
      border: 1px solid rgba(99,102,241,0.4);
      color: #a78bfa;
    }
    .btn-outline:hover { background: rgba(99,102,241,0.1); }
    .btn-sm { padding: 0.4rem 1rem; font-size: 0.85rem; }

    .loading-text { display: flex; align-items: center; gap: 0.6rem; justify-content: center; }
    .spinner {
      width: 18px; height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .form-note {
      margin-top: 1rem;
      color: #64748b;
      font-size: 0.82rem;
      text-align: center;
      line-height: 1.5;
    }
    .form-note a { color: #818cf8; }
    .lock-icon { margin-right: 0.3rem; }

    .error-banner {
      margin-top: 1rem;
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.3);
      color: #fca5a5;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      font-size: 0.88rem;
    }

    /* ── Results ── */
    .results-panel { display: flex; flex-direction: column; gap: 1.5rem; }

    .results-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .results-title {
      font-size: 1.4rem;
      font-weight: 800;
      color: #e2e8f0;
      margin: 0 0 0.5rem;
      display: flex; align-items: center; gap: 0.5rem;
    }
    .ai-icon { font-size: 1.5rem; }
    .results-stats { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .stat-pill {
      background: rgba(99,102,241,0.15);
      border: 1px solid rgba(99,102,241,0.3);
      color: #a78bfa;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .stat-pill.secondary { background: rgba(30,41,59,0.5); color: #94a3b8; border-color: rgba(148,163,184,0.2); }

    .no-matches {
      background: rgba(15,23,42,0.6);
      border: 1px solid rgba(99,102,241,0.15);
      border-radius: 16px;
      padding: 3rem;
      text-align: center;
      color: #64748b;
    }
    .no-match-icon { font-size: 3rem; margin-bottom: 1rem; }

    /* ── Match Cards ── */
    .match-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .match-card {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      background: rgba(15,23,42,0.7);
      border: 1px solid rgba(99,102,241,0.15);
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      text-decoration: none;
      transition: all 0.25s ease;
      animation: slideIn 0.4s ease both;
      cursor: pointer;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .match-card:hover {
      border-color: rgba(99,102,241,0.5);
      background: rgba(30,27,75,0.8);
      transform: translateX(4px);
      box-shadow: 0 4px 20px rgba(99,102,241,0.15);
    }

    .match-rank {
      font-size: 0.75rem;
      font-weight: 800;
      color: #475569;
      width: 28px;
      text-align: center;
      flex-shrink: 0;
    }
    .match-body { flex: 1; min-width: 0; }
    .match-title {
      font-size: 1rem;
      font-weight: 700;
      color: #e2e8f0;
      margin: 0 0 0.3rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .match-sector {
      font-size: 0.78rem;
      font-weight: 600;
      color: #6366f1;
      background: rgba(99,102,241,0.1);
      padding: 0.15rem 0.6rem;
      border-radius: 20px;
    }

    /* Score Ring */
    .match-score-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.3rem;
      flex-shrink: 0;
    }
    .score-ring {
      position: relative;
      width: 52px; height: 52px;
    }
    .score-svg { transform: rotate(-90deg); width: 100%; height: 100%; }
    .score-bg {
      fill: none;
      stroke: rgba(99,102,241,0.1);
      stroke-width: 3.5;
    }
    .score-fill {
      fill: none;
      stroke: url(#scoreGrad);
      stroke-width: 3.5;
      stroke-linecap: round;
      stroke: #6366f1;
      transition: stroke-dasharray 0.5s ease;
    }
    .score-label {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      font-size: 0.7rem;
      font-weight: 800;
      color: #e2e8f0;
    }
    .score-text {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    .score-high { color: #34d399; }
    .score-mid  { color: #fbbf24; }
    .score-low  { color: #94a3b8; }

    .match-arrow { color: #475569; font-size: 1.1rem; flex-shrink: 0; }

    /* ── CTA ── */
    .cta-banner {
      background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.12));
      border: 1px solid rgba(99,102,241,0.25);
      border-radius: 20px;
      padding: 1.75rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .cta-content {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }
    .cta-icon { font-size: 2rem; flex-shrink: 0; }
    .cta-content strong { color: #e2e8f0; font-size: 1rem; }
    .cta-content p { color: #94a3b8; font-size: 0.88rem; margin: 0.25rem 0 0; line-height: 1.5; }
    .cta-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; flex-shrink: 0; }

    @media (max-width: 640px) {
      .hero-section { padding: 2.5rem 1rem 2rem; }
      .form-body { padding: 1.25rem; }
      .match-card { padding: 1rem; gap: 0.75rem; }
      .cta-banner { flex-direction: column; }
      .hero-steps { display: none; }
    }
  `],
})
export class GuestMatcherComponent implements OnInit {
  sectors = SECTORS;
  sessionToken = '';

  form = {
    title: '',
    description: '',
    sector: '',
    priorities: '',
    expected_outputs: '',
  };

  loading = false;
  error = '';
  hasResults = false;
  showForm = true;
  challengeTitle = '';
  matches: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.sessionToken = getOrCreateSessionToken();
    
    // Try to load existing results from local storage
    const savedData = localStorage.getItem(SESSION_DATA_KEY);
    if (savedData) {
      try {
        const res = JSON.parse(savedData);
        if (res && res.matches && res.matches.length > 0) {
          this.applyResults(res);
          this.showForm = false;
        }
      } catch (e) {
        // ignore parsing errors
      }
    }
  }

  isFormValid(): boolean {
    return !!this.form.title.trim() && !!this.form.description.trim() && !!this.form.sector;
  }

  submit(): void {
    if (!this.isFormValid()) return;
    this.loading = true;
    this.error = '';

    this.api.guestMatch({
      ...this.form,
      session_token: this.sessionToken,
    }).subscribe({
      next: (res: { challenge: any; matches: any[]; total: number }) => {
        // Save to local storage since backend doesn't persist it
        localStorage.setItem(SESSION_DATA_KEY, JSON.stringify(res));
        this.applyResults(res);
        this.showForm = false;
        this.loading = false;
        // Scroll to results
        setTimeout(() => document.querySelector('.results-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      },
      error: (err: any) => {
        this.error = err?.error?.detail || 'Something went wrong. Please try again.';
        this.loading = false;
      },
    });
  }

  private applyResults(res: any): void {
    this.matches = res.matches || [];
    this.challengeTitle = res.challenge?.title || '';
    if (res.challenge) {
      this.form.title = res.challenge.title;
      this.form.description = res.challenge.description;
      this.form.sector = res.challenge.sector;
      this.form.priorities = res.challenge.priorities || '';
      this.form.expected_outputs = res.challenge.expected_outputs || '';
    }
    this.hasResults = true;
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  resetSession(): void {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_DATA_KEY);
    this.sessionToken = getOrCreateSessionToken();
    this.hasResults = false;
    this.showForm = true;
    this.matches = [];
    this.challengeTitle = '';
    this.form = { title: '', description: '', sector: '', priorities: '', expected_outputs: '' };
    this.error = '';
  }

  getScoreClass(score: number): string {
    if (score >= 0.65) return 'score-high';
    if (score >= 0.4) return 'score-mid';
    return 'score-low';
  }

  getScoreLabel(score: number): string {
    if (score >= 0.65) return 'Strong';
    if (score >= 0.4) return 'Good';
    return 'Partial';
  }
}
