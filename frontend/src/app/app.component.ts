import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, TranslateModule],
  template: `
    <!-- Navigation -->
    <nav class="navbar" [class.rtl]="isRtl">
      <div class="nav-container">
        <a routerLink="/" class="nav-logo">
          <span class="logo-icon">⚡</span>
          <span class="logo-text">INNOSPARK</span>
        </a>

        <div class="nav-links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">{{ 'NAV.HOME' | translate }}</a>
          <a routerLink="/projects" routerLinkActive="active">{{ 'NAV.PROJECTS' | translate }}</a>
          <a routerLink="/challenges" routerLinkActive="active" *ngIf="authService.isLoggedIn()">{{ 'NAV.CHALLENGES' | translate }}</a>
          <a routerLink="/dashboard" routerLinkActive="active" *ngIf="authService.isLoggedIn()">{{ 'NAV.DASHBOARD' | translate }}</a>
          <a routerLink="/pipeline" routerLinkActive="active" *ngIf="authService.hasRole('admin', 'evaluator')">{{ 'NAV.PIPELINE' | translate }}</a>
        </div>

        <div class="nav-actions">
          <button class="lang-btn" (click)="toggleLanguage()">
            {{ isRtl ? 'EN' : 'عربي' }}
          </button>

          <ng-container *ngIf="!authService.isLoggedIn()">
            <a routerLink="/auth/login" class="btn btn-outline">{{ 'NAV.LOGIN' | translate }}</a>
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
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>

    <!-- Footer -->
    <footer class="footer" [class.rtl]="isRtl">
      <div class="footer-container">
        <div class="footer-brand">
          <span class="logo-icon">⚡</span>
          <span>INNOSPARK</span>
          <p>An-Najah Innovation Park</p>
        </div>
        <div class="footer-links">
          <a routerLink="/projects">{{ 'NAV.PROJECTS' | translate }}</a>
          <a routerLink="/challenges">{{ 'NAV.CHALLENGES' | translate }}</a>
          <a routerLink="/dashboard">{{ 'NAV.DASHBOARD' | translate }}</a>
        </div>
        <div class="footer-copy">
          &copy; 2026 INNOSPARK. All rights reserved.
        </div>
      </div>
    </footer>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; min-height: 100vh; }

    .navbar {
      position: sticky; top: 0; z-index: 100;
      background: rgba(15, 15, 35, 0.95);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(99, 102, 241, 0.15);
      padding: 0 2rem;
    }
    .nav-container {
      max-width: 1400px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between;
      height: 70px;
    }
    .nav-logo {
      display: flex; align-items: center; gap: 0.5rem;
      text-decoration: none; font-size: 1.4rem; font-weight: 700;
      background: linear-gradient(135deg, #818cf8, #c084fc);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .logo-icon { font-size: 1.6rem; -webkit-text-fill-color: initial; }
    .nav-links { display: flex; gap: 1.5rem; }
    .nav-links a {
      text-decoration: none; color: #94a3b8; font-weight: 500;
      transition: color 0.2s; padding: 0.5rem 0;
      border-bottom: 2px solid transparent;
    }
    .nav-links a:hover, .nav-links a.active {
      color: #c084fc;
      border-bottom-color: #c084fc;
    }
    .nav-actions { display: flex; align-items: center; gap: 0.75rem; }
    .lang-btn {
      background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3);
      color: #c084fc; padding: 0.4rem 0.8rem; border-radius: 8px;
      cursor: pointer; font-weight: 600; font-size: 0.85rem;
      transition: all 0.2s;
    }
    .lang-btn:hover { background: rgba(99, 102, 241, 0.2); }
    .user-profile { display: flex; align-items: center; gap: 0.6rem; margin-right: 0.5rem; }
    .user-name { color: #e2e8f0; font-weight: 600; font-size: 0.95rem; }
    .user-role.badge-glass {
      background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(192,132,252,0.2));
      border: 1px solid rgba(192,132,252,0.3);
      color: #e879f9; padding: 0.25rem 0.6rem; border-radius: 20px;
      font-size: 0.7rem; font-weight: 800; letter-spacing: 0.5px;
      box-shadow: 0 0 10px rgba(192,132,252,0.1);
    }

    .btn {
      padding: 0.5rem 1.2rem; border-radius: 10px; font-weight: 600;
      text-decoration: none; font-size: 0.9rem; cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; border: none;
    }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4); }
    .btn-outline {
      background: transparent; color: #c084fc;
      border: 1px solid rgba(192, 132, 252, 0.4);
    }
    .btn-outline:hover { background: rgba(192, 132, 252, 0.1); }

    .main-content { flex: 1; }

    .footer {
      background: rgba(10, 10, 30, 0.95);
      border-top: 1px solid rgba(99, 102, 241, 0.1);
      padding: 2rem;
    }
    .footer-container {
      max-width: 1400px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between;
    }
    .footer-brand {
      display: flex; align-items: center; gap: 0.5rem;
      color: #818cf8; font-weight: 700; font-size: 1.1rem;
    }
    .footer-brand p { color: #64748b; font-size: 0.8rem; margin-left: 0.5rem; font-weight: 400; }
    .footer-links { display: flex; gap: 1.5rem; }
    .footer-links a { color: #94a3b8; text-decoration: none; transition: color 0.2s; }
    .footer-links a:hover { color: #c084fc; }
    .footer-copy { color: #475569; font-size: 0.85rem; }

    .rtl { direction: rtl; text-align: right; }

    @media (max-width: 768px) {
      .nav-links { display: none; }
      .footer-container { flex-direction: column; gap: 1rem; text-align: center; }
    }
  `],
})
export class AppComponent implements OnInit {
  isRtl = false;

  constructor(
    public authService: AuthService,
    private translate: TranslateService,
    private router: Router
  ) {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  ngOnInit(): void {}

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
