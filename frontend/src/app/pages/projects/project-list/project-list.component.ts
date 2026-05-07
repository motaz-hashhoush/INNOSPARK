import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project } from '../../../models/interfaces';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-row">
          <div>
            <h1 class="page-title">{{ 'PROJECTS.TITLE' | translate }}</h1>
            <p class="page-subtitle">{{ 'PROJECTS.SUBTITLE' | translate }}</p>
          </div>
          <a routerLink="/projects/submit" class="btn btn-primary" *ngIf="authService.isLoggedIn() && authService.currentUser?.role !== 'company'">
            + {{ 'PROJECTS.SUBMIT' | translate }}
          </a>
        </div>

        <!-- Filters -->
        <div class="filters">
          <input type="text" class="form-input search-input" [(ngModel)]="search"
                 [placeholder]="'PROJECTS.SEARCH' | translate" (input)="onFilterChange()">
          <input type="text" class="form-input filter-select" [(ngModel)]="sectorFilter"
                 placeholder="Filter by Sector" (input)="onFilterChange()" list="sector-options">
          <datalist id="sector-options">
            <option value="Health"></option>
            <option value="Environment"></option>
            <option value="Energy"></option>
            <option value="Agriculture"></option>
            <option value="Industry"></option>
            <option value="Engineering"></option>
            <option value="Information Technology"></option>
            <option value="Education"></option>
            <option value="Artificial Intelligence"></option>
            <option value="Biotechnology"></option>
            <option value="Other"></option>
          </datalist>
          <select class="form-select filter-select" [(ngModel)]="readinessFilter" (change)="onFilterChange()">
            <option value="">{{ 'PROJECTS.FILTER_READINESS' | translate }}</option>
            <option value="concept">{{ 'READINESS.concept' | translate }}</option>
            <option value="prototype">{{ 'READINESS.prototype' | translate }}</option>
            <option value="pilot_ready">{{ 'READINESS.pilot_ready' | translate }}</option>
          </select>
        </div>
      </div>

      <!-- Project Grid -->
      <div class="grid grid-3" *ngIf="projects.length > 0">
        <a [routerLink]="['/projects', project.id]" class="project-card card" *ngFor="let project of projects">
          <div class="card-top">
            <span class="badge" [ngClass]="getReadinessBadge(project.readiness_level)">
              {{ 'READINESS.' + project.readiness_level | translate }}
            </span>
            <span class="badge badge-primary">{{ project.sector }}</span>
          </div>
          <h3 class="card-title">{{ project.title }}</h3>
          <p class="card-desc">{{ (project.summary || project.problem) | slice:0:120 }}...</p>
          <div class="card-footer">
            <span class="card-date">{{ project.created_at | date:'mediumDate' }}</span>
          </div>
        </a>
      </div>

      <!-- Pagination -->
      <div class="pagination-controls" *ngIf="projects.length > 0 && projects.length < total">
        <button class="btn btn-outline" (click)="loadMore()" [disabled]="loading">
          {{ loading ? ('COMMON.LOADING' | translate) : 'Load More' }}
        </button>
      </div>

      <div class="empty-state" *ngIf="projects.length === 0 && !loading">
        <p>{{ 'COMMON.NO_DATA' | translate }}</p>
      </div>

      <div class="loading-state loading-pulse" *ngIf="loading">
        <p>{{ 'COMMON.LOADING' | translate }}</p>
      </div>
    </div>
  `,
  styles: [`
    .header-row { display: flex; justify-content: space-between; align-items: flex-start; }
    .filters { display: flex; gap: 0.75rem; margin-top: 1.25rem; flex-wrap: wrap; }
    .search-input { max-width: 350px; }
    .filter-select { max-width: 220px; }
    .project-card {
      text-decoration: none; color: inherit; display: flex; flex-direction: column;
      cursor: pointer;
    }
    .card-top { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
    .card-title { font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--text-primary); }
    .card-desc { color: var(--text-secondary); font-size: 0.9rem; flex: 1; line-height: 1.5; }
    .card-footer {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 1rem; padding-top: 0.75rem;
      border-top: 1px solid var(--border-subtle);
      font-size: 0.85rem; color: var(--text-muted);
    }
    .empty-state, .loading-state { text-align: center; padding: 4rem; color: var(--text-muted); font-size: 1.1rem; }
    .pagination-controls { display: flex; justify-content: center; margin-top: 2rem; }
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
  limit = 20;

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

  onFilterChange(): void {
    this.loadProjects(true);
  }

  loadMore(): void {
    this.skip += this.limit;
    this.loadProjects(false);
  }

  getReadinessBadge(level: string): string {
    const map: any = { concept: 'badge-warning', prototype: 'badge-primary', pilot_ready: 'badge-success' };
    return map[level] || 'badge-primary';
  }
}
