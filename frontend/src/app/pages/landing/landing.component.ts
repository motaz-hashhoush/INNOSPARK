import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { Project } from '../../models/interfaces';

// Import sub-components
import { NavComponent } from './components/nav.component';
import { HeroComponent } from './components/hero.component';
import { StatsComponent } from './components/stats.component';
import { PipelineComponent } from './components/pipeline.component';
import { AudienceComponent } from './components/audience.component';
import { AiMatcherComponent } from './components/ai-matcher.component';
import { FeaturedComponent } from './components/featured.component';
import { ProgramsComponent } from './components/programs.component';
import { CtaComponent } from './components/cta.component';
import { FooterComponent } from './components/footer.component';
import { NewsComponent } from './components/news.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    NavComponent,
    HeroComponent,
    StatsComponent,
    PipelineComponent,
    AudienceComponent,
    AiMatcherComponent,
    FeaturedComponent,
    ProgramsComponent,
    CtaComponent,
    FooterComponent,
    NewsComponent
  ],
  template: `
    <app-landing-nav></app-landing-nav>
    
    <main>
      <app-landing-hero></app-landing-hero>
      
      <app-landing-stats [stats]="overview"></app-landing-stats>
      
      <app-landing-pipeline></app-landing-pipeline>
      
      <app-landing-audience></app-landing-audience>
      
      <app-landing-matcher></app-landing-matcher>
      
      <app-landing-featured [projects]="featuredProjects"></app-landing-featured>
      
      <app-landing-programs></app-landing-programs>

      <app-landing-news></app-landing-news>

      <app-landing-cta></app-landing-cta>
    </main>

    <app-landing-footer></app-landing-footer>
  `,
  styles: [`
    :host {
      display: block;
      overflow-x: hidden;
    }
  `]
})
export class LandingComponent implements OnInit {
  overview: any = {};
  featuredProjects: Project[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    // Fetch overview stats
    this.api.getAnalyticsOverview().subscribe({
      next: (data) => {
        this.overview = data;
      },
      error: (err) => console.error('Error fetching analytics overview:', err)
    });

    // Fetch featured projects
    this.api.getProjects({ limit: 3 }).subscribe({
      next: (data) => {
        this.featuredProjects = data.projects;
      },
      error: (err) => console.error('Error fetching featured projects:', err)
    });
  }
}
