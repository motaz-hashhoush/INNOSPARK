import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-challenge-submit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="page-container">
      <div class="form-page fade-in-up">
        <h1 class="page-title">{{ 'CHALLENGES.SUBMIT_TITLE' | translate }}</h1>
        <p class="page-subtitle">{{ 'CHALLENGES.SUBMIT_SUBTITLE' | translate }}</p>

        <!-- Guest Info Banner -->
        <div class="guest-info-banner" *ngIf="!authService.isLoggedIn()">
          <span class="banner-icon">🔒</span>
          <div class="banner-text">
            <strong>Submitting as Guest</strong>
            <p>
              Your challenge will be publicly listed and AI matching will run automatically.
              <a routerLink="/auth/register">Create an account</a> to manage your challenges, set them private, and track results over time.
            </p>
          </div>
        </div>

        <form (ngSubmit)="onSubmit()" class="submit-form">
          <div class="form-group">
            <label class="form-label">{{ 'CHALLENGES.CHALLENGE_TITLE' | translate }} *</label>
            <input type="text" class="form-input" [(ngModel)]="challenge.title" name="title" required>
          </div>

          <div class="form-group">
            <label class="form-label">{{ 'CHALLENGES.DESCRIPTION' | translate }} *</label>
            <textarea class="form-textarea" [(ngModel)]="challenge.description" name="description" required
                      style="min-height:150px;"></textarea>
          </div>

          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label">{{ 'PROJECTS.SECTOR' | translate }}</label>
              <select class="form-select" [(ngModel)]="challenge.sector" name="sector">
                <option *ngFor="let s of sectors" [value]="s">{{ 'SECTORS.' + s | translate }}</option>
              </select>
            </div>
            <div class="form-group" *ngIf="authService.isLoggedIn()">
              <label class="form-label">{{ 'CHALLENGES.BUDGET' | translate }}</label>
              <input type="number" class="form-input" [(ngModel)]="challenge.budget" name="budget">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">{{ 'CHALLENGES.PRIORITIES' | translate }}</label>
            <textarea class="form-textarea" [(ngModel)]="challenge.priorities" name="priorities"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">{{ 'CHALLENGES.EXPECTED_OUTPUTS' | translate }}</label>
            <textarea class="form-textarea" [(ngModel)]="challenge.expected_outputs" name="expectedOutputs"></textarea>
          </div>

          <!-- Visibility only for logged-in users (guests are always public) -->
          <div class="form-group" *ngIf="authService.isLoggedIn()">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="challenge.is_public" name="isPublic">
              {{ 'CHALLENGES.IS_PUBLIC' | translate }}
            </label>
          </div>

          <div class="error-msg" *ngIf="error">{{ error }}</div>

          <div class="form-actions-row">
            <button type="submit" class="btn btn-primary btn-lg" [disabled]="loading">
              {{ loading ? '...' : ('CHALLENGES.SUBMIT' | translate) }}
            </button>
            <a routerLink="/challenges" class="btn btn-outline">Cancel</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-page { max-width: 800px; margin: 0 auto; }
    .submit-form { margin-top: 2rem; }

    /* Guest Info Banner */
    .guest-info-banner {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.05));
      border: 1px solid rgba(99,102,241,0.25);
      border-radius: 14px;
      padding: 1.1rem 1.4rem;
      margin-bottom: 2rem;
    }
    .banner-icon { font-size: 1.5rem; flex-shrink: 0; margin-top: 2px; }
    .banner-text strong {
      display: block;
      color: var(--text-primary, #e2e8f0);
      font-weight: 700;
      margin-bottom: 0.3rem;
    }
    .banner-text p {
      color: var(--text-secondary, #94a3b8);
      font-size: 0.88rem;
      margin: 0;
      line-height: 1.5;
    }
    .banner-text a {
      color: #818cf8;
      text-decoration: none;
      font-weight: 600;
    }
    .banner-text a:hover { text-decoration: underline; }

    .checkbox-label {
      display: flex; align-items: center; gap: 0.5rem;
      color: var(--text-secondary); cursor: pointer;
    }
    .checkbox-label input { width: 18px; height: 18px; accent-color: var(--accent-primary); }
    .error-msg {
      color: var(--danger); background: rgba(239, 68, 68, 0.1);
      padding: 0.6rem 1rem; border-radius: var(--radius-sm); margin-bottom: 1rem;
    }
    .form-actions-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 0.5rem;
    }
    .btn-lg { padding: 0.8rem 2rem; font-size: 1rem; }
  `],
})
export class ChallengeSubmitComponent {
  challenge: any = {
    title: '', description: '', sector: 'other',
    priorities: '', expected_outputs: '', budget: null, is_public: true,
  };
  error = '';
  loading = false;
  sectors = ['health', 'environment', 'energy', 'agriculture', 'industry', 'information_technology', 'education', 'other'];

  constructor(
    private api: ApiService,
    private router: Router,
    public authService: AuthService,
  ) {}

  onSubmit(): void {
    this.loading = true;
    this.error = '';
    this.api.createChallenge(this.challenge).subscribe({
      next: () => {
        this.loading = false;
        // Guests go to /match to see AI results; logged-in users go to challenges
        if (this.authService.isLoggedIn()) {
          this.router.navigate(['/challenges']);
        } else {
          this.router.navigate(['/match']);
        }
      },
      error: (err) => { this.loading = false; this.error = err.error?.detail || 'Failed to submit'; },
    });
  }
}

