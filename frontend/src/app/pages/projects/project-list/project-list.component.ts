import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project } from '../../../models/interfaces';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

/** Staff-only chips: approval state or booth membership. */
type StaffFilter = '' | 'pending' | 'approved' | 'rejected' | 'booth';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, RevealDirective],
  template: `
    <div class="projects-page">
      <div class="mesh" aria-hidden="true" style="opacity: 0.3;"><span></span></div>
      <div class="grain"></div>

      <div class="container">
        <div class="page-header">
          <div appReveal><span class="kicker">Student Projects</span></div>
          <div class="header-row" style="margin-top: 18px;">
            <div appReveal [delay]="80">
              <h1 class="h-section">Project <em class="serif-italic" style="color: var(--c-blue);">Database</em>.</h1>
              <p class="lead" style="margin-top: 12px;">
                Every graduation project supervised at An-Najah — the pool the AI matcher searches when a company posts a challenge.
              </p>
            </div>
            <div class="header-actions" appReveal [delay]="140">
              <a routerLink="/projects/submit" class="btn btn-primary" *ngIf="authService.hasRole('admin', 'supervisor')">
                + Add Project
              </a>
              <a routerLink="/booth" class="btn btn-ghost">Open Virtual Booth →</a>
              <a routerLink="/review" class="btn btn-outline" *ngIf="authService.hasRole('supervisor', 'admin')">
                Review Queue
              </a>
            </div>
          </div>

          <div class="filters-box" appReveal [delay]="200">
            <div class="search-wrap">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" [ngModel]="search" (ngModelChange)="onSearchInput($event)" [placeholder]="'PROJECTS.SEARCH' | translate">
            </div>

            <div class="filter-group">
              <select [(ngModel)]="sectorFilter" (change)="query()">
                <option value="">All Sectors</option>
                <option *ngFor="let s of sectors" [value]="s">{{ s }}</option>
              </select>
              <select [(ngModel)]="readinessFilter" (change)="query()">
                <option value="">All Stages</option>
                <option value="concept">Concept</option>
                <option value="prototype">Prototype</option>
                <option value="pilot_ready">Pilot Ready</option>
              </select>
            </div>
          </div>

          <!-- Staff see the whole database; chips narrow it by approval or booth state -->
          <div class="tabs" *ngIf="isStaff" appReveal [delay]="240">
            <button *ngFor="let c of staffChips" [class.active]="staffFilter === c.value" (click)="setStaffFilter(c.value)">{{ c.label }}</button>
          </div>
        </div>

        <div class="booth-grid" *ngIf="projects.length > 0">
          <article *ngFor="let project of projects; let i = index" class="proj" appReveal [delay]="(i % 3) * 60">
            <div class="proj-thumb" [style.background]="project.image_url ? 'url(' + project.image_url + ') center/cover' : sectorGradient(project.sector)">
              <div class="proj-badges">
                <span class="proj-status booth" *ngIf="project.booth_published">In Booth</span>
                <span class="proj-status" [ngClass]="project.approval_status" *ngIf="isStaff && project.approval_status !== 'approved'">{{ project.approval_status }}</span>
                <span class="proj-status" [ngClass]="project.status">{{ project.status?.replace('_', ' ') | titlecase }}</span>
              </div>
              <div class="proj-overlay"></div>
            </div>
            <div class="proj-body">
              <div class="proj-meta">
                <span style="color: var(--c-blue);">{{ project.sector | titlecase }}</span>
                <span class="sep"></span>
                <span>{{ project.created_at | date:'yyyy' }} Cohort</span>
                <ng-container *ngIf="project.supervisor">
                  <span class="sep"></span>
                  <span class="sup">{{ project.supervisor.full_name }}</span>
                </ng-container>
              </div>
              <h3 class="proj-title" [attr.dir]="isArabic ? 'rtl' : null">{{ displayTitle(project) }}</h3>
              <p class="proj-desc" [attr.dir]="isArabic ? 'rtl' : null">{{ displaySummary(project) | slice:0:100 }}...</p>

              <div class="proj-footer">
                <span class="readiness" [ngClass]="project.readiness_level">
                  {{ project.readiness_level?.replace('_', ' ') | titlecase }}
                </span>
                <div class="proj-actions">
                  <ng-container *ngIf="canManage(project)">
                    <button class="link-btn" (click)="togglePublish(project)" [disabled]="busyId === project.id">
                      {{ project.booth_published ? 'Unpublish' : 'Publish to Booth' }}
                    </button>
                  </ng-container>
                  <a *ngIf="project.booth_published" [routerLink]="['/booth', project.id]" class="proj-link">Booth</a>
                  <a [routerLink]="['/projects', project.id]" class="proj-link">Details</a>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div class="pagination-area" *ngIf="projects.length > 0 && projects.length < total">
          <button class="btn btn-outline" (click)="loadMore()" [disabled]="loading">
            {{ loading ? 'Loading...' : 'Load More Projects' }}
          </button>
        </div>

        <div class="empty-state" *ngIf="projects.length === 0 && !loading" appReveal>
          <div class="empty-icon">📂</div>
          <h3>No projects found</h3>
          <p>Try adjusting your filters or search terms.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .projects-page { position: relative; padding: 60px 0 100px; min-height: 100vh; overflow: hidden; }

    .header-row { display: flex; justify-content: space-between; align-items: flex-end; gap: 40px; margin-bottom: 40px; }
    .header-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    @media (max-width: 768px) { .header-row { flex-direction: column; align-items: flex-start; } }

    .filters-box {
      display: flex; justify-content: space-between; align-items: center; gap: 20px;
      padding: 16px 24px; background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(20px); border: 1px solid var(--c-line-soft);
      border-radius: 99px; margin-bottom: 20px;
    }
    @media (max-width: 880px) { .filters-box { flex-direction: column; border-radius: 24px; align-items: stretch; } }

    .search-wrap { display: flex; align-items: center; gap: 12px; flex: 1; color: var(--c-text-faint); }
    .search-wrap input { background: transparent; border: none; outline: none; width: 100%; font-size: 15px; color: var(--c-text); }

    .filter-group { display: flex; gap: 12px; }
    .filter-group select {
      background: transparent; border: 1px solid var(--c-line-soft);
      padding: 6px 16px; border-radius: 99px; font-size: 13px; font-weight: 600;
      color: var(--c-text-mute); outline: none; cursor: pointer;
    }

    .tabs { display: inline-flex; gap: 4px; padding: 4px; border-radius: 999px; background: rgba(11,27,61,0.04); margin-bottom: 40px; flex-wrap: wrap; }
    .tabs button { padding: 8px 14px; border-radius: 999px; border: 0; background: transparent; color: var(--c-text-mute); font-size: 13px; font-weight: 600; cursor: pointer; text-transform: capitalize; }
    .tabs button.active { background: white; color: var(--c-ink); box-shadow: 0 2px 8px -2px rgba(11,27,61,0.15); }

    .booth-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    @media (max-width: 900px) { .booth-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .booth-grid { grid-template-columns: 1fr; } }

    .proj { background: white; border-radius: 24px; border: 1px solid var(--c-line-soft); overflow: hidden; transition: all 300ms var(--ease); display: flex; flex-direction: column; }
    .proj:hover { transform: translateY(-6px); box-shadow: 0 30px 60px -20px rgba(11, 27, 61, 0.15); border-color: rgba(30, 107, 255, 0.2); }

    .proj-thumb { height: 160px; background: var(--c-bg-warm); position: relative; overflow: hidden; }
    .proj-badges { position: absolute; top: 12px; right: 12px; display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; z-index: 2; }
    .proj-status { padding: 4px 12px; background: rgba(255,255,255,0.92); backdrop-filter: blur(8px); border-radius: 99px; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--c-royal); }
    .proj-status.submitted    { color: #0369a1; }
    .proj-status.under_review { color: #7c3aed; }
    .proj-status.incubation   { color: #c2410c; }
    .proj-status.partnership  { color: #15803d; }
    .proj-status.marketed     { color: #1e6bff; }
    .proj-status.pending      { color: #b45309; }
    .proj-status.rejected     { color: #b91c1c; }
    .proj-status.booth        { background: #15803d; color: white; }
    .proj-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 50%, rgba(11,27,61,0.05)); }

    .proj-body { padding: 24px; flex-grow: 1; display: flex; flex-direction: column; }
    .proj-meta { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 12px; flex-wrap: wrap; }
    .proj-meta .sep { width: 4px; height: 4px; border-radius: 50%; background: var(--c-line); }
    .proj-meta .sup { text-transform: none; letter-spacing: 0; color: var(--c-text-mute); }

    .proj-title { font-family: var(--serif); font-size: 18px; font-weight: 700; color: var(--c-ink); line-height: 1.25; margin: 0 0 8px; }
    .proj-desc { font-size: 13px; color: var(--c-text-mute); margin-bottom: 16px; flex-grow: 1; line-height: 1.5; }

    .proj-footer { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--c-line-soft); }
    .proj-actions { display: flex; gap: 12px; align-items: center; }
    .readiness { font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 99px; white-space: nowrap; }
    .readiness.concept { background: #fff7ed; color: #c2410c; }
    .readiness.prototype { background: #f0f9ff; color: #0369a1; }
    .readiness.pilot_ready { background: #f0fdf4; color: #15803d; }

    .proj-link { font-size: 13px; font-weight: 700; color: var(--c-blue); text-decoration: none; }
    .link-btn { background: none; border: 0; padding: 0; font-size: 13px; font-weight: 700; color: #15803d; cursor: pointer; }
    .link-btn:disabled { opacity: 0.5; cursor: default; }

    .pagination-area { display: flex; justify-content: center; margin-top: 60px; }
    .empty-state { text-align: center; padding: 80px 0; color: var(--c-text-faint); }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }
  `],
})
export class ProjectListComponent implements OnInit, OnDestroy {
  projects: Project[] = [];
  loading = false;
  busyId: number | null = null;
  search = '';
  sectorFilter = '';
  readinessFilter = '';
  staffFilter: StaffFilter = '';
  total = 0;
  skip = 0;
  limit = 12;

  staffChips: { label: string; value: StaffFilter }[] = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'In booth', value: 'booth' },
  ];

  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;

  sectors = [
    'Health', 'Environment', 'Energy', 'Agriculture', 'Industry',
    'Engineering', 'Information Technology', 'Education',
    'Artificial Intelligence', 'Biotechnology'
  ];

  constructor(
    public authService: AuthService,
    private api: ApiService,
    private translate: TranslateService,
  ) { }

  ngOnInit(): void {
    this.query();
    this.searchSub = this.searchSubject.pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => this.query());
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  get isStaff(): boolean {
    return this.authService.hasRole('admin', 'supervisor', 'evaluator', 'park_manager', 'vp_innovation');
  }

  canManage(project: Project): boolean {
    return this.authService.hasRole('admin') ||
      (this.authService.hasRole('supervisor') && project.supervisor_id === this.authService.currentUser?.id);
  }

  onSearchInput(value: string): void {
    this.search = value;
    this.searchSubject.next(value);
  }

  setStaffFilter(value: StaffFilter): void {
    this.staffFilter = value;
    this.query();
  }

  get isArabic(): boolean {
    return this.translate.currentLang === 'ar';
  }

  displayTitle(project: Project): string {
    const preferred = this.isArabic ? project.title_ar : project.title_en;
    return preferred || project.title;
  }

  displaySummary(project: Project): string {
    const preferred = this.isArabic ? project.description_ar : project.description_en;
    return preferred || project.summary || project.problem || '';
  }

  /** Reload page 1 with the current search + filters. Semantic search when there is a query. */
  query(): void {
    this.skip = 0;
    this.loading = true;
    const q = this.search.trim();
    const booth = this.staffFilter === 'booth' ? true : undefined;
    const request = q
      ? this.api.semanticSearchProjects(q, this.sectorFilter, this.readinessFilter, this.limit, booth)
      : this.api.getProjects(this.listParams());
    request.subscribe({
      next: res => { this.projects = res.projects; this.total = res.total; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  loadMore(): void {
    this.skip += this.limit;
    this.loading = true;
    this.api.getProjects(this.listParams()).subscribe({
      next: res => { this.projects = [...this.projects, ...res.projects]; this.total = res.total; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  private listParams() {
    return {
      search: this.search || undefined,
      sector: this.sectorFilter || undefined,
      readiness: this.readinessFilter || undefined,
      approval: this.staffFilter && this.staffFilter !== 'booth' ? this.staffFilter : undefined,
      booth: this.staffFilter === 'booth' ? true : undefined,
      skip: this.skip,
      limit: this.limit,
    };
  }

  togglePublish(project: Project): void {
    this.busyId = project.id;
    this.api.publishBooth(project.id, !project.booth_published).subscribe({
      next: updated => {
        this.projects = this.projects.map(p => p.id === updated.id ? updated : p);
        this.busyId = null;
      },
      error: () => { this.busyId = null; },
    });
  }

  sectorGradient(sector: string): string {
    const map: Record<string, string> = {
      health:                 'linear-gradient(135deg,#1E6BFF,#A8D0FF)',
      environment:            'linear-gradient(135deg,#0B3FA8,#1E6BFF)',
      energy:                 'linear-gradient(135deg,#1E6BFF,#7AB8FF)',
      agriculture:            'linear-gradient(135deg,#0B3FA8,#1E6BFF)',
      engineering:            'linear-gradient(135deg,#0B3FA8,#7AB8FF)',
      information_technology: 'linear-gradient(135deg,#0A1B3D,#1E6BFF)',
      education:              'linear-gradient(135deg,#1E6BFF,#7AB8FF)',
      industry:               'linear-gradient(135deg,#0B3FA8,#1E6BFF)',
    };
    return map[(sector || '').toLowerCase()] ?? 'linear-gradient(135deg,#0B3FA8,#7AB8FF)';
  }
}
