import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { PipelineStage } from '../../models/interfaces';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-pipeline',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, RevealDirective],
  template: `
    <div class="pipeline-page">
      <div class="mesh" aria-hidden="true" style="opacity: 0.2;"><span></span></div>
      <div class="grain"></div>

      <div class="container-fluid" style="padding: 0 40px;">
        <div class="page-header">
          <div appReveal><span class="kicker">Operational Dashboard</span></div>
          <div appReveal [delay]="80" style="margin-top: 18px;">
            <h1 class="h-section">Innovation <em class="serif-italic" style="color: var(--c-blue);">Pipeline</em>.</h1>
            <p class="lead">Manage and monitor the progression of projects through the ecosystem lifecycle.</p>
          </div>
        </div>

        <div class="pipeline-board" *ngIf="stages.length" appReveal [delay]="160">
          <div class="pipeline-column glass" *ngFor="let stage of stages; let i = index">
            <div class="column-header">
              <div class="title-wrap">
                <span class="dot"></span>
                <h3>{{ 'PIPELINE.STAGES.' + stage.stage | translate }}</h3>
              </div>
              <span class="column-count">{{ stage.count }}</span>
            </div>
            
            <div class="column-body">
              <div class="pipeline-card" *ngFor="let project of stage.projects">
                <a [routerLink]="['/projects', project.id]" class="card-title">{{ project.title }}</a>
                <div class="card-meta">
                  <span class="sector">{{ project.sector }}</span>
                  <span class="readiness" [ngClass]="project.readiness">
                    {{ project.readiness?.replace('_', ' ') | titlecase }}
                  </span>
                </div>
                
                <button class="advance-btn" *ngIf="canAdvance(stage.stage)" (click)="advance(project.id)">
                  Advance Stage →
                </button>
              </div>
              
              <div class="empty-column" *ngIf="!stage.projects.length">
                <div class="empty-icon">📂</div>
                <p>No projects</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pipeline-page { position: relative; padding: 60px 0 100px; min-height: 100vh; overflow: hidden; }
    
    .pipeline-board { 
      display: flex; gap: 20px; overflow-x: auto; padding: 20px 0 40px; 
      scrollbar-width: thin; scrollbar-color: var(--c-blue) transparent;
    }
    .pipeline-board::-webkit-scrollbar { height: 6px; }
    .pipeline-board::-webkit-scrollbar-thumb { background: var(--c-line-soft); border-radius: 99px; }

    .pipeline-column {
      min-width: 320px; flex: 1; border-radius: 24px; border: 1px solid var(--c-line-soft);
      display: flex; flex-direction: column; max-height: 80vh;
    }
    .glass { background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(20px); }

    .column-header { 
      padding: 24px; border-bottom: 1px solid var(--c-line-soft);
      display: flex; align-items: center; justify-content: space-between;
    }
    .title-wrap { display: flex; align-items: center; gap: 10px; }
    .title-wrap .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c-blue); box-shadow: 0 0 8px var(--c-blue); }
    .column-header h3 { font-family: var(--serif); font-size: 16px; font-weight: 700; color: var(--c-ink); text-transform: capitalize; }
    .column-count { font-size: 11px; font-weight: 800; color: var(--c-blue); background: rgba(30,107,255,0.1); padding: 4px 10px; border-radius: 99px; }

    .column-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
    
    .pipeline-card { 
      background: white; border: 1px solid var(--c-line-soft); border-radius: 16px; padding: 20px;
      transition: all 240ms var(--ease);
    }
    .pipeline-card:hover { transform: translateY(-3px); border-color: var(--c-blue); box-shadow: 0 10px 25px -10px rgba(11,27,61,0.15); }
    
    .card-title { font-size: 14px; font-weight: 700; color: var(--c-ink); text-decoration: none; display: block; margin-bottom: 12px; line-height: 1.4; }
    .card-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .card-meta span { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 99px; text-transform: uppercase; }
    .sector { background: var(--c-bg-warm); color: var(--c-text-mute); }
    .readiness.concept { background: #fff7ed; color: #c2410c; }
    .readiness.prototype { background: #f0f9ff; color: #0369a1; }
    .readiness.pilot_ready { background: #f0fdf4; color: #15803d; }

    .advance-btn { 
      width: 100%; padding: 8px; border-radius: 10px; border: 1px solid var(--c-line-soft);
      background: var(--c-bg-warm); color: var(--c-blue); font-size: 12px; font-weight: 700;
      cursor: pointer; transition: all 200ms;
    }
    .advance-btn:hover { background: var(--c-blue); color: white; border-color: var(--c-blue); }

    .empty-column { text-align: center; padding: 40px 0; color: var(--c-text-faint); }
    .empty-icon { font-size: 24px; margin-bottom: 8px; }
    .empty-column p { font-size: 13px; font-weight: 500; }
  `]
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
