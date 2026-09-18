import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../models/interfaces';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

/**
 * One form, two entry points: /projects/submit adds a project to the Student
 * Projects database; /booth/new (route data `booth: true`) does the same and
 * then publishes it to the Virtual Booth. Both create one Project row.
 */
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
            <div appReveal><span class="kicker">{{ boothMode ? 'Virtual Booth' : 'Student Projects' }}</span></div>
            <div appReveal [delay]="80" style="margin-top: 18px;">
              <h1 class="h-section" *ngIf="boothMode">Add a <em class="serif-italic" style="color: var(--c-blue);">Booth</em> project.</h1>
              <h1 class="h-section" *ngIf="!boothMode">Add a <em class="serif-italic" style="color: var(--c-blue);">project</em>.</h1>
              <p class="lead" *ngIf="boothMode">The project is added to the Student Projects database and published to the Virtual Booth in one step.</p>
              <p class="lead" *ngIf="!boothMode">The project joins the Student Projects database and becomes part of the AI matching pool.</p>
            </div>
          </div>

          <form (ngSubmit)="onSubmit()" class="form-card glass" appReveal [delay]="160">
            <div class="form-grid">
              <div class="field full">
                <label>Project Title *</label>
                <input type="text" [(ngModel)]="project.title" name="title" required placeholder="Enter a descriptive title">
              </div>

              <div class="field full">
                <label>Problem *</label>
                <textarea [(ngModel)]="project.problem" name="problem" rows="3" required placeholder="What problem does the project solve?"></textarea>
              </div>

              <div class="field full">
                <label>Proposed solution / summary</label>
                <textarea [(ngModel)]="project.summary" name="summary" rows="3" placeholder="How does the project solve it? Shown as the booth's solution section."></textarea>
              </div>

              <div class="field full">
                <label>Value &amp; innovation</label>
                <textarea [(ngModel)]="project.value_proposition" name="value_proposition" rows="2" placeholder="Why it matters — impact, market, novelty"></textarea>
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

              <div class="field full" *ngIf="authService.hasRole('admin')">
                <label>Supervisor</label>
                <select [(ngModel)]="project.supervisor_id" name="supervisor_id">
                  <option [ngValue]="null">— Not assigned —</option>
                  <option *ngFor="let s of supervisors" [ngValue]="s.id">{{ s.full_name }} ({{ s.email }})</option>
                </select>
              </div>
              <div class="field full hint" *ngIf="authService.hasRole('supervisor')">
                <label>Supervisor</label>
                <p>You are recorded as the supervisor of this project.</p>
              </div>

              <div class="field full">
                <label>Technical Outputs</label>
                <textarea [(ngModel)]="project.technical_outputs" name="techOutputs" rows="3" placeholder="What are the concrete outputs? (e.g. mobile app, hardware prototype)"></textarea>
              </div>

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

              <div class="field">
                <label>Cover image</label>
                <div class="file-drop-zone">
                  <input type="file" accept="image/*" (change)="onCoverSelected($event)">
                  <div class="drop-ui">{{ coverFile ? '🖼 ' + coverFile.name : '🖼 Choose the booth cover image' }}</div>
                </div>
              </div>

              <div class="field">
                <label>Documents, gallery &amp; video</label>
                <div class="file-drop-zone">
                  <input type="file" multiple (change)="onFilesSelected($event)">
                  <div class="drop-ui">{{ selectedFiles.length ? selectedFiles.length + ' file(s) selected' : '📁 Slides, reports, photos, demo video' }}</div>
                </div>
              </div>

              <div class="field full">
                <label>Demo URL</label>
                <input type="url" [(ngModel)]="demoUrl" name="demo_url" placeholder="https://… (optional live demo)">
              </div>
            </div>

            <div class="form-footer">
              <div class="error-msg" *ngIf="error">{{ error }}</div>
              <button type="submit" class="btn btn-primary btn-lg" [disabled]="loading">
                {{ loading ? 'Saving...' : (boothMode ? 'Publish to Booth' : 'Add project') }}
              </button>
              <a *ngIf="boothMode" routerLink="/booth" class="btn btn-ghost btn-sm">Cancel</a>
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
    .field.hint p { font-size: 13px; color: var(--c-text-mute); margin: 0; }

    .team-list { display: flex; flex-direction: column; gap: 10px; }
    .team-member-row { display: flex; gap: 10px; align-items: center; }
    .remove-btn { background: transparent; border: none; color: var(--c-text-faint); cursor: pointer; padding: 4px; }
    .remove-btn:hover { color: #ef4444; }

    .file-drop-zone { position: relative; border: 2px dashed var(--c-line-soft); border-radius: 16px; padding: 28px 16px; text-align: center; transition: all 200ms; }
    .file-drop-zone:hover { border-color: var(--c-blue); background: rgba(30,107,255,0.02); }
    .file-drop-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    .drop-ui { font-size: 13px; color: var(--c-text-mute); font-weight: 500; }

    .form-footer { margin-top: 40px; display: flex; flex-direction: column; align-items: center; gap: 16px; border-top: 1px solid var(--c-line-soft); padding-top: 32px; }
    .error-msg { font-size: 13px; color: #ef4444; font-weight: 600; }
  `]
})
export class ProjectSubmitComponent implements OnInit {
  boothMode = false;
  project: any = {
    title: '', summary: '', problem: '', value_proposition: '', sector: '',
    readiness_level: 'concept', technical_outputs: '', development_needs: '', supervisor_id: null,
  };
  demoUrl = '';
  teamMembers: any[] = [{ name: '', role: '', email: '' }];
  coverFile: File | null = null;
  selectedFiles: File[] = [];
  supervisors: User[] = [];
  error = '';
  loading = false;

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.boothMode = !!this.route.snapshot.data['booth'];
    if (this.authService.hasRole('admin')) {
      this.api.getUsers('supervisor').subscribe({ next: users => this.supervisors = users });
    }
  }

  addTeamMember() { this.teamMembers.push({ name: '', role: '', email: '' }); }
  removeTeamMember(i: number) { this.teamMembers.splice(i, 1); }

  onCoverSelected(event: any) { this.coverFile = event.target.files?.[0] ?? null; }
  onFilesSelected(event: any) { this.selectedFiles = Array.from(event.target.files); }

  async onSubmit(): Promise<void> {
    if (!this.project.title || !this.project.problem) {
      this.error = 'Title and Problem description are required.';
      return;
    }
    this.loading = true;
    this.error = '';

    const payload = { ...this.project, team_members: this.teamMembers.filter(m => m.name) };
    // Cover goes first: the API makes the first uploaded image the booth cover.
    const files = [...(this.coverFile ? [this.coverFile] : []), ...this.selectedFiles];

    try {
      const created = await firstValueFrom(this.api.createProject(payload));
      const id = created.id;
      if (files.length) await firstValueFrom(this.api.uploadProjectFiles(id, files));
      if (this.demoUrl) await firstValueFrom(this.api.updateProjectMedia(id, { demo_url: this.demoUrl }));
      if (this.boothMode) await firstValueFrom(this.api.publishBooth(id, true));
      this.router.navigate([this.boothMode ? '/booth' : '/projects', id]);
    } catch (err: any) {
      this.error = err?.error?.detail || 'Failed to create project';
    } finally {
      this.loading = false;
    }
  }
}
