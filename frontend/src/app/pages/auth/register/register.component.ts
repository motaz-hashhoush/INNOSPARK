import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="auth-page">
      <div class="auth-card fade-in-up">
        <h1 class="auth-title">{{ 'AUTH.REGISTER_TITLE' | translate }}</h1>
        <p class="auth-subtitle">{{ 'AUTH.REGISTER_SUBTITLE' | translate }}</p>

        <form (ngSubmit)="onRegister()" class="auth-form">
          <div class="form-group">
            <label class="form-label">{{ 'AUTH.FULL_NAME' | translate }}</label>
            <input type="text" class="form-input" [(ngModel)]="fullName" name="fullName" required>
          </div>
          <div class="form-group">
            <label class="form-label">{{ 'AUTH.EMAIL' | translate }}</label>
            <input type="email" class="form-input" [(ngModel)]="email" name="email" required>
          </div>
          <div class="form-group">
            <label class="form-label">{{ 'AUTH.PASSWORD' | translate }}</label>
            <input type="password" class="form-input" [(ngModel)]="password" name="password" required>
          </div>
          <div class="form-group">
            <label class="form-label">{{ 'AUTH.ROLE' | translate }}</label>
            <select class="form-select" [(ngModel)]="role" name="role">
              <option value="student">{{ 'AUTH.ROLES.student' | translate }}</option>
              <option value="supervisor">{{ 'AUTH.ROLES.supervisor' | translate }}</option>
              <option value="company">{{ 'AUTH.ROLES.company' | translate }}</option>
              <option value="evaluator">{{ 'AUTH.ROLES.evaluator' | translate }}</option>
            </select>
          </div>

          <div class="error-msg" *ngIf="error">{{ error }}</div>

          <button type="submit" class="btn btn-primary btn-lg" style="width:100%;" [disabled]="loading">
            {{ loading ? '...' : ('AUTH.SUBMIT_REGISTER' | translate) }}
          </button>
        </form>

        <p class="auth-switch">
          {{ 'AUTH.HAS_ACCOUNT' | translate }}
          <a routerLink="/auth/login">{{ 'NAV.LOGIN' | translate }}</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: calc(100vh - 70px);
      display: flex; align-items: center; justify-content: center;
      padding: 2rem;
      background:
        radial-gradient(ellipse at 30% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 60%),
        radial-gradient(ellipse at 70% 30%, rgba(139, 92, 246, 0.06) 0%, transparent 50%);
    }
    .auth-card {
      background: var(--bg-card); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl); padding: 3rem; width: 100%; max-width: 440px;
      backdrop-filter: blur(20px);
    }
    .auth-title {
      font-size: 1.8rem; font-weight: 700; margin-bottom: 0.3rem;
      background: var(--accent-gradient);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .auth-subtitle { color: var(--text-secondary); margin-bottom: 2rem; }
    .auth-form { margin-bottom: 1.5rem; }
    .error-msg {
      color: var(--danger); background: rgba(239, 68, 68, 0.1);
      padding: 0.6rem 1rem; border-radius: var(--radius-sm); margin-bottom: 1rem;
      font-size: 0.9rem;
    }
    .auth-switch { text-align: center; color: var(--text-secondary); font-size: 0.9rem; }
    .auth-switch a { color: var(--accent-tertiary); text-decoration: none; font-weight: 600; }
    .auth-switch a:hover { text-decoration: underline; }
  `],
})
export class RegisterComponent {
  fullName = '';
  email = '';
  password = '';
  role = 'student';
  error = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onRegister(): void {
    this.loading = true;
    this.error = '';
    this.authService.register({
      email: this.email,
      password: this.password,
      full_name: this.fullName,
      role: this.role,
    }).subscribe({
      next: () => {
        // Auto-login after registration
        this.authService.login(this.email, this.password).subscribe({
          next: () => this.router.navigate(['/projects']),
          error: () => this.router.navigate(['/auth/login']),
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.detail || 'Registration failed';
      },
    });
  }
}
