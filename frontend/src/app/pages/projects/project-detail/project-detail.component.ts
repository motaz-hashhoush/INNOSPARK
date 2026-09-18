import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project } from '../../../models/interfaces';
import { environment } from '../../../../environments/environment';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, RevealDirective],
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
              <h1 class="h-section" [attr.dir]="descLang === 'ar' && project.title_ar ? 'rtl' : null">
                {{ displayTitle }}
              </h1>
              <p class="pending-note" *ngIf="project.approval_status !== 'approved'">
                ⏳ This project is {{ project.approval_status }} — it is not published to the Virtual Booth yet.
              </p>
            </div>
            
            <div appReveal [delay]="140" class="actions">
              <a *ngIf="project.attachment_url" [href]="project.attachment_url" target="_blank" class="btn btn-primary">
                View Project Files
              </a>
              <button class="btn btn-outline" *ngIf="authService.isLoggedIn()">Save to Interests</button>
              <button class="btn btn-outline" *ngIf="canEdit" (click)="toggleEdit()">
                {{ editing ? 'Cancel edit' : 'Edit project' }}
              </button>
            </div>
          </div>
        </header>

        <div class="detail-grid">
          <main class="main-content" appReveal [delay]="200">
            <!-- Supervisors edit the projects they supervise; admins edit anything. -->
            <section class="glass section edit-section" *ngIf="editing && canEdit">
              <h2 class="h-card">Edit project</h2>
              <form class="edit-form" (ngSubmit)="saveEdit()">
                <label>Title<input type="text" [(ngModel)]="editDraft.title" name="title" required></label>
                <label>Summary<textarea [(ngModel)]="editDraft.summary" name="summary" rows="3"></textarea></label>
                <label>Problem<textarea [(ngModel)]="editDraft.problem" name="problem" rows="3" required></textarea></label>
                <label>Innovation &amp; value<textarea [(ngModel)]="editDraft.value_proposition" name="value_proposition" rows="3"></textarea></label>
                <label>Technical outputs<textarea [(ngModel)]="editDraft.technical_outputs" name="technical_outputs" rows="3"></textarea></label>
                <label>Development needs<textarea [(ngModel)]="editDraft.development_needs" name="development_needs" rows="2"></textarea></label>
                <div class="edit-row">
                  <label>Maturity
                    <select [(ngModel)]="editDraft.readiness_level" name="readiness_level">
                      <option value="concept">Concept</option>
                      <option value="prototype">Prototype</option>
                      <option value="pilot_ready">Pilot ready</option>
                    </select>
                  </label>
                  <label>Status
                    <select [(ngModel)]="editDraft.status" name="status">
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Under review</option>
                      <option value="incubation">Incubation</option>
                      <option value="partnership">Partnership</option>
                      <option value="marketed">Marketed</option>
                    </select>
                  </label>
                </div>
                <div class="media-actions">
                  <button type="submit" class="btn btn-primary btn-sm" [disabled]="savingEdit">
                    {{ savingEdit ? 'Saving…' : 'Save changes' }}
                  </button>
                  <span class="media-error" *ngIf="editError">{{ editError }}</span>
                </div>
              </form>
            </section>

            <!-- Virtual Booth: video + demo of the graduation project -->
            <section class="glass section media-section" *ngIf="project.video_url || project.demo_url || authService.hasRole('admin')">
              <div class="section-head">
                <h2 class="h-card">Video &amp; Demo</h2>
                <button class="link-btn" *ngIf="authService.hasRole('admin')" (click)="editingMedia = !editingMedia">
                  {{ editingMedia ? 'Cancel' : 'Edit media' }}
                </button>
              </div>

              <video class="booth-video" *ngIf="project.video_url" [src]="project.video_url" controls preload="metadata"></video>
              <a class="demo-link" *ngIf="project.demo_url" [href]="project.demo_url" target="_blank" rel="noopener">
                ▶ Open live demo
              </a>
              <p class="media-empty" *ngIf="!project.video_url && !project.demo_url && !editingMedia">
                No video or demo has been uploaded for this project yet.
              </p>

              <!-- Only the admin can publish booth media -->
              <div class="media-form" *ngIf="editingMedia && authService.hasRole('admin')">
                <label>Upload video (mp4 / webm)
                  <input type="file" accept="video/mp4,video/webm" (change)="uploadVideo($event)" [disabled]="uploadingVideo">
                </label>
                <p class="media-empty" *ngIf="uploadingVideo">Uploading video…</p>
                <label>Video URL<input type="url" [(ngModel)]="mediaDraft.video_url" name="videoUrl" placeholder="https://…/demo.mp4"></label>
                <label>Demo URL<input type="url" [(ngModel)]="mediaDraft.demo_url" name="demoUrl" placeholder="https://…"></label>
                <label>Cover image URL<input type="url" [(ngModel)]="mediaDraft.image_url" name="imageUrl" placeholder="https://…"></label>
                <div class="media-actions">
                  <button class="btn btn-primary btn-sm" (click)="saveMedia()" [disabled]="savingMedia">
                    {{ savingMedia ? 'Saving…' : 'Save media' }}
                  </button>
                  <span class="media-error" *ngIf="mediaError">{{ mediaError }}</span>
                </div>
              </div>
            </section>

            <section class="glass section">
              <div class="section-head">
                <h2 class="h-card">Overview</h2>
                <div class="lang-toggle" *ngIf="hasBilingualContent">
                  <button [class.active]="descLang === 'en'" (click)="descLang = 'en'">EN</button>
                  <button [class.active]="descLang === 'ar'" (click)="descLang = 'ar'">عربي</button>
                </div>
              </div>
              <p class="lead" style="font-size: 16px;" [attr.dir]="descLang === 'ar' && displayDescription === project.description_ar ? 'rtl' : null">
                {{ displayDescription }}
              </p>
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
    .section-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 8px; }
    .lang-toggle { display: flex; gap: 4px; background: rgba(30,107,255,0.06); border-radius: 99px; padding: 3px; }
    .lang-toggle button {
      border: none; background: transparent; cursor: pointer; font-size: 11px; font-weight: 700;
      padding: 4px 14px; border-radius: 99px; color: var(--c-text-mute); transition: all 200ms;
    }
    .lang-toggle button.active { background: var(--c-blue); color: white; }
    .section p { color: var(--c-text-mute); line-height: 1.8; font-size: 15px; }

    .pending-note { margin-top: 10px; font-size: 13px; font-weight: 600; color: #a16207; }

    .media-section { display: flex; flex-direction: column; gap: 16px; }
    .booth-video { width: 100%; border-radius: 20px; background: #0a1b3d; max-height: 460px; }
    .demo-link { font-size: 13px; font-weight: 700; color: var(--c-blue); text-decoration: none; }
    .media-empty { font-size: 13px; color: var(--c-text-faint); }
    .link-btn { border: none; background: transparent; cursor: pointer; font-size: 12px; font-weight: 700; color: var(--c-blue); }
    .media-form { display: flex; flex-direction: column; gap: 12px; padding-top: 8px; border-top: 1px solid var(--c-line-soft); }
    .media-form label { display: flex; flex-direction: column; gap: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--c-text-faint); }
    .media-form input { border: 1px solid var(--c-line-soft); border-radius: 12px; padding: 9px 14px; font-size: 13px; outline: none; background: white; color: var(--c-text); }
    .media-actions { display: flex; align-items: center; gap: 12px; }
    .btn-sm { font-size: 12px; padding: 8px 16px; }
    .media-error { font-size: 12px; font-weight: 600; color: #b91c1c; }

    .edit-form { display: flex; flex-direction: column; gap: 12px; }
    .edit-form label { display: flex; flex-direction: column; gap: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--c-text-faint); }
    .edit-form input, .edit-form textarea, .edit-form select {
      border: 1px solid var(--c-line-soft); border-radius: 12px; padding: 9px 14px; font-size: 13px;
      outline: none; background: white; color: var(--c-text); font-family: inherit; text-transform: none; letter-spacing: 0;
    }
    .edit-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 600px) { .edit-row { grid-template-columns: 1fr; } }
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
  descLang: 'en' | 'ar' = 'en';

  // Virtual Booth media editing — admin only
  editingMedia = false;
  savingMedia = false;
  mediaError = '';
  mediaDraft: { video_url?: string; demo_url?: string; image_url?: string } = {};
  uploadingVideo = false;

  // Project editing — supervisor of this project, or admin
  editing = false;
  savingEdit = false;
  editError = '';
  editDraft: Partial<Project> = {};

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    public authService: AuthService,
    private translate: TranslateService,
  ) { }

  ngOnInit(): void {
    this.descLang = this.translate.currentLang === 'ar' ? 'ar' : 'en';
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getProject(id).subscribe({
      next: (p) => {
        this.project = p;
        this.teamMembers = this.parseTeamMembers(p.team_members);
        this.mediaDraft = { video_url: p.video_url, demo_url: p.demo_url, image_url: p.image_url };
      },
    });
  }

  /** Publish the booth video / demo / cover image. Rejected by the API for non-admins. */
  saveMedia(): void {
    if (!this.project) return;
    this.savingMedia = true;
    this.mediaError = '';
    this.api.updateProjectMedia(this.project.id, this.mediaDraft).subscribe({
      next: (p) => {
        this.project = p;
        this.savingMedia = false;
        this.editingMedia = false;
      },
      error: (err) => {
        this.savingMedia = false;
        this.mediaError = err?.error?.detail || 'Could not save the media. Please try again.';
      },
    });
  }

  /** Upload a booth video file; the API stores it and sets the project's video_url. */
  uploadVideo(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.project) return;
    this.uploadingVideo = true;
    this.mediaError = '';
    this.api.uploadProjectFiles(this.project.id, [file]).subscribe({
      next: () => this.api.getProject(this.project!.id).subscribe(p => {
        this.project = p;
        this.mediaDraft.video_url = p.video_url;
        this.uploadingVideo = false;
      }),
      error: (err) => {
        this.uploadingVideo = false;
        this.mediaError = err?.error?.detail || 'Could not upload the video. Please try again.';
      },
    });
  }

  /** Supervisors may edit the projects they supervise; admins may edit any project. */
  get canEdit(): boolean {
    if (!this.project) return false;
    if (this.authService.hasRole('admin')) return true;
    return this.authService.hasRole('supervisor') && this.project.supervisor_id === this.authService.currentUser?.id;
  }

  toggleEdit(): void {
    this.editing = !this.editing;
    this.editError = '';
    if (this.editing && this.project) {
      const { title, summary, problem, value_proposition, technical_outputs, development_needs, readiness_level, status } = this.project;
      this.editDraft = { title, summary, problem, value_proposition, technical_outputs, development_needs, readiness_level, status };
    }
  }

  saveEdit(): void {
    if (!this.project) return;
    this.savingEdit = true;
    this.editError = '';
    this.api.updateProject(this.project.id, this.editDraft).subscribe({
      next: (p) => {
        this.project = p;
        this.teamMembers = this.parseTeamMembers(p.team_members);
        this.savingEdit = false;
        this.editing = false;
      },
      error: (err) => {
        this.savingEdit = false;
        this.editError = err?.error?.detail || 'Could not save the project. Please try again.';
      },
    });
  }

  /** True once the LLM has produced both language versions of the title or the description. */
  get hasBilingualContent(): boolean {
    if (!this.project) return false;
    const { title_en, title_ar, description_en, description_ar } = this.project;
    return Boolean((title_en && title_ar) || (description_en && description_ar));
  }

  /** Title in the selected language, falling back to the stored original. */
  get displayTitle(): string {
    if (!this.project) return '';
    const preferred = this.descLang === 'ar' ? this.project.title_ar : this.project.title_en;
    return preferred || this.project.title;
  }

  /** Description in the selected language, falling back to the other, then raw fields. */
  get displayDescription(): string {
    if (!this.project) return '';
    const preferred = this.descLang === 'ar' ? this.project.description_ar : this.project.description_en;
    const fallback = this.descLang === 'ar' ? this.project.description_en : this.project.description_ar;
    return preferred || fallback || this.project.summary || this.project.problem;
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
