import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <!-- Hero -->
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="hero-content fade-in-up">
        <h1 class="hero-title">{{ 'HOME.HERO_TITLE' | translate }}</h1>
        <p class="hero-subtitle">{{ 'HOME.HERO_SUBTITLE' | translate }}</p>
        <p class="hero-desc">{{ 'HOME.HERO_DESC' | translate }}</p>
        <div class="hero-actions">
          <a routerLink="/projects" class="btn btn-primary btn-lg">{{ 'HOME.CTA_PROJECTS' | translate }}</a>
          <a routerLink="/projects/submit" class="btn btn-outline btn-lg">{{ 'HOME.CTA_SUBMIT' | translate }}</a>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="stats-section" *ngIf="overview">
      <div class="page-container">
        <div class="grid grid-4">
          <div class="stat-card fade-in-up">
            <div class="stat-value">{{ overview.total_projects || 0 }}</div>
            <div class="stat-label">{{ 'HOME.STATS_PROJECTS' | translate }}</div>
          </div>
          <div class="stat-card fade-in-up">
            <div class="stat-value">{{ overview.total_challenges || 0 }}</div>
            <div class="stat-label">{{ 'HOME.STATS_CHALLENGES' | translate }}</div>
          </div>
          <div class="stat-card fade-in-up">
            <div class="stat-value">{{ matchStats?.total_matches || 0 }}</div>
            <div class="stat-label">{{ 'HOME.STATS_MATCHES' | translate }}</div>
          </div>
          <div class="stat-card fade-in-up">
            <div class="stat-value">{{ sectorCount }}</div>
            <div class="stat-label">{{ 'HOME.STATS_SECTORS' | translate }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Sectors -->
    <section class="sectors-section">
      <div class="page-container">
        <h2 class="section-title">{{ 'HOME.SECTORS_TITLE' | translate }}</h2>
        <div class="grid grid-4">
          <div class="sector-card" *ngFor="let sector of sectors">
            <div class="sector-icon">{{ sector.icon }}</div>
            <div class="sector-name">{{ 'SECTORS.' + sector.key | translate }}</div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero {
      position: relative; min-height: 80vh;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    .hero-bg {
      position: absolute; inset: 0;
      background:
        radial-gradient(ellipse at 20% 50%, rgba(23, 97, 141, 0.1) 0%, transparent 60%),
        radial-gradient(ellipse at 80% 20%, rgba(56, 189, 248, 0.1) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 80%, rgba(15, 63, 93, 0.05) 0%, transparent 50%);
    }
    .hero-content { text-align: center; padding: 2rem; max-width: 800px; position: relative; z-index: 1; }
    .hero-title {
      font-size: 5rem; font-weight: 800; letter-spacing: -2px;
      text-transform: uppercase;
      background: var(--accent-gradient);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      margin-bottom: 1rem;
    }
    .hero-subtitle {
      font-size: 1.6rem; font-weight: 600; color: var(--text-primary);
      margin-bottom: 0.75rem;
    }
    .hero-desc { font-size: 1.1rem; color: var(--text-secondary); max-width: 600px; margin: 0 auto 2rem; }
    .hero-actions { display: flex; gap: 1rem; justify-content: center; }

    .stats-section { padding: 2rem 0; margin-top: -3rem; position: relative; z-index: 2; }

    .sectors-section { padding: 4rem 0; }
    .section-title {
      font-size: 1.8rem; font-weight: 700; text-align: center; margin-bottom: 2rem;
      background: var(--accent-gradient);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .sector-card {
      background: var(--bg-card); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg); padding: 2rem; text-align: center;
      transition: all 0.3s; cursor: pointer;
    }
    .sector-card:hover { border-color: var(--border-hover); transform: translateY(-4px); box-shadow: var(--shadow-glow); }
    .sector-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
    .sector-name { font-weight: 600; color: var(--text-primary); }

    @media (max-width: 768px) {
      .hero-title { font-size: 3rem; }
      .hero-subtitle { font-size: 1.2rem; }
      .hero-actions { flex-direction: column; align-items: center; }
    }
  `],
})
export class LandingComponent implements OnInit {
  overview: any = null;
  matchStats: any = null;
  sectorCount = 8;

  sectors = [
    { key: 'health', icon: '🏥' },
    { key: 'environment', icon: '🌿' },
    { key: 'energy', icon: '⚡' },
    { key: 'agriculture', icon: '🌾' },
    { key: 'industry', icon: '🏭' },
    { key: 'information_technology', icon: '💻' },
    { key: 'education', icon: '📚' },
    { key: 'other', icon: '🔬' },
  ];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getAnalyticsOverview().subscribe({
      next: (data) => {
        this.overview = data;
        this.sectorCount = Object.keys(data.projects_by_sector || {}).length || 8;
      },
      error: () => {},
    });
    this.api.getMatchAnalytics().subscribe({
      next: (data) => (this.matchStats = data),
      error: () => {},
    });
  }
}
