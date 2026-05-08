import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project } from '../../../models/interfaces';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

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
          <div appReveal><span class="kicker">The Virtual Booth</span></div>
          <div class="header-row" style="margin-top: 18px;">
            <div appReveal [delay]="80">
              <h1 class="h-section">Explore <em class="serif-italic" style="color: var(--c-blue);">Innovation</em>.</h1>
              <p class="lead" style="margin-top: 12px;">Discover high-potential graduation projects from An-Najah's brightest minds.</p>
            </div>
            <div appReveal [delay]="140">
              <a routerLink="/projects/submit" class="btn btn-primary" *ngIf="authService.isLoggedIn() && authService.currentUser?.role !== 'company'">
                + Submit Your Project
              </a>
            </div>
          </div>

          <!-- Modern Filters -->
          <div class="filters-box" appReveal [delay]="200">
            <div class="search-wrap">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" [(ngModel)]="search" [placeholder]="'PROJECTS.SEARCH' | translate" (input)="onFilterChange()">
            </div>
            
            <div class="filter-group">
              <select [(ngModel)]="sectorFilter" (change)="onFilterChange()">
                <option value="">All Sectors</option>
                <option *ngFor="let s of sectors" [value]="s">{{ s }}</option>
              </select>
              <select [(ngModel)]="readinessFilter" (change)="onFilterChange()">
                <option value="">All Stages</option>
                <option value="concept">Concept</option>
                <option value="prototype">Prototype</option>
                <option value="pilot_ready">Pilot Ready</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Project Grid -->
        <div class="booth-grid" *ngIf="projects.length > 0">
          <article *ngFor="let project of projects; let i = index" class="proj" appReveal [delay]="(i % 3) * 60">
            <div class="proj-thumb" [style.background]="sectorGradient(project.sector)">
              <div class="proj-status" [ngClass]="project.status">{{ project.status?.replace('_', ' ') | titlecase }}</div>
              <div class="proj-overlay"></div>
            </div>
            <div class="proj-body">
              <div class="proj-meta">
                <span style="color: var(--c-blue);">{{ project.sector | titlecase }}</span>
                <span class="sep"></span>
                <span>{{ project.created_at | date:'yyyy' }} Cohort</span>
              </div>
              <h3 class="proj-title">{{ project.title }}</h3>
              <p class="proj-desc">{{ (project.summary || project.problem) | slice:0:100 }}...</p>
              
              <div class="proj-footer">
                <span class="readiness" [ngClass]="project.readiness_level">
                  {{ project.readiness_level?.replace('_', ' ') | titlecase }}
                </span>
                <a [routerLink]="['/projects', project.id]" class="proj-link">Details</a>
              </div>
            </div>
          </article>
        </div>

        <!-- Pagination -->
        <div class="pagination-area" *ngIf="projects.length > 0 && projects.length < total">
          <button class="btn btn-outline" (click)="loadMore()" [disabled]="loading">
            {{ loading ? 'Loading...' : 'Load More Innovation' }}
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
    
    .header-row { display: flex; justify-content: space-between; align-items: flex-end; gap: 40px; margin-bottom: 48px; }
    @media (max-width: 768px) { .header-row { flex-direction: column; align-items: flex-start; } }

    .filters-box {
      display: flex; justify-content: space-between; align-items: center; gap: 20px;
      padding: 16px 24px; background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(20px); border: 1px solid var(--c-line-soft);
      border-radius: 99px; margin-bottom: 48px;
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

    /* Booth Grid - matching landing featured style */
    .booth-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    @media (max-width: 900px) { .booth-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .booth-grid { grid-template-columns: 1fr; } }

    .proj { background: white; border-radius: 24px; border: 1px solid var(--c-line-soft); overflow: hidden; transition: all 300ms var(--ease); display: flex; flex-direction: column; }
    .proj:hover { transform: translateY(-6px); box-shadow: 0 30px 60px -20px rgba(11, 27, 61, 0.15); border-color: rgba(30, 107, 255, 0.2); }

    .proj-thumb { height: 160px; background: var(--c-bg-warm); position: relative; overflow: hidden; }
    .proj-status { position: absolute; top: 12px; right: 12px; padding: 4px 12px; background: rgba(255,255,255,0.92); backdrop-filter: blur(8px); border-radius: 99px; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; z-index: 2; color: var(--c-royal); }
    .proj-status.submitted    { color: #0369a1; }
    .proj-status.under_review { color: #7c3aed; }
    .proj-status.incubation   { color: #c2410c; }
    .proj-status.partnership  { color: #15803d; }
    .proj-status.marketed     { color: #1e6bff; }
    .proj-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 50%, rgba(11,27,61,0.05)); }

    .proj-body { padding: 24px; flex-grow: 1; display: flex; flex-direction: column; }
    .proj-meta { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 12px; }
    .proj-meta .sep { width: 4px; height: 4px; border-radius: 50%; background: var(--c-line); }
    
    .proj-title { font-family: var(--serif); font-size: 18px; font-weight: 700; color: var(--c-ink); line-height: 1.25; margin: 0 0 8px; }
    .proj-desc { font-size: 13px; color: var(--c-text-mute); margin-bottom: 16px; flex-grow: 1; line-height: 1.5; }
    
    .proj-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--c-line-soft); }
    .readiness { font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 99px; }
    .readiness.concept { background: #fff7ed; color: #c2410c; }
    .readiness.prototype { background: #f0f9ff; color: #0369a1; }
    .readiness.pilot_ready { background: #f0fdf4; color: #15803d; }

    .proj-link { font-size: 13px; font-weight: 700; color: var(--c-blue); text-decoration: none; }
    
    .pagination-area { display: flex; justify-content: center; margin-top: 60px; }
    .empty-state { text-align: center; padding: 80px 0; color: var(--c-text-faint); }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }
  `],
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];
  loading = false;
  search = '';
  sectorFilter = '';
  readinessFilter = '';
  total = 0;
  skip = 0;
  limit = 12;

  sectors = [
    'Health', 'Environment', 'Energy', 'Agriculture', 'Industry', 
    'Engineering', 'Information Technology', 'Education', 
    'Artificial Intelligence', 'Biotechnology'
  ];

  constructor(public authService: AuthService, private api: ApiService) { }

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(reset = false): void {
    if (reset) {
      this.skip = 0;
      this.projects = [];
    }
    this.loading = true;
    this.api.getProjects({
      search: this.search || undefined,
      sector: this.sectorFilter || undefined,
      readiness: this.readinessFilter || undefined,
      skip: this.skip,
      limit: this.limit
    }).subscribe({
      next: (res) => { 
        this.projects = reset ? res.projects : [...this.projects, ...res.projects];
        this.total = res.total;
        this.loading = false; 
      },
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
    return map[(sector || '').toLowerCase()] ?? 'linear-gradient(135deg,#0B3FA8,#7AB8FF)';
  }

  onFilterChange(): void {
    this.loadProjects(true);
  }

  loadMore(): void {
    this.skip += this.limit;
    this.loadProjects(false);
  }
}
