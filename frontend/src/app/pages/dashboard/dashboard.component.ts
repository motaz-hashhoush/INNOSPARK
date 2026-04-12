import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">{{ 'DASHBOARD.TITLE' | translate }}</h1>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-4" style="margin-bottom:2rem;" *ngIf="overview">
        <div class="stat-card fade-in-up">
          <div class="stat-value">{{ overview.total_projects }}</div>
          <div class="stat-label">{{ 'DASHBOARD.TOTAL_PROJECTS' | translate }}</div>
        </div>
        <div class="stat-card fade-in-up">
          <div class="stat-value">{{ overview.total_challenges }}</div>
          <div class="stat-label">{{ 'DASHBOARD.TOTAL_CHALLENGES' | translate }}</div>
        </div>
        <div class="stat-card fade-in-up">
          <div class="stat-value">{{ overview.open_challenges }}</div>
          <div class="stat-label">{{ 'DASHBOARD.OPEN_CHALLENGES' | translate }}</div>
        </div>
        <div class="stat-card fade-in-up">
          <div class="stat-value">{{ matchStats?.total_matches || 0 }}</div>
          <div class="stat-label">{{ 'DASHBOARD.TOTAL_MATCHES' | translate }}</div>
        </div>
      </div>

      <!-- Charts -->
      <div class="grid grid-2">
        <div class="card chart-card">
          <h3 class="chart-title">{{ 'DASHBOARD.BY_SECTOR' | translate }}</h3>
          <canvas #sectorChart></canvas>
        </div>
        <div class="card chart-card">
          <h3 class="chart-title">{{ 'DASHBOARD.BY_READINESS' | translate }}</h3>
          <canvas #readinessChart></canvas>
        </div>
        <div class="card chart-card">
          <h3 class="chart-title">{{ 'DASHBOARD.BY_STATUS' | translate }}</h3>
          <canvas #statusChart></canvas>
        </div>
        <div class="card chart-card">
          <h3 class="chart-title">{{ 'DASHBOARD.MATCH_STATS' | translate }}</h3>
          <canvas #matchChart></canvas>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chart-card { padding: 1.5rem; }
    .chart-title {
      font-size: 1rem; font-weight: 700; color: var(--accent-tertiary);
      margin-bottom: 1rem;
    }
    canvas { max-height: 300px; }
  `],
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

    const colors = ['#6366f1', '#8b5cf6', '#c084fc', '#f0abfc', '#818cf8', '#a78bfa', '#34d399', '#fbbf24'];

    // Sector chart
    if (this.sectorChartRef) {
      new Chart(this.sectorChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: Object.keys(this.overview.projects_by_sector || {}),
          datasets: [{ data: Object.values(this.overview.projects_by_sector || {}), backgroundColor: colors }],
        },
        options: { responsive: true, plugins: { legend: { labels: { color: '#94a3b8' } } } },
      });
    }

    // Readiness chart
    if (this.readinessChartRef) {
      new Chart(this.readinessChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: Object.keys(this.overview.projects_by_readiness || {}),
          datasets: [{ label: 'Projects', data: Object.values(this.overview.projects_by_readiness || {}), backgroundColor: '#8b5cf6' }],
        },
        options: {
          responsive: true,
          scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' }, beginAtZero: true } },
          plugins: { legend: { display: false } },
        },
      });
    }

    // Status chart
    if (this.statusChartRef) {
      new Chart(this.statusChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: Object.keys(this.overview.projects_by_status || {}),
          datasets: [{ label: 'Projects', data: Object.values(this.overview.projects_by_status || {}), backgroundColor: colors.slice(0, 5) }],
        },
        options: {
          responsive: true, indexAxis: 'y',
          scales: { x: { ticks: { color: '#94a3b8' }, beginAtZero: true }, y: { ticks: { color: '#94a3b8' } } },
          plugins: { legend: { display: false } },
        },
      });
    }

    // Match stats chart
    if (this.matchChartRef && this.matchStats) {
      new Chart(this.matchChartRef.nativeElement, {
        type: 'pie',
        data: {
          labels: Object.keys(this.matchStats.matches_by_status || {}),
          datasets: [{ data: Object.values(this.matchStats.matches_by_status || {}), backgroundColor: ['#fbbf24', '#34d399', '#f87171'] }],
        },
        options: { responsive: true, plugins: { legend: { labels: { color: '#94a3b8' } } } },
      });
    }
  }
}
