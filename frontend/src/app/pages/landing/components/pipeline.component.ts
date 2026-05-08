import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

@Component({
  selector: 'app-landing-pipeline',
  standalone: true,
  imports: [CommonModule, TranslateModule, RevealDirective],
  template: `
    <section class="section" id="pipeline">
      <div class="container">
        <div appReveal><span class="kicker">{{ 'LANDING.PIPELINE.KICKER' | translate }}</span></div>
        <div class="section-head" style="margin-top: 18px;">
          <div appReveal>
            <h2 class="h-section">{{ 'LANDING.PIPELINE.TITLE_1' | translate }}<em class="serif-italic" style="color: var(--c-blue);">{{ 'LANDING.PIPELINE.TITLE_EM' | translate }}</em>{{ 'LANDING.PIPELINE.TITLE_2' | translate }}</h2>
          </div>
          <div appReveal [delay]="120">
            <p class="lead">{{ 'LANDING.PIPELINE.LEAD' | translate }}</p>
          </div>
        </div>

        <div appReveal [delay]="240">
          <div class="pipeline">
            <div class="pipe-track"></div>
            <div class="pipe-step" *ngFor="let step of steps">
              <div class="pipe-num">{{ step.n }}</div>
              <div class="pipe-icon">
                <span [innerHTML]="step.svg"></span>
              </div>
              <div class="pipe-title">{{ step.tKey | translate }}</div>
              <div class="pipe-desc">{{ step.dKey | translate }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .pipeline { position: relative; display: grid; grid-template-columns: repeat(6, 1fr); gap: 0; padding: 24px 0; }
    @media (max-width: 1080px) { .pipeline { grid-template-columns: repeat(3, 1fr); row-gap: 32px; } }
    @media (max-width: 600px) { .pipeline { grid-template-columns: repeat(2, 1fr); } }

    .pipe-step { position: relative; padding: 20px 18px 22px; border-right: 1px solid var(--c-line-soft); cursor: default; transition: background 240ms var(--ease); }
    .pipe-step:last-child { border-right: 0; }
    .pipe-step:hover { background: rgba(30, 107, 255, 0.04); }

    .pipe-num { font-family: var(--serif); font-size: 12px; font-weight: 700; color: var(--c-blue); letter-spacing: 0.14em; }
    .pipe-icon {
      width: 60px; height: 60px; margin: 14px 0 16px; border-radius: 16px;
      background: linear-gradient(135deg, rgba(30,107,255,0.14) 0%, rgba(122,184,255,0.22) 100%);
      border: 1px solid rgba(30,107,255,0.28);
      box-shadow: 0 4px 16px -4px rgba(30,107,255,0.20);
      display: grid; place-items: center; color: var(--c-royal);
      transition: transform 240ms var(--ease), box-shadow 240ms var(--ease), background 240ms;
    }
    .pipe-step:hover .pipe-icon {
      background: linear-gradient(135deg, rgba(30,107,255,0.22) 0%, rgba(122,184,255,0.32) 100%);
      box-shadow: 0 8px 24px -6px rgba(30,107,255,0.35);
      transform: translateY(-2px);
    }
    .pipe-icon ::ng-deep svg { width: 28px; height: 28px; }

    .pipe-title { font-family: var(--serif); font-weight: 700; font-size: 19px; line-height: 1.15; color: var(--c-ink); letter-spacing: -0.015em; }
    .pipe-desc { margin-top: 8px; font-size: 13px; line-height: 1.45; color: var(--c-text-mute); }

    .pipe-track { position: absolute; top: 92px; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--c-line), transparent); z-index: 0; pointer-events: none; }
    .pipe-track::after {
      content: ""; position: absolute; top: -2px; left: 0; width: 80px; height: 5px;
      background: linear-gradient(90deg, transparent, var(--c-blue), transparent);
      filter: blur(2px); animation: pipePulse 5s ease-in-out infinite;
    }
  `]
})
export class PipelineComponent {
  steps: { n: string; tKey: string; dKey: string; svg: SafeHtml }[];

  private rawSvgs = [
    // 01 Submission — document upload
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="currentColor" fill-opacity="0.14"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="12" y1="18" x2="12" y2="12"/>
      <polyline points="9,15 12,12 15,15"/>
    </svg>`,
    // 02 Evaluation — clipboard with checkmark
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" fill="currentColor" fill-opacity="0.12"/>
      <rect x="9" y="3" width="6" height="4" rx="1" ry="1" fill="currentColor" fill-opacity="0.22"/>
      <path d="M9 14l2 2 4-4"/>
    </svg>`,
    // 03 AI Matching — network nodes
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="5"  r="2.5" fill="currentColor" fill-opacity="0.22"/>
      <circle cx="5"  cy="19" r="2.5" fill="currentColor" fill-opacity="0.22"/>
      <circle cx="19" cy="19" r="2.5" fill="currentColor" fill-opacity="0.22"/>
      <line x1="12" y1="7.5" x2="12" y2="13"/>
      <line x1="10.8" y1="13.6" x2="6.3"  y2="17.1"/>
      <line x1="13.2" y1="13.6" x2="17.7" y2="17.1"/>
      <circle cx="12" cy="13" r="2" fill="currentColor" fill-opacity="0.18"/>
    </svg>`,
    // 04 Incubation — lightbulb
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 1 6 6c0 2.6-1.5 4.8-3 6v1H9v-1c-1.5-1.2-3-3.4-3-6a6 6 0 0 1 6-6z" fill="currentColor" fill-opacity="0.14"/>
    </svg>`,
    // 05 Partnership — handshake
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 12l4-4h4l2 2 2-2h4l4 4-8 8-8-8z" fill="currentColor" fill-opacity="0.14"/>
      <path d="M12 10v4M10 12h4"/>
      <path d="M6 8V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3"/>
    </svg>`,
    // 06 Market — rocket
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" fill="currentColor" fill-opacity="0.18"/>
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" fill="currentColor" fill-opacity="0.14"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>`,
  ];

  constructor(private sanitizer: DomSanitizer) {
    const keys = [
      { n: '01', tKey: 'LANDING.PIPELINE.S1_T', dKey: 'LANDING.PIPELINE.S1_D' },
      { n: '02', tKey: 'LANDING.PIPELINE.S2_T', dKey: 'LANDING.PIPELINE.S2_D' },
      { n: '03', tKey: 'LANDING.PIPELINE.S3_T', dKey: 'LANDING.PIPELINE.S3_D' },
      { n: '04', tKey: 'LANDING.PIPELINE.S4_T', dKey: 'LANDING.PIPELINE.S4_D' },
      { n: '05', tKey: 'LANDING.PIPELINE.S5_T', dKey: 'LANDING.PIPELINE.S5_D' },
      { n: '06', tKey: 'LANDING.PIPELINE.S6_T', dKey: 'LANDING.PIPELINE.S6_D' },
    ];
    this.steps = keys.map((k, i) => ({
      ...k,
      svg: this.sanitizer.bypassSecurityTrustHtml(this.rawSvgs[i]),
    }));
  }
}
