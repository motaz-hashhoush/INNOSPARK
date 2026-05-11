import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-landing-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <!-- Brand -->
          <div>
            <a routerLink="/" class="nav-logo">
              <span class="dot"></span>
              innoPark
            </a>
            <p class="footer-bio">{{ 'LANDING.FOOTER.BIO' | translate }}</p>
          </div>

          <div class="footer-col">
            <h5>{{ 'LANDING.FOOTER.PLATFORM' | translate }}</h5>
            <ul>
              <li><a routerLink="/projects">{{ 'LANDING.FOOTER.LINK_BOOTH' | translate }}</a></li>
              <li><a routerLink="/challenges">{{ 'LANDING.FOOTER.LINK_CHALLENGES' | translate }}</a></li>
              <li><a routerLink="/dashboard">{{ 'LANDING.FOOTER.LINK_MATCHER' | translate }}</a></li>
              <li><a routerLink="/pipeline">{{ 'LANDING.FOOTER.LINK_PIPELINE' | translate }}</a></li>
              <li><a routerLink="/dashboard">{{ 'LANDING.FOOTER.LINK_DASHBOARD' | translate }}</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h5>{{ 'LANDING.FOOTER.ROLES' | translate }}</h5>
            <ul>
              <li><a routerLink="/auth/register">{{ 'LANDING.FOOTER.LINK_STUDENTS' | translate }}</a></li>
              <li><a routerLink="/auth/register">{{ 'LANDING.FOOTER.LINK_FACULTY' | translate }}</a></li>
              <li><a routerLink="/auth/register">{{ 'LANDING.FOOTER.LINK_COMPANIES' | translate }}</a></li>
              <li><a routerLink="/auth/register">{{ 'LANDING.FOOTER.LINK_ADMIN' | translate }}</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h5>{{ 'LANDING.FOOTER.PARK' | translate }}</h5>
            <ul>
              <li><a href="#">{{ 'LANDING.FOOTER.LINK_ABOUT' | translate }}</a></li>
              <li><a href="#">{{ 'LANDING.FOOTER.LINK_PROGRAMS' | translate }}</a></li>
              <li><a href="#">{{ 'LANDING.FOOTER.LINK_PRESS' | translate }}</a></li>
              <li><a href="#">{{ 'LANDING.FOOTER.LINK_CONTACT' | translate }}</a></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <span>{{ 'LANDING.FOOTER.COPYRIGHT' | translate }}</span>
          <span class="anu">{{ 'LANDING.FOOTER.POWERED' | translate }}</span>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer { border-top: 1px solid var(--c-line-soft); padding: 48px 0 60px; background: var(--c-bg-warm); }

    .footer-grid { display: grid; grid-template-columns: 1.5fr repeat(3, 1fr); gap: 40px; margin-bottom: 48px; }
    @media (max-width: 880px) { .footer-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .footer-grid { grid-template-columns: 1fr; } }

    .nav-logo {
      display: inline-flex; align-items: center; gap: 10px;
      font-family: var(--sans); font-size: 20px; font-weight: 700;
      letter-spacing: -0.01em; color: var(--c-ink); text-decoration: none;
    }
    .nav-logo .dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: linear-gradient(135deg, var(--c-blue), var(--c-azure));
      box-shadow: 0 0 10px var(--c-blue);
    }

    .footer-bio { max-width: 34ch; margin-top: 16px; font-size: 13px; color: var(--c-text-mute); line-height: 1.55; }

    .footer-col h5 { font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--c-text-faint); font-weight: 500; margin: 0 0 16px; }
    .footer-col ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
    .footer-col a { font-size: 14px; color: var(--c-text); transition: color 200ms; text-decoration: none; }
    .footer-col a:hover { color: var(--c-blue); }

    .footer-bottom {
      margin-top: 0; padding-top: 24px; border-top: 1px solid var(--c-line-soft);
      display: flex; align-items: center; justify-content: space-between;
      font-size: 12px; color: var(--c-text-faint); flex-wrap: wrap; gap: 12px;
    }
    .anu { font-family: var(--sans); font-size: 13px; font-style: italic; color: var(--c-text-mute); }

    @media (max-width: 600px) { .footer-bottom { flex-direction: column; gap: 8px; text-align: center; } }
  `]
})
export class FooterComponent {}
