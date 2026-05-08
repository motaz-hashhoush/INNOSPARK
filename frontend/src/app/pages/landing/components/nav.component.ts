import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-landing-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <nav class="nav" [attr.data-scrolled]="isScrolled">
      <div class="container nav-inner">
        <a routerLink="/" class="nav-logo">
          <div class="dot"></div>
          INNOSPARK
        </a>

        <div class="nav-links">
          <a routerLink="/">{{ 'LANDING.NAV.HOME' | translate }}</a>
          <a routerLink="/projects">{{ 'LANDING.NAV.VIRTUAL_BOOTH' | translate }}</a>
          <a routerLink="/challenges">{{ 'LANDING.NAV.CHALLENGES' | translate }}</a>
          <a routerLink="/pipeline">{{ 'LANDING.NAV.PIPELINE' | translate }}</a>
          <a routerLink="/dashboard">{{ 'LANDING.NAV.DASHBOARD' | translate }}</a>
        </div>

        <div class="nav-cta">
          <button class="btn btn-ghost lang-toggle" (click)="toggleLanguage()">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>
            </svg>
            <span>{{ isRtl ? 'EN' : 'عربي' }}</span>
          </button>
          <a routerLink="/auth/login" class="btn btn-ghost">{{ 'LANDING.NAV.LOGIN' | translate }}</a>
          <a routerLink="/auth/register" class="btn btn-primary">{{ 'LANDING.NAV.REGISTER' | translate }}</a>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .nav {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 100;
      padding: 16px 0;
      transition: backdrop-filter 240ms, background-color 240ms;
    }
    .nav[data-scrolled="true"] {
      background: rgba(251, 252, 255, 0.7);
      -webkit-backdrop-filter: blur(20px) saturate(140%);
      backdrop-filter: blur(20px) saturate(140%);
      border-bottom: 0.5px solid var(--c-line-soft);
    }
    .nav-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 32px;
    }
    .nav-logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-family: var(--serif);
      font-size: 22px;
      letter-spacing: -0.01em;
      color: rgba(255,255,255,0.95);
      font-weight: 600;
      text-decoration: none;
      transition: color 240ms;
    }
    .nav[data-scrolled="true"] .nav-logo { color: var(--c-ink); }
    .nav-logo .dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--c-blue), var(--c-azure));
      box-shadow: 0 0 12px var(--c-blue);
    }
    .nav-links {
      display: flex; gap: 4px;
      font-size: 14px;
      color: rgba(255,255,255,0.75);
    }
    .nav-links a {
      padding: 8px 14px;
      border-radius: 999px;
      transition: color 200ms, background 200ms;
      text-decoration: none;
      color: inherit;
    }
    .nav-links a:hover { color: white; background: rgba(255,255,255,0.10); }
    .nav[data-scrolled="true"] .nav-links { color: var(--c-text-mute); }
    .nav[data-scrolled="true"] .nav-links a:hover { color: var(--c-ink); background: rgba(11,27,61,0.04); }
    .nav-cta { display: flex; gap: 8px; align-items: center; }
    .nav .btn-ghost { color: rgba(255,255,255,0.85); border-color: rgba(255,255,255,0.25); }
    .nav .btn-ghost:hover { color: white; border-color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.08); }
    .nav[data-scrolled="true"] .btn-ghost { color: var(--c-ink); border-color: transparent; }
    .nav[data-scrolled="true"] .btn-ghost:hover { color: var(--c-ink); background: rgba(11,27,61,0.04); }
    .lang-toggle { padding: 8px 14px; font-size: 13px; gap: 6px; }

    @media (max-width: 880px) { .nav-links { display: none; } }
    @media (max-width: 640px) { .lang-toggle { display: none; } }
  `]
})
export class NavComponent {
  isScrolled = false;
  isRtl = false;

  constructor(private translate: TranslateService) {}

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  toggleLanguage() {
    const newLang = this.isRtl ? 'en' : 'ar';
    this.translate.use(newLang);
    this.isRtl = !this.isRtl;
    document.documentElement.dir = this.isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  }
}
