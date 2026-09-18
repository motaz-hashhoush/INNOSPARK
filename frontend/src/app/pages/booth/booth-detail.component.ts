import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Project, ProjectFile } from '../../models/interfaces';
import { RevealDirective } from '../../shared/directives/reveal.directive';

/**
 * One project's booth: problem → solution → value, media, team, supervisor,
 * documents and a collaboration form. Admin / the project's supervisor also get
 * a "Manage booth" panel here; the underlying data is the same Project row that
 * Student Projects shows.
 */
@Component({
  selector: 'app-booth-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, RevealDirective],
  template: `
    <div class="booth-page" *ngIf="project as p">
      <div class="mesh" aria-hidden="true" style="opacity: 0.15;"><span></span></div>
      <div class="grain"></div>

      <div class="container">
        <div appReveal class="topbar">
          <a routerLink="/booth" class="back-link">← Virtual Booth</a>
          <span class="preview-note" *ngIf="!p.booth_published">Preview — not published yet</span>
        </div>

        <!-- Hero -->
        <section class="hero glass" appReveal [delay]="60">
          <div class="hero-cover" [style.backgroundImage]="p.image_url ? 'url(' + p.image_url + ')' : sectorGradient(p.sector)"></div>
          <div class="hero-body">
            <div class="badges">
              <span class="pill">{{ p.sector | titlecase }}</span>
              <span class="pill" [ngClass]="p.readiness_level">{{ p.readiness_level?.replace('_', ' ') | titlecase }}</span>
              <span class="pill stage">{{ p.status?.replace('_', ' ') | titlecase }}</span>
            </div>
            <h1 class="h-section" [attr.dir]="isArabic && p.title_ar ? 'rtl' : null">{{ displayTitle }}</h1>
            <p class="lead" *ngIf="p.summary">{{ p.summary | slice:0:220 }}{{ p.summary.length > 220 ? '…' : '' }}</p>
            <div class="hero-actions">
              <a href="#contact" class="btn btn-primary" (click)="showContact = true">Request collaboration</a>
              <a *ngIf="p.demo_url" [href]="p.demo_url" target="_blank" rel="noopener" class="btn btn-outline">▶ Live demo</a>
              <a *ngIf="p.video_url" href="#media" class="btn btn-ghost">Watch video</a>
            </div>
          </div>
        </section>

        <div class="detail-grid">
          <main>
            <!-- Manage panel: admin or the project's supervisor -->
            <section class="glass section manage" *ngIf="canManage" appReveal [delay]="100">
              <div class="section-head">
                <h2 class="h-card">Manage booth</h2>
                <button class="btn btn-sm" [class.btn-primary]="!p.booth_published" [class.btn-outline]="p.booth_published"
                  (click)="togglePublish()" [disabled]="busy">
                  {{ busy ? 'Saving…' : (p.booth_published ? 'Unpublish' : 'Publish to Booth') }}
                </button>
              </div>
              <div class="manage-grid">
                <label class="upload">
                  <input type="file" multiple (change)="uploadFiles($event)" [disabled]="busy">
                  <span>📁 Add images, video or documents</span>
                </label>
                <label>Video URL<input type="url" [(ngModel)]="mediaDraft.video_url" name="video_url" placeholder="https://…/demo.mp4"></label>
                <label>Demo URL<input type="url" [(ngModel)]="mediaDraft.demo_url" name="demo_url" placeholder="https://…"></label>
                <label>Cover image URL<input type="url" [(ngModel)]="mediaDraft.image_url" name="image_url" placeholder="Pick a gallery image below or paste a URL"></label>
                <div class="manage-actions">
                  <button class="btn btn-primary btn-sm" (click)="saveMedia()" [disabled]="busy">Save media</button>
                  <a [routerLink]="['/projects', p.id]" class="btn btn-ghost btn-sm">Edit project details →</a>
                  <span class="error" *ngIf="manageError">{{ manageError }}</span>
                </div>
              </div>
            </section>

            <section class="glass section" appReveal [delay]="140">
              <div class="section-head">
                <h2 class="h-card">The problem</h2>
                <div class="lang-toggle" *ngIf="p.description_en && p.description_ar">
                  <button [class.active]="!isArabic" (click)="lang = 'en'">EN</button>
                  <button [class.active]="isArabic" (click)="lang = 'ar'">عربي</button>
                </div>
              </div>
              <p>{{ p.problem }}</p>
            </section>

            <section class="glass section" appReveal [delay]="180">
              <h2 class="h-card">Proposed solution</h2>
              <p [attr.dir]="isArabic && solutionText === p.description_ar ? 'rtl' : null">{{ solutionText }}</p>
              <p class="muted" *ngIf="p.technical_outputs && solutionText !== p.technical_outputs"><strong>Technical outputs.</strong> {{ p.technical_outputs }}</p>
            </section>

            <section class="glass section" *ngIf="p.value_proposition" appReveal [delay]="220">
              <h2 class="h-card">Value &amp; innovation</h2>
              <p>{{ p.value_proposition }}</p>
            </section>

            <section class="glass section" id="media" *ngIf="p.video_url || gallery.length || p.demo_url" appReveal [delay]="260">
              <h2 class="h-card">Media</h2>
              <video class="booth-video" *ngIf="p.video_url" [src]="p.video_url" controls preload="metadata"></video>
              <div class="gallery" *ngIf="gallery.length">
                <figure *ngFor="let f of gallery">
                  <a [href]="f.url" target="_blank" rel="noopener"><img [src]="f.url" [alt]="f.file_name" loading="lazy"></a>
                  <figcaption *ngIf="canManage">
                    <button class="link-btn" (click)="setCover(f)" [disabled]="p.image_url === f.url">{{ p.image_url === f.url ? 'Cover' : 'Set as cover' }}</button>
                    <button class="link-btn danger" (click)="deleteFile(f)">Remove</button>
                  </figcaption>
                </figure>
              </div>
              <a *ngIf="p.demo_url" [href]="p.demo_url" target="_blank" rel="noopener" class="demo-link">▶ Open the live demo</a>
            </section>

            <!-- Contact / collaboration -->
            <section class="glass section contact" id="contact" appReveal [delay]="300">
              <h2 class="h-card">Collaborate with this team</h2>
              <p class="muted" *ngIf="!p.booth_published">The contact form opens once the booth is published.</p>
              <ng-container *ngIf="p.booth_published">
                <p class="muted" *ngIf="!contactSent">Pilot it, license it, fund it, or hire the team — tell us what you have in mind. The InnoPark team and the supervisor will get back to you.</p>
                <form *ngIf="!contactSent" class="contact-form" (ngSubmit)="sendContact()">
                  <div class="row">
                    <label>Your name *<input type="text" [(ngModel)]="contact.name" name="name" required minlength="2"></label>
                    <label>Email *<input type="email" [(ngModel)]="contact.email" name="email" required></label>
                  </div>
                  <label>Organization<input type="text" [(ngModel)]="contact.organization" name="organization"></label>
                  <label>Message *<textarea [(ngModel)]="contact.message" name="message" rows="4" required minlength="10" placeholder="What would you like to do with this project?"></textarea></label>
                  <div class="manage-actions">
                    <button type="submit" class="btn btn-primary" [disabled]="busy || !contact.name || !contact.email || contact.message.length < 10">{{ busy ? 'Sending…' : 'Send request' }}</button>
                    <span class="error" *ngIf="contactError">{{ contactError }}</span>
                  </div>
                </form>
                <p class="success" *ngIf="contactSent">✅ Sent. The InnoPark team ({{ contactEmail }}) and the supervisor have been notified.</p>
              </ng-container>
            </section>
          </main>

          <aside>
            <div class="glass side-card" *ngIf="p.supervisor" appReveal [delay]="120">
              <h3 class="h-card side-title">Supervisor</h3>
              <div class="person">
                <div class="avatar sup">{{ p.supervisor.full_name.charAt(0) | uppercase }}</div>
                <div>
                  <div class="name">{{ p.supervisor.full_name }}</div>
                  <div class="role">Academic supervisor</div>
                </div>
              </div>
            </div>

            <div class="glass side-card" appReveal [delay]="180">
              <h3 class="h-card side-title">Team</h3>
              <div class="person" *ngFor="let m of team">
                <div class="avatar">{{ m.initial }}</div>
                <div>
                  <div class="name">{{ m.name }}</div>
                  <div class="role">{{ m.role || 'Team member' }}</div>
                </div>
              </div>
              <p class="muted" *ngIf="!team.length">Team details coming soon.</p>
            </div>

            <div class="glass side-card" *ngIf="documents.length || p.attachment_url" appReveal [delay]="240">
              <h3 class="h-card side-title">Documents</h3>
              <a *ngIf="p.attachment_url" [href]="p.attachment_url" target="_blank" rel="noopener" class="doc-item"><span>🔗</span><span class="fname">Repository record</span></a>
              <div class="doc-item" *ngFor="let f of documents">
                <span>{{ f.file_type === 'video' ? '🎬' : f.file_type === 'presentation' ? '📊' : '📄' }}</span>
                <a [href]="f.url" target="_blank" rel="noopener" class="fname">{{ f.file_name }}</a>
                <button *ngIf="canManage" class="link-btn danger" (click)="deleteFile(f)" title="Remove">✕</button>
              </div>
            </div>

            <div class="glass side-card facts" appReveal [delay]="300">
              <h3 class="h-card side-title">At a glance</h3>
              <dl>
                <dt>Readiness</dt><dd>{{ p.readiness_level?.replace('_', ' ') | titlecase }}</dd>
                <dt>Pipeline stage</dt><dd>{{ p.status?.replace('_', ' ') | titlecase }}</dd>
                <dt>Sector</dt><dd>{{ p.sector | titlecase }}</dd>
                <dt *ngIf="p.booth_published_at">In the booth since</dt><dd *ngIf="p.booth_published_at">{{ p.booth_published_at | date:'mediumDate' }}</dd>
                <dt *ngIf="p.development_needs">Looking for</dt><dd *ngIf="p.development_needs">{{ p.development_needs }}</dd>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </div>

    <div class="loading-state" *ngIf="!project && !notFound"><div class="spinner"></div></div>
    <div class="loading-state" *ngIf="notFound"><p>This booth is not available. <a routerLink="/booth">Back to the Virtual Booth</a></p></div>
  `,
  styles: [`
    .booth-page { position: relative; padding: 40px 0 100px; min-height: 100vh; overflow: hidden; }
    .topbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 24px; }
    .back-link { font-size: 13px; font-weight: 700; color: var(--c-blue); text-decoration: none; }
    .preview-note { font-size: 12px; font-weight: 700; color: #a16207; background: #fef3c7; padding: 6px 12px; border-radius: 99px; }

    .glass { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); border: 1px solid var(--c-line-soft); }

    .hero { display: grid; grid-template-columns: 1.1fr 1fr; border-radius: 32px; overflow: hidden; margin-bottom: 32px; }
    @media (max-width: 900px) { .hero { grid-template-columns: 1fr; } }
    .hero-cover { min-height: 340px; background-size: cover; background-position: center; }
    .hero-body { padding: 40px; display: flex; flex-direction: column; justify-content: center; gap: 16px; }
    .hero-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }

    .badges { display: flex; gap: 8px; flex-wrap: wrap; }
    .pill { font-size: 10px; font-weight: 700; background: rgba(30,107,255,0.1); color: var(--c-blue); padding: 4px 12px; border-radius: 99px; text-transform: uppercase; }
    .pill.concept { background: #fff7ed; color: #c2410c; }
    .pill.prototype { background: #f0f9ff; color: #0369a1; }
    .pill.pilot_ready { background: #f0fdf4; color: #15803d; }
    .pill.stage { background: rgba(11,27,61,0.06); color: var(--c-ink); }

    .detail-grid { display: grid; grid-template-columns: 1fr 320px; gap: 32px; }
    @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }

    .section { padding: 36px 40px; border-radius: 28px; margin-bottom: 24px; }
    @media (max-width: 600px) { .section { padding: 24px; } }
    .section-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 8px; }
    .section p { color: var(--c-text-mute); line-height: 1.8; font-size: 15px; white-space: pre-line; }
    .muted { font-size: 13px !important; color: var(--c-text-faint) !important; }
    .success { color: #15803d !important; font-weight: 600; }
    .error { font-size: 12px; font-weight: 600; color: #b91c1c; }

    .lang-toggle { display: flex; gap: 4px; background: rgba(30,107,255,0.06); border-radius: 99px; padding: 3px; }
    .lang-toggle button { border: none; background: transparent; cursor: pointer; font-size: 11px; font-weight: 700; padding: 4px 14px; border-radius: 99px; color: var(--c-text-mute); }
    .lang-toggle button.active { background: var(--c-blue); color: white; }

    .booth-video { width: 100%; border-radius: 20px; background: #0a1b3d; max-height: 460px; margin-top: 12px; }
    .gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px; }
    @media (max-width: 600px) { .gallery { grid-template-columns: repeat(2, 1fr); } }
    .gallery figure { margin: 0; }
    .gallery img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 14px; border: 1px solid var(--c-line-soft); display: block; }
    .gallery figcaption { display: flex; gap: 10px; margin-top: 6px; }
    .demo-link { display: inline-block; margin-top: 16px; font-size: 13px; font-weight: 700; color: var(--c-blue); text-decoration: none; }
    .link-btn { border: none; background: transparent; cursor: pointer; font-size: 12px; font-weight: 700; color: var(--c-blue); padding: 0; }
    .link-btn.danger { color: #b91c1c; }
    .link-btn:disabled { color: var(--c-text-faint); cursor: default; }

    .manage { border-color: rgba(30,107,255,0.3); }
    .manage-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; }
    @media (max-width: 600px) { .manage-grid { grid-template-columns: 1fr; } }
    .manage-grid label, .contact-form label { display: flex; flex-direction: column; gap: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--c-text-faint); }
    .manage-grid input, .contact-form input, .contact-form textarea { border: 1px solid var(--c-line-soft); border-radius: 12px; padding: 9px 14px; font-size: 13px; outline: none; background: white; color: var(--c-text); font-family: inherit; text-transform: none; letter-spacing: 0; }
    .manage-grid .upload { grid-column: span 2; position: relative; border: 2px dashed var(--c-line-soft); border-radius: 14px; padding: 18px; text-align: center; text-transform: none; letter-spacing: 0; font-weight: 500; color: var(--c-text-mute); cursor: pointer; }
    @media (max-width: 600px) { .manage-grid .upload { grid-column: span 1; } }
    .manage-grid .upload input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    .manage-actions { grid-column: 1 / -1; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 4px; }
    .btn-sm { font-size: 12px; padding: 8px 16px; }

    .contact-form { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
    .contact-form .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 600px) { .contact-form .row { grid-template-columns: 1fr; } }

    .side-card { padding: 24px; border-radius: 24px; margin-bottom: 24px; }
    .side-title { font-size: 14px; margin-bottom: 14px; }
    .person { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--c-blue); color: white; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
    .avatar.sup { background: var(--c-ink); }
    .name { font-size: 13px; font-weight: 700; color: var(--c-ink); }
    .role { font-size: 11px; color: var(--c-text-faint); }

    .doc-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 12px; text-decoration: none; }
    .doc-item:hover { background: rgba(30,107,255,0.05); }
    .doc-item .fname { flex: 1; font-size: 12px; font-weight: 600; color: var(--c-ink); text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .facts dl { display: grid; grid-template-columns: auto 1fr; gap: 8px 14px; margin: 0; }
    .facts dt { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--c-text-faint); }
    .facts dd { margin: 0; font-size: 13px; color: var(--c-ink); }

    .loading-state { height: 60vh; display: flex; align-items: center; justify-content: center; color: var(--c-text-mute); }
    .loading-state a { color: var(--c-blue); font-weight: 600; }
  `],
})
export class BoothDetailComponent implements OnInit {
  project: Project | null = null;
  notFound = false;
  team: { name: string; role: string; initial: string }[] = [];
  lang: 'en' | 'ar' = 'en';

  busy = false;
  manageError = '';
  mediaDraft: { video_url?: string; demo_url?: string; image_url?: string } = {};

  showContact = false;
  contact = { name: '', email: '', organization: '', message: '' };
  contactSent = false;
  contactEmail = '';
  contactError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    public authService: AuthService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.lang = this.translate.currentLang === 'ar' ? 'ar' : 'en';
    const me = this.authService.currentUser;
    if (me) { this.contact.name = me.full_name; this.contact.email = me.email; }
    this.route.paramMap.subscribe(params => this.load(Number(params.get('id'))));
  }

  private load(id: number): void {
    this.api.getProject(id).subscribe({
      next: p => {
        if (!p.booth_published && !this.canManageProject(p)) {
          // Not a booth (yet): send visitors to the database record if they may see it
          this.router.navigate(['/projects', p.id], { replaceUrl: true });
          return;
        }
        this.apply(p);
      },
      error: () => { this.notFound = true; },
    });
  }

  private apply(p: Project): void {
    this.project = p;
    this.team = this.parseTeam(p.team_members);
    this.mediaDraft = { video_url: p.video_url, demo_url: p.demo_url, image_url: p.image_url };
  }

  private canManageProject(p: Project): boolean {
    return this.authService.hasRole('admin') ||
      (this.authService.hasRole('supervisor') && p.supervisor_id === this.authService.currentUser?.id);
  }

  get canManage(): boolean { return !!this.project && this.canManageProject(this.project); }
  get isArabic(): boolean { return this.lang === 'ar'; }

  get displayTitle(): string {
    const p = this.project!;
    return (this.isArabic ? p.title_ar : p.title_en) || p.title;
  }

  /** "Proposed solution": the summary, else technical outputs, else the LLM description. */
  get solutionText(): string {
    const p = this.project!;
    return p.summary || p.technical_outputs || (this.isArabic ? p.description_ar : p.description_en) || p.description_en || p.description_ar || '—';
  }

  get gallery(): ProjectFile[] { return (this.project?.files || []).filter(f => f.file_type === 'image'); }
  get documents(): ProjectFile[] { return (this.project?.files || []).filter(f => f.file_type !== 'image'); }

  togglePublish(): void {
    if (!this.project) return;
    this.busy = true; this.manageError = '';
    this.api.publishBooth(this.project.id, !this.project.booth_published).subscribe({
      next: p => { this.apply(p); this.busy = false; },
      error: err => { this.busy = false; this.manageError = err?.error?.detail || 'Could not update the booth.'; },
    });
  }

  uploadFiles(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files || []);
    if (!files.length || !this.project) return;
    this.busy = true; this.manageError = '';
    this.api.uploadProjectFiles(this.project.id, files).subscribe({
      next: () => this.refresh(),
      error: err => { this.busy = false; this.manageError = err?.error?.detail || 'Upload failed.'; },
    });
  }

  saveMedia(): void {
    if (!this.project) return;
    this.busy = true; this.manageError = '';
    this.api.updateProjectMedia(this.project.id, this.mediaDraft).subscribe({
      next: p => { this.apply(p); this.busy = false; },
      error: err => { this.busy = false; this.manageError = err?.error?.detail || 'Could not save media.'; },
    });
  }

  setCover(f: ProjectFile): void {
    this.mediaDraft.image_url = f.url;
    this.saveMedia();
  }

  deleteFile(f: ProjectFile): void {
    if (!this.project || !confirm(`Remove "${f.file_name}" from this project?`)) return;
    this.busy = true; this.manageError = '';
    this.api.deleteProjectFile(this.project.id, f.id).subscribe({
      next: () => this.refresh(),
      error: err => { this.busy = false; this.manageError = err?.error?.detail || 'Could not remove the file.'; },
    });
  }

  private refresh(): void {
    this.api.getProject(this.project!.id).subscribe({
      next: p => { this.apply(p); this.busy = false; },
      error: () => { this.busy = false; },
    });
  }

  sendContact(): void {
    if (!this.project) return;
    this.busy = true; this.contactError = '';
    this.api.contactBooth(this.project.id, this.contact).subscribe({
      next: res => { this.busy = false; this.contactSent = true; this.contactEmail = res.contact_email; },
      error: err => { this.busy = false; this.contactError = err?.error?.detail || 'Could not send your request. Please try again.'; },
    });
  }

  parseTeam(raw: any): { name: string; role: string; initial: string }[] {
    let arr = raw;
    if (typeof raw === 'string') { try { arr = JSON.parse(raw); } catch { return []; } }
    if (!Array.isArray(arr)) return [];
    return arr
      .map(m => ({ name: typeof m === 'string' ? m : (m?.name || ''), role: typeof m === 'string' ? '' : (m?.role || '') }))
      .filter(m => m.name)
      .map(m => ({ ...m, initial: m.name.charAt(0).toUpperCase() }));
  }

  sectorGradient(sector: string): string {
    const map: Record<string, string> = {
      health: 'linear-gradient(135deg,#1E6BFF,#A8D0FF)', environment: 'linear-gradient(135deg,#0B3FA8,#1E6BFF)',
      energy: 'linear-gradient(135deg,#1E6BFF,#7AB8FF)', agriculture: 'linear-gradient(135deg,#0B3FA8,#1E6BFF)',
      engineering: 'linear-gradient(135deg,#0B3FA8,#7AB8FF)', information_technology: 'linear-gradient(135deg,#0A1B3D,#1E6BFF)',
      education: 'linear-gradient(135deg,#1E6BFF,#7AB8FF)', industry: 'linear-gradient(135deg,#0B3FA8,#1E6BFF)',
    };
    return map[(sector || '').toLowerCase().replace(' ', '_')] ?? 'linear-gradient(135deg,#0B3FA8,#7AB8FF)';
  }
}
