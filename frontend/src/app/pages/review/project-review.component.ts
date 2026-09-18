import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Project } from '../../models/interfaces';
import { RevealDirective } from '../../shared/directives/reveal.directive';

/**
 * Supervisor workspace: review projects awaiting approval, and track the ones
 * already published. Admins see every project, supervisors only their own.
 */
@Component({
  selector: 'app-project-review',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, RevealDirective],
  template: `
    <div class="review-page">
      <div class="mesh" aria-hidden="true" style="opacity: 0.2;"><span></span></div>
      <div class="grain"></div>

      <div class="container">
        <header class="page-header">
          <div appReveal><span class="kicker">Supervision</span></div>
          <div appReveal [delay]="80" style="margin-top: 18px;">
            <h1 class="h-section">Project <em class="serif-italic" style="color: var(--c-blue);">Review</em>.</h1>
            <p class="lead" style="margin-top: 12px;">
              Approve projects before they are published to the Virtual Booth, and follow the ones you supervise.
            </p>
          </div>
        </header>

        <div class="tabs" appReveal [delay]="140">
          <button [class.active]="tab === 'pending'" (click)="switchTab('pending')">Awaiting review</button>
          <button [class.active]="tab === 'approved'" (click)="switchTab('approved')">Published</button>
          <button [class.active]="tab === 'rejected'" (click)="switchTab('rejected')">Rejected</button>
        </div>

        <div class="error-alert" *ngIf="error">⚠️ {{ error }}</div>

        <div class="list" *ngIf="projects.length; else emptyTpl">
          <article class="row glass" *ngFor="let p of projects; let i = index" appReveal [delay]="i * 60">
            <div class="row-main">
              <div class="row-meta">
                <span class="pill">{{ p.sector | titlecase }}</span>
                <span class="pill" [ngClass]="p.readiness_level">{{ p.readiness_level?.replace('_', ' ') | titlecase }}</span>
                <span class="pill state" [ngClass]="p.approval_status">{{ p.approval_status | titlecase }}</span>
              </div>
              <h3><a [routerLink]="['/projects', p.id]">{{ p.title }}</a></h3>
              <p>{{ (p.summary || p.problem) | slice:0:220 }}...</p>
              <p class="note" *ngIf="p.review_note">Review note: {{ p.review_note }}</p>
            </div>

            <div class="row-actions" *ngIf="tab === 'pending'">
              <input type="text" [(ngModel)]="notes[p.id]" [name]="'note' + p.id" placeholder="Optional note to the team">
              <div class="btn-row">
                <button class="btn btn-primary btn-sm" (click)="review(p, true)" [disabled]="busy[p.id]">Approve &amp; publish</button>
                <button class="btn btn-outline btn-sm" (click)="review(p, false)" [disabled]="busy[p.id]">Reject</button>
              </div>
            </div>

            <div class="row-actions" *ngIf="tab !== 'pending'">
              <a [routerLink]="['/projects', p.id]" class="btn btn-outline btn-sm">Open</a>
            </div>
          </article>
        </div>

        <ng-template #emptyTpl>
          <div class="empty-state" *ngIf="!loading">
            <div class="empty-icon">✅</div>
            <h3>Nothing here</h3>
            <p *ngIf="tab === 'pending'">No projects are waiting for your approval.</p>
            <p *ngIf="tab !== 'pending'">No projects in this state yet.</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .review-page { position: relative; padding: 60px 0 100px; min-height: 100vh; overflow: hidden; }
    .page-header { margin-bottom: 32px; }
    .glass { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(20px); }

    .tabs { display: flex; gap: 6px; background: rgba(30,107,255,0.06); border-radius: 99px; padding: 4px; width: fit-content; margin-bottom: 28px; }
    .tabs button {
      border: none; background: transparent; cursor: pointer; font-size: 12px; font-weight: 700;
      padding: 8px 20px; border-radius: 99px; color: var(--c-text-mute); transition: all 200ms;
    }
    .tabs button.active { background: var(--c-blue); color: white; }

    .error-alert {
      margin-bottom: 20px; padding: 12px 16px; border-radius: 14px; font-size: 13px; font-weight: 600;
      background: rgba(239, 68, 68, 0.06); border: 1px solid rgba(239, 68, 68, 0.25); color: #b91c1c;
    }

    .list { display: flex; flex-direction: column; gap: 16px; }
    .row { display: flex; justify-content: space-between; gap: 32px; padding: 28px; border-radius: 24px; border: 1px solid var(--c-line-soft); }
    @media (max-width: 820px) { .row { flex-direction: column; gap: 20px; } }

    .row-meta { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
    .pill { font-size: 10px; font-weight: 700; background: rgba(30,107,255,0.1); color: var(--c-blue); padding: 4px 12px; border-radius: 99px; text-transform: uppercase; }
    .pill.concept { background: #fff7ed; color: #c2410c; }
    .pill.prototype { background: #f0f9ff; color: #0369a1; }
    .pill.pilot_ready { background: #f0fdf4; color: #15803d; }
    .pill.state.pending { background: #fef9c3; color: #a16207; }
    .pill.state.approved { background: #f0fdf4; color: #15803d; }
    .pill.state.rejected { background: #fef2f2; color: #b91c1c; }

    .row-main h3 { font-family: var(--serif); font-size: 19px; font-weight: 700; margin: 0 0 8px; }
    .row-main h3 a { color: var(--c-ink); text-decoration: none; }
    .row-main h3 a:hover { color: var(--c-blue); }
    .row-main p { font-size: 13px; color: var(--c-text-mute); line-height: 1.6; margin: 0; }
    .row-main .note { margin-top: 8px; font-style: italic; color: var(--c-text-faint); }

    .row-actions { display: flex; flex-direction: column; gap: 10px; min-width: 260px; }
    .row-actions input {
      border: 1px solid var(--c-line-soft); border-radius: 12px; padding: 8px 14px;
      font-size: 12px; outline: none; background: white; color: var(--c-text);
    }
    .btn-row { display: flex; gap: 8px; }
    .btn-sm { font-size: 12px; padding: 8px 16px; }

    .empty-state { text-align: center; padding: 80px 0; color: var(--c-text-faint); }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }
  `],
})
export class ProjectReviewComponent implements OnInit {
  projects: Project[] = [];
  tab: 'pending' | 'approved' | 'rejected' = 'pending';
  notes: { [projectId: number]: string } = {};
  busy: { [projectId: number]: boolean } = {};
  loading = false;
  error = '';

  constructor(public authService: AuthService, private api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  switchTab(tab: 'pending' | 'approved' | 'rejected'): void {
    this.tab = tab;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.api.getProjects({
      approval: this.tab,
      // Admins oversee everything; supervisors only see what they supervise.
      supervised: this.authService.hasRole('admin') ? undefined : true,
      limit: 50,
    }).subscribe({
      next: (res) => { this.projects = res.projects; this.loading = false; },
      error: (err) => {
        this.error = err?.error?.detail || 'Could not load projects. Please try again later.';
        this.loading = false;
      },
    });
  }

  review(project: Project, approved: boolean): void {
    this.busy[project.id] = true;
    this.error = '';
    this.api.reviewProject(project.id, approved, this.notes[project.id]).subscribe({
      next: () => {
        this.busy[project.id] = false;
        this.projects = this.projects.filter(p => p.id !== project.id);
      },
      error: (err) => {
        this.busy[project.id] = false;
        this.error = err?.error?.detail || 'Could not save your decision. Please try again later.';
      },
    });
  }
}
