import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

@Component({
  selector: 'app-project-submit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, RevealDirective],
  template: `
    <div class="submit-page">
      <div class="mesh" aria-hidden="true" style="opacity: 0.25;"><span></span></div>
      <div class="grain"></div>

      <div class="container">
        <div class="form-layout">
          <div class="form-header">
            <div appReveal><span class="kicker">Innovation Entry</span></div>
            <div appReveal [delay]="80" style="margin-top: 18px;">
              <h1 class="h-section">Submit Your <em class="serif-italic" style="color: var(--c-blue);">Innovation</em>.</h1>
              <p class="lead">Tell us about your project and ignite your path to the market.</p>
            </div>
          </div>

          <form (ngSubmit)="onSubmit()" class="form-card glass" appReveal [delay]="160">
            <div class="form-grid">
              <div class="field full">
                <label>Project Title *</label>
                <input type="text" [(ngModel)]="project.title" name="title" required placeholder="Enter a descriptive title">
              </div>

              <div class="field full">
                <label>Problem Description *</label>
                <textarea [(ngModel)]="project.problem" name="problem" rows="4" required placeholder="What problem does your project solve?"></textarea>
              </div>

              <div class="field">
                <label>Sector</label>
                <input type="text" [(ngModel)]="project.sector" name="sector" placeholder="e.g. Health, Energy, AI">
              </div>

              <div class="field">
                <label>Readiness Level</label>
                <select [(ngModel)]="project.readiness_level" name="readiness">
                  <option value="concept">Concept</option>
                  <option value="prototype">Prototype</option>
                  <option value="pilot_ready">Pilot Ready</option>
                </select>
              </div>

              <div class="field full">
                <label>Technical Outputs</label>
                <textarea [(ngModel)]="project.technical_outputs" name="techOutputs" rows="3" placeholder="What are the concrete outputs? (e.g. mobile app, hardware prototype)"></textarea>
              </div>

              <!-- Team Section -->
              <div class="field full">
                <label>Innovation Team</label>
                <div class="team-list">
                  <div class="team-member-row" *ngFor="let member of teamMembers; let i = index">
                    <input type="text" [(ngModel)]="member.name" [name]="'mName'+i" placeholder="Full Name">
                    <input type="text" [(ngModel)]="member.role" [name]="'mRole'+i" placeholder="Role">
                    <button type="button" class="remove-btn" (click)="removeTeamMember(i)">✕</button>
                  </div>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" (click)="addTeamMember()" style="margin-top: 12px;">
                  + Add Team Member
                </button>
              </div>

              <div class="field full">
                <label>Project Files</label>
                <div class="file-drop-zone">
                  <input type="file" multiple (change)="onFilesSelected($event)">
                  <div class="drop-ui">
                    <span>📁 Upload project documentation, slides, or images</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-footer">
              <div class="error-msg" *ngIf="error">{{ error }}</div>
              <button type="submit" class="btn btn-primary btn-lg" [disabled]="loading">
                {{ loading ? 'Submitting...' : 'Submit to Pipeline' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .submit-page { position: relative; padding: 60px 0 100px; min-height: 100vh; overflow: hidden; }
    .form-layout { max-width: 860px; margin: 0 auto; }
    .form-header { text-align: center; margin-bottom: 48px; }

    .form-card { padding: 48px; border-radius: 32px; border: 1px solid var(--c-line-soft); }
    .glass { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(20px); }
    
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .field.full { grid-column: span 2; }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } .field.full { grid-column: span 1; } .form-card { padding: 24px; } }

    .field label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--c-text-faint); margin-bottom: 8px; }
    .field input, .field select, .field textarea { 
      width: 100%; background: rgba(255,255,255,0.8); border: 1px solid var(--c-line-soft); 
      border-radius: 12px; padding: 12px 16px; font-size: 15px; color: var(--c-text); outline: none; 
      transition: all 200ms;
    }
    .field input:focus, .field select:focus, .field textarea:focus { border-color: var(--c-blue); box-shadow: 0 0 0 3px rgba(30,107,255,0.1); }

    .team-list { display: flex; flex-direction: column; gap: 10px; }
    .team-member-row { display: flex; gap: 10px; align-items: center; }
    .remove-btn { background: transparent; border: none; color: var(--c-text-faint); cursor: pointer; padding: 4px; }
    .remove-btn:hover { color: #ef4444; }

    .file-drop-zone { position: relative; border: 2px dashed var(--c-line-soft); border-radius: 16px; padding: 32px; text-align: center; transition: all 200ms; }
    .file-drop-zone:hover { border-color: var(--c-blue); background: rgba(30,107,255,0.02); }
    .file-drop-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    .drop-ui { font-size: 13px; color: var(--c-text-mute); font-weight: 500; }

    .form-footer { margin-top: 40px; display: flex; flex-direction: column; align-items: center; gap: 16px; border-top: 1px solid var(--c-line-soft); padding-top: 32px; }
    .error-msg { font-size: 13px; color: #ef4444; font-weight: 600; }
  `]
})
export class ProjectSubmitComponent {
  project: any = {
    title: '', summary: '',
    problem: '', value_proposition: '', sector: '',
    readiness_level: 'concept', technical_outputs: '', development_needs: '', video_url: '',
  };
  teamMembers: any[] = [{ name: '', role: '', email: '' }];
  selectedFiles: File[] = [];
  error = '';
  loading = false;

  constructor(private api: ApiService, private router: Router) {}

  addTeamMember() { this.teamMembers.push({ name: '', role: '', email: '' }); }
  removeTeamMember(i: number) { this.teamMembers.splice(i, 1); }

  onFilesSelected(event: any) {
    this.selectedFiles = Array.from(event.target.files);
  }

  onSubmit(): void {
    if (!this.project.title || !this.project.problem) {
      this.error = 'Title and Problem description are required.';
      return;
    }

    this.loading = true;
    this.error = '';

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
