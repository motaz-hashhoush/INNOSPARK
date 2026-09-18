import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { Chart, registerables } from 'chart.js';
import { RevealDirective } from '../../shared/directives/reveal.directive';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TranslateModule, RevealDirective],
  template: `
    <div class="dashboard-page">
      <div class="mesh" aria-hidden="true" style="opacity: 0.2;"><span></span></div>
      <div class="grain"></div>

      <div class="container">
        <header class="dash-header">
          <div appReveal><span class="kicker">Ecosystem Analytics</span></div>
          <div appReveal [delay]="80" style="margin-top: 18px;">
            <h1 class="h-section">Platform <em class="serif-italic" style="color: var(--c-blue);">Insights</em>.</h1>
            <p class="lead">Monitoring the growth and health of the innoPark innovation pipeline.</p>
          </div>
        </header>

        <!-- KPI Grid -->
        <div class="kpi-grid" *ngIf="overview">
          <div class="kpi-card glass" appReveal [delay]="120">
            <div class="kpi-val">{{ overview.total_projects }}</div>
            <div class="kpi-lbl">Total Innovations</div>
          </div>
          <div class="kpi-card glass" appReveal [delay]="180">
            <div class="kpi-val">{{ overview.total_challenges }}</div>
            <div class="kpi-lbl">Industry Challenges</div>
          </div>
          <div class="kpi-card glass" appReveal [delay]="240">
            <div class="kpi-val">{{ overview.open_challenges }}</div>
            <div class="kpi-lbl">Active Calls</div>
          </div>
          <div class="kpi-card glass" appReveal [delay]="300">
            <div class="kpi-val">{{ matchStats?.total_matches || 0 }}</div>
            <div class="kpi-lbl">AI Matches</div>
          </div>
        </div>

        <!-- Charts Grid -->
        <div class="charts-grid" appReveal [delay]="360">
          <div class="chart-box glass">
            <h3 class="h-card">Sectors Distribution</h3>
            <div class="canvas-wrap"><canvas #sectorChart></canvas></div>
          </div>
          <div class="chart-box glass">
            <h3 class="h-card">Readiness Levels</h3>
            <div class="canvas-wrap"><canvas #readinessChart></canvas></div>
          </div>
          <div class="chart-box glass">
            <h3 class="h-card">Innovation Pipeline</h3>
            <div class="canvas-wrap"><canvas #statusChart></canvas></div>
          </div>
          <div class="chart-box glass">
            <h3 class="h-card">Matching Success</h3>
            <div class="canvas-wrap"><canvas #matchChart></canvas></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page { position: relative; padding: 60px 0 100px; min-height: 100vh; overflow: hidden; }
    .dash-header { margin-bottom: 48px; }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 40px; }
    @media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 500px) { .kpi-grid { grid-template-columns: 1fr; } }

    .kpi-card { padding: 32px; border-radius: 24px; border: 1px solid var(--c-line-soft); text-align: center; }
    .kpi-val { font-family: var(--serif); font-size: 32px; font-weight: 800; color: var(--c-blue); line-height: 1; margin-bottom: 8px; }
    .kpi-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--c-text-faint); }
    
    .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    @media (max-width: 800px) { .charts-grid { grid-template-columns: 1fr; } }

    .chart-box { padding: 32px; border-radius: 32px; border: 1px solid var(--c-line-soft); }
    .canvas-wrap { margin-top: 24px; height: 300px; position: relative; }
    .glass { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(20px); }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('sectorChart') sectorChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('readinessChart') readinessChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('matchChart') matchChartRef!: ElementRef<HTMLCanvasElement>;

  overview: any = null;
  matchStats: any = null;
  private chartsReady = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getAnalyticsOverview().subscribe({
      next: (data) => { this.overview = data; this.tryBuildCharts(); },
    });
    this.api.getMatchAnalytics().subscribe({
      next: (data) => { this.matchStats = data; this.tryBuildCharts(); },
    });
  }

  ngAfterViewInit(): void {
    this.chartsReady = true;
    this.tryBuildCharts();
  }

  private tryBuildCharts(): void {
    if (!this.chartsReady || !this.overview) return;

    const accentBlue = '#1e6bff';
    const accentSoft = '#e2e8f0';
    const chartColors = ['#1e6bff', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

    Chart.defaults.color = '#64748b';
    Chart.defaults.font.family = 'Inter, sans-serif';

    if (this.sectorChartRef) {
      new Chart(this.sectorChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: Object.keys(this.overview.projects_by_sector || {}),
          datasets: [{ data: Object.values(this.overview.projects_by_sector || {}), backgroundColor: chartColors, borderWidth: 0, hoverOffset: 10 }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 20 } } } },
      });
    }

    if (this.readinessChartRef) {
      new Chart(this.readinessChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: Object.keys(this.overview.projects_by_readiness || {}).map(l => l.replace('_', ' ')),
          datasets: [{ label: 'Innovations', data: Object.values(this.overview.projects_by_readiness || {}), backgroundColor: accentBlue, borderRadius: 8 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.03)' } }, x: { grid: { display: false } } },
          plugins: { legend: { display: false } }
        },
      });
    }

    if (this.statusChartRef) {
      new Chart(this.statusChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: Object.keys(this.overview.projects_by_status || {}),
          datasets: [{ label: 'Stage Count', data: Object.values(this.overview.projects_by_status || {}), backgroundColor: '#3b82f6', borderRadius: 8 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false, indexAxis: 'y',
          scales: { x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.03)' } }, y: { grid: { display: false } } },
          plugins: { legend: { display: false } }
        },
      });
    }

    if (this.matchChartRef && this.matchStats) {
      new Chart(this.matchChartRef.nativeElement, {
        type: 'pie',
        data: {
          labels: Object.keys(this.matchStats.matches_by_status || {}),
          datasets: [{ data: Object.values(this.matchStats.matches_by_status || {}), backgroundColor: ['#fbbf24', '#34d399', '#f87171'], borderWidth: 0 }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
      });
    }
  }
}
