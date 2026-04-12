import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-challenge-submit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="page-container">
      <div class="form-page fade-in-up">
        <h1 class="page-title">{{ 'CHALLENGES.SUBMIT_TITLE' | translate }}</h1>
        <p class="page-subtitle">{{ 'CHALLENGES.SUBMIT_SUBTITLE' | translate }}</p>

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
            <div class="form-group">
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

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="challenge.is_public" name="isPublic">
              {{ 'CHALLENGES.IS_PUBLIC' | translate }}
            </label>
          </div>

          <div class="error-msg" *ngIf="error">{{ error }}</div>

          <button type="submit" class="btn btn-primary btn-lg" [disabled]="loading">
            {{ loading ? '...' : ('CHALLENGES.SUBMIT' | translate) }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-page { max-width: 800px; margin: 0 auto; }
    .submit-form { margin-top: 2rem; }
    .checkbox-label {
      display: flex; align-items: center; gap: 0.5rem;
      color: var(--text-secondary); cursor: pointer;
    }
    .checkbox-label input { width: 18px; height: 18px; accent-color: var(--accent-primary); }
    .error-msg {
      color: var(--danger); background: rgba(239, 68, 68, 0.1);
      padding: 0.6rem 1rem; border-radius: var(--radius-sm); margin-bottom: 1rem;
    }
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

  constructor(private api: ApiService, private router: Router) {}

  onSubmit(): void {
    this.loading = true;
    this.error = '';
    this.api.createChallenge(this.challenge).subscribe({
      next: () => { this.loading = false; this.router.navigate(['/challenges']); },
      error: (err) => { this.loading = false; this.error = err.error?.detail || 'Failed to submit'; },
    });
  }
}
