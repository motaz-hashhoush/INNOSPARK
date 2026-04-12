import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-project-submit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="page-container">
      <div class="form-page fade-in-up">
        <h1 class="page-title">{{ 'PROJECTS.SUBMIT_TITLE' | translate }}</h1>
        <p class="page-subtitle">{{ 'PROJECTS.SUBMIT_SUBTITLE' | translate }}</p>

        <form (ngSubmit)="onSubmit()" class="submit-form">
          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label">{{ 'PROJECTS.TITLE_EN' | translate }}</label>
              <input type="text" class="form-input" [(ngModel)]="project.title_en" name="titleEn">
            </div>
            <div class="form-group">
              <label class="form-label">{{ 'PROJECTS.TITLE_AR' | translate }}</label>
              <input type="text" class="form-input" [(ngModel)]="project.title_ar" name="titleAr" dir="rtl">
            </div>
          </div>

          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label">{{ 'PROJECTS.SUMMARY_EN' | translate }}</label>
              <textarea class="form-textarea" [(ngModel)]="project.summary_en" name="summaryEn"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">{{ 'PROJECTS.SUMMARY_AR' | translate }}</label>
              <textarea class="form-textarea" [(ngModel)]="project.summary_ar" name="summaryAr" dir="rtl"></textarea>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">{{ 'PROJECTS.PROBLEM' | translate }} *</label>
            <textarea class="form-textarea" [(ngModel)]="project.problem" name="problem" required></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">{{ 'PROJECTS.VALUE' | translate }}</label>
            <textarea class="form-textarea" [(ngModel)]="project.value_proposition" name="value"></textarea>
          </div>

          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label">{{ 'PROJECTS.SECTOR' | translate }}</label>
              <select class="form-select" [(ngModel)]="project.sector" name="sector">
                <option *ngFor="let s of sectors" [value]="s">{{ 'SECTORS.' + s | translate }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">{{ 'PROJECTS.READINESS' | translate }}</label>
              <select class="form-select" [(ngModel)]="project.readiness_level" name="readiness">
                <option value="concept">{{ 'READINESS.concept' | translate }}</option>
                <option value="prototype">{{ 'READINESS.prototype' | translate }}</option>
                <option value="pilot_ready">{{ 'READINESS.pilot_ready' | translate }}</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">{{ 'PROJECTS.TECH_OUTPUTS' | translate }}</label>
            <textarea class="form-textarea" [(ngModel)]="project.technical_outputs" name="techOutputs"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">{{ 'PROJECTS.DEV_NEEDS' | translate }}</label>
            <textarea class="form-textarea" [(ngModel)]="project.development_needs" name="devNeeds"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">{{ 'PROJECTS.VIDEO_URL' | translate }}</label>
            <input type="url" class="form-input" [(ngModel)]="project.video_url" name="videoUrl">
          </div>

          <!-- Team Members -->
          <div class="form-group">
            <label class="form-label">{{ 'PROJECTS.TEAM' | translate }}</label>
            <div class="team-inputs">
              <div class="team-row" *ngFor="let member of teamMembers; let i = index">
                <input type="text" class="form-input" [(ngModel)]="member.name" [name]="'mName'+i" placeholder="Name">
                <input type="text" class="form-input" [(ngModel)]="member.role" [name]="'mRole'+i" placeholder="Role">
                <input type="email" class="form-input" [(ngModel)]="member.email" [name]="'mEmail'+i" placeholder="Email">
                <button type="button" class="btn btn-danger btn-sm" (click)="removeTeamMember(i)">✕</button>
              </div>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" (click)="addTeamMember()" style="margin-top:0.5rem;">
              + Add Member
            </button>
          </div>

          <!-- File Upload -->
          <div class="form-group">
            <label class="form-label">{{ 'PROJECTS.FILES' | translate }}</label>
            <input type="file" multiple (change)="onFilesSelected($event)" class="form-input file-input">
          </div>

          <div class="error-msg" *ngIf="error">{{ error }}</div>
          <div class="success-msg" *ngIf="success">{{ success }}</div>

          <button type="submit" class="btn btn-primary btn-lg" [disabled]="loading">
            {{ loading ? '...' : ('PROJECTS.SUBMIT' | translate) }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-page { max-width: 900px; margin: 0 auto; }
    .submit-form { margin-top: 2rem; }
    .team-inputs { display: flex; flex-direction: column; gap: 0.5rem; }
    .team-row { display: flex; gap: 0.5rem; align-items: center; }
    .team-row .form-input { flex: 1; }
    .file-input { padding: 0.5rem; }
    .error-msg {
      color: var(--danger); background: rgba(239, 68, 68, 0.1);
      padding: 0.6rem 1rem; border-radius: var(--radius-sm); margin-bottom: 1rem;
    }
    .success-msg {
      color: var(--success); background: rgba(16, 185, 129, 0.1);
      padding: 0.6rem 1rem; border-radius: var(--radius-sm); margin-bottom: 1rem;
    }
  `],
})
export class ProjectSubmitComponent {
  project: any = {
    title_en: '', title_ar: '', summary_en: '', summary_ar: '',
    problem: '', value_proposition: '', sector: 'other',
    readiness_level: 'concept', technical_outputs: '', development_needs: '', video_url: '',
  };
  teamMembers: any[] = [{ name: '', role: '', email: '' }];
  selectedFiles: File[] = [];
  error = '';
  success = '';
  loading = false;
  sectors = ['health', 'environment', 'energy', 'agriculture', 'industry', 'information_technology', 'education', 'other'];

  constructor(private api: ApiService, private router: Router) {}

  addTeamMember() { this.teamMembers.push({ name: '', role: '', email: '' }); }
  removeTeamMember(i: number) { this.teamMembers.splice(i, 1); }

  onFilesSelected(event: any) {
    this.selectedFiles = Array.from(event.target.files);
  }

  onSubmit(): void {
    this.loading = true;
    this.error = '';
    this.success = '';

    const payload = {
      ...this.project,
      team_members: this.teamMembers.filter(m => m.name),
    };

    this.api.createProject(payload).subscribe({
      next: (created) => {
        if (this.selectedFiles.length) {
          this.api.uploadProjectFiles(created.id, this.selectedFiles).subscribe({
            next: () => { this.loading = false; this.router.navigate(['/projects', created.id]); },
            error: () => { this.loading = false; this.router.navigate(['/projects', created.id]); },
          });
        } else {
          this.loading = false;
          this.router.navigate(['/projects', created.id]);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.detail || 'Failed to create project';
      },
    });
  }
}
