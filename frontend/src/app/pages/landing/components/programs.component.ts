import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

@Component({
  selector: 'app-landing-programs',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, RevealDirective],
  template: `
    <section class="programs section" id="programs">
      <div class="container">
        <div appReveal><span class="kicker">{{ 'LANDING.PROGRAMS.KICKER' | translate }}</span></div>
        <div class="section-head" style="margin-top: 18px;">
          <div appReveal>
            <h2 class="h-section">{{ 'LANDING.PROGRAMS.TITLE_1' | translate }}<br>{{ 'LANDING.PROGRAMS.TITLE_2' | translate }}<em class="serif-italic" style="color:var(--c-blue);">{{ 'LANDING.PROGRAMS.TITLE_EM' | translate }}</em>{{ 'LANDING.PROGRAMS.TITLE_3' | translate }}</h2>
          </div>
          <div appReveal [delay]="120">
            <p class="lead">{{ 'LANDING.PROGRAMS.LEAD' | translate }}</p>
          </div>
        </div>

        <div class="prog-grid">
          <article *ngFor="let it of items; let i = index" class="prog-card" appReveal [delay]="i * 90">
            <div class="prog-thumb" [style.backgroundImage]="it.thumbBg">
              <span class="prog-cat">{{ it.catKey | translate }}</span>
            </div>
            <div class="prog-body">
              <h3 class="prog-title">{{ it.titleKey | translate }}</h3>
              <p class="prog-desc">{{ it.descKey | translate }}</p>
              <div class="prog-links">
                <a *ngFor="let link of it.links" [routerLink]="link.path" class="prog-link">
                  <span>{{ link.labelKey | translate }}</span>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .programs { background: linear-gradient(180deg, var(--c-bg) 0%, #EEF3FE 60%, var(--c-bg) 100%); }

    .prog-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
    @media (max-width: 1080px) { .prog-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px)  { .prog-grid { grid-template-columns: 1fr; } }

    .prog-card {
      position: relative; border-radius: 22px; overflow: hidden; background: white;
      border: 1px solid var(--c-line-soft); box-shadow: 0 1px 2px rgba(11,27,61,0.04);
      transition: transform 360ms var(--ease), box-shadow 360ms var(--ease), border-color 240ms;
      display: flex; flex-direction: column;
    }
    .prog-card:hover { transform: translateY(-6px); box-shadow: 0 30px 60px -25px rgba(11,27,61,0.25); border-color: rgba(30,107,255,0.30); }

    .prog-thumb {
      position: relative; aspect-ratio: 4 / 3; overflow: hidden;
      background: linear-gradient(135deg, rgba(30,107,255,0.10), rgba(122,184,255,0.18));
      background-size: cover; background-position: center;
    }
    .prog-cat {
      position: absolute; top: 14px; left: 14px;
      background: rgba(255,255,255,0.92); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
      padding: 6px 10px; border-radius: 999px; font-size: 10px; font-weight: 700;
      color: var(--c-royal); letter-spacing: 0.14em; text-transform: uppercase;
      border: 0.5px solid rgba(255,255,255,0.6); z-index: 2;
    }

    .prog-body { padding: 22px 22px 24px; display: flex; flex-direction: column; flex: 1; gap: 12px; }
    .prog-title { font-family: var(--sans); font-weight: 700; font-size: 22px; line-height: 1.18; letter-spacing: -0.018em; color: var(--c-ink); margin: 0; }
    .prog-desc { font-size: 13px; line-height: 1.5; color: var(--c-text-mute); margin: 0; }

    .prog-links { margin-top: auto; padding-top: 14px; border-top: 1px solid var(--c-line-soft); display: flex; flex-direction: column; gap: 8px; }
    .prog-link {
      display: flex; align-items: center; justify-content: space-between;
      font-size: 13px; font-weight: 600; color: var(--c-ink); padding: 6px 0;
      transition: color 200ms; text-decoration: none;
    }
    .prog-link svg { color: var(--c-blue); transition: transform 240ms var(--ease); }
    .prog-link:hover { color: var(--c-blue); }
    .prog-link:hover svg { transform: translateX(4px); }
  `]
})
export class ProgramsComponent {
  items = [
    {
      catKey: 'LANDING.PROGRAMS.P1_CAT', titleKey: 'LANDING.PROGRAMS.P1_TITLE',
      thumbBg: "url('assets/images/program-booth.png')",
      descKey: 'LANDING.PROGRAMS.P1_DESC',
      links: [{ labelKey: 'LANDING.PROGRAMS.P1_L1', path: '/projects' }, { labelKey: 'LANDING.PROGRAMS.P1_L2', path: '/projects/submit' }],
    },
    {
      catKey: 'LANDING.PROGRAMS.P2_CAT', titleKey: 'LANDING.PROGRAMS.P2_TITLE',
      thumbBg: "url('assets/images/program-challenges.png')",
      descKey: 'LANDING.PROGRAMS.P2_DESC',
      links: [{ labelKey: 'LANDING.PROGRAMS.P2_L1', path: '/challenges' }, { labelKey: 'LANDING.PROGRAMS.P2_L2', path: '/challenges/submit' }],
    },
    {
      catKey: 'LANDING.PROGRAMS.P3_CAT', titleKey: 'LANDING.PROGRAMS.P3_TITLE',
      thumbBg: "url('assets/images/program-matcher.png')",
      descKey: 'LANDING.PROGRAMS.P3_DESC',
      links: [{ labelKey: 'LANDING.PROGRAMS.P3_L1', path: '/guest-match' }, { labelKey: 'LANDING.PROGRAMS.P3_L2', path: '/dashboard' }],
    },
    {
      catKey: 'LANDING.PROGRAMS.P4_CAT', titleKey: 'LANDING.PROGRAMS.P4_TITLE',
      thumbBg: "url('assets/images/program-pipeline.png')",
      descKey: 'LANDING.PROGRAMS.P4_DESC',
      links: [{ labelKey: 'LANDING.PROGRAMS.P4_L1', path: '/pipeline' }, { labelKey: 'LANDING.PROGRAMS.P4_L2', path: '/auth/register' }],
    },
  ];
}
