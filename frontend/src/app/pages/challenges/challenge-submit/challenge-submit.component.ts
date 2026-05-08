import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

@Component({
  selector: 'app-challenge-submit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, RevealDirective],
  template: `
    <div class="submit-page">
      <div class="mesh" aria-hidden="true" style="opacity: 0.25;"><span></span></div>
      <div class="grain"></div>

      <div class="container">
        <div class="form-layout">
          <div class="form-header">
            <div appReveal><span class="kicker">Market Demand</span></div>
            <div appReveal [delay]="80" style="margin-top: 18px;">
              <h1 class="h-section">Post a <em class="serif-italic" style="color: var(--c-blue);">Challenge</em>.</h1>
              <p class="lead">Connect your industry problem with academic innovation for real solutions.</p>
            </div>
          </div>

          <!-- Guest Info Banner -->
          <div class="banner glass" *ngIf="!authService.isLoggedIn()" appReveal [delay]="120">
            <span class="icon">🔒</span>
            <div class="text">
              <strong>Submitting as Guest</strong>
              <p>Your challenge will be public and AI matching will run instantly. <a routerLink="/auth/register">Create account</a> to set privacy.</p>
            </div>
          </div>

          <form (ngSubmit)="onSubmit()" class="form-card glass" appReveal [delay]="180">
            <div class="form-grid">
              <div class="field full">
                <label>Challenge Title *</label>
                <input type="text" [(ngModel)]="challenge.title" name="title" required placeholder="e.g. Optimized Logistics Data Pipeline">
              </div>

              <div class="field full">
                <label>Detailed Description *</label>
                <textarea [(ngModel)]="challenge.description" name="description" rows="5" required placeholder="Describe the pain points and current status..."></textarea>
              </div>

              <div class="field">
                <label>Sector</label>
                <select [(ngModel)]="challenge.sector" name="sector">
                  <option *ngFor="let s of sectors" [value]="s">{{ 'SECTORS.' + s | translate }}</option>
                </select>
              </div>

              <div class="field" *ngIf="authService.isLoggedIn()">
                <label>Available Budget (Optional)</label>
                <input type="number" [(ngModel)]="challenge.budget" name="budget" placeholder="USD">
              </div>

              <div class="field full">
                <label>Key Priorities</label>
                <textarea [(ngModel)]="challenge.priorities" name="priorities" rows="3" placeholder="What are the most important requirements?"></textarea>
              </div>

              <div class="field full">
                <label>Expected Outputs</label>
                <textarea [(ngModel)]="challenge.expected_outputs" name="expectedOutputs" rows="3" placeholder="What results are you looking for?"></textarea>
              </div>

              <div class="field full" *ngIf="authService.isLoggedIn()">
                <label class="check-wrap">
                  <input type="checkbox" [(ngModel)]="challenge.is_public" name="isPublic">
                  <span class="check-txt">List this challenge publicly in the Virtual Booth</span>
                </label>
              </div>
            </div>

            <div class="form-footer">
              <div class="error-msg" *ngIf="error">{{ error }}</div>
              <div class="action-row">
                <button type="submit" class="btn btn-primary btn-lg" [disabled]="loading">
                  {{ loading ? 'Posting...' : 'Post Challenge' }}
                </button>
                <a routerLink="/challenges" class="btn btn-ghost">Cancel</a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .submit-page { position: relative; padding: 60px 0 100px; min-height: 100vh; overflow: hidden; }
    .form-layout { max-width: 860px; margin: 0 auto; }
    .form-header { text-align: center; margin-bottom: 48px; }

    .form-card { padding: 48px; border-radius: 32px; border: 1px solid var(--c-line-soft); }
    .glass { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(20px); }
    
    .banner { 
      margin-bottom: 32px; padding: 24px; border-radius: 20px; border: 1px solid rgba(30,107,255,0.2);
      display: flex; gap: 20px; align-items: flex-start;
    }
    .banner .icon { font-size: 24px; }
    .banner .text strong { display: block; font-size: 14px; font-weight: 700; color: var(--c-ink); margin-bottom: 4px; }
    .banner .text p { font-size: 13px; color: var(--c-text-mute); margin: 0; line-height: 1.5; }
    .banner .text a { color: var(--c-blue); font-weight: 600; text-decoration: none; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .field.full { grid-column: span 2; }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } .field.full { grid-column: span 1; } .form-card { padding: 24px; } }

    .field label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--c-text-faint); margin-bottom: 8px; }
    .field input, .field select, .field textarea { 
      width: 100%; background: rgba(255,255,255,0.8); border: 1px solid var(--c-line-soft); 
      border-radius: 12px; padding: 12px 16px; font-size: 15px; color: var(--c-text); outline: none; 
      transition: all 200ms;
    }
    .field input:focus, .field select:focus, .field textarea:focus { border-color: var(--c-blue); box-shadow: 0 0 0 3px rgba(30,107,255,0.1); }

    .check-wrap { display: flex; align-items: center; gap: 12px; cursor: pointer; }
    .check-wrap input { width: 20px; height: 20px; accent-color: var(--c-blue); cursor: pointer; }
    .check-txt { font-size: 14px; font-weight: 500; color: var(--c-text-mute); }

    .form-footer { margin-top: 40px; border-top: 1px solid var(--c-line-soft); padding-top: 32px; }
    .action-row { display: flex; align-items: center; gap: 16px; justify-content: center; }
    .error-msg { font-size: 13px; color: #ef4444; font-weight: 600; text-align: center; margin-bottom: 16px; }
  `]
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
    if (!this.challenge.title || !this.challenge.description) {
      this.error = 'Title and Description are required.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.api.createChallenge(this.challenge).subscribe({
      next: () => {
        this.loading = false;
        if (this.authService.isLoggedIn()) {
          this.router.navigate(['/challenges']);
        } else {
          this.router.navigate(['/match']);
        }
      },
      error: (err: any) => { this.loading = false; this.error = err.error?.detail || 'Failed to submit'; },
    });
  }
}
