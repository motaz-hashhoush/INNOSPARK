import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { Project } from '../../models/interfaces';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="landing-container">
      <!-- Animated Mesh Background -->
      <div class="mesh-bg">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="blob blob-3"></div>
        <div class="blob blob-4"></div>
        <div class="blob blob-5"></div>
        <div class="blob blob-6"></div>
      </div>

      <!-- Hero Section -->
      <section class="hero-section">
        <div class="container hero-content">
          <div class="hero-badge fade-in">✨ Empowering Innovation</div>
          <h1 class="hero-title slide-up">
            <span class="gradient-text">INNOSPARK</span>
          </h1>
          <h2 class="hero-subtitle fade-in delay-1">
            {{ 'HOME.HERO_SUBTITLE' | translate }}
          </h2>
          <p class="hero-description fade-in delay-2">
            {{ 'HOME.HERO_DESC' | translate }}
          </p>
          <div class="hero-actions fade-in delay-3">
            <a routerLink="/projects" class="btn btn-primary btn-glow">
              <span class="btn-icon">🚀</span> {{ 'HOME.CTA_PROJECTS' | translate }}
            </a>
            <a routerLink="/challenges/submit" class="btn btn-outline">
              <span class="btn-icon">💡</span> {{ 'HOME.CTA_SUBMIT' | translate }}
            </a>
          </div>
        </div>
      </section>

      <!-- Stats Section -->
      <section class="stats-section" *ngIf="overview">
        <div class="container">
          <div class="stats-grid">
            <div class="stat-item fade-in-up" style="--delay: 0.1s">
              <div class="stat-icon">📊</div>
              <div class="stat-info">
                <span class="stat-value">{{ overview.total_projects || 0 }}</span>
                <span class="stat-label">{{ 'HOME.STATS_PROJECTS' | translate }}</span>
              </div>
            </div>
            <div class="stat-item fade-in-up" style="--delay: 0.2s">
              <div class="stat-icon">🎯</div>
              <div class="stat-info">
                <span class="stat-value">{{ overview.total_challenges || 0 }}</span>
                <span class="stat-label">{{ 'HOME.STATS_CHALLENGES' | translate }}</span>
              </div>
            </div>
            <div class="stat-item fade-in-up" style="--delay: 0.3s">
              <div class="stat-icon">🔥</div>
              <div class="stat-info">
                <span class="stat-value">{{ matchStats?.total_matches || 0 }}</span>
                <span class="stat-label">{{ 'HOME.STATS_MATCHES' | translate }}</span>
              </div>
            </div>
            <div class="stat-item fade-in-up" style="--delay: 0.4s">
              <div class="stat-icon">🌐</div>
              <div class="stat-info">
                <span class="stat-value">{{ sectorCount }}</span>
                <span class="stat-label">{{ 'HOME.STATS_SECTORS' | translate }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Featured Projects Section -->
      <section class="featured-section" *ngIf="featuredProjects.length > 0">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title slide-up">Featured <span class="gradient-text">Innovations</span></h2>
            <p class="section-subtitle fade-in">Discover the latest cutting-edge projects from our community</p>
          </div>
          
          <div class="projects-grid">
            <div class="project-card fade-in-up" *ngFor="let project of featuredProjects; let i = index" [style.--delay]="(i * 0.1 + 0.2) + 's'">
              <div class="card-content">
                <div class="project-type">{{ project.sector | titlecase }}</div>
                <h3 class="project-title">{{ project.title }}</h3>
                <p class="project-summary">{{ project.summary | slice:0:120 }}...</p>
                <div class="project-footer">
                  <div class="readiness-badge" [ngClass]="project.readiness_level">
                    {{ project.readiness_level?.replace('_', ' ') | titlecase }}
                  </div>
                  <a [routerLink]="['/projects', project.id]" class="view-btn">
                    View Details <span class="arrow">→</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div class="more-actions fade-in-up">
            <a routerLink="/projects" class="btn btn-outline">Explore All Projects</a>
          </div>
        </div>
      </section>

      <!-- Sectors Section -->
      <section class="sectors-section">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title slide-up">Explore by <span class="gradient-text">Sector</span></h2>
          </div>
          <div class="sectors-grid">
            <div class="sector-item fade-in-up" *ngFor="let sector of sectors; let i = index" [style.--delay]="(i * 0.05 + 0.1) + 's'">
              <div class="sector-card-inner">
                <div class="sector-icon-wrap">{{ sector.icon }}</div>
                <span class="sector-label">{{ 'SECTORS.' + sector.key | translate }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- How it Works -->
      <section class="how-it-works">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title slide-up">How <span class="gradient-text">InnoSpark</span> Works</h2>
            <p class="section-subtitle fade-in">Bridge the gap between industry needs and academic excellence in 3 simple steps</p>
          </div>
          
          <div class="steps-grid">
            <div class="step-card fade-in-up" style="--delay: 0.1s">
              <div class="step-number">01</div>
              <h3 class="step-title">Submit Challenge</h3>
              <p class="step-text">Organizations describe their industry problems and requirements.</p>
            </div>
            <div class="step-card fade-in-up" style="--delay: 0.2s">
              <div class="step-number">02</div>
              <h3 class="step-title">AI Matching</h3>
              <p class="step-text">Our intelligent engine matches challenges with relevant projects.</p>
            </div>
            <div class="step-card fade-in-up" style="--delay: 0.3s">
              <div class="step-number">03</div>
              <h3 class="step-title">Collaborate</h3>
              <p class="step-text">Connect with creators and turn ideas into real-world solutions.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host {
      --primary: #17618d;
      --primary-light: #38bdf8;
      --bg-white: #ffffff;
      --bg-soft: #f8fafc;
      --text-dark: #0f172a;
      --text-gray: #475569;
      --accent-grad: linear-gradient(135deg, #17618d 0%, #38bdf8 100%);
    }

    .landing-container {
      background: var(--bg-white);
      color: var(--text-dark);
      min-height: 100vh;
      overflow-x: hidden;
      position: relative;
    }

    /* Mesh Background Animation */
    .mesh-bg {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      overflow: hidden;
      z-index: 0;
      pointer-events: none;
      background: var(--bg-white);
    }
    .blob {
      position: absolute;
      width: 600px; height: 600px;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.15;
      mix-blend-mode: multiply;
      animation: move 25s infinite alternate ease-in-out;
    }
    .blob-1 { background: #17618d; top: -10%; left: -10%; animation-duration: 20s; }
    .blob-2 { background: #38bdf8; top: 40%; right: -10%; animation-duration: 30s; animation-delay: -5s; }
    .blob-3 { background: #6366f1; bottom: -10%; left: 20%; animation-duration: 25s; animation-delay: -2s; }
    .blob-4 { background: #0ea5e9; top: 10%; right: 20%; animation-duration: 35s; animation-delay: -10s; }
    .blob-5 { background: #3b82f6; bottom: 20%; right: 10%; animation-duration: 22s; animation-delay: -7s; }
    .blob-6 { background: #075985; top: 60%; left: -5%; animation-duration: 28s; animation-delay: -12s; }

    @keyframes move {
      0% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(100px, 50px) scale(1.1); }
      66% { transform: translate(-50px, 150px) scale(0.9); }
      100% { transform: translate(20px, -20px) scale(1); }
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    /* Hero Section */
    .hero-section {
      padding: 10rem 0 7rem;
      text-align: center;
      position: relative;
      z-index: 1;
    }
    .hero-badge {
      display: inline-block;
      padding: 0.5rem 1.2rem;
      background: rgba(23, 97, 141, 0.05);
      border: 1px solid rgba(23, 97, 141, 0.1);
      border-radius: 50px;
      color: var(--primary);
      font-weight: 600;
      font-size: 0.85rem;
      margin-bottom: 2rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .hero-title {
      font-size: clamp(3rem, 10vw, 6.5rem);
      line-height: 1;
      font-weight: 900;
      margin-bottom: 1.5rem;
      letter-spacing: -0.03em;
    }
    .hero-subtitle {
      font-size: clamp(1.2rem, 3vw, 1.8rem);
      font-weight: 600;
      color: var(--text-dark);
      margin-bottom: 1.5rem;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
      line-height: 1.3;
    }
    .gradient-text {
      background: var(--accent-grad);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-description {
      font-size: 1.15rem;
      color: var(--text-gray);
      max-width: 650px;
      margin: 0 auto 3rem;
      line-height: 1.6;
    }
    .hero-actions {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.9rem 2.2rem;
      border-radius: 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.8rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      text-decoration: none;
      font-size: 1rem;
    }
    .btn-icon { font-size: 1.3rem; }
    .btn-primary {
      background: var(--accent-grad);
      color: white;
      border: none;
    }
    .btn-glow:hover {
      box-shadow: 0 12px 24px rgba(23, 97, 141, 0.25);
      transform: translateY(-4px);
    }
    .btn-outline {
      background: transparent;
      border: 1px solid rgba(23, 97, 141, 0.2);
      color: var(--primary);
    }
    .btn-outline:hover {
      background: rgba(23, 97, 141, 0.05);
      border-color: var(--primary);
      transform: translateY(-4px);
    }

    /* Stats Section */
    .stats-section {
      padding: 4rem 0;
      position: relative;
      z-index: 1;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(23, 97, 141, 0.1);
      border-radius: 28px;
      padding: 3rem;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.04);
    }
    .stat-item {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    .stat-icon {
      font-size: 2.2rem;
      background: rgba(23, 97, 141, 0.05);
      width: 70px; height: 70px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 20px;
    }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-dark);
      line-height: 1;
    }
    .stat-label {
      color: var(--text-gray);
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 0.4rem;
    }

    /* Featured Section */
    .featured-section {
      padding: 7rem 0;
      position: relative;
      z-index: 1;
    }
    .section-header {
      text-align: center;
      margin-bottom: 5rem;
    }
    .section-title {
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 1.2rem;
      color: var(--text-dark);
      letter-spacing: -0.01em;
    }
    .section-subtitle {
      color: var(--text-gray);
      font-size: 1.2rem;
    }
    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 2.5rem;
      margin-bottom: 5rem;
    }
    .project-card {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(23, 97, 141, 0.08);
      border-radius: 24px;
      padding: 2.5rem;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
      display: flex;
      flex-direction: column;
    }
    .project-card:hover {
      border-color: var(--primary);
      transform: translateY(-8px);
      box-shadow: 0 25px 50px rgba(23, 97, 141, 0.08);
    }
    .project-type {
      color: var(--primary-light);
      font-size: 0.85rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      margin-bottom: 1.2rem;
    }
    .project-title {
      font-size: 1.6rem;
      font-weight: 800;
      margin-bottom: 1.2rem;
      color: var(--text-dark);
      line-height: 1.3;
    }
    .project-summary {
      color: var(--text-gray);
      font-size: 1.05rem;
      line-height: 1.7;
      margin-bottom: 2.5rem;
    }
    .project-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
    }
    .readiness-badge {
      font-size: 0.8rem;
      padding: 0.4rem 1rem;
      border-radius: 22px;
      font-weight: 700;
    }
    .readiness-badge.concept { background: #f1f5f9; color: #64748b; }
    .readiness-badge.prototype { background: #fef3c7; color: #d97706; }
    .readiness-badge.pilot_ready { background: #dcfce7; color: #16a34a; }
    
    .view-btn {
      color: var(--primary);
      text-decoration: none;
      font-size: 1rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .view-btn .arrow { transition: transform 0.3s ease; }
    .view-btn:hover .arrow { transform: translateX(6px); }

    .more-actions {
      display: flex;
      justify-content: center;
    }

    /* Sectors Section */
    .sectors-section {
      padding: 7rem 0;
    }
    .sectors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 1.8rem;
    }
    .sector-card-inner {
      background: var(--bg-soft);
      border: 1px solid rgba(23, 97, 141, 0.05);
      border-radius: 24px;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.2rem;
      transition: all 0.3s ease;
    }
    .sector-item:hover .sector-card-inner {
      background: var(--bg-white);
      border-color: var(--primary);
      transform: translateY(-6px);
      box-shadow: 0 12px 24px rgba(23, 97, 141, 0.06);
    }
    .sector-icon-wrap { font-size: 2.8rem; }
    .sector-label {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-gray);
      text-align: center;
    }
    .sector-item:hover .sector-label { color: var(--primary); }

    /* How it Works */
    .how-it-works {
      padding: 7rem 0 10rem;
    }
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 3.5rem;
    }
    .step-card {
      padding: 2.5rem;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(10px);
      border-radius: 28px;
      border: 1px solid rgba(23, 97, 141, 0.05);
      transition: all 0.3s ease;
    }
    .step-card:hover {
      background: var(--bg-white);
      border-color: var(--primary);
      transform: translateY(-8px);
      box-shadow: 0 15px 35px rgba(23, 97, 141, 0.06);
    }
    .step-number {
      font-size: 3.5rem;
      font-weight: 900;
      color: rgba(23, 97, 141, 0.08);
      margin-bottom: -1.8rem;
    }
    .step-title {
      font-size: 1.8rem;
      font-weight: 800;
      margin-bottom: 1.2rem;
      color: var(--text-dark);
    }
    .step-text {
      color: var(--text-gray);
      line-height: 1.7;
      font-size: 1.1rem;
    }

    /* Animations */
    .fade-in { animation: fadeIn 1s ease forwards; }
    .fade-in-up { animation: fadeInUp 0.8s ease forwards; }
    .slide-up { animation: slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
    
    .delay-1 { animation-delay: 0.2s; opacity: 0; }
    .delay-2 { animation-delay: 0.4s; opacity: 0; }
    .delay-3 { animation-delay: 0.6s; opacity: 0; }

    /* Ensure initial state for delayed animations */
    .fade-in, .fade-in-up, .slide-up {
      opacity: 0;
    }

    @keyframes fadeIn { 
      from { opacity: 0; } 
      to { opacity: 1; } 
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(40px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(60px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 768px) {
      .hero-section { padding: 8rem 0 5rem; }
      .hero-actions { flex-direction: column; padding: 0 2rem; }
      .stats-grid { padding: 2rem; }
      .stat-item { flex-direction: column; text-align: center; }
    }
  `],
})
export class LandingComponent implements OnInit {
  overview: any = null;
  matchStats: any = null;
  sectorCount = 8;
  featuredProjects: Project[] = [];

  sectors = [
    { key: 'health', icon: '🏥' },
    { key: 'environment', icon: '🌿' },
    { key: 'energy', icon: '⚡' },
    { key: 'agriculture', icon: '🌾' },
    { key: 'industry', icon: '🏭' },
    { key: 'information_technology', icon: '💻' },
    { key: 'education', icon: '📚' },
    { key: 'other', icon: '🔬' },
  ];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getAnalyticsOverview().subscribe({
      next: (data) => {
        this.overview = data;
        this.sectorCount = Object.keys(data.projects_by_sector || {}).length || 8;
      },
      error: () => {},
    });

    this.api.getMatchAnalytics().subscribe({
      next: (data) => (this.matchStats = data),
      error: () => {},
    });

    this.api.getProjects({ limit: 3 }).subscribe({
      next: (data) => {
        this.featuredProjects = data.projects;
      },
      error: () => {},
    });
  }
}
