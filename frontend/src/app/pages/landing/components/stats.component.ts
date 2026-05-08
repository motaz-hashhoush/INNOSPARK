import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

@Component({
  selector: 'app-landing-stats',
  standalone: true,
  imports: [CommonModule, TranslateModule, RevealDirective],
  template: `
    <section class="stats">
      <div class="container">
        <div class="stats-row">
          <div *ngFor="let s of displayStats; let i = index" appReveal [delay]="i * 80">
            <div class="stat-num">
              {{ s.value }}<small>{{ s.suffix }}</small>
            </div>
            <div class="stat-lbl">{{ s.labelKey | translate }}</div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .stats { border-top: 1px solid var(--c-line-soft); border-bottom: 1px solid var(--c-line-soft); padding: 36px 0; background: linear-gradient(180deg, transparent, rgba(244, 247, 254, 0.5)); }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    @media (max-width: 880px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }

    .stat-num { font-family: var(--serif); font-weight: 700; font-size: clamp(40px, 4vw, 64px); line-height: 1; color: var(--c-ink); letter-spacing: -0.025em; display: flex; align-items: baseline; gap: 4px; }
    .stat-num small { font-size: 0.4em; font-family: var(--sans); font-weight: 500; color: var(--c-blue); }
    .stat-lbl { margin-top: 6px; font-size: 13px; color: var(--c-text-mute); letter-spacing: 0.01em; }
  `]
})
export class StatsComponent {
  @Input() set stats(data: any) {
    if (data) {
      this.displayStats = [
        { value: data.total_projects || 240, suffix: '+', labelKey: 'LANDING.STATS.PROJECTS' },
        { value: data.total_partners || 67, suffix: '', labelKey: 'LANDING.STATS.PARTNERS' },
        { value: 92, suffix: '%', labelKey: 'LANDING.STATS.ACCURACY' },
        { value: 12, suffix: '', labelKey: 'LANDING.STATS.VENTURES' }
      ];
    }
  }

  displayStats = [
    { value: 240, suffix: '+', labelKey: 'LANDING.STATS.PROJECTS' },
    { value: 67, suffix: '', labelKey: 'LANDING.STATS.PARTNERS' },
    { value: 92, suffix: '%', labelKey: 'LANDING.STATS.ACCURACY' },
    { value: 12, suffix: '', labelKey: 'LANDING.STATS.VENTURES' }
  ];
}
