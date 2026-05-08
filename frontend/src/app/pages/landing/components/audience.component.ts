import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

@Component({
  selector: 'app-landing-audience',
  standalone: true,
  imports: [CommonModule, TranslateModule, RevealDirective],
  template: `
    <section class="section" id="about" style="background: linear-gradient(180deg, transparent, rgba(244,247,254,0.55));">
      <div class="container">
        <div appReveal><span class="kicker">{{ 'LANDING.AUDIENCE.KICKER' | translate }}</span></div>
        <div class="section-head" style="margin-top: 18px;">
          <div appReveal>
            <h2 class="h-section">{{ 'LANDING.AUDIENCE.TITLE_1' | translate }}<br>{{ 'LANDING.AUDIENCE.TITLE_2' | translate }}<em class="serif-italic" style="color: var(--c-blue);">{{ 'LANDING.AUDIENCE.TITLE_EM' | translate }}</em>{{ 'LANDING.AUDIENCE.TITLE_3' | translate }}</h2>
          </div>
          <div appReveal [delay]="120">
            <p class="lead">{{ 'LANDING.AUDIENCE.LEAD' | translate }}</p>
          </div>
        </div>

        <div class="aud-grid">
          <div *ngFor="let it of items; let i = index" class="aud-card" appReveal [delay]="i * 100">
            <div>
              <div class="aud-tag"><span class="num">{{ it.n }}</span><span>{{ it.tagKey | translate }}</span></div>
              <div class="aud-icon">
                <span [innerHTML]="it.svg"></span>
              </div>
              <h3 class="aud-title" style="white-space: pre-line;">{{ it.titleKey | translate }}</h3>
              <p class="aud-sub">{{ it.descKey | translate }}</p>
            </div>
            <ul class="aud-list">
              <li *ngFor="let b of it.bulletKeys">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12l5 5L20 7" />
                </svg>
                <span>{{ b | translate }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .aud-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    @media (max-width: 1080px) { .aud-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .aud-grid { grid-template-columns: 1fr; } }

    .aud-card {
      position: relative; border-radius: 22px; padding: 28px 24px 24px; min-height: 360px;
      display: flex; flex-direction: column; justify-content: space-between;
      background: white; border: 1px solid var(--c-line-soft); overflow: hidden;
      transition: transform 360ms var(--ease), box-shadow 360ms var(--ease), border-color 240ms;
      isolation: isolate;
    }
    .aud-card::before { content: ""; position: absolute; inset: 0; background: radial-gradient(120% 90% at 100% 0%, rgba(30,107,255,0.08), transparent 60%); opacity: 0; transition: opacity 360ms var(--ease); z-index: -1; }
    .aud-card:hover { transform: translateY(-4px); border-color: rgba(30,107,255,0.35); box-shadow: 0 30px 60px -30px rgba(11, 27, 61, 0.25); }
    .aud-card:hover::before { opacity: 1; }

    .aud-tag { font-size: 11px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: var(--c-blue); display: inline-flex; align-items: center; gap: 8px; margin-bottom: 18px; }
    .aud-tag .num { font-family: var(--serif); font-size: 14px; letter-spacing: 0; }

    .aud-icon { width: 56px; height: 56px; margin-bottom: 18px; border-radius: 16px; background: linear-gradient(135deg, var(--c-royal), var(--c-blue)); display: grid; place-items: center; color: white; box-shadow: 0 12px 30px -12px rgba(30,107,255,0.55); }
    .aud-icon ::ng-deep svg { width: 26px; height: 26px; }

    .aud-title { font-family: var(--serif); font-weight: 700; font-size: 26px; line-height: 1.18; color: var(--c-ink); letter-spacing: -0.02em; margin: 0 0 14px; padding-bottom: 0.04em; }
    .aud-sub { font-size: 14px; color: var(--c-text-mute); line-height: 1.5; margin: 0; }

    .aud-list { margin: 22px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 10px; border-top: 1px solid var(--c-line-soft); padding-top: 18px; }
    .aud-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: var(--c-text); }
    .aud-list li svg { flex-shrink: 0; margin-top: 2px; color: var(--c-blue); }
  `]
})
export class AudienceComponent {
  items: { n: string; tagKey: string; titleKey: string; descKey: string; bulletKeys: string[]; svg: SafeHtml }[];

  private rawSvgs = [
    // 01 Innovators — graduation cap
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 4L2 9l10 5 10-5-10-5z" fill="white" fill-opacity="0.28"/>
      <path d="M6 11.5v5c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5v-5"/>
      <line x1="22" y1="9" x2="22" y2="14"/>
      <circle cx="22" cy="14" r="1" fill="white" fill-opacity="0.5"/>
    </svg>`,
    // 02 Supervisors — eye / oversight
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" fill="white" fill-opacity="0.18"/>
      <circle cx="12" cy="12" r="3.5" fill="white" fill-opacity="0.30"/>
      <circle cx="12" cy="12" r="1.5" fill="white" fill-opacity="0.55"/>
    </svg>`,
    // 03 Industry — office building
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="8" width="11" height="13" rx="1" fill="white" fill-opacity="0.20"/>
      <path d="M14 11V3h7v18" fill="white" fill-opacity="0.14"/>
      <line x1="3" y1="21" x2="21" y2="21"/>
      <line x1="6" y1="12" x2="6" y2="12.01"/>
      <line x1="10" y1="12" x2="10" y2="12.01"/>
      <line x1="6" y1="16" x2="6" y2="16.01"/>
      <line x1="10" y1="16" x2="10" y2="16.01"/>
      <line x1="17" y1="7"  x2="17" y2="7.01"/>
      <line x1="17" y1="11" x2="17" y2="11.01"/>
      <line x1="17" y1="15" x2="17" y2="15.01"/>
    </svg>`,
    // 04 Administration — dashboard grid
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3"  y="3"  width="7" height="7" rx="1.5" fill="white" fill-opacity="0.30"/>
      <rect x="14" y="3"  width="7" height="7" rx="1.5" fill="white" fill-opacity="0.18"/>
      <rect x="3"  y="14" width="7" height="7" rx="1.5" fill="white" fill-opacity="0.18"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5" fill="white" fill-opacity="0.30"/>
    </svg>`,
  ];

  constructor(private sanitizer: DomSanitizer) {
    const meta = [
      { n: '01', tagKey: 'LANDING.AUDIENCE.ROLE1_TAG', titleKey: 'LANDING.AUDIENCE.ROLE1_TITLE', descKey: 'LANDING.AUDIENCE.ROLE1_DESC', bulletKeys: ['LANDING.AUDIENCE.ROLE1_B1', 'LANDING.AUDIENCE.ROLE1_B2', 'LANDING.AUDIENCE.ROLE1_B3'] },
      { n: '02', tagKey: 'LANDING.AUDIENCE.ROLE2_TAG', titleKey: 'LANDING.AUDIENCE.ROLE2_TITLE', descKey: 'LANDING.AUDIENCE.ROLE2_DESC', bulletKeys: ['LANDING.AUDIENCE.ROLE2_B1', 'LANDING.AUDIENCE.ROLE2_B2', 'LANDING.AUDIENCE.ROLE2_B3'] },
      { n: '03', tagKey: 'LANDING.AUDIENCE.ROLE3_TAG', titleKey: 'LANDING.AUDIENCE.ROLE3_TITLE', descKey: 'LANDING.AUDIENCE.ROLE3_DESC', bulletKeys: ['LANDING.AUDIENCE.ROLE3_B1', 'LANDING.AUDIENCE.ROLE3_B2', 'LANDING.AUDIENCE.ROLE3_B3'] },
      { n: '04', tagKey: 'LANDING.AUDIENCE.ROLE4_TAG', titleKey: 'LANDING.AUDIENCE.ROLE4_TITLE', descKey: 'LANDING.AUDIENCE.ROLE4_DESC', bulletKeys: ['LANDING.AUDIENCE.ROLE4_B1', 'LANDING.AUDIENCE.ROLE4_B2', 'LANDING.AUDIENCE.ROLE4_B3'] },
    ];
    this.items = meta.map((m, i) => ({
      ...m,
      svg: this.sanitizer.bypassSecurityTrustHtml(this.rawSvgs[i]),
    }));
  }
}
