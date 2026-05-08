import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Project } from '../../../models/interfaces';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

const CAT_GRADIENTS: Record<string, string> = {
  'engineering': 'linear-gradient(135deg,#0B3FA8,#7AB8FF)',
  'health':      'linear-gradient(135deg,#1E6BFF,#A8D0FF)',
  'environment': 'linear-gradient(135deg,#0B3FA8,#1E6BFF)',
  'ai':          'linear-gradient(135deg,#0A1B3D,#1E6BFF)',
  'energy':      'linear-gradient(135deg,#1E6BFF,#7AB8FF)',
  'default':     'linear-gradient(135deg,#0B3FA8,#7AB8FF)',
};

@Component({
  selector: 'app-landing-featured',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, RevealDirective],
  template: `
    <section class="section" id="projects">
      <div class="container">
        <div class="feat-header">
          <div>
            <div appReveal><span class="kicker">{{ 'LANDING.FEATURED.KICKER' | translate }}</span></div>
            <div appReveal [delay]="80">
              <h2 class="h-section" style="margin-top: 18px;">
                {{ 'LANDING.FEATURED.TITLE_1' | translate }}<em class="serif-italic" style="color: var(--c-blue);">{{ 'LANDING.FEATURED.TITLE_EM' | translate }}</em>{{ 'LANDING.FEATURED.TITLE_3' | translate }}
              </h2>
            </div>
            <div appReveal [delay]="140">
              <div class="filters">
                <button *ngFor="let f of filters" class="filter-pill"
                  [attr.data-active]="activeFilter === f.value"
                  (click)="activeFilter = f.value">{{ f.key | translate }}</button>
              </div>
            </div>
          </div>
          <div appReveal [delay]="180">
            <a routerLink="/projects" class="btn btn-ghost" style="padding: 10px 14px;">
              {{ 'LANDING.FEATURED.BROWSE' | translate }}
              <span class="btn-arrow">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </span>
            </a>
          </div>
        </div>

        <!-- API projects -->
        <div class="booth-grid" *ngIf="projects.length > 0">
          <article *ngFor="let project of projects; let i = index" class="proj" appReveal [delay]="(i % 3) * 80">
            <div class="proj-thumb" [style.backgroundImage]="thumbGradient(project.sector)">
              <div class="proj-match">
                <span class="match-dot"></span> 94% match
              </div>
            </div>
            <div class="proj-body">
              <div class="proj-meta">
                <span style="color: var(--c-blue);">{{ project.sector | titlecase }}</span>
                <span class="sep"></span>
                <span>{{ 'LANDING.FEATURED.COHORT' | translate }}</span>
              </div>
              <h3 class="proj-title">{{ project.title }}</h3>
              <p class="proj-team">{{ 'LANDING.FEATURED.FINAL_YEAR' | translate }}</p>
              <div class="proj-tags">
                <span class="tag">{{ (project.readiness_level || 'prototype').replace('_', ' ') | titlecase }}</span>
              </div>
              <a [routerLink]="['/projects', project.id]" class="proj-link">{{ 'LANDING.FEATURED.VIEW' | translate }}</a>
            </div>
          </article>
        </div>

        <!-- Static demo projects when no API data -->
        <div class="booth-grid" *ngIf="projects.length === 0">
          <article *ngFor="let p of filteredDemo(); let i = index"
            class="proj" appReveal [delay]="(i % 3) * 80">
            <div class="proj-thumb" [style.backgroundImage]="p.bg">
              <div class="proj-match"><span class="match-dot"></span> {{ p.match }}% match</div>
            </div>
            <div class="proj-body">
              <div class="proj-meta">
                <span style="color: var(--c-blue);">{{ p.cat }}</span>
                <span class="sep"></span>
                <span>{{ 'LANDING.FEATURED.COHORT' | translate }}</span>
              </div>
              <h3 class="proj-title">{{ p.title }}</h3>
              <p class="proj-team">{{ p.team }}</p>
              <div class="proj-tags">
                <span *ngFor="let t of p.tags" class="tag">{{ t }}</span>
              </div>
              <a routerLink="/projects" class="proj-link">{{ 'LANDING.FEATURED.VIEW' | translate }}</a>
            </div>
          </article>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .feat-header { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 20px; margin-bottom: 40px; }

    .filters { display: inline-flex; gap: 4px; padding: 4px; border-radius: 999px; background: rgba(11,27,61,0.04); margin-top: 24px; }
    .filter-pill { padding: 8px 14px; border-radius: 999px; background: transparent; border: 0; color: var(--c-text-mute); font-size: 13px; font-weight: 500; cursor: pointer; transition: background 200ms, color 200ms; }
    .filter-pill[data-active="true"] { background: white; color: var(--c-ink); box-shadow: 0 2px 8px -2px rgba(11,27,61,0.15); }
    .filter-pill:hover { color: var(--c-ink); }

    .booth-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    @media (max-width: 1080px) { .booth-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 700px)  { .booth-grid { grid-template-columns: 1fr; } }

    .proj { border-radius: 22px; overflow: hidden; background: white; border: 1px solid var(--c-line-soft); transition: transform 360ms var(--ease), box-shadow 360ms var(--ease); position: relative; }
    .proj:hover { transform: translateY(-4px); box-shadow: 0 30px 60px -30px rgba(11,27,61,0.30); }

    .proj-thumb { position: relative; aspect-ratio: 4 / 3; overflow: hidden; background-size: cover; background-position: center; }
    .proj-match {
      position: absolute; top: 12px; right: 12px;
      background: rgba(255,255,255,0.92); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
      padding: 6px 10px; border-radius: 999px; font-size: 11px; font-weight: 500; color: var(--c-royal);
      display: inline-flex; align-items: center; gap: 6px; border: 0.5px solid rgba(255,255,255,0.6);
    }
    .match-dot { width: 6px; height: 6px; border-radius: 50%; background: #19B074; box-shadow: 0 0 6px #19B074; }

    .proj-body { padding: 18px 20px 22px; }
    .proj-meta { display: flex; align-items: center; gap: 10px; font-size: 11px; letter-spacing: 0.06em; color: var(--c-text-faint); text-transform: uppercase; font-weight: 500; margin-bottom: 10px; }
    .proj-meta .sep { width: 3px; height: 3px; border-radius: 50%; background: var(--c-text-faint); }
    .proj-title { font-family: var(--sans); font-weight: 700; font-size: 20px; line-height: 1.22; color: var(--c-ink); letter-spacing: -0.015em; margin: 0; }
    .proj-team { margin-top: 10px; font-size: 12px; color: var(--c-text-mute); }
    .proj-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }
    .proj-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 16px; font-size: 13px; font-weight: 600; color: var(--c-royal); transition: gap 240ms var(--ease); }
    .proj-link:hover { gap: 10px; }
  `]
})
export class FeaturedComponent {
  @Input() projects: Project[] = [];

  filters = [
    { key: 'LANDING.FEATURED.FILTER_ALL', value: 'ALL' },
    { key: 'LANDING.FEATURED.F_ENGINEERING', value: 'Engineering' },
    { key: 'LANDING.FEATURED.F_HEALTH',      value: 'Health' },
    { key: 'LANDING.FEATURED.F_ENVIRONMENT', value: 'Environment' },
    { key: 'LANDING.FEATURED.F_AI',          value: 'AI' },
    { key: 'LANDING.FEATURED.F_ENERGY',      value: 'Energy' },
  ];
  activeFilter = 'ALL';

  demoProjects = [
    { cat: 'Engineering', match: 96, bg: "url('assets/images/project-engineering.png')",
      title: 'Lean Six‑Sigma DMAIC for Manufacturing', team: 'Mahmoud Saleh · 4 collaborators',
      tags: ['Operations', 'Manufacturing', 'Process'] },
    { cat: 'Health', match: 91, bg: "url('assets/images/project-health.png')",
      title: 'Possible Role of Parental Microbiomes', team: 'Layan Odeh · 3 collaborators',
      tags: ['Bioinformatics', 'Genomics', 'Public Health'] },
    { cat: 'Environment', match: 89, bg: "url('assets/images/project-environment.png')",
      title: 'Cooling Technologies in Data Centers', team: 'Yousef Hamdan · 5 collaborators',
      tags: ['Sustainability', 'Hardware', 'Energy'] },
    { cat: 'AI', match: 94, bg: "url('assets/images/project-ai.png')",
      title: 'Arabic NLP for Legal Document Search', team: 'Salma Khoury · 4 collaborators',
      tags: ['NLP', 'Transformers', 'Search'] },
    { cat: 'Engineering', match: 86, bg: "url('assets/images/project-construction.png')",
      title: 'Modular Concrete Forms for Low‑Rise Housing', team: 'Tariq Nasr · 6 collaborators',
      tags: ['Civil', 'Construction', 'Cost'] },
    { cat: 'Environment', match: 92, bg: "url('assets/images/project-energy.png')",
      title: 'Greywater Reclamation for Urban Farms', team: 'Rana Issa · 3 collaborators',
      tags: ['Water', 'Urban', 'Agritech'] },
  ];

  filteredDemo() {
    return this.activeFilter === 'ALL'
      ? this.demoProjects
      : this.demoProjects.filter(p => p.cat === this.activeFilter);
  }

  thumbGradient(sector: string): string {
    const map: Record<string, string> = {
      engineering: "url('assets/images/project-engineering.png')",
      health:      "url('assets/images/project-health.png')",
      environment: "url('assets/images/project-environment.png')",
      agriculture: "url('assets/images/project-environment.png')",
      energy:      "url('assets/images/project-energy.png')",
      information_technology: "url('assets/images/project-ai.png')",
    };
    const key = (sector || '').toLowerCase();
    return map[key] ?? CAT_GRADIENTS['default'];
  }
}
