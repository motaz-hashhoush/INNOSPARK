import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

@Component({
  selector: 'app-landing-matcher',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, RevealDirective],
  template: `
    <section class="match" id="match">
      <div class="mesh" aria-hidden="true" style="opacity: 0.55;"><span></span></div>
      <div class="container">
        <div appReveal><span class="kicker">{{ 'LANDING.MATCHER.KICKER' | translate }}</span></div>
        <div class="section-head" style="margin-top: 18px;">
          <div appReveal>
            <h2 class="h-section">{{ 'LANDING.MATCHER.TITLE_1' | translate }}<br>{{ 'LANDING.MATCHER.TITLE_2' | translate }}<em class="serif-italic" style="color: var(--c-blue);">{{ 'LANDING.MATCHER.TITLE_EM' | translate }}</em>{{ 'LANDING.MATCHER.TITLE_3' | translate }}</h2>
          </div>
          <div appReveal [delay]="120">
            <p class="lead">{{ 'LANDING.MATCHER.LEAD' | translate }}</p>
          </div>
        </div>

        <div class="match-stage" #matchStage>
          <!-- Project card -->
          <div appReveal>
            <div class="match-card">
              <div class="match-card-head">
                <div class="match-avatar">PR</div>
                <div>
                  <div class="role">{{ 'LANDING.MATCHER.PROJ_ROLE' | translate }}</div>
                  <h3 class="name">{{ 'LANDING.MATCHER.PROJ_NAME' | translate }}</h3>
                </div>
              </div>
              <p class="desc">{{ 'LANDING.MATCHER.PROJ_DESC' | translate }}</p>
              <div class="match-tags">
                <span class="tag">Python</span>
                <span class="tag">Computer Vision</span>
                <span class="tag">Agritech</span>
              </div>
            </div>
          </div>

          <!-- Connection -->
          <div class="match-svg-wrap">
            <svg class="match-svg" viewBox="0 0 240 200" fill="none">
              <defs>
                <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#0B3FA8"/>
                  <stop offset="1" stopColor="#1E6BFF"/>
                </linearGradient>
                <radialGradient id="dot-grad">
                  <stop offset="0" stopColor="#fff"/>
                  <stop offset="1" stopColor="#7AB8FF"/>
                </radialGradient>
              </defs>
              <path id="cnxA" d="M0 100 C 80 60, 160 60, 240 100" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.55"/>
              <path id="cnxB" d="M0 100 C 80 140, 160 140, 240 100" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.55"/>
              <circle r="4" fill="url(#dot-grad)">
                <animateMotion dur="3s" repeatCount="indefinite"><mpath href="#cnxA"/></animateMotion>
              </circle>
              <circle r="3" fill="url(#dot-grad)">
                <animateMotion dur="3.6s" begin="-1s" repeatCount="indefinite"><mpath href="#cnxA"/></animateMotion>
              </circle>
              <circle r="4" fill="url(#dot-grad)">
                <animateMotion dur="3.2s" begin="-0.5s" repeatCount="indefinite"><mpath href="#cnxB"/></animateMotion>
              </circle>
            </svg>
            <div class="match-pct">
              <div class="match-pct-num">{{ displayPct }}%</div>
              <div class="match-pct-lbl">{{ 'LANDING.MATCHER.MATCH_LBL' | translate }}</div>
            </div>
          </div>

          <!-- Company card -->
          <div appReveal [delay]="120">
            <div class="match-card">
              <div class="match-card-head">
                <div class="match-avatar" style="background: linear-gradient(135deg, #0A1B3D, #1E6BFF);">NA</div>
                <div>
                  <div class="role">{{ 'LANDING.MATCHER.COMP_ROLE' | translate }}</div>
                  <h3 class="name">{{ 'LANDING.MATCHER.COMP_NAME' | translate }}</h3>
                </div>
              </div>
              <p class="desc">{{ 'LANDING.MATCHER.COMP_DESC' | translate }}</p>
              <div class="match-tags">
                <span class="tag">ML/AI</span>
                <span class="tag">Satellite data</span>
                <span class="tag">Agriculture</span>
              </div>
            </div>
          </div>
        </div>

        <div appReveal [delay]="300" style="display: flex; justify-content: center; margin-top: 48px;">
          <a routerLink="/guest-match" class="btn btn-outline">
            {{ 'LANDING.MATCHER.CTA' | translate }}
            <span class="btn-arrow">→</span>
          </a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .match { position: relative; padding: 120px 0; overflow: hidden; background: linear-gradient(180deg, var(--c-bg) 0%, #EEF3FE 50%, var(--c-bg) 100%); }
    .match-stage { position: relative; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 48px; margin-top: 56px; min-height: 380px; }
    
    @media (max-width: 1080px) {
      .match-stage { grid-template-columns: 1fr; gap: 16px; }
      .match-svg-wrap { margin: 32px 0; }
    }

    .match-card { border-radius: 20px; padding: 22px; background: white; border: 1px solid var(--c-line-soft); box-shadow: 0 20px 50px -25px rgba(11,27,61,0.18); position: relative; z-index: 2; }
    .match-card-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .match-avatar { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, var(--c-royal), var(--c-azure)); flex-shrink: 0; display: grid; place-items: center; color: white; font-weight: 700; font-size: 14px; }
    .match-card .role { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--c-blue); font-weight: 600; }
    .match-card .name { font-size: 18px; font-weight: 700; color: var(--c-ink); margin: 2px 0 0; }
    .match-card .desc { font-size: 14px; color: var(--c-text-mute); line-height: 1.5; margin: 0 0 16px; }
    
    .match-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 14px; }

    .match-svg-wrap { position: relative; width: 240px; display: grid; place-items: center; z-index: 1; }
    .match-svg { width: 100%; }

    .match-pct {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: white; padding: 16px 22px; border-radius: 16px;
      border: 1px solid var(--c-line-soft);
      box-shadow: 0 16px 40px -16px rgba(11,27,61,0.25);
      text-align: center; z-index: 3;
    }
    .match-pct-num { font-family: var(--sans); font-weight: 700; font-size: 34px; line-height: 1; color: var(--c-ink); letter-spacing: -0.03em; }
    .match-pct-lbl { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--c-blue); margin-top: 4px; font-weight: 500; }
  `]
})
export class AiMatcherComponent implements OnInit {
  @ViewChild('matchStage') matchStage!: ElementRef;
  displayPct: number = 72;
  private targetPct: number = 94;
  private hasAnimated: boolean = false;

  ngOnInit() {
    this.setupIntersectionObserver();
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.hasAnimated) {
        this.animateCounter();
        this.hasAnimated = true;
      }
    }, { threshold: 0.4 });

    setTimeout(() => {
      if (this.matchStage) {
        observer.observe(this.matchStage.nativeElement);
      }
    }, 100);
  }

  animateCounter() {
    const duration = 1500;
    const startTime = performance.now();
    const startValue = this.displayPct;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      this.displayPct = Math.floor(startValue + (this.targetPct - startValue) * progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.displayPct = this.targetPct;
      }
    };

    requestAnimationFrame(animate);
  }
}
