import { Component, OnInit, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from './core/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, TranslateModule],
  template: `
    <!-- Global Navigation (hidden on landing page) -->
    <nav *ngIf="!isLandingPage" class="nav" [attr.data-scrolled]="isScrolled">
      <div class="container nav-inner">
        <a routerLink="/" class="nav-logo">
          <div class="dot"></div>
          innoPark
        </a>

        <div class="nav-links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">{{ 'NAV.HOME' | translate }}</a>
          <a routerLink="/projects" routerLinkActive="active">{{ 'NAV.PROJECTS' | translate }}</a>
          <a routerLink="/challenges" routerLinkActive="active">{{ 'NAV.CHALLENGES' | translate }}</a>
          <a routerLink="/dashboard" routerLinkActive="active" *ngIf="authService.isLoggedIn()">{{ 'NAV.DASHBOARD' | translate }}</a>
          <a routerLink="/pipeline" routerLinkActive="active" *ngIf="authService.hasRole('admin', 'evaluator')">{{ 'NAV.PIPELINE' | translate }}</a>
        </div>

        <div class="nav-actions">
          <button class="lang-btn" (click)="toggleLanguage()">
            {{ isRtl ? 'EN' : 'عربي' }}
          </button>

          <ng-container *ngIf="!authService.isLoggedIn()">
            <a routerLink="/auth/login" class="btn btn-ghost">{{ 'NAV.LOGIN' | translate }}</a>
            <a routerLink="/auth/register" class="btn btn-primary">{{ 'NAV.REGISTER' | translate }}</a>
          </ng-container>

          <ng-container *ngIf="authService.isLoggedIn()">
            <div class="user-profile" *ngIf="authService.currentUser$ | async as user">
              <span class="user-role badge-glass">{{ user.role | uppercase }}</span>
              <span class="user-name">{{ user.full_name || user.email }}</span>
            </div>
            <button class="btn btn-outline" (click)="logout()">{{ 'NAV.LOGOUT' | translate }}</button>
          </ng-container>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main [class.main-content]="!isLandingPage">
      <router-outlet></router-outlet>
    </main>

    <!-- Global Footer (hidden on landing page) -->
    <footer *ngIf="!isLandingPage" class="footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <a routerLink="/" class="nav-logo">
              <div class="dot"></div>
              innoPark
            </a>
            <p class="footer-bio">
              The digital innovation infrastructure of An‑Najah Innovation Park,
              connecting graduation projects with industry, capital, and impact.
            </p>
          </div>
          <div class="footer-col">
            <h5>Platform</h5>
            <ul>
              <li><a routerLink="/projects">Virtual Booth</a></li>
              <li><a routerLink="/challenges">Industry Challenges</a></li>
              <li><a routerLink="/dashboard">Dashboard</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h5>For Roles</h5>
            <ul>
              <li><a routerLink="/auth/register">Students</a></li>
              <li><a routerLink="/auth/register">Faculty</a></li>
              <li><a routerLink="/auth/register">Companies</a></li>
              <li><a routerLink="/auth/register">Administration</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h5>Innovation Park</h5>
            <ul>
              <li><a href="#">About An-Najah</a></li>
              <li><a href="#">Programs</a></li>
              <li><a href="#">Press</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© 2026 innoPark · An‑Najah Innovation Park · Nablus, Palestine</span>
          <span class="anu">Powered by An‑Najah National University</span>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    .main-content { flex: 1; padding-top: 80px; }

    /* ── Nav ── */
    .nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      padding: 16px 0; transition: backdrop-filter 240ms, background-color 240ms;
    }
    .nav[data-scrolled="true"] {
      background: rgba(251, 252, 255, 0.7);
      -webkit-backdrop-filter: blur(20px) saturate(140%);
      backdrop-filter: blur(20px) saturate(140%);
      border-bottom: 0.5px solid var(--c-line-soft);
    }
    .nav-inner { display: flex; align-items: center; justify-content: space-between; gap: 32px; }

    .nav-logo {
      display: inline-flex; align-items: center; gap: 10px;
      font-family: var(--sans); font-size: 20px; color: var(--c-ink); font-weight: 700;
      text-decoration: none; letter-spacing: -0.01em;
    }
    .nav-logo .dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: linear-gradient(135deg, var(--c-blue), var(--c-azure));
      box-shadow: 0 0 12px var(--c-blue);
    }

    .nav-links { display: flex; gap: 4px; font-size: 14px; color: var(--c-text-mute); }
    .nav-links a {
      padding: 8px 14px; border-radius: 999px;
      transition: color 200ms, background 200ms; text-decoration: none;
    }
    .nav-links a:hover, .nav-links a.active { color: var(--c-ink); background: rgba(11, 27, 61, 0.04); }

    .nav-actions { display: flex; align-items: center; gap: 8px; }
    .lang-btn {
      background: rgba(11, 27, 61, 0.04); border: 1px solid var(--c-line-soft);
      padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 600;
      cursor: pointer; transition: all 200ms; color: var(--c-ink);
    }
    .lang-btn:hover { background: rgba(11, 27, 61, 0.08); }

    .user-profile { display: flex; align-items: center; gap: 10px; margin-right: 8px; }
    .user-name { font-size: 13px; font-weight: 600; color: var(--c-ink); }
    .user-role.badge-glass {
      background: rgba(30, 107, 255, 0.1); border: 1px solid rgba(30, 107, 255, 0.2);
      color: var(--c-blue); padding: 2px 8px; border-radius: 99px;
      font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
    }

    /* ── Footer ── */
    .footer { padding: 48px 0 60px; background: var(--c-bg-warm); border-top: 1px solid var(--c-line-soft); }
    .footer-grid { display: grid; grid-template-columns: 1.5fr repeat(3, 1fr); gap: 40px; margin-bottom: 48px; }
    .footer-bio { margin-top: 16px; font-size: 13px; color: var(--c-text-mute); max-width: 34ch; line-height: 1.55; }
    .footer-col h5 { font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--c-text-faint); font-weight: 500; margin: 0 0 16px; }
    .footer-col ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
    .footer-col a { font-size: 14px; color: var(--c-text); transition: color 200ms; text-decoration: none; }
    .footer-col a:hover { color: var(--c-blue); }
    .footer-bottom {
      padding-top: 24px; border-top: 1px solid var(--c-line-soft);
      display: flex; align-items: center; justify-content: space-between;
      font-size: 12px; color: var(--c-text-faint); flex-wrap: wrap; gap: 12px;
    }
    .anu { font-family: var(--sans); font-size: 13px; font-style: italic; color: var(--c-text-mute); }

    @media (max-width: 880px) {
      .nav-links { display: none; }
      .footer-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 600px) {
      .footer-grid { grid-template-columns: 1fr; }
      .footer-bottom { flex-direction: column; gap: 8px; text-align: center; }
    }
  `],
})
export class AppComponent implements OnInit {
  isRtl = false;
  isScrolled = false;
  isLandingPage = true;

  constructor(
    public authService: AuthService,
    private translate: TranslateService,
    private router: Router
  ) {
    this.translate.setDefaultLang('en');
    this.translate.use('en');

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isLandingPage = event.urlAfterRedirects === '/';
    });
  }

  ngOnInit(): void {
    this.isLandingPage = this.router.url === '/';
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 20;
  }

  toggleLanguage(): void {
    const newLang = this.translate.currentLang === 'en' ? 'ar' : 'en';
    this.translate.use(newLang);
    this.isRtl = newLang === 'ar';
    document.documentElement.dir = this.isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
