import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Project } from '../../models/interfaces';
import { RevealDirective } from '../../shared/directives/reveal.directive';

/** Curated public showcase: only projects with booth_published = true. */
@Component({
  selector: 'app-booth-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, RevealDirective],
  template: `
    <div class="booth-page">
      <div class="mesh" aria-hidden="true" style="opacity: 0.35;"><span></span></div>
      <div class="grain"></div>

      <div class="container">
        <div class="head">
          <div>
            <div appReveal><span class="kicker">The Virtual Booth</span></div>
            <div appReveal [delay]="80">
              <h1 class="h-section" style="margin-top: 18px;">Explore <em class="serif-italic" style="color: var(--c-blue);">innovation</em>.</h1>
              <p class="lead" style="margin-top: 12px; max-width: 56ch;">
                A curated exhibition of An-Najah graduation projects — see the problem, the solution, the team, and get in touch to collaborate.
              </p>
            </div>
          </div>
          <div class="head-actions" appReveal [delay]="140" *ngIf="authService.hasRole('admin', 'supervisor')">
            <a routerLink="/booth/new" class="btn btn-primary">+ New booth project</a>
            <a routerLink="/projects" class="btn btn-ghost">Manage in Student Projects →</a>
          </div>
        </div>

        <div class="toolbar" appReveal [delay]="180">
          <div class="filters">
            <button class="filter-pill" [attr.data-active]="sector === ''" (click)="setSector('')">All</button>
            <button *ngFor="let s of sectors" class="filter-pill" [attr.data-active]="sector === s" (click)="setSector(s)">{{ s }}</button>
          </div>
          <div class="search-wrap">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" [ngModel]="search" (ngModelChange)="onSearchInput($event)" placeholder="Search the booth…">
          </div>
        </div>

        <div class="booth-grid" *ngIf="projects.length > 0">
          <article *ngFor="let p of projects; let i = index" class="proj" appReveal [delay]="(i % 3) * 80">
            <a [routerLink]="['/booth', p.id]" class="proj-thumb" [style.backgroundImage]="p.image_url ? 'url(' + p.image_url + ')' : sectorGradient(p.sector)">
              <span class="proj-chip" *ngIf="p.video_url">▶ Video</span>
              <span class="proj-chip demo" *ngIf="p.demo_url">Live demo</span>
            </a>
            <div class="proj-body">
              <div class="proj-meta">
                <span style="color: var(--c-blue);">{{ p.sector | titlecase }}</span>
                <span class="sep"></span>
                <span>{{ p.created_at | date:'yyyy' }} cohort</span>
              </div>
              <h3 class="proj-title" [attr.dir]="isArabic ? 'rtl' : null">{{ displayTitle(p) }}</h3>
              <p class="proj-desc" [attr.dir]="isArabic ? 'rtl' : null">{{ displaySummary(p) | slice:0:120 }}{{ displaySummary(p).length > 120 ? '…' : '' }}</p>
              <div class="proj-team">
                <span>{{ p.team_members?.length || 0 }} team member{{ p.team_members?.length === 1 ? '' : 's' }}</span>
                <ng-container *ngIf="p.supervisor"> · {{ p.supervisor.full_name }}</ng-container>
              </div>
              <div class="proj-tags">
                <span class="tag">{{ (p.readiness_level || 'concept').replace('_', ' ') | titlecase }}</span>
                <span class="tag">{{ (p.status || '').replace('_', ' ') | titlecase }}</span>
              </div>
              <a [routerLink]="['/booth', p.id]" class="proj-link">Visit booth →</a>
            </div>
          </article>
        </div>

        <div class="pagination-area" *ngIf="projects.length > 0 && projects.length < total">
          <button class="btn btn-outline" (click)="loadMore()" [disabled]="loading">{{ loading ? 'Loading…' : 'Show more' }}</button>
        </div>

        <div class="empty-state" *ngIf="projects.length === 0 && !loading" appReveal>
          <div class="empty-icon">🎪</div>
          <h3>{{ search || sector ? 'No booths match your search' : 'The booth is being set up' }}</h3>
          <p *ngIf="!search && !sector">Published projects will appear here. <a routerLink="/projects">Browse the full project database</a> meanwhile.</p>
          <p *ngIf="search || sector">Try another sector or search term.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .booth-page { position: relative; padding: 60px 0 100px; min-height: 100vh; overflow: hidden; }
    .head { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 20px; margin-bottom: 32px; }
    .head-actions { display: flex; gap: 10px; flex-wrap: wrap; }

    .toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 40px; }
    .filters { display: inline-flex; gap: 4px; padding: 4px; border-radius: 999px; background: rgba(11,27,61,0.04); flex-wrap: wrap; }
    .filter-pill { padding: 8px 14px; border-radius: 999px; background: transparent; border: 0; color: var(--c-text-mute); font-size: 13px; font-weight: 500; cursor: pointer; transition: background 200ms, color 200ms; }
    .filter-pill[data-active="true"] { background: white; color: var(--c-ink); box-shadow: 0 2px 8px -2px rgba(11,27,61,0.15); }
    .filter-pill:hover { color: var(--c-ink); }
    .search-wrap { display: flex; align-items: center; gap: 10px; padding: 10px 18px; border-radius: 99px; background: rgba(255,255,255,0.7); border: 1px solid var(--c-line-soft); color: var(--c-text-faint); min-width: 260px; }
    .search-wrap input { background: transparent; border: none; outline: none; width: 100%; font-size: 14px; color: var(--c-text); }

    .booth-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    @media (max-width: 1080px) { .booth-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 700px)  { .booth-grid { grid-template-columns: 1fr; } }

    .proj { border-radius: 22px; overflow: hidden; background: white; border: 1px solid var(--c-line-soft); transition: transform 360ms var(--ease), box-shadow 360ms var(--ease); display: flex; flex-direction: column; }
    .proj:hover { transform: translateY(-4px); box-shadow: 0 30px 60px -30px rgba(11,27,61,0.30); }

    .proj-thumb { position: relative; display: block; aspect-ratio: 4 / 3; overflow: hidden; background-size: cover; background-position: center; }
    .proj-chip {
      position: absolute; top: 12px; left: 12px;
      background: rgba(255,255,255,0.92); backdrop-filter: blur(8px);
      padding: 5px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; color: var(--c-royal);
    }
    .proj-chip.demo { left: auto; right: 12px; color: #15803d; }

    .proj-body { padding: 18px 20px 22px; display: flex; flex-direction: column; flex: 1; }
    .proj-meta { display: flex; align-items: center; gap: 10px; font-size: 11px; letter-spacing: 0.06em; color: var(--c-text-faint); text-transform: uppercase; font-weight: 500; margin-bottom: 10px; }
    .proj-meta .sep { width: 3px; height: 3px; border-radius: 50%; background: var(--c-text-faint); }
    .proj-title { font-family: var(--sans); font-weight: 700; font-size: 20px; line-height: 1.22; color: var(--c-ink); letter-spacing: -0.015em; margin: 0; }
    .proj-desc { margin: 10px 0 0; font-size: 13px; line-height: 1.55; color: var(--c-text-mute); flex: 1; }
    .proj-team { margin-top: 12px; font-size: 12px; color: var(--c-text-mute); }
    .proj-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
    .proj-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 16px; font-size: 13px; font-weight: 600; color: var(--c-royal); text-decoration: none; }

    .pagination-area { display: flex; justify-content: center; margin-top: 60px; }
    .empty-state { text-align: center; padding: 80px 0; color: var(--c-text-faint); }
    .empty-state a { color: var(--c-blue); font-weight: 600; }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }
  `],
})
export class BoothListComponent implements OnInit, OnDestroy {
  projects: Project[] = [];
  total = 0;
  loading = false;
  search = '';
  sector = '';
  skip = 0;
  limit = 12;

  sectors = ['Health', 'Environment', 'Energy', 'Agriculture', 'Industry', 'Engineering', 'Information Technology', 'Education'];

  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;

  constructor(public authService: AuthService, private api: ApiService, private translate: TranslateService) {}

  ngOnInit(): void {
    this.query();
    this.searchSub = this.searchSubject.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => this.query());
  }

  ngOnDestroy(): void { this.searchSub?.unsubscribe(); }

  onSearchInput(v: string): void { this.search = v; this.searchSubject.next(v); }
  setSector(s: string): void { this.sector = s; this.query(); }

  get isArabic(): boolean { return this.translate.currentLang === 'ar'; }

  displayTitle(p: Project): string {
    return (this.isArabic ? p.title_ar : p.title_en) || p.title;
  }

  displaySummary(p: Project): string {
    return (this.isArabic ? p.description_ar : p.description_en) || p.summary || p.problem || '';
  }

  query(): void {
    this.skip = 0;
    this.loading = true;
    const q = this.search.trim();
    const request = q
      ? this.api.semanticSearchProjects(q, this.sector || undefined, undefined, this.limit, true)
      : this.api.getProjects({ booth: true, sector: this.sector || undefined, skip: 0, limit: this.limit });
    request.subscribe({
      next: res => { this.projects = res.projects; this.total = res.total; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  loadMore(): void {
    this.skip += this.limit;
    this.loading = true;
    this.api.getProjects({ booth: true, sector: this.sector || undefined, skip: this.skip, limit: this.limit }).subscribe({
      next: res => { this.projects = [...this.projects, ...res.projects]; this.total = res.total; this.loading = false; },
      error: () => { this.loading = false; },
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
    return map[(sector || '').toLowerCase().replace(' ', '_')] ?? 'linear-gradient(135deg,#0B3FA8,#7AB8FF)';
  }
}
