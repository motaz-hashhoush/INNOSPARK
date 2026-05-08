import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

@Component({
  selector: 'app-landing-news',
  standalone: true,
  imports: [CommonModule, TranslateModule, RevealDirective],
  template: `
    <section class="news" id="news">
      <div class="container">
        <div appReveal><span class="kicker">{{ 'LANDING.NEWS.KICKER' | translate }}</span></div>
        <div class="section-head" style="margin-top: 18px;">
          <div appReveal>
            <h2 class="h-section">{{ 'LANDING.NEWS.TITLE_1' | translate }}<em class="serif-italic" style="color:var(--c-blue);">{{ 'LANDING.NEWS.TITLE_EM' | translate }}</em>{{ 'LANDING.NEWS.TITLE_3' | translate }}</h2>
          </div>
          <div appReveal [delay]="120">
            <p class="lead">{{ 'LANDING.NEWS.LEAD' | translate }}</p>
          </div>
        </div>

        <div class="news-grid">
          <article *ngFor="let it of items; let i = index" class="news-card" appReveal [delay]="i * 100">
            <div class="news-thumb" [style.backgroundImage]="it.thumbBg"></div>
            <div class="news-body">
              <div class="news-meta">
                <span class="news-cat">{{ it.catKey | translate }}</span>
                <span class="sep"></span>
                <span>{{ it.dateKey | translate }}</span>
              </div>
              <h3 class="news-title">{{ it.titleKey | translate }}</h3>
              <p class="news-excerpt">{{ it.excerptKey | translate }}</p>
              <a href="#" class="news-read">
                {{ 'LANDING.NEWS.READ' | translate }}
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .news { padding: var(--pad-section-y) 0; }

    .news-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
    @media (max-width: 880px) { .news-grid { grid-template-columns: 1fr; } }

    .news-card { position: relative; border-radius: 22px; overflow: hidden; background: white; border: 1px solid var(--c-line-soft); transition: transform 360ms var(--ease), box-shadow 360ms var(--ease); }
    .news-card:hover { transform: translateY(-4px); box-shadow: 0 30px 60px -30px rgba(11,27,61,0.25); }

    .news-thumb { aspect-ratio: 16 / 10; overflow: hidden; background-size: cover; background-position: center; }

    .news-body { padding: 22px 22px 26px; }

    .news-meta { display: flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--c-text-faint); margin-bottom: 12px; }
    .news-cat { color: var(--c-blue); }
    .sep { width: 3px; height: 3px; border-radius: 50%; background: var(--c-text-faint); }

    .news-title { font-family: var(--sans); font-weight: 700; font-size: 21px; line-height: 1.22; letter-spacing: -0.018em; color: var(--c-ink); margin: 0; }
    .news-excerpt { margin-top: 12px; font-size: 13px; line-height: 1.55; color: var(--c-text-mute); }

    .news-read { margin-top: 16px; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--c-royal); transition: gap 240ms var(--ease); text-decoration: none; }
    .news-read:hover { gap: 10px; }
  `]
})
export class NewsComponent {
  items = [
    {
      catKey: 'LANDING.NEWS.N1_CAT', dateKey: 'LANDING.NEWS.N1_DATE',
      thumbBg: "url('assets/images/news-demoday.png')",
      titleKey: 'LANDING.NEWS.N1_TITLE',
      excerptKey: 'LANDING.NEWS.N1_EXCERPT',
    },
    {
      catKey: 'LANDING.NEWS.N2_CAT', dateKey: 'LANDING.NEWS.N2_DATE',
      thumbBg: "url('assets/images/news-partnership.png')",
      titleKey: 'LANDING.NEWS.N2_TITLE',
      excerptKey: 'LANDING.NEWS.N2_EXCERPT',
    },
    {
      catKey: 'LANDING.NEWS.N3_CAT', dateKey: 'LANDING.NEWS.N3_DATE',
      thumbBg: "url('assets/images/news-engineering.png')",
      titleKey: 'LANDING.NEWS.N3_TITLE',
      excerptKey: 'LANDING.NEWS.N3_EXCERPT',
    },
  ];
}
