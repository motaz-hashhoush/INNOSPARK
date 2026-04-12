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
          <a routerLink="/projects/submit" class="btn btn-primary" *ngIf="authService.isLoggedIn()">
            + {{ 'PROJECTS.SUBMIT' | translate }}
          </a>
        </div>

        <!-- Filters -->
        <div class="filters">
          <input type="text" class="form-input search-input" [(ngModel)]="search"
                 [placeholder]="'PROJECTS.SEARCH' | translate" (input)="loadProjects()">
          <select class="form-select filter-select" [(ngModel)]="sectorFilter" (change)="loadProjects()">
            <option value="">{{ 'PROJECTS.FILTER_SECTOR' | translate }}</option>
            <option *ngFor="let s of sectors" [value]="s">{{ 'SECTORS.' + s | translate }}</option>
          </select>
          <select class="form-select filter-select" [(ngModel)]="readinessFilter" (change)="loadProjects()">
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
            <span class="badge badge-primary">{{ 'SECTORS.' + project.sector | translate }}</span>
          </div>
          <h3 class="card-title">{{ project.title_en || project.title_ar }}</h3>
          <p class="card-desc">{{ (project.summary_en || project.summary_ar || project.problem) | slice:0:120 }}...</p>
          <div class="card-footer">
            <span class="card-team" *ngIf="project.team_members?.length">
              👥 {{ project.team_members.length }} members
            </span>
            <span class="card-date">{{ project.created_at | date:'mediumDate' }}</span>
          </div>
        </a>
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
  `],
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];
  loading = false;
  search = '';
  sectorFilter = '';
  readinessFilter = '';
  sectors = ['health', 'environment', 'energy', 'agriculture', 'industry', 'information_technology', 'education', 'other'];

  constructor(public authService: AuthService, private api: ApiService) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading = true;
    this.api.getProjects({
      search: this.search || undefined,
      sector: this.sectorFilter || undefined,
      readiness: this.readinessFilter || undefined,
    }).subscribe({
      next: (res) => { this.projects = res.projects; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  getReadinessBadge(level: string): string {
    const map: any = { concept: 'badge-warning', prototype: 'badge-primary', pilot_ready: 'badge-success' };
    return map[level] || 'badge-primary';
  }
}
