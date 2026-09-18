import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Project, Challenge, Match, Notification, PipelineStage, User } from '../../models/interfaces';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Projects ──
  getProjects(params?: any): Observable<{ projects: Project[]; total: number }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(`${this.baseUrl}/projects`, { params: httpParams });
  }

  getProject(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/projects/${id}`);
  }

  createProject(data: any): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/projects`, data);
  }

  updateProject(id: number, data: any): Observable<Project> {
    return this.http.put<Project>(`${this.baseUrl}/projects/${id}`, data);
  }

  uploadProjectFiles(projectId: number, files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.http.post(`${this.baseUrl}/projects/${projectId}/files`, formData);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/projects/${id}`);
  }

  /** Supervisor sign-off: approve a project for publication, or reject it. */
  reviewProject(id: number, approved: boolean, note?: string): Observable<Project> {
    return this.http.put<Project>(`${this.baseUrl}/projects/${id}/review`, { approved, note });
  }

  /** Publish a project to the Virtual Booth or withdraw it (admin or the project's supervisor). */
  publishBooth(id: number, published: boolean): Observable<Project> {
    return this.http.put<Project>(`${this.baseUrl}/projects/${id}/booth`, { published });
  }

  /** Collaboration request from a booth page — open to anyone. */
  contactBooth(
    id: number,
    data: { name: string; email: string; organization?: string; message: string },
  ): Observable<{ message: string; contact_email: string }> {
    return this.http.post<any>(`${this.baseUrl}/projects/${id}/contact`, data);
  }

  deleteProjectFile(projectId: number, fileId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/projects/${projectId}/files/${fileId}`);
  }

  /** Admin only — used to pick a supervisor when adding a project. */
  getUsers(role?: string): Observable<User[]> {
    let params = new HttpParams();
    if (role) params = params.set('role', role);
    return this.http.get<User[]>(`${this.baseUrl}/auth/users`, { params });
  }

  /** Set the Virtual Booth video / demo / cover image (admin or the project's supervisor). */
  updateProjectMedia(
    id: number,
    media: { video_url?: string; demo_url?: string; image_url?: string },
  ): Observable<Project> {
    return this.http.put<Project>(`${this.baseUrl}/projects/${id}/media`, media);
  }

  // ── Challenges ──
  getChallenges(params?: any): Observable<{ challenges: Challenge[]; total: number }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(`${this.baseUrl}/challenges`, { params: httpParams });
  }

  getChallenge(id: number): Observable<Challenge> {
    return this.http.get<Challenge>(`${this.baseUrl}/challenges/${id}`);
  }

  createChallenge(data: any): Observable<Challenge> {
    return this.http.post<Challenge>(`${this.baseUrl}/challenges`, data);
  }

  updateChallengeStatus(id: number, status: string): Observable<Challenge> {
    return this.http.put<Challenge>(`${this.baseUrl}/challenges/${id}`, { status });
  }

  // ── Matching ──
  runMatching(challengeId: number): Observable<{ matches: Match[]; total: number }> {
    return this.http.post<any>(`${this.baseUrl}/matching/run/${challengeId}`, {});
  }

  getMatchResults(challengeId: number): Observable<{ matches: Match[]; total: number }> {
    return this.http.get<any>(`${this.baseUrl}/matching/results/${challengeId}`);
  }

  updateMatchStatus(matchId: number, status: string): Observable<Match> {
    return this.http.put<Match>(`${this.baseUrl}/matching/${matchId}/status`, { status });
  }

  // ── Semantic search ──
  semanticSearchProjects(q: string, sector?: string, readiness?: string, limit = 20, booth?: boolean): Observable<{ projects: Project[]; total: number }> {
    let params = new HttpParams().set('q', q).set('limit', limit);
    if (sector) params = params.set('sector', sector);
    if (readiness) params = params.set('readiness', readiness);
    if (booth !== undefined) params = params.set('booth', booth);
    return this.http.get<any>(`${this.baseUrl}/projects/search`, { params });
  }

  /** Ask the InnoPark manager to put the company in touch with a project team. */
  contactParkManager(matchId: number, message?: string): Observable<{ message: string; contact_email: string }> {
    return this.http.post<any>(`${this.baseUrl}/matching/${matchId}/contact`, { message });
  }

  // ── Guest Session ──
  guestMatch(data: {
    title: string;
    description?: string;
    sector?: string;
    priorities?: string;
    expected_outputs?: string;
    session_token: string;
  }): Observable<{ challenge: any; matches: Match[]; total: number }> {
    return this.http.post<any>(`${this.baseUrl}/guest/match`, data);
  }

  // ── Analytics ──
  getAnalyticsOverview(): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics/overview`);
  }

  getMatchAnalytics(): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics/matches`);
  }

  // ── Pipeline ──
  getPipelineStages(): Observable<{ stages: PipelineStage[] }> {
    return this.http.get<any>(`${this.baseUrl}/pipeline/stages`);
  }

  advanceProject(projectId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/pipeline/${projectId}/advance`, {});
  }

  // ── Notifications ──
  getNotifications(unreadOnly = false): Observable<any> {
    return this.http.get(`${this.baseUrl}/notifications`, {
      params: new HttpParams().set('unread_only', String(unreadOnly))
    });
  }

  markNotificationRead(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/notifications/${id}/read`, {});
  }

  markAllNotificationsRead(): Observable<any> {
    return this.http.put(`${this.baseUrl}/notifications/read-all`, {});
  }
}
