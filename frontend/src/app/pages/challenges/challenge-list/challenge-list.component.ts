import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Challenge } from '../../../models/interfaces';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

@Component({
  selector: 'app-challenge-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, RevealDirective],
  template: `
    <div class="challenges-page">
      <div class="mesh" aria-hidden="true" style="opacity: 0.3;"><span></span></div>
      <div class="grain"></div>

      <div class="container">
        <div class="page-header">
          <div appReveal><span class="kicker">Industry Collaboration</span></div>
          <div class="header-row" style="margin-top: 18px;">
            <div appReveal [delay]="80">
              <h1 class="h-section">Real Challenges,<br><em class="serif-italic" style="color: var(--c-blue);">Real Impact</em>.</h1>
              <p class="lead" style="margin-top: 12px;">Bridging the gap between industrial needs and academic innovation.</p>
            </div>
            <div appReveal [delay]="140">
              <a routerLink="/challenges/submit" class="btn btn-primary">
                + Post a Challenge
              </a>
            </div>
          </div>
        </div>

        <div class="booth-grid" *ngIf="challenges.length">
          <article class="proj glass" *ngFor="let c of challenges; let i = index" appReveal [delay]="i * 80">
            <div class="proj-body">
              <div class="proj-meta">
                <span style="color: var(--c-blue);">{{ 'SECTORS.' + c.sector | translate }}</span>
                <span class="sep"></span>
                
                <div class="status-zone">
                  <span class="status-pill" [ngClass]="c.status" 
                        *ngIf="!authService.hasRole('company', 'admin') || authService.currentUser?.id !== c.company_id">
                    {{ c.status | titlecase }}
                  </span>
                  
                  <select class="status-select-mini" *ngIf="authService.hasRole('admin') || (authService.hasRole('company') && authService.currentUser?.id === c.company_id)"
                          [(ngModel)]="c.status" (change)="updateChallengeStatus(c)">
                    <option value="open">Open</option>
                    <option value="matched">Matched</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <h3 class="proj-title">{{ c.title }}</h3>
              <p class="proj-desc">{{ c.description | slice:0:150 }}...</p>
              
              <div class="proj-footer">
                <div class="card-meta">
                  <span *ngIf="c.budget" class="budget">💰 $ {{ c.budget | number }}</span>
                  <span class="date">{{ c.created_at | date:'mediumDate' }}</span>
                </div>
                
                <button class="btn btn-ghost btn-sm" (click)="runMatch(c.id)"
                        *ngIf="authService.hasRole('company', 'admin', 'evaluator')">
                  🤖 AI Match
                </button>
              </div>

              <div class="match-results-box" *ngIf="matchResults[c.id]?.length">
                <h4>Top AI Matches</h4>
                <div class="match-mini-list">
                  <div class="match-mini-item" *ngFor="let m of matchResults[c.id] | slice:0:3">
                    <a [routerLink]="['/projects', m.project_id]">{{ m.project_title }}</a>
                    <span class="score">{{ (m.similarity_score * 100).toFixed(0) }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div class="empty-state" *ngIf="!challenges.length && !loading" appReveal>
          <div class="empty-icon">💡</div>
          <h3>No challenges posted yet</h3>
          <p>Be the first to post an industry challenge and connect with innovators.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .challenges-page { position: relative; padding: 60px 0 100px; min-height: 100vh; overflow: hidden; }
    
    .header-row { display: flex; justify-content: space-between; align-items: flex-end; gap: 40px; margin-bottom: 48px; }
    @media (max-width: 768px) { .header-row { flex-direction: column; align-items: flex-start; } }

    .booth-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    @media (max-width: 900px) { .booth-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .booth-grid { grid-template-columns: 1fr; } }

    .proj.glass { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(20px); border-radius: 28px; border: 1px solid var(--c-line-soft); }
    .proj-body { padding: 32px; flex-grow: 1; display: flex; flex-direction: column; }
    .proj-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 16px; }
    .proj-meta .sep { width: 4px; height: 4px; border-radius: 50%; background: var(--c-line); }

    .status-pill { font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 3px 10px; border-radius: 99px; }
    .status-pill.open { background: #f0fdf4; color: #15803d; }
    .status-pill.matched { background: #f0f9ff; color: #0369a1; }
    .status-pill.closed { background: #fef2f2; color: #991b1b; }

    .status-select-mini {
      background: rgba(255, 255, 255, 0.8); border: 1px solid var(--c-line-soft);
      padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 700;
      text-transform: uppercase; color: var(--c-text-mute); outline: none; cursor: pointer;
    }

    .proj-title { font-family: var(--serif); font-size: 20px; font-weight: 700; color: var(--c-ink); line-height: 1.25; margin: 0 0 12px; }
    .proj-desc { font-size: 14px; color: var(--c-text-mute); margin-bottom: 24px; flex-grow: 1; line-height: 1.6; }

    .proj-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 20px; border-top: 1px solid var(--c-line-soft); }
    .card-meta { display: flex; flex-direction: column; gap: 4px; }
    .card-meta .budget { font-size: 13px; font-weight: 700; color: var(--c-ink); }
    .card-meta .date { font-size: 11px; color: var(--c-text-faint); }

    .match-results-box { margin-top: 24px; padding: 16px; background: rgba(30, 107, 255, 0.04); border-radius: 16px; border: 1px solid rgba(30, 107, 255, 0.1); }
    .match-results-box h4 { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--c-blue); margin-bottom: 12px; }
    .match-mini-list { display: flex; flex-direction: column; gap: 8px; }
    .match-mini-item { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
    .match-mini-item a { color: var(--c-ink); font-weight: 600; text-decoration: none; max-width: 18ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .match-mini-item a:hover { color: var(--c-blue); }
    .match-mini-item .score { font-weight: 700; color: var(--c-blue); }

    .empty-state { text-align: center; padding: 80px 0; color: var(--c-text-faint); }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }
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
      next: () => {},
      error: (err) => {
        console.error('Failed to update status', err);
        this.ngOnInit();
      }
    });
  }
}
