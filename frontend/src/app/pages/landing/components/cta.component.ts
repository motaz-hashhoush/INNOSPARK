import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

@Component({
  selector: 'app-landing-cta',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, RevealDirective],
  template: `
    <section class="cta">
      <div class="mesh" aria-hidden="true"><span></span></div>
      <div class="grain"></div>
      <div class="container">
        <div class="cta-inner">
          <div appReveal>
            <h2>{{ 'LANDING.CTA.TITLE_1' | translate }}<br>{{ 'LANDING.CTA.TITLE_2' | translate }}<em>{{ 'LANDING.CTA.TITLE_EM' | translate }}</em>{{ 'LANDING.CTA.TITLE_3' | translate }}</h2>
          </div>
          <div appReveal [delay]="120">
            <div class="cta-paths">
              <p class="cta-sub">{{ 'LANDING.CTA.SUB' | translate }}</p>
              <a routerLink="/auth/register" class="btn btn-primary">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M13 2L3 14h7l-1 8 11-14h-7l1-6h-1z"/></svg>
                {{ 'LANDING.CTA.BTN_PROJECT' | translate }}
                <span class="btn-arrow">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </span>
              </a>
              <a routerLink="/challenges/submit" class="btn btn-outline">{{ 'LANDING.CTA.BTN_CHALLENGE' | translate }}</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .cta {
      position: relative; margin: 80px var(--pad-container) 60px; border-radius: 36px;
      overflow: hidden; isolation: isolate; background: var(--c-ink); color: white;
      padding: 100px 56px;
    }
    .cta .mesh::before { background: radial-gradient(circle, var(--c-blue), transparent 60%); opacity: 0.55; }
    .cta .mesh::after  { background: radial-gradient(circle, var(--c-azure), transparent 60%); opacity: 0.45; }
    .cta .mesh > span  { background: radial-gradient(circle, var(--c-royal), transparent 60%); }

    .cta-inner {
      position: relative; z-index: 2;
      display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 60px; align-items: end;
    }
    .cta h2 {
      font-family: var(--sans); font-weight: 700;
      font-size: clamp(48px, 6.4vw, 88px); line-height: 1.05; letter-spacing: -0.03em;
      color: white; margin: 0; padding-bottom: 0.04em;
    }
    .cta h2 em {
      font-style: italic;
      background: linear-gradient(120deg, var(--c-azure), white);
      -webkit-background-clip: text; background-clip: text; color: transparent;
    }
    .cta-paths { display: flex; flex-direction: column; gap: 14px; align-items: flex-start; }
    .cta-sub { font-size: 15px; color: rgba(255,255,255,0.7); max-width: 40ch; margin: 0 0 4px; }
    .cta .btn-outline { border-color: rgba(255,255,255,0.3); color: white; }
    .cta .btn-outline:hover { border-color: white; background: rgba(255,255,255,0.06); }

    @media (max-width: 880px) { .cta-inner { grid-template-columns: 1fr; gap: 32px; } }
    @media (max-width: 600px) { .cta { margin: 40px 16px; padding: 60px 28px; border-radius: 24px; } }
  `]
})
export class CtaComponent {}
