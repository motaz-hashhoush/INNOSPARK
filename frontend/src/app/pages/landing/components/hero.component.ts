import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

interface Particle {
  left: string;
  top: string;
  dx: string;
  dy: string;
  dur: string;
  del: string;
  size: number;
}

@Component({
  selector: 'app-landing-hero',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, RevealDirective],
  template: `
    <section class="hero" id="home">
      <!-- background photo + dark overlay set via binding so the path resolves correctly -->
      <div class="hero-photo" [style.backgroundImage]="'url(assets/images/hero-bg.png)'" aria-hidden="true"></div>
      <div class="hero-overlay" aria-hidden="true"></div>
      <div class="hero-grid-bg"></div>
      <div class="mesh" aria-hidden="true"><span></span></div>
      <div class="grain" aria-hidden="true"></div>

      <!-- Spark Particles -->
      <div class="spark-field">
        <span *ngFor="let p of particles" class="spark-particle" [style]="{
          left: p.left, top: p.top,
          width: p.size + 'px', height: p.size + 'px',
          '--dx': p.dx, '--dy': p.dy, '--dur': p.dur, '--del': p.del
        }"></span>
      </div>

      <div class="container hero-inner">
        <div appReveal>
          <span class="hero-pill">
            <span class="spark-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="url(#pillg)">
                <defs>
                  <linearGradient id="pillg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#1E6BFF"/><stop offset="1" stopColor="#7AB8FF"/>
                  </linearGradient>
                </defs>
                <path d="M13 2L3 14h7l-1 8 11-14h-7l1-6h-1z" />
              </svg>
            </span>
            {{ 'LANDING.HERO.PILL' | translate }}
          </span>
        </div>

        <div appReveal [delay]="120">
          <h1 #wordmark class="wordmark">innoPark</h1>
        </div>

        <div appReveal [delay]="240">
          <h2 #tagline class="hero-tag">
            {{ 'LANDING.HERO.TAGLINE_1' | translate }}<em>{{ 'LANDING.HERO.TAGLINE_EM' | translate }}</em>{{ 'LANDING.HERO.TAGLINE_2' | translate }}
          </h2>
        </div>

        <div appReveal [delay]="340">
          <p class="hero-sub">{{ 'LANDING.HERO.SUB' | translate }}</p>
        </div>

        <div appReveal [delay]="420" class="hero-cta">
          <a routerLink="/projects" class="btn btn-primary">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="margin-right: 8px;">
              <path d="M13 2L3 14h7l-1 8 11-14h-7l1-6h-1z" />
            </svg>
            {{ 'LANDING.HERO.CTA_EXPLORE' | translate }}
            <span class="btn-arrow">→</span>
          </a>
          <a routerLink="/projects/submit" class="btn btn-outline">{{ 'LANDING.HERO.CTA_SUBMIT' | translate }}</a>
        </div>

        <div appReveal [delay]="520" class="hero-meta">
          <span class="hero-meta-dot"></span>
          <span>{{ 'LANDING.HERO.META_LIVE' | translate }}</span>
          <span style="opacity: 0.4;">·</span>
          <span>{{ 'LANDING.HERO.META_PROJECTS' | translate }}</span>
          <span style="opacity: 0.4;">·</span>
          <span>{{ 'LANDING.HERO.META_PARTNERS' | translate }}</span>
        </div>
      </div>

      <div class="scroll-cue">
        <span>Scroll</span>
        <span class="line"></span>
      </div>
    </section>
  `,
  styles: [`
    .hero {
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      padding: 140px 0 100px;
      overflow: hidden;
      text-align: center;
      background-color: #0A1B3D;
    }
    .hero-photo {
      position: absolute; inset: 0; z-index: 0;
      background-size: cover; background-position: center top;
    }
    .hero-overlay {
      position: absolute; inset: 0; z-index: 1;
      background: linear-gradient(180deg, rgba(10,27,61,0.82) 0%, rgba(10,27,61,0.60) 45%, rgba(10,27,61,0.88) 100%);
    }
    .hero-inner { position: relative; z-index: 3; display: flex; flex-direction: column; align-items: center; gap: 36px; width: 100%; }
    
    .hero-pill {
      display: inline-flex; align-items: center; gap: 10px; padding: 8px 16px 8px 12px;
      border-radius: 999px; background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(16px); border: 0.5px solid rgba(11, 27, 61, 0.08);
      font-size: 11px; font-weight: 600; letter-spacing: 0.16em;
      text-transform: uppercase; color: var(--c-royal);
      box-shadow: 0 8px 24px -10px rgba(11, 27, 61, 0.12);
    }
    .hero-pill .spark-icon { width: 18px; height: 18px; display: inline-grid; place-items: center; }

    .wordmark {
      font-family: var(--serif);
      font-weight: 800;
      font-size: clamp(72px, 14vw, 220px);
      line-height: 0.85;
      letter-spacing: -0.045em;
      background: linear-gradient(180deg, var(--c-royal) 0%, var(--c-blue) 50%, var(--c-azure) 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      margin: 0;
      position: relative;
      display: inline-block;
      transition: transform 0.1s ease-out;
    }
    .wordmark::after {
      content: ""; position: absolute; left: 50%; bottom: -8%; transform: translateX(-50%);
      width: 60%; height: 30%; background: radial-gradient(ellipse, var(--c-azure), transparent 70%);
      filter: blur(40px); opacity: 0.45; z-index: -1;
    }

    .hero-tag {
      font-family: var(--serif); font-weight: 700;
      font-size: clamp(26px, 3.2vw, 44px); line-height: 1.16;
      letter-spacing: -0.022em; color: white;
      max-width: 24ch; margin: 0 auto;
      transition: transform 0.1s ease-out;
    }
    .hero-tag em { font-style: italic; color: var(--c-azure); }

    .hero-sub { font-size: 17px; line-height: 1.55; color: rgba(255,255,255,0.72); max-width: 56ch; margin: -8px auto 0; }
    .hero-cta { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }
    .hero .btn-outline { border-color: rgba(255,255,255,0.35); color: white; }
    .hero .btn-outline:hover { border-color: white; background: rgba(255,255,255,0.08); }

    .hero-meta { display: flex; align-items: center; gap: 18px; margin-top: 32px; font-size: 12px; color: rgba(255,255,255,0.48); letter-spacing: 0.04em; }
    .hero-meta-dot {
      width: 6px; height: 6px; border-radius: 50%; background: var(--c-blue);
      box-shadow: 0 0 8px var(--c-blue); animation: pulse 2.4s ease-in-out infinite;
    }

    .spark-field { position: absolute; inset: 0; z-index: 2; pointer-events: none; overflow: hidden; }
    .spark-particle {
      position: absolute; border-radius: 50%; background: var(--c-azure);
      box-shadow: 0 0 8px var(--c-azure), 0 0 16px var(--c-blue);
      animation: spark-drift var(--dur, 12s) ease-in-out infinite;
      animation-delay: var(--del, 0s); opacity: 0;
    }

    .hero-grid-bg {
      position: absolute; inset: 0;
      background-image: linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px);
      background-size: 80px 80px;
      mask-image: radial-gradient(ellipse 80% 60% at center, black, transparent 80%);
      z-index: 0;
    }

    .scroll-cue {
      position: absolute; bottom: 36px; left: 50%; transform: translateX(-50%);
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(255,255,255,0.4); z-index: 3;
    }
    .scroll-cue .line { width: 1px; height: 36px; background: linear-gradient(to bottom, transparent, var(--c-blue)); position: relative; overflow: hidden; }
    .scroll-cue .line::after {
      content: ""; position: absolute; top: -10px; left: 0; width: 100%; height: 10px;
      background: var(--c-blue); animation: scroll-tick 2.2s ease-in-out infinite;
    }

    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.7); } }
  `]
})
export class HeroComponent implements OnInit {
  @ViewChild('wordmark') wordmark!: ElementRef;
  @ViewChild('tagline') tagline!: ElementRef;

  particles: Particle[] = [];

  ngOnInit() {
    this.generateParticles();
  }

  generateParticles() {
    const n = 15;
    this.particles = Array.from({ length: n }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${50 + Math.random() * 50}%`,
      dx: `${(Math.random() - 0.5) * 240}px`,
      dy: `${-200 - Math.random() * 300}px`,
      dur: `${8 + Math.random() * 10}s`,
      del: `${Math.random() * 6}s`,
      size: 2 + Math.random() * 4
    }));
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const x = (e.clientX - w / 2) / w;
    const y = (e.clientY - h / 2) / h;
    
    if (this.wordmark) {
      this.wordmark.nativeElement.style.transform = `translate(${x * 16}px, ${y * 10}px)`;
    }
    if (this.tagline) {
      this.tagline.nativeElement.style.transform = `translate(${x * -8}px, ${y * -4}px)`;
    }
  }
}
