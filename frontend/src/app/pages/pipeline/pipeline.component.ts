import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { PipelineStage } from '../../models/interfaces';

@Component({
  selector: 'app-pipeline',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">{{ 'PIPELINE.TITLE' | translate }}</h1>
        <p class="page-subtitle">{{ 'PIPELINE.SUBTITLE' | translate }}</p>
      </div>

      <div class="pipeline-board" *ngIf="stages.length">
        <div class="pipeline-column" *ngFor="let stage of stages">
          <div class="column-header">
            <h3>{{ 'PIPELINE.STAGES.' + stage.stage | translate }}</h3>
            <span class="column-count">{{ stage.count }}</span>
          </div>
          <div class="column-body">
            <div class="pipeline-card" *ngFor="let project of stage.projects">
              <a [routerLink]="['/projects', project.id]" class="pipeline-title">{{ project.title }}</a>
              <div class="pipeline-meta">
                <span class="badge badge-primary" style="font-size:0.7rem;">{{ 'SECTORS.' + project.sector | translate }}</span>
                <span class="badge" [ngClass]="project.readiness === 'pilot_ready' ? 'badge-success' : 'badge-warning'"
                      style="font-size:0.7rem;">
                  {{ 'READINESS.' + project.readiness | translate }}
                </span>
              </div>
              <button class="btn btn-secondary btn-sm advance-btn"
                      *ngIf="canAdvance(stage.stage)"
                      (click)="advance(project.id)">
                {{ 'PIPELINE.ADVANCE' | translate }} →
              </button>
            </div>
            <div class="empty-column" *ngIf="!stage.projects.length">
              —
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pipeline-board {
      display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 1rem;
      min-height: 500px;
    }
    .pipeline-column {
      min-width: 260px; flex: 1;
      background: var(--bg-card); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg); overflow: hidden;
    }
    .column-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.25rem;
      background: rgba(99, 102, 241, 0.08);
      border-bottom: 1px solid var(--border-subtle);
    }
    .column-header h3 { font-size: 0.95rem; font-weight: 700; color: var(--accent-tertiary); }
    .column-count {
      background: var(--accent-primary); color: white;
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700;
    }
    .column-body { padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .pipeline-card {
      background: rgba(15, 15, 40, 0.6); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm); padding: 0.75rem;
      transition: border-color 0.2s;
    }
    .pipeline-card:hover { border-color: var(--border-hover); }
    .pipeline-title {
      font-weight: 600; color: var(--text-primary); text-decoration: none;
      font-size: 0.9rem; display: block; margin-bottom: 0.4rem;
    }
    .pipeline-title:hover { color: var(--accent-tertiary); }
    .pipeline-meta { display: flex; gap: 0.3rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
    .advance-btn { width: 100%; margin-top: 0.3rem; font-size: 0.8rem; }
    .empty-column { text-align: center; color: var(--text-muted); padding: 2rem 0; }
  `],
})
export class PipelineComponent implements OnInit {
  stages: PipelineStage[] = [];

  constructor(private api: ApiService, public authService: AuthService) {}

  ngOnInit(): void {
    this.loadPipeline();
  }

  loadPipeline(): void {
    this.api.getPipelineStages().subscribe({
      next: (res) => (this.stages = res.stages),
    });
  }

  canAdvance(stage: string): boolean {
    return stage !== 'marketed' && this.authService.hasRole('admin', 'evaluator');
  }

  advance(projectId: number): void {
    this.api.advanceProject(projectId).subscribe({
      next: () => this.loadPipeline(),
    });
  }
}
