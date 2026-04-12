import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project } from '../../../models/interfaces';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="page-container" *ngIf="project">
      <a routerLink="/projects" class="back-link">← {{ 'COMMON.BACK' | translate }}</a>

      <div class="booth fade-in-up">
        <!-- Header -->
        <div class="booth-header">
          <div>
            <div class="badges">
              <span class="badge badge-primary">{{ 'SECTORS.' + project.sector | translate }}</span>
              <span class="badge" [ngClass]="getReadinessBadge(project.readiness_level)">
                {{ 'READINESS.' + project.readiness_level | translate }}
              </span>
              <span class="badge badge-warning">{{ project.status }}</span>
            </div>
            <h1 class="booth-title">{{ project.title_en || project.title_ar }}</h1>
            <p class="booth-title-alt" *ngIf="project.title_ar && project.title_en">{{ project.title_ar }}</p>
          </div>
        </div>

        <!-- Video -->
        <div class="booth-video" *ngIf="project.video_url">
          <iframe [src]="project.video_url" allowfullscreen></iframe>
        </div>

        <!-- Content Grid -->
        <div class="booth-grid">
          <div class="booth-main">
            <!-- Summary -->
            <div class="section" *ngIf="project.summary_en || project.summary_ar">
              <h3>Summary</h3>
              <p *ngIf="project.summary_en">{{ project.summary_en }}</p>
              <p *ngIf="project.summary_ar" class="text-ar">{{ project.summary_ar }}</p>
            </div>

            <!-- Problem -->
            <div class="section">
              <h3>{{ 'PROJECTS.PROBLEM' | translate }}</h3>
              <p>{{ project.problem }}</p>
            </div>

            <!-- Value -->
            <div class="section" *ngIf="project.value_proposition">
              <h3>{{ 'PROJECTS.VALUE' | translate }}</h3>
              <p>{{ project.value_proposition }}</p>
            </div>

            <!-- Tech Outputs -->
            <div class="section" *ngIf="project.technical_outputs">
              <h3>{{ 'PROJECTS.TECH_OUTPUTS' | translate }}</h3>
              <p>{{ project.technical_outputs }}</p>
            </div>

            <!-- Dev Needs -->
            <div class="section" *ngIf="project.development_needs">
              <h3>{{ 'PROJECTS.DEV_NEEDS' | translate }}</h3>
              <p>{{ project.development_needs }}</p>
            </div>
          </div>

          <div class="booth-sidebar">
            <!-- Team -->
            <div class="sidebar-card">
              <h3>{{ 'PROJECTS.TEAM' | translate }}</h3>
              <div class="team-list">
                <div class="team-member" *ngFor="let m of project.team_members">
                  <div class="member-avatar">{{ m.name ? m.name.charAt(0) : '' }}</div>
                  <div>
                    <div class="member-name">{{ m.name }}</div>
                    <div class="member-role">{{ m.role }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Documents -->
            <div class="sidebar-card" *ngIf="project.files?.length">
              <h3>{{ 'PROJECTS.DOCUMENTS' | translate }}</h3>
              <div class="file-list">
                <a *ngFor="let f of project.files" [href]="getFileUrl(f.id)" target="_blank" class="file-item">
                  <span class="file-icon">📄</span>
                  <span>{{ f.file_name }}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="loading-state loading-pulse" *ngIf="!project">
      <p>{{ 'COMMON.LOADING' | translate }}</p>
    </div>
  `,
  styles: [`
    .back-link { color: var(--accent-tertiary); text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    .back-link:hover { text-decoration: underline; }
    .booth {
      background: var(--bg-card); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl); overflow: hidden;
    }
    .booth-header { padding: 2rem 2rem 1rem; }
    .badges { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
    .booth-title {
      font-size: 2rem; font-weight: 800;
      background: var(--accent-gradient);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .booth-title-alt { color: var(--text-secondary); font-size: 1.2rem; margin-top: 0.3rem; direction: rtl; }
    .booth-video { padding: 0 2rem; }
    .booth-video iframe {
      width: 100%; height: 400px; border: none; border-radius: var(--radius-md);
      background: var(--bg-secondary);
    }
    .booth-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; padding: 2rem; }
    .section { margin-bottom: 1.5rem; }
    .section h3 { font-size: 1.1rem; font-weight: 700; color: var(--accent-tertiary); margin-bottom: 0.5rem; }
    .section p { color: var(--text-secondary); line-height: 1.7; }
    .text-ar { direction: rtl; text-align: right; }
    .sidebar-card {
      background: rgba(15, 15, 40, 0.5); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1rem;
    }
    .sidebar-card h3 { font-size: 1rem; font-weight: 700; color: var(--accent-tertiary); margin-bottom: 0.75rem; }
    .team-list { display: flex; flex-direction: column; gap: 0.6rem; }
    .team-member { display: flex; align-items: center; gap: 0.6rem; }
    .member-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: var(--accent-gradient); display: flex; align-items: center; justify-content: center;
      font-weight: 700; color: white; font-size: 0.9rem;
    }
    .member-name { font-weight: 600; color: var(--text-primary); font-size: 0.9rem; }
    .member-role { color: var(--text-muted); font-size: 0.8rem; }
    .file-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .file-item {
      display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary);
      text-decoration: none; padding: 0.4rem 0.6rem; border-radius: var(--radius-sm);
      transition: background 0.2s; font-size: 0.9rem;
    }
    .file-item:hover { background: rgba(99, 102, 241, 0.1); }
    .loading-state { text-align: center; padding: 4rem; color: var(--text-muted); }
    @media (max-width: 768px) { .booth-grid { grid-template-columns: 1fr; } }
  `],
})
export class ProjectDetailComponent implements OnInit {
  project: Project | null = null;

  constructor(private route: ActivatedRoute, private api: ApiService, public authService: AuthService) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getProject(id).subscribe({
      next: (p) => (this.project = p),
    });
  }

  getReadinessBadge(level: string): string {
    const map: any = { concept: 'badge-warning', prototype: 'badge-primary', pilot_ready: 'badge-success' };
    return map[level] || 'badge-primary';
  }

  getFileUrl(fileId: number): string {
    return `${environment.apiUrl.replace('/api', '')}/uploads/${this.project?.id}`;
  }
}
