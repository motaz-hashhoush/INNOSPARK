import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Challenge } from '../../../models/interfaces';

@Component({
  selector: 'app-challenge-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-row">
          <div>
            <h1 class="page-title">{{ 'CHALLENGES.TITLE' | translate }}</h1>
            <p class="page-subtitle">{{ 'CHALLENGES.SUBTITLE' | translate }}</p>
          </div>
          <a routerLink="/challenges/submit" class="btn btn-primary">
            + {{ 'CHALLENGES.SUBMIT' | translate }}
          </a>
        </div>
      </div>



      <div class="grid grid-3" *ngIf="challenges.length">
        <div class="card challenge-card" *ngFor="let c of challenges">
          <div class="card-top">
            <span class="badge badge-primary">{{ 'SECTORS.' + c.sector | translate }}</span>
            
            <div class="status-zone">
              <span class="badge" [ngClass]="c.status === 'open' ? 'badge-success' : 'badge-warning'" 
                    *ngIf="!authService.hasRole('company', 'admin') || authService.currentUser?.id !== c.company_id">
                {{ c.status }}
              </span>
              
              <select class="form-select status-select" *ngIf="authService.hasRole('admin') || (authService.hasRole('company') && authService.currentUser?.id === c.company_id)"
                      [(ngModel)]="c.status" (change)="updateChallengeStatus(c)">
                <option value="open">Open</option>
                <option value="matched">Matched</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <h3 class="card-title">{{ c.title }}</h3>
          <p class="card-desc">{{ c.description | slice:0:150 }}...</p>
          <div class="card-meta">
            <span *ngIf="c.budget">💰 $ {{ c.budget | number }}</span>
            <span>{{ c.created_at | date:'mediumDate' }}</span>
          </div>

          <button class="btn btn-secondary btn-sm" (click)="runMatch(c.id)" style="margin-top:0.75rem"
                  *ngIf="authService.hasRole('company', 'admin', 'evaluator')">
            🤖 Run AI Match
          </button>

          <div class="match-results" *ngIf="matchResults[c.id]?.length">
            <h4>Top Matches:</h4>
            <div class="match-item" *ngFor="let m of matchResults[c.id]">
              <a [routerLink]="['/projects', m.project_id]">{{ m.project_title }}</a>
              <span class="match-score">{{ (m.similarity_score * 100).toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!challenges.length && !loading">
        <p>{{ 'COMMON.NO_DATA' | translate }}</p>
      </div>
    </div>
  `,
  styles: [`
    .header-row { display: flex; justify-content: space-between; align-items: flex-start; }
    .challenge-card { display: flex; flex-direction: column; }
    .card-top { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; justify-content: space-between; align-items: flex-start; }
    .status-select { 
      appearance: none;
      -moz-appearance: none;
      -webkit-appearance: none;
      padding: 0.35rem 1.8rem 0.35rem 0.85rem; 
      font-size: 0.8rem; font-weight: 700; letter-spacing: 0.5px;
      border-radius: 20px; 
      background-color: rgba(30, 41, 59, 0.6);
      color: #e2e8f0; 
      border: 1px solid rgba(148, 163, 184, 0.3);
      cursor: pointer;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
      background-repeat: no-repeat;
      background-position: right 0.7rem top 50%;
      background-size: 0.65rem auto;
      text-transform: uppercase;
    }
    .status-select:hover {
      border-color: rgba(192, 132, 252, 0.8);
      box-shadow: 0 0 12px rgba(192, 132, 252, 0.3);
    }
    .status-select:focus {
      outline: none;
      border-color: #c084fc;
      box-shadow: 0 0 15px rgba(192, 132, 252, 0.4);
    }
    /* Style based on selected value using Angular classes via NgModel */
    .status-select.ng-valid[ng-reflect-model="open"] {
      border-color: rgba(52, 211, 153, 0.5); color: #10b981;
      background-color: rgba(16, 185, 129, 0.1);
    }
    .status-select.ng-valid[ng-reflect-model="matched"] {
      border-color: rgba(96, 165, 250, 0.5); color: #60a5fa;
      background-color: rgba(59, 130, 246, 0.1);
    }
    .status-select.ng-valid[ng-reflect-model="closed"] {
      border-color: rgba(248, 113, 113, 0.5); color: #f87171;
      background-color: rgba(239, 68, 68, 0.1);
    }
    .card-title { font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; }
    .card-desc { color: var(--text-secondary); font-size: 0.9rem; flex: 1; }
    .card-meta {
      display: flex; justify-content: space-between; margin-top: 0.75rem;
      font-size: 0.85rem; color: var(--text-muted);
    }
    .match-results {
      margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle);
    }
    .match-results h4 { font-size: 0.9rem; color: var(--accent-tertiary); margin-bottom: 0.5rem; }
    .match-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.3rem 0; font-size: 0.85rem;
    }
    .match-item a { color: var(--text-primary); text-decoration: none; }
    .match-item a:hover { color: var(--accent-tertiary); }
    .match-score {
      background: rgba(16, 185, 129, 0.15); color: #34d399;
      padding: 0.15rem 0.5rem; border-radius: 10px; font-weight: 600; font-size: 0.8rem;
    }
    .empty-state { text-align: center; padding: 4rem; color: var(--text-muted); }

    /* ── Guest Banner ── */
    .guest-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.25rem;
      flex-wrap: wrap;
      background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08));
      border: 1px solid rgba(99,102,241,0.3);
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      margin-bottom: 2rem;
    }
    .guest-banner-left {
      display: flex; align-items: center; gap: 1rem;
    }
    .guest-banner-icon {
      font-size: 2rem; flex-shrink: 0;
    }
    .guest-banner strong {
      display: block;
      color: #e2e8f0; font-size: 1rem; font-weight: 700; margin-bottom: 0.2rem;
    }
    .guest-banner p {
      color: #94a3b8; font-size: 0.88rem; margin: 0; line-height: 1.4;
    }
    .btn-gradient {
      display: inline-block;
      padding: 0.6rem 1.4rem; border-radius: 12px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; font-weight: 700; font-size: 0.9rem;
      text-decoration: none; white-space: nowrap;
      transition: all 0.2s;
      box-shadow: 0 4px 15px rgba(99,102,241,0.3);
    }
    .btn-gradient:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(99,102,241,0.45); }
  `],
})
export class ChallengeListComponent implements OnInit {
  challenges: Challenge[] = [];
  matchResults: { [id: number]: any[] } = {};
  loading = false;

  constructor(public authService: AuthService, private api: ApiService) {}

  ngOnInit(): void {
    this.loading = true;
    this.api.getChallenges().subscribe({
      next: (res) => {
        this.challenges = res.challenges;
        this.loading = false;
        // Fetch existing matches for each challenge
        this.challenges.forEach(c => this.loadMatches(c.id));
      },
      error: () => { this.loading = false; },
    });
  }

  loadMatches(challengeId: number): void {
    this.api.getMatchResults(challengeId).subscribe({
      next: (res) => {
        if (res.matches && res.matches.length > 0) {
          this.matchResults[challengeId] = res.matches;
        }
      }
    });
  }

  runMatch(challengeId: number): void {
    this.api.runMatching(challengeId).subscribe({
      next: (res) => { this.matchResults[challengeId] = res.matches; },
    });
  }

  updateChallengeStatus(challenge: Challenge): void {
    this.api.updateChallengeStatus(challenge.id, challenge.status).subscribe({
      next: (updated) => {
        // Option to show a toast or notification here
      },
      error: (err) => {
        console.error('Failed to update status', err);
        // Refresh to revert UI state on error
        this.ngOnInit();
      }
    });
  }
}
