import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project } from '../../../models/interfaces';
import { environment } from '../../../../environments/environment';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, RevealDirective],
  template: `
    <div class="booth-detail-page" *ngIf="project">
      <div class="mesh" aria-hidden="true" style="opacity: 0.15;"><span></span></div>
      <div class="grain"></div>

      <div class="container">
        <header class="detail-header">
          <div appReveal><a routerLink="/projects" class="back-link">← Virtual Booth</a></div>
          
          <div class="header-main" style="margin-top: 32px;">
            <div appReveal [delay]="80">
              <div class="badges">
                <span class="pill">{{ project.sector | titlecase }}</span>
                <span class="pill" [ngClass]="project.readiness_level">
                  {{ project.readiness_level?.replace('_', ' ') | titlecase }}
                </span>
              </div>
              <h1 class="h-section">{{ project.title }}</h1>
            </div>
            
            <div appReveal [delay]="140" class="actions">
              <a *ngIf="project.attachment_url" [href]="project.attachment_url" target="_blank" class="btn btn-primary">
                View Project Files
              </a>
              <button class="btn btn-outline" *ngIf="authService.isLoggedIn()">Save to Interests</button>
            </div>
          </div>
        </header>

        <div class="detail-grid">
          <main class="main-content" appReveal [delay]="200">
            <section class="glass section">
              <h2 class="h-card">Overview</h2>
              <p class="lead" style="font-size: 16px;">{{ project.summary || project.problem }}</p>
            </section>

            <section class="glass section" *ngIf="project.value_proposition">
              <h2 class="h-card">Innovation & Value</h2>
              <p>{{ project.value_proposition }}</p>
            </section>

            <section class="glass section" *ngIf="project.technical_outputs">
              <h2 class="h-card">Technical Execution</h2>
              <p>{{ project.technical_outputs }}</p>
            </section>
          </main>

          <aside class="sidebar" appReveal [delay]="260">
            <div class="glass side-card">
              <h3 class="h-card" style="font-size: 14px;">Innovation Team</h3>
              <div class="team-list">
                <div class="team-member" *ngFor="let m of teamMembers">
                  <div class="avatar">{{ m.initial }}</div>
                  <div class="info">
                    <span class="name">{{ m.name }}</span>
                    <span class="role">{{ m.role }}</span>
                  </div>
                </div>
                <div *ngIf="!teamMembers.length" class="empty-state">Faculty of Engineering</div>
              </div>
            </div>

            <div class="glass side-card" *ngIf="project.files?.length">
              <h3 class="h-card" style="font-size: 14px;">Documents</h3>
              <div class="doc-list">
                <a *ngFor="let f of project.files" [href]="getFileUrl(f.id)" target="_blank" class="doc-item">
                  <span class="icon">📄</span>
                  <span class="fname">{{ f.file_name }}</span>
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>

    <div class="loading-state" *ngIf="!project">
      <div class="spinner"></div>
    </div>
  `,
  styles: [`
    .booth-detail-page { position: relative; padding: 40px 0 100px; min-height: 100vh; overflow: hidden; }
    .detail-header { margin-bottom: 48px; }
    .back-link { font-size: 13px; font-weight: 700; color: var(--c-blue); text-decoration: none; }
    .header-main { display: flex; justify-content: space-between; align-items: flex-end; gap: 40px; }
    @media (max-width: 880px) { .header-main { flex-direction: column; align-items: flex-start; } }

    .badges { display: flex; gap: 8px; margin-bottom: 16px; }
    .pill { font-size: 10px; font-weight: 700; background: rgba(30,107,255,0.1); color: var(--c-blue); padding: 4px 12px; border-radius: 99px; text-transform: uppercase; }
    .pill.concept { background: #fff7ed; color: #c2410c; }
    .pill.prototype { background: #f0f9ff; color: #0369a1; }
    .pill.pilot_ready { background: #f0fdf4; color: #15803d; }

    .detail-grid { display: grid; grid-template-columns: 1fr 320px; gap: 32px; }
    @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }

    .section { padding: 40px; border-radius: 32px; border: 1px solid var(--c-line-soft); margin-bottom: 24px; }
    .section p { color: var(--c-text-mute); line-height: 1.8; font-size: 15px; }
    .glass { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(20px); }

    .side-card { padding: 24px; border-radius: 24px; border: 1px solid var(--c-line-soft); margin-bottom: 24px; }
    .team-list { margin-top: 16px; display: flex; flex-direction: column; gap: 16px; }
    .team-member { display: flex; align-items: center; gap: 12px; }
    .avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--c-blue); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
    .info { display: flex; flex-direction: column; }
    .name { font-size: 13px; font-weight: 700; color: var(--c-ink); }
    .role { font-size: 11px; color: var(--c-text-faint); }

    .doc-list { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
    .doc-item { display: flex; align-items: center; gap: 10px; text-decoration: none; padding: 8px 12px; border-radius: 12px; transition: all 200ms; }
    .doc-item:hover { background: rgba(30,107,255,0.05); }
    .doc-item .fname { font-size: 12px; font-weight: 600; color: var(--c-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .loading-state { height: 60vh; display: flex; align-items: center; justify-content: center; }
  `]
})
export class ProjectDetailComponent implements OnInit {
  project: Project | null = null;
  teamMembers: any[] = [];

  constructor(private route: ActivatedRoute, private api: ApiService, public authService: AuthService) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getProject(id).subscribe({
      next: (p) => {
        this.project = p;
        this.teamMembers = this.parseTeamMembers(p.team_members);
      },
    });
  }

  parseTeamMembers(raw: any): any[] {
    if (!raw) return [];
    let arr = raw;
    if (typeof raw === 'string') {
      try { arr = JSON.parse(raw); } catch { return []; }
    }
    if (!Array.isArray(arr)) return [];
    return arr.map(m => {
      const name = typeof m === 'string' ? m : (m?.name || '');
      const role = typeof m === 'string' ? '' : (m?.role || '');
      return { name, role, initial: name ? name.charAt(0).toUpperCase() : '?' };
    }).filter(m => m.name !== '');
  }

  getFileUrl(fileId: number): string {
    return `${environment.apiUrl.replace('/api', '')}/uploads/${this.project?.id}`;
  }
}
