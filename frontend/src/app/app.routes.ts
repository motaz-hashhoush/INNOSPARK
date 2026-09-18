import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'match',
    loadComponent: () => import('./pages/guest-match/guest-matcher.component').then(m => m.GuestMatcherComponent),
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    // Student Projects — the full project database (approved projects are public).
    path: 'projects',
    loadComponent: () => import('./pages/projects/project-list/project-list.component').then(m => m.ProjectListComponent),
  },
  {
    // Admins ingest repository projects; supervisors add their own.
    path: 'projects/submit',
    loadComponent: () => import('./pages/projects/project-submit/project-submit.component').then(m => m.ProjectSubmitComponent),
    canActivate: [roleGuard('admin', 'supervisor')],
  },
  {
    // Virtual Booth — curated public showcase of published projects.
    path: 'booth',
    loadComponent: () => import('./pages/booth/booth-list.component').then(m => m.BoothListComponent),
  },
  {
    // Same form as projects/submit, but publishes to the booth on save.
    path: 'booth/new',
    loadComponent: () => import('./pages/projects/project-submit/project-submit.component').then(m => m.ProjectSubmitComponent),
    canActivate: [roleGuard('admin', 'supervisor')],
    data: { booth: true },
  },
  {
    path: 'booth/:id',
    loadComponent: () => import('./pages/booth/booth-detail.component').then(m => m.BoothDetailComponent),
  },
  {
    // Supervisors review and approve the projects they supervise.
    path: 'review',
    loadComponent: () => import('./pages/review/project-review.component').then(m => m.ProjectReviewComponent),
    canActivate: [roleGuard('supervisor', 'admin')],
  },
  {
    path: 'notifications',
    loadComponent: () => import('./pages/notifications/notifications.component').then(m => m.NotificationsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'projects/:id',
    loadComponent: () => import('./pages/projects/project-detail/project-detail.component').then(m => m.ProjectDetailComponent),
  },

  {
    path: 'challenges',
    loadComponent: () => import('./pages/challenges/challenge-list/challenge-list.component').then(m => m.ChallengeListComponent),
  },
  {
    // Posting a challenge is reserved for companies.
    path: 'challenges/submit',
    loadComponent: () => import('./pages/challenges/challenge-submit/challenge-submit.component').then(m => m.ChallengeSubmitComponent),
    canActivate: [roleGuard('company', 'admin')],
  },
  {
    // Public AI matcher — visitors can try a challenge without an account.
    path: 'guest-match',
    loadComponent: () => import('./pages/guest-match/guest-matcher.component').then(m => m.GuestMatcherComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'pipeline',
    loadComponent: () => import('./pages/pipeline/pipeline.component').then(m => m.PipelineComponent),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
