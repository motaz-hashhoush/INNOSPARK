import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { RevealDirective } from '../../shared/directives/reveal.directive';

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
  imports: [CommonModule, FormsModule, RouterLink, RevealDirective],
  template: `
    <div class="matcher-page">
      <div class="mesh" aria-hidden="true" style="opacity: 0.35;"><span></span></div>
      <div class="grain"></div>

      <div class="container">
        <!-- Hero Section -->
        <div class="matcher-hero">
          <div appReveal><span class="kicker">AI matchmaking</span></div>
          <div appReveal [delay]="80">
            <h1 class="h-section">Every challenge,<br>meets <em class="serif-italic" style="color: var(--c-blue);">its team</em>.</h1>
          </div>
          <div appReveal [delay]="140">
            <p class="lead" style="max-width: 60ch; margin: 20px auto 0;">
              Describe your industry challenge and our AI will instantly match you with 
              relevant graduation projects from An-Najah's brightest innovators.
            </p>
          </div>
        </div>

        <div class="matcher-layout">
          <!-- Form Panel -->
          <div class="matcher-form card glass" appReveal [delay]="200" [class.collapsed]="hasResults && !showForm">
            <div class="form-head" (click)="hasResults && toggleForm()">
              <h2 class="h-card">
                {{ hasResults ? (showForm ? 'Edit Your Challenge' : 'Your Challenge') : 'Describe Your Challenge' }}
              </h2>
              <button class="btn btn-ghost btn-sm" *ngIf="hasResults">
                {{ showForm ? 'Collapse' : 'Edit Challenge' }}
              </button>
            </div>

            <div class="form-body" *ngIf="!hasResults || showForm">
              <div class="form-grid">
                <div class="field">
                  <label>Challenge Title *</label>
                  <input type="text" [(ngModel)]="form.title" placeholder="e.g. Smart Water Leak Detection">
                </div>
                <div class="field">
                  <label>Sector *</label>
                  <select [(ngModel)]="form.sector">
                    <option value="">Select a sector...</option>
                    <option *ngFor="let s of sectors" [value]="s.value">{{ s.label }}</option>
                  </select>
                </div>
              </div>
              
              <div class="field" style="margin-top: 20px;">
                <label>Problem Description *</label>
                <textarea [(ngModel)]="form.description" rows="4" placeholder="Describe the problem you are trying to solve..."></textarea>
              </div>

              <div class="form-actions" style="margin-top: 32px;">
                <button class="btn btn-primary btn-lg" [disabled]="loading || !isFormValid()" (click)="submit()">
                  <span *ngIf="!loading">⚡ Find Matching Projects</span>
                  <span *ngIf="loading">Analyzing...</span>
                </button>
                <p class="note">Your session is private. <a routerLink="/auth/register">Sign up</a> to save results.</p>
              </div>
            </div>
          </div>

          <!-- Results Panel -->
          <div class="matcher-results" *ngIf="hasResults" appReveal [delay]="100">
            <div class="results-head">
              <h2 class="h-card">AI Match Results</h2>
              <div class="meta-pills">
                <span class="pill">{{ matches.length }} Matches</span>
                <button class="btn btn-ghost btn-sm" (click)="resetSession()">New Search</button>
              </div>
            </div>

            <div class="match-grid">
              <article *ngFor="let m of matches; let i = index" class="match-item glass" [style.animation-delay]="i * 0.1 + 's'">
                <div class="match-score">
                  <div class="pct">{{ (m.similarity_score * 100).toFixed(0) }}%</div>
                  <div class="lbl">Match</div>
                </div>
                <div class="match-content">
                  <span class="sector">{{ m.project_sector | titlecase }}</span>
                  <h3 class="title">{{ m.project_title }}</h3>
                  <div class="actions">
                    <a [routerLink]="['/projects', m.project_id]" class="btn btn-primary btn-sm">Details</a>
                  </div>
                </div>
              </article>
            </div>

            <div class="results-cta glass" style="margin-top: 40px; text-align: center; padding: 40px;">
              <h3 class="h-card">Found what you were looking for?</h3>
              <p style="margin: 12px 0 24px; color: var(--c-text-mute);">Register now to contact these teams and start a collaboration.</p>
              <div style="display: flex; gap: 12px; justify-content: center;">
                <a routerLink="/auth/register" class="btn btn-primary">Create Account</a>
                <a routerLink="/projects" class="btn btn-outline">Browse All</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .matcher-page { position: relative; padding: 60px 0 100px; min-height: 100vh; overflow: hidden; }
    .matcher-hero { text-align: center; margin-bottom: 64px; }
    
    .matcher-layout { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 32px; }

    .matcher-form { border-radius: 32px; border: 1px solid var(--c-line-soft); overflow: hidden; }
    .matcher-form.collapsed { border-color: rgba(30,107,255,0.2); }
    .form-head { padding: 32px 40px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
    .form-body { padding: 0 40px 40px; }
    
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } .form-head, .form-body { padding: 24px; } }

    .field label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--c-text-faint); margin-bottom: 8px; }
    .field input, .field select, .field textarea { 
      width: 100%; background: rgba(255,255,255,0.8); border: 1px solid var(--c-line-soft); 
      border-radius: 12px; padding: 12px 16px; font-size: 15px; color: var(--c-text); outline: none; 
      transition: all 200ms;
    }
    .field input:focus, .field select:focus, .field textarea:focus { border-color: var(--c-blue); box-shadow: 0 0 0 3px rgba(30,107,255,0.1); }

    .form-actions { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .note { font-size: 12px; color: var(--c-text-faint); }
    .note a { color: var(--c-blue); font-weight: 600; text-decoration: none; }

    .matcher-results { margin-top: 16px; }
    .results-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .meta-pills { display: flex; gap: 12px; align-items: center; }
    .pill { font-size: 12px; font-weight: 700; background: rgba(30,107,255,0.1); color: var(--c-blue); padding: 4px 12px; border-radius: 99px; }

    .match-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    .match-item { 
      display: flex; align-items: center; gap: 32px; padding: 24px 32px; border-radius: 24px; 
      border: 1px solid var(--c-line-soft); transition: all 300ms;
      animation: slideUp 0.6s ease both;
    }
    .match-item:hover { transform: translateX(8px); border-color: var(--c-blue); box-shadow: 0 20px 40px -20px rgba(30,107,255,0.2); }
    
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    .match-score { text-align: center; min-width: 60px; }
    .match-score .pct { font-family: var(--serif); font-size: 24px; font-weight: 800; color: var(--c-blue); line-height: 1; }
    .match-score .lbl { font-size: 9px; text-transform: uppercase; font-weight: 700; color: var(--c-text-faint); margin-top: 4px; }

    .match-content { flex: 1; }
    .match-content .sector { font-size: 10px; font-weight: 700; color: var(--c-blue); text-transform: uppercase; }
    .match-content .title { font-size: 17px; font-weight: 700; color: var(--c-ink); margin: 4px 0 0; }

    .glass { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(20px); }
  `]
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
    const savedData = localStorage.getItem(SESSION_DATA_KEY);
    if (savedData) {
      try {
        const res = JSON.parse(savedData);
        if (res && res.matches && res.matches.length > 0) {
          this.applyResults(res);
          this.showForm = false;
        }
      } catch (e) {}
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
      next: (res: any) => {
        localStorage.setItem(SESSION_DATA_KEY, JSON.stringify(res));
        this.applyResults(res);
        this.showForm = false;
        this.loading = false;
        setTimeout(() => document.querySelector('.matcher-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      },
      error: (err: any) => {
        this.error = err?.error?.detail || 'Something went wrong.';
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
    this.form = { title: '', description: '', sector: '', priorities: '', expected_outputs: '' };
  }
}
