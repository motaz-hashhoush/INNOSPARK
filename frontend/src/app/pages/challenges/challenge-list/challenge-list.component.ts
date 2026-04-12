import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Challenge } from '../../../models/interfaces';

@Component({
  selector: 'app-challenge-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-row">
          <div>
            <h1 class="page-title">{{ 'CHALLENGES.TITLE' | translate }}</h1>
            <p class="page-subtitle">{{ 'CHALLENGES.SUBTITLE' | translate }}</p>
          </div>
          <a routerLink="/challenges/submit" class="btn btn-primary"
             *ngIf="authService.hasRole('company', 'admin')">
            + {{ 'CHALLENGES.SUBMIT' | translate }}
          </a>
        </div>
      </div>

      <div class="grid grid-3" *ngIf="challenges.length">
        <div class="card challenge-card" *ngFor="let c of challenges">
          <div class="card-top">
            <span class="badge badge-primary">{{ 'SECTORS.' + c.sector | translate }}</span>
            <span class="badge" [ngClass]="c.status === 'open' ? 'badge-success' : 'badge-warning'">
              {{ c.status }}
            </span>
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
    .card-top { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
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
      next: (res) => { this.challenges = res.challenges; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  runMatch(challengeId: number): void {
    this.api.runMatching(challengeId).subscribe({
      next: (res) => { this.matchResults[challengeId] = res.matches; },
    });
  }
}
