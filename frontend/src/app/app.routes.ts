import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent),
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
    path: 'projects',
    loadComponent: () => import('./pages/projects/project-list/project-list.component').then(m => m.ProjectListComponent),
  },
  {
    path: 'projects/submit',
    loadComponent: () => import('./pages/projects/project-submit/project-submit.component').then(m => m.ProjectSubmitComponent),
    canActivate: [authGuard],
  },
  {
    path: 'projects/:id',
    loadComponent: () => import('./pages/projects/project-detail/project-detail.component').then(m => m.ProjectDetailComponent),
  },
  {
    path: 'challenges',
    loadComponent: () => import('./pages/challenges/challenge-list/challenge-list.component').then(m => m.ChallengeListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'challenges/submit',
    loadComponent: () => import('./pages/challenges/challenge-submit/challenge-submit.component').then(m => m.ChallengeSubmitComponent),
    canActivate: [authGuard],
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
